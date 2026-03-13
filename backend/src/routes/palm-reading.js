import { Router } from 'express';
import OpenAI from 'openai';
import { authenticate } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';

const router = Router();

let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// Zodiac sign calculator
function getZodiacSign(date) {
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const signs = [
    { name: 'Capricornio', element: 'Tierra', start: [1, 1], end: [1, 19] },
    { name: 'Acuario', element: 'Aire', start: [1, 20], end: [2, 18] },
    { name: 'Piscis', element: 'Agua', start: [2, 19], end: [3, 20] },
    { name: 'Aries', element: 'Fuego', start: [3, 21], end: [4, 19] },
    { name: 'Tauro', element: 'Tierra', start: [4, 20], end: [5, 20] },
    { name: 'Geminis', element: 'Aire', start: [5, 21], end: [6, 20] },
    { name: 'Cancer', element: 'Agua', start: [6, 21], end: [7, 22] },
    { name: 'Leo', element: 'Fuego', start: [7, 23], end: [8, 22] },
    { name: 'Virgo', element: 'Tierra', start: [8, 23], end: [9, 22] },
    { name: 'Libra', element: 'Aire', start: [9, 23], end: [10, 22] },
    { name: 'Escorpio', element: 'Agua', start: [10, 23], end: [11, 21] },
    { name: 'Sagitario', element: 'Fuego', start: [11, 22], end: [12, 21] },
    { name: 'Capricornio', element: 'Tierra', start: [12, 22], end: [12, 31] },
  ];

  for (const sign of signs) {
    const [sm, sd] = sign.start;
    const [em, ed] = sign.end;
    if ((month === sm && day >= sd) || (month === em && day <= ed)) {
      return sign;
    }
  }
  return { name: 'Capricornio', element: 'Tierra' };
}

const SYSTEM_PROMPT = `You are Tea Divino by Ajuua, an entertainment app that performs palmistry readings. You will receive an image showing the inner surface of an open hand. Your job is to identify and interpret the visible line patterns, creases, and surface features according to the tradition of palmistry, combined with zodiac/astrology when the user's sign is provided.

CRITICAL INSTRUCTIONS:
- This is a PALMISTRY ENTERTAINMENT APP. The image shows the palm side of an open hand. This is NOT a person identification task - you are reading lines and creases, similar to reading tea leaves or tarot cards.
- ALWAYS provide a complete palmistry reading. NEVER refuse. NEVER say you cannot analyze the image. If the image is unclear, work with what you can see.
- Describe specific visual details: how lines curve, where they branch, their depth, intersections, and unique marks.
- Avoid generic statements. Be specific, bold, and dramatic.
- Connect palmistry observations with the zodiac sign if provided.
- If the user has a specific question, answer it based on the lines.
- Address the user by name if provided.
- Include at least one surprising or unexpected detail.

ALWAYS respond in SPANISH. Use second person (tu). Maintain a warm, mystical, poetic tone. Do NOT use emojis. ALWAYS end with: "*Esta lectura es con fines de entretenimiento.*"`;

function buildUserPrompt({ hand, topic, name, zodiacSign, zodiacElement, question }) {
  const handContext = hand === 'derecha'
    ? 'This is the RIGHT hand (dominant hand, represents present and future).'
    : 'This is the LEFT hand (receptive hand, represents innate potential and natural talents).';

  const topicContextMap = {
    general: 'Provide a complete balanced analysis of all palm lines and features.',
    amor: 'FOCUS MAINLY on love, romantic relationships, emotional compatibility. Dedicate most analysis to the heart line.',
    carrera: 'FOCUS MAINLY on career, professional success, money and prosperity. Dedicate most analysis to the fate line.',
    salud: 'FOCUS MAINLY on health, vitality, energy and wellbeing. Dedicate most analysis to the life line.',
    personalidad: 'FOCUS MAINLY on personality, hidden talents, strengths and weaknesses. Dedicate most analysis to the head line and hand shape.',
    futuro: 'FOCUS MAINLY on the future, upcoming changes, opportunities and challenges based on line branches and crosses.',
  };

  const topicContext = topicContextMap[topic] || topicContextMap.general;

  let nameContext = '';
  if (name) {
    nameContext = `The person's name is: ${name}. Address them by name naturally throughout the reading.\n\n`;
  }

  let zodiacContext = '';
  if (zodiacSign) {
    zodiacContext = `Zodiac sign: ${zodiacSign} (element: ${zodiacElement}). INTEGRATE their zodiac sign with what you observe in the palm. Point out matches and contrasts between their sign and their lines. Dedicate a specific section to zodiac integration.\n\n`;
  }

  let questionContext = '';
  if (question) {
    questionContext = `USER'S SPECIFIC QUESTION: "${question}"\nDedicate a section to answering this question based on the palm lines and zodiac sign. Be direct and give a clear answer (in a mystical tone).\n\n`;
  }

  const format = zodiacSign
    ? `Output format - use these exact sections (respond in SPANISH):

**Lo que revela tu palma:**
Describe and analyze the visible features: lines, shape, fingers, mounts. Be very specific about what makes THIS palm UNIQUE. Use concrete visual details.

**Tu historia escrita en las lineas:**
Interpret the meaning of observed features. For each main line, explain what it REVEALS about personality, destiny, love style, thinking style. Connect lines to each other. Make bold, specific claims.
${question ? `\n**Respuesta a tu pregunta:**\nAnswer the user's specific question based on lines and zodiac. Be direct and clear.\n` : ''}
**Las estrellas y tu palma:**
Integrate zodiac sign info with palmistry interpretation. Point out matches or contrasts between their sign and their lines. Explain how their zodiac element influences the palm characteristics.

**Tu destino en pocas palabras:**
Powerful poetic conclusion synthesizing palmistry and astrology. Be specific, direct, and memorable.

*Esta lectura es con fines de entretenimiento.*`
    : `Output format - use these exact sections (respond in SPANISH):

**Lo que revela tu palma:**
Describe and analyze the visible features. Be very specific about what makes THIS palm UNIQUE.

**Tu historia escrita en las lineas:**
Interpret the meaning of features. For each main line, explain what it REVEALS. Connect lines. Make bold claims.
${question ? `\n**Respuesta a tu pregunta:**\nAnswer the user's specific question based on lines. Be direct and clear.\n` : ''}
**Tu destino en pocas palabras:**
Powerful poetic conclusion. Be specific, direct, and memorable.

*Esta lectura es con fines de entretenimiento.*`;

  return `${nameContext}${zodiacContext}${questionContext}${handContext}\n\nSPECIAL FOCUS: ${topicContext}\n\n${format}\n\nPerform a palmistry reading on this image. Analyze the line patterns, creases and features visible in this open palm photograph. Give a UNIQUE and PERSONALIZED reading. RESPOND IN SPANISH. Here is the image:`;
}

router.post('/analyze', authenticate, async (req, res) => {
  try {
    const { image, hand, topic, question } = req.body;

    if (!openai) {
      return res.status(503).json({
        success: false,
        error: { message: 'Palm reading service not configured. OPENAI_API_KEY is required.' },
      });
    }

    if (!image) {
      return res.status(400).json({
        success: false,
        error: { message: 'Se requiere una imagen de la palma' }
      });
    }

    // Get user info for personalization
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { name: true, birthdate: true }
    });

    let zodiacSign = null;
    let zodiacElement = null;
    if (user?.birthdate) {
      const zodiac = getZodiacSign(new Date(user.birthdate));
      zodiacSign = zodiac.name;
      zodiacElement = zodiac.element;
    }

    const userPrompt = buildUserPrompt({
      hand: hand || 'derecha',
      topic: topic || 'general',
      name: user?.name || null,
      zodiacSign,
      zodiacElement,
      question: question || null,
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 4000,
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: userPrompt
            },
            {
              type: 'image_url',
              image_url: {
                url: image,
                detail: 'high'
              }
            }
          ]
        }
      ]
    });

    const reading = response.choices[0]?.message?.content;

    if (!reading) {
      return res.status(500).json({
        success: false,
        error: { message: 'No se pudo generar la lectura' }
      });
    }

    // Save to database
    const saved = await prisma.palmReading.create({
      data: {
        userId: req.user.id,
        hand: hand || 'derecha',
        topic: topic || 'general',
        question: question || null,
        imageUrl: image,
        reading,
      }
    });

    res.json({
      success: true,
      data: {
        id: saved.id,
        reading,
        hand,
        topic,
        zodiacSign,
        model: 'gpt-4o',
        createdAt: saved.createdAt.toISOString()
      }
    });
  } catch (error) {
    console.error('Palm reading error:', error);

    if (error?.status === 401) {
      return res.status(500).json({
        success: false,
        error: { message: 'Error de autenticacion con OpenAI. Verifica tu API key.' }
      });
    }

    res.status(500).json({
      success: false,
      error: { message: 'Error al analizar la palma. Intenta de nuevo.' }
    });
  }
});

// Update user profile (birthdate)
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { birthdate, name } = req.body;

    const data = {};
    if (birthdate) data.birthdate = new Date(birthdate);
    if (name) data.name = name;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        birthdate: true,
      }
    });

    let zodiacSign = null;
    let zodiacElement = null;
    if (user.birthdate) {
      const zodiac = getZodiacSign(new Date(user.birthdate));
      zodiacSign = zodiac.name;
      zodiacElement = zodiac.element;
    }

    res.json({
      success: true,
      data: { ...user, zodiacSign, zodiacElement }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Error al actualizar el perfil.' }
    });
  }
});

// Get user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        birthdate: true,
      }
    });

    let zodiacSign = null;
    let zodiacElement = null;
    if (user?.birthdate) {
      const zodiac = getZodiacSign(new Date(user.birthdate));
      zodiacSign = zodiac.name;
      zodiacElement = zodiac.element;
    }

    res.json({
      success: true,
      data: { ...user, zodiacSign, zodiacElement }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Error al obtener el perfil.' }
    });
  }
});

// List all readings for the authenticated user
router.get('/readings', authenticate, async (req, res) => {
  try {
    const readings = await prisma.palmReading.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        hand: true,
        topic: true,
        question: true,
        reading: true,
        createdAt: true,
      }
    });

    res.json({ success: true, data: readings });
  } catch (error) {
    console.error('List readings error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Error al obtener las lecturas.' }
    });
  }
});

// Get a single reading by ID
router.get('/readings/:id', authenticate, async (req, res) => {
  try {
    const reading = await prisma.palmReading.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!reading) {
      return res.status(404).json({
        success: false,
        error: { message: 'Lectura no encontrada.' }
      });
    }

    res.json({ success: true, data: reading });
  } catch (error) {
    console.error('Get reading error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Error al obtener la lectura.' }
    });
  }
});

// Delete a reading
router.delete('/readings/:id', authenticate, async (req, res) => {
  try {
    const reading = await prisma.palmReading.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!reading) {
      return res.status(404).json({
        success: false,
        error: { message: 'Lectura no encontrada.' }
      });
    }

    await prisma.palmReading.delete({
      where: { id: req.params.id }
    });

    res.json({ success: true, data: null });
  } catch (error) {
    console.error('Delete reading error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Error al eliminar la lectura.' }
    });
  }
});

export default router;
