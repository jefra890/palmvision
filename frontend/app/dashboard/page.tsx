'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Upload, Sparkles, Hand, Heart, Brain, Star, Loader2, X, Sun, ArrowRight, Info, Briefcase, Activity, Eye } from 'lucide-react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useAuth, useToast } from '@/app/providers';
import { palmReadingApi } from '@/lib/api';

const palmLines = [
  { name: 'Linea del Corazon', icon: Heart, color: 'from-pink-500 to-red-500', description: 'Amor y emociones' },
  { name: 'Linea de la Cabeza', icon: Brain, color: 'from-blue-500 to-cyan-500', description: 'Intelecto y pensamiento' },
  { name: 'Linea de la Vida', icon: Sparkles, color: 'from-green-500 to-emerald-500', description: 'Vitalidad y energia' },
  { name: 'Linea del Destino', icon: Star, color: 'from-amber-500 to-yellow-500', description: 'Camino profesional' },
];

const topics = [
  { id: 'general', name: 'Lectura General', icon: Eye, color: 'from-purple-500 to-indigo-500', description: 'Analisis completo de todas las lineas' },
  { id: 'amor', name: 'Amor y Relaciones', icon: Heart, color: 'from-pink-500 to-red-500', description: 'Vida sentimental, pareja y emociones' },
  { id: 'carrera', name: 'Carrera y Dinero', icon: Briefcase, color: 'from-amber-500 to-yellow-500', description: 'Exito profesional y prosperidad' },
  { id: 'salud', name: 'Salud y Vitalidad', icon: Activity, color: 'from-green-500 to-emerald-500', description: 'Energia, bienestar y vitalidad' },
  { id: 'personalidad', name: 'Personalidad', icon: Brain, color: 'from-blue-500 to-cyan-500', description: 'Quien eres, talentos y fortalezas' },
  { id: 'futuro', name: 'Mi Futuro', icon: Star, color: 'from-violet-500 to-purple-500', description: 'Que cambios y oportunidades vienen' },
];

type HandChoice = 'derecha' | 'izquierda' | null;
type TopicChoice = string | null;
type Step = 'choose-hand' | 'choose-topic' | 'take-photo' | 'preview' | 'reading';

export default function DashboardPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [step, setStep] = useState<Step>('choose-hand');
  const [selectedHand, setSelectedHand] = useState<HandChoice>(null);
  const [selectedTopic, setSelectedTopic] = useState<TopicChoice>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [reading, setReading] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const processFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      setSelectedImage(ev.target?.result as string);
      setStep('preview');
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (showCamera && videoRef.current && streamRef.current) {
      const video = videoRef.current;
      video.srcObject = streamRef.current;
      const playVideo = async () => {
        try {
          await video.play();
          setCameraReady(true);
        } catch (e) {
          console.error('Play failed:', e);
        }
      };
      if (video.readyState >= 2) {
        playVideo();
      } else {
        video.onloadeddata = playVideo;
      }
    }
  }, [showCamera]);

  const startCamera = useCallback(async () => {
    setCameraReady(false);
    cleanupStream();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      setShowCamera(true);
    } catch {
      cameraInputRef.current?.click();
    }
  }, [cleanupStream]);

  const stopCamera = useCallback(() => {
    cleanupStream();
    setCameraReady(false);
    setShowCamera(false);
  }, [cleanupStream]);

  const takePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (w === 0 || h === 0) return;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    const imageData = canvas.toDataURL('image/jpeg', 0.95);
    cleanupStream();
    setCameraReady(false);
    setShowCamera(false);
    setSelectedImage(imageData);
    setStep('preview');
  }, [cleanupStream]);

  const handleAnalyze = useCallback(async () => {
    if (!selectedImage) return;
    setIsAnalyzing(true);
    setStep('reading');

    try {
      const response = await palmReadingApi.analyze(selectedImage, selectedHand || 'derecha', selectedTopic || 'general');
      const data = response.data as { reading: string };
      setReading(data.reading);
    } catch (error) {
      addToast('Error al analizar la palma. Intenta de nuevo.', 'error');
      setStep('preview');
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedImage, selectedHand, addToast]);

  const resetAll = useCallback(() => {
    setSelectedImage(null);
    setReading(null);
    setSelectedHand(null);
    setSelectedTopic(null);
    setStep('choose-hand');
    setShowCamera(false);
    cleanupStream();
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  }, [cleanupStream]);

  const chooseHand = useCallback((hand: HandChoice) => {
    setSelectedHand(hand);
    setStep('choose-topic');
  }, []);

  const chooseTopic = useCallback((topic: string) => {
    setSelectedTopic(topic);
    setStep('take-photo');
  }, []);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Hidden elements */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} style={{ display: 'none' }} />

        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">
            Hola, {user?.name || 'Viajero'} &#9995;
          </h1>
          <p className="text-purple-300/70 mt-2">
            {step === 'choose-hand' && 'Primero, elige que mano quieres leer'}
            {step === 'choose-topic' && 'Que te gustaria descubrir hoy?'}
            {step === 'take-photo' && `Ahora, toma una foto de tu mano ${selectedHand}`}
            {step === 'preview' && 'Revisa tu foto y cuando estes listo, analiza tu palma'}
            {step === 'reading' && (isAnalyzing ? 'Analizando las lineas de tu palma...' : 'Tu lectura esta lista')}
          </p>
        </div>

        {/* Step 1: Choose Hand */}
        {step === 'choose-hand' && (
          <>
            <div className="bg-gray-900 border border-purple-900/30 rounded-2xl p-8">
              <h3 className="text-lg font-semibold text-white text-center mb-6">
                Cual mano quieres leer?
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
                <button
                  onClick={() => chooseHand('derecha')}
                  className="p-6 bg-gray-800 border-2 border-purple-900/30 rounded-xl hover:border-purple-500/50 hover:bg-purple-900/20 transition-all text-center group"
                >
                  <div className="text-5xl mb-3" style={{ transform: 'scaleX(-1)' }}>&#9995;</div>
                  <p className="text-white font-semibold text-lg">Mano Derecha</p>
                  <p className="text-purple-400/60 text-sm mt-1">Tu presente y futuro</p>
                  <p className="text-purple-400/40 text-xs mt-1">Recomendada si eres diestro</p>
                </button>
                <button
                  onClick={() => chooseHand('izquierda')}
                  className="p-6 bg-gray-800 border-2 border-purple-900/30 rounded-xl hover:border-purple-500/50 hover:bg-purple-900/20 transition-all text-center group"
                >
                  <div className="text-5xl mb-3">&#9995;</div>
                  <p className="text-white font-semibold text-lg">Mano Izquierda</p>
                  <p className="text-purple-400/60 text-sm mt-1">Tu potencial innato</p>
                  <p className="text-purple-400/40 text-xs mt-1">Recomendada si eres zurdo</p>
                </button>
              </div>

              {/* Info box */}
              <div className="mt-6 bg-purple-900/20 border border-purple-800/30 rounded-xl p-4 max-w-lg mx-auto">
                <div className="flex gap-3">
                  <Info className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-purple-300/70">
                    <p className="font-medium text-purple-200 mb-1">Como funciona?</p>
                    <p>La <strong className="text-purple-200">mano dominante</strong> (con la que escribes) muestra tu vida actual y hacia donde vas. La <strong className="text-purple-200">otra mano</strong> revela tus talentos naturales y tu potencial de nacimiento.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Palm lines preview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {palmLines.map((line) => (
                <div key={line.name} className="bg-gray-900 border border-purple-900/30 rounded-xl p-4 text-center hover:border-purple-500/30 transition-colors">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${line.color} flex items-center justify-center mx-auto mb-3`}>
                    <line.icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-sm font-medium text-purple-200">{line.name}</p>
                  <p className="text-xs text-purple-400/50 mt-1">{line.description}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Step 2: Choose Topic */}
        {step === 'choose-topic' && (
          <div className="bg-gray-900 border border-purple-900/30 rounded-2xl p-8">
            <h3 className="text-lg font-semibold text-white text-center mb-2">
              Que quieres saber?
            </h3>
            <p className="text-purple-300/50 text-sm text-center mb-6">
              Elige un tema para enfocar tu lectura de mano {selectedHand}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
              {topics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => chooseTopic(topic.id)}
                  className="p-4 bg-gray-800 border-2 border-purple-900/30 rounded-xl hover:border-purple-500/50 hover:bg-purple-900/20 transition-all text-center group"
                >
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${topic.color} flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform`}>
                    <topic.icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-white font-medium text-sm">{topic.name}</p>
                  <p className="text-purple-400/50 text-xs mt-1">{topic.description}</p>
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep('choose-hand')}
              className="mt-6 text-purple-400/60 text-sm hover:text-purple-300 transition-colors block mx-auto"
            >
              &#8592; Cambiar de mano
            </button>
          </div>
        )}

        {/* Step 3: Take Photo */}
        {step === 'take-photo' && !showCamera && (
          <div className="bg-gray-900 border border-purple-900/30 rounded-2xl p-8">
            {/* Tips */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="text-center p-4 bg-gray-800/50 rounded-xl">
                <Sun className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                <p className="text-sm text-purple-200 font-medium">Buena luz</p>
                <p className="text-xs text-purple-400/50">Natural o lampara directa</p>
              </div>
              <div className="text-center p-4 bg-gray-800/50 rounded-xl">
                <Hand className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                <p className="text-sm text-purple-200 font-medium">Palma abierta</p>
                <p className="text-xs text-purple-400/50">Dedos separados y relajados</p>
              </div>
              <div className="text-center p-4 bg-gray-800/50 rounded-xl">
                <Camera className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <p className="text-sm text-purple-200 font-medium">Foto clara</p>
                <p className="text-xs text-purple-400/50">Que se vean las lineas</p>
              </div>
            </div>

            {/* Upload area */}
            <div className="border-2 border-dashed border-purple-700/40 rounded-xl p-10 text-center">
              <div className="text-5xl mb-4" style={selectedHand === 'izquierda' ? {} : { transform: 'scaleX(-1)' }}>&#9995;</div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Foto de tu mano {selectedHand}
              </h3>
              <p className="text-purple-300/50 mb-6 text-sm">
                Abre bien la palma de tu mano {selectedHand} y toma la foto
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <button
                  onClick={startCamera}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-medium shadow-lg shadow-purple-500/25 hover:from-purple-500 hover:to-pink-500 transition-all"
                >
                  <Camera className="w-5 h-5" />
                  Tomar Foto
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 bg-gray-800 text-purple-300 px-6 py-3 rounded-lg font-medium border border-purple-900/30 hover:bg-gray-700 transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  Subir Imagen
                </button>
              </div>
            </div>

            <button
              onClick={() => setStep('choose-topic')}
              className="mt-4 text-purple-400/60 text-sm hover:text-purple-300 transition-colors"
            >
              &#8592; Cambiar tema
            </button>
          </div>
        )}

        {/* Camera View */}
        {showCamera && (
          <div className="bg-gray-900 border border-purple-900/30 rounded-2xl p-4 space-y-4">
            <div className="relative rounded-xl overflow-hidden bg-black" style={{ minHeight: '300px' }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: '300px' }}
              />
              {!cameraReady && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                  <p className="text-purple-300/50 text-sm">Iniciando camara...</p>
                </div>
              )}
              <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-6">
                <button onClick={stopCamera} className="p-3 bg-red-600/80 backdrop-blur rounded-full text-white hover:bg-red-500 transition-colors">
                  <X className="w-6 h-6" />
                </button>
                <button
                  onClick={takePhoto}
                  disabled={!cameraReady}
                  className="w-16 h-16 bg-white rounded-full flex items-center justify-center hover:bg-gray-200 disabled:opacity-30 transition-all active:scale-90 ring-4 ring-white/30"
                >
                  <div className="w-12 h-12 bg-white rounded-full border-2 border-gray-300" />
                </button>
              </div>
            </div>
            <p className="text-center text-purple-300/50 text-sm">
              {cameraReady
                ? `Muestra la palma de tu mano ${selectedHand} y presiona el boton blanco`
                : 'Esperando camara...'}
            </p>
          </div>
        )}

        {/* Step 3: Preview */}
        {step === 'preview' && selectedImage && (
          <div className="bg-gray-900 border border-purple-900/30 rounded-2xl p-8 space-y-6">
            <div className="relative rounded-xl overflow-hidden flex items-center justify-center bg-gray-800" style={{ maxHeight: '400px' }}>
              <img src={selectedImage} alt="Tu palma" style={{ maxHeight: '400px', objectFit: 'contain' }} />
              <div className="absolute top-3 left-3 bg-gray-900/80 backdrop-blur px-3 py-1 rounded-full text-xs text-purple-300">
                Mano {selectedHand}
              </div>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-50 shadow-lg shadow-purple-500/25"
              >
                <Sparkles className="w-5 h-5" />
                Analizar mi Palma
              </button>
              <button
                onClick={() => { setSelectedImage(null); setStep('take-photo'); }}
                className="inline-flex items-center gap-2 bg-gray-800 text-purple-300 px-6 py-3 rounded-xl font-medium border border-purple-900/30 hover:bg-gray-700 transition-colors"
              >
                Otra Foto
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Reading */}
        {step === 'reading' && (
          <>
            {/* Loading animation */}
            {isAnalyzing && (
              <div className="space-y-6">
                <div className="bg-gray-900 border border-purple-900/30 rounded-2xl p-8 text-center">
                  <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
                  <p className="text-white font-semibold text-lg">Analizando tu mano {selectedHand}...</p>
                  <p className="text-purple-300/50 text-sm mt-2">Leyendo las lineas de tu palma</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {palmLines.map((line, index) => (
                    <div
                      key={line.name}
                      className="bg-gray-900 border border-purple-900/30 rounded-xl p-4 text-center animate-pulse"
                      style={{ animationDelay: `${index * 200}ms` }}
                    >
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${line.color} flex items-center justify-center mx-auto mb-3 opacity-60`}>
                        <line.icon className="w-5 h-5 text-white" />
                      </div>
                      <p className="text-sm font-medium text-purple-200/70">{line.name}</p>
                      <p className="text-xs text-purple-400/40 mt-1">{line.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reading result */}
            {reading && (
              <>
                {/* Image thumbnail */}
                {selectedImage && (
                  <div className="flex justify-center">
                    <div className="relative w-32 h-32 rounded-xl overflow-hidden border-2 border-purple-500/30">
                      <img src={selectedImage} alt="Tu palma" className="w-full h-full object-cover" />
                      <div className="absolute bottom-0 left-0 right-0 bg-gray-900/80 text-center py-1">
                        <span className="text-xs text-purple-300">Mano {selectedHand}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/30 rounded-2xl p-8 animate-fade-in">
                  <div className="flex items-center gap-2 mb-6">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <h2 className="text-lg font-semibold text-white">Tu Lectura de Palma</h2>
                  </div>
                  <div className="text-purple-100/80 leading-relaxed whitespace-pre-line">
                    {reading.split('**').map((part, i) =>
                      i % 2 === 1 ? <strong key={i} className="text-purple-300">{part}</strong> : part
                    )}
                  </div>
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={resetAll}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg shadow-purple-500/25"
                  >
                    Nueva Lectura
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
