import Link from 'next/link';
import { ArrowRight, Camera, Sparkles, Eye, Heart, Brain, Star } from 'lucide-react';

export default function HomePage() {
  const features = [
    {
      icon: Camera,
      title: 'Escanea tu Palma',
      description: 'Toma una foto de tu mano y nuestra IA analiza cada linea al instante.',
    },
    {
      icon: Heart,
      title: 'Linea del Corazon',
      description: 'Descubre que dicen tus lineas sobre el amor, las relaciones y las emociones.',
    },
    {
      icon: Brain,
      title: 'Linea de la Cabeza',
      description: 'Conoce tu estilo de pensamiento, creatividad e inteligencia.',
    },
    {
      icon: Sparkles,
      title: 'Linea de la Vida',
      description: 'Explora tu vitalidad, energia y los grandes cambios que vienen.',
    },
    {
      icon: Eye,
      title: 'Linea del Destino',
      description: 'Descifra tu camino profesional y las oportunidades que te esperan.',
    },
    {
      icon: Star,
      title: 'Lectura Completa',
      description: 'Obtén un analisis profundo y personalizado de toda tu palma.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Navigation */}
      <nav className="border-b border-purple-900/30 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-amber-400 flex items-center justify-center">
                <span className="text-white text-sm">&#10070;</span>
              </div>
              <span className="font-bold text-xl text-white">PalmVision</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/auth/login"
                className="text-purple-300 hover:text-white font-medium transition-colors"
              >
                Iniciar Sesion
              </Link>
              <Link
                href="/auth/register"
                className="bg-gradient-to-r from-purple-600 to-purple-500 text-white px-4 py-2 rounded-lg font-medium hover:from-purple-500 hover:to-purple-400 transition-all"
              >
                Comenzar Gratis
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-gray-950 to-indigo-950" />
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(168, 85, 247, 0.4) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(251, 191, 36, 0.3) 0%, transparent 50%)'
        }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <div className="text-6xl mb-6">&#9995;</div>
            <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6 animate-fade-in">
              Descubre tu Destino
              <span className="block mt-2 bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
                en la Palma de tu Mano
              </span>
            </h1>
            <p className="text-xl text-purple-200/80 mb-8 animate-slide-up">
              Inteligencia artificial que lee las lineas de tu mano y revela
              secretos sobre tu personalidad, amor y futuro.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-purple-500 hover:to-pink-500 transition-all hover:scale-105 shadow-lg shadow-purple-500/25"
              >
                Leer mi Palma <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="#como-funciona"
                className="inline-flex items-center justify-center gap-2 bg-white/10 text-white px-8 py-4 rounded-xl font-semibold border border-purple-500/30 hover:bg-white/20 transition-colors backdrop-blur-sm"
              >
                Como Funciona
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="py-24 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              Como Funciona
            </h2>
            <p className="text-lg text-purple-300/70 max-w-2xl mx-auto">
              En 3 simples pasos descubre lo que las lineas de tu mano revelan sobre ti.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: '1', title: 'Toma una Foto', desc: 'Abre tu camara y fotografía la palma de tu mano.' },
              { step: '2', title: 'La IA Analiza', desc: 'Nuestra inteligencia artificial identifica y lee cada linea.' },
              { step: '3', title: 'Recibe tu Lectura', desc: 'Obtén una lectura detallada y personalizada al instante.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-purple-300/70">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              Que Puede Revelarte
            </h2>
            <p className="text-lg text-purple-300/70 max-w-2xl mx-auto">
              Cada linea de tu mano cuenta una historia unica sobre ti.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="p-6 rounded-2xl border border-purple-900/30 bg-gray-900/50 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-purple-900/50 flex items-center justify-center mb-4 group-hover:bg-purple-600 transition-colors">
                  <feature.icon className="w-6 h-6 text-purple-400 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-purple-300/70">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-purple-900 via-indigo-900 to-pink-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-5xl mb-6">&#10024;</div>
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Tu Destino Esta en tus Manos
          </h2>
          <p className="text-xl text-purple-200/80 mb-8">
            Miles de personas ya han descubierto lo que sus palmas revelan. Es tu turno.
          </p>
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 bg-white text-purple-700 px-8 py-4 rounded-xl font-semibold hover:bg-purple-50 transition-colors shadow-lg"
          >
            Descubre tu Lectura Gratis <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 border-t border-purple-900/30 text-purple-300/50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-amber-400 flex items-center justify-center">
                <span className="text-white text-sm">&#10070;</span>
              </div>
              <span className="font-bold text-white">PalmVision</span>
            </div>
            <p className="text-sm">
              &copy; {new Date().getFullYear()} PalmVision. Solo con fines de entretenimiento.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
