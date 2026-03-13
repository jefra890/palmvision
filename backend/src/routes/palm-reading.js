import { Router } from 'express';
import OpenAI from 'openai';
import { authenticate } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';

const router = Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `Eres "PalmVision", una aplicacion de entretenimiento. Actua como un experto en quiromancia capaz de analizar tanto descripciones textuales detalladas de las manos como imagenes o fotografias de las mismas.

Analiza cuidadosamente primero todos los detalles relevantes (forma de la mano, longitud de los dedos, lineas principales, montes, etc.), identificando sus caracteristicas y su posible significado segun la quiromancia tradicional. Si recibes una imagen o foto, describela punto por punto antes de extraer cualquier conclusion. Solo despues de exponer tu razonamiento, formula tu interpretacion, conclusiones y recomendaciones. No comiences con afirmaciones tajantes; asegurate de separar claramente la fase de observacion y razonamiento de la conclusion final.

Si la imagen es poco clara, senala cualquier aspecto relevante que no pueda analizarse por falta de calidad o detalles, pero SIEMPRE da una lectura completa con lo que puedas observar.

Para cada consulta, sigue estos pasos:
1. Observa y describe detalladamente los elementos y caracteristicas de la mano a partir de la imagen.
2. Explica el significado de esas caracteristicas, razonando como se relacionan con rasgos de personalidad o aspectos de la vida segun la quiromancia.
3. Concluye con una sintesis o interpretacion personalizada, solo al final.

IMPORTANTE: Siempre responde en espanol. Habla en segunda persona (tu/tu). Manten un tono calido, mistico y positivo. NO uses emojis. Termina con: "*Esta lectura es con fines de entretenimiento.*"`;

const USER_PROMPT = `Analiza la foto de mi palma y dame una lectura completa de quiromancia.

Formato de salida - usa estas secciones exactas:

**Observacion detallada:**
Describe punto por punto lo que ves en mi palma: forma de la mano, longitud de dedos, montes, y las lineas principales (linea de la vida, linea del corazon, linea de la cabeza, linea del destino si es visible). Se muy especifico sobre lo que observas en ESTA palma.

**Interpretacion y razonamiento:**
Explica el significado de cada caracteristica que observaste segun la quiromancia tradicional. Razona como se relacionan con rasgos de mi personalidad, emociones, salud, carrera y relaciones. Dedica al menos un parrafo a cada linea principal.

**Conclusion final:**
Una sintesis personalizada de mi lectura, integrando todas las observaciones en un retrato coherente de quien soy y hacia donde me dirijo.

*Esta lectura es con fines de entretenimiento.*`;

router.post('/analyze', authenticate, async (req, res) => {
  try {
    const { image, hand, topic } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        error: { message: 'Se requiere una imagen de la palma' }
      });
    }

    const handContext = hand === 'derecha'
      ? 'Esta es la mano DERECHA (mano dominante, representa el presente y futuro).'
      : 'Esta es la mano IZQUIERDA (mano receptiva, representa el potencial innato y talentos naturales).';

    const topicContextMap = {
      general: 'Haz un analisis completo y equilibrado de todas las lineas y aspectos de la palma.',
      amor: 'ENFOCATE PRINCIPALMENTE en el amor, las relaciones sentimentales, la compatibilidad emocional y la vida en pareja. Dedica la mayor parte de tu analisis a la linea del corazon y lo que revela sobre mi vida amorosa. Tambien menciona brevemente las otras lineas.',
      carrera: 'ENFOCATE PRINCIPALMENTE en la carrera profesional, el exito laboral, el dinero y la prosperidad economica. Dedica la mayor parte de tu analisis a la linea del destino y los montes relacionados con el exito. Tambien menciona brevemente las otras lineas.',
      salud: 'ENFOCATE PRINCIPALMENTE en la salud, la vitalidad, la energia y el bienestar fisico y mental. Dedica la mayor parte de tu analisis a la linea de la vida y lo que revela sobre mi vitalidad. Tambien menciona brevemente las otras lineas.',
      personalidad: 'ENFOCATE PRINCIPALMENTE en la personalidad, los talentos ocultos, las fortalezas y debilidades de caracter. Dedica la mayor parte de tu analisis a la linea de la cabeza y la forma de la mano. Tambien menciona brevemente las otras lineas.',
      futuro: 'ENFOCATE PRINCIPALMENTE en el futuro, los cambios que vienen, las oportunidades y los desafios que se aproximan. Dedica la mayor parte de tu analisis a predecir tendencias y momentos clave basandote en las bifurcaciones y cruces de las lineas. Tambien menciona brevemente las otras lineas.',
    };

    const topicContext = topicContextMap[topic] || topicContextMap.general;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 2000,
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
              text: `${USER_PROMPT}\n\n${handContext}\n\nENFOQUE ESPECIAL: ${topicContext}\n\nAqui esta la foto de mi palma:`
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
        model: 'gpt-4o',
        createdAt: saved.createdAt.toISOString()
      }
    });
  } catch (error) {
    console.error('Palm reading error:', error);

    if (error?.status === 401) {
      return res.status(500).json({
        success: false,
        error: { message: 'Error de autenticación con OpenAI. Verifica tu API key.' }
      });
    }

    res.status(500).json({
      success: false,
      error: { message: 'Error al analizar la palma. Intenta de nuevo.' }
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

export default router;
