'use client';

import { useState, useEffect, useCallback } from 'react';
import { History, Hand, ArrowRight, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { palmReadingApi, PalmReadingData } from '@/lib/api';

export default function ReadingsPage() {
  const [readings, setReadings] = useState<PalmReadingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchReadings = useCallback(async () => {
    try {
      const response = await palmReadingApi.list();
      const data = response.data as PalmReadingData[];
      setReadings(data);
    } catch (error) {
      console.error('Error fetching readings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReadings();
  }, [fetchReadings]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSummary = (reading: string) => {
    const firstLine = reading.split('\n').find(l => l.trim() && !l.startsWith('**'));
    return firstLine?.slice(0, 100) || reading.slice(0, 100);
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Mis Lecturas</h1>
          <p className="text-purple-300/70 mt-1">Historial de todas tus lecturas de palma</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          </div>
        ) : readings.length === 0 ? (
          <div className="bg-gray-900 border border-purple-900/30 rounded-2xl p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-purple-900/30 flex items-center justify-center mx-auto mb-4">
              <History className="w-10 h-10 text-purple-400/50" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Aun no tienes lecturas
            </h2>
            <p className="text-purple-300/50 mb-6 max-w-md mx-auto">
              Sube una foto de tu palma y descubre lo que las lineas revelan sobre tu personalidad, amor y futuro.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg shadow-purple-500/25"
            >
              <Hand className="w-5 h-5" />
              Hacer mi Primera Lectura
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {readings.map((reading) => (
              <div
                key={reading.id}
                className="bg-gray-900 border border-purple-900/30 rounded-xl overflow-hidden hover:border-purple-500/30 transition-colors"
              >
                <button
                  onClick={() => setExpandedId(expandedId === reading.id ? null : reading.id)}
                  className="w-full p-4 flex items-center gap-4 text-left"
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0">
                    <Hand className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-purple-400/60">{formatDate(reading.createdAt)}</p>
                    <p className="text-white font-medium">
                      Mano {reading.hand}
                    </p>
                    {expandedId !== reading.id && (
                      <p className="text-purple-300/50 text-sm truncate mt-0.5">{getSummary(reading.reading)}</p>
                    )}
                  </div>
                  {expandedId === reading.id ? (
                    <ChevronUp className="w-5 h-5 text-purple-400/50 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-purple-400/50 flex-shrink-0" />
                  )}
                </button>

                {expandedId === reading.id && (
                  <div className="px-4 pb-4 border-t border-purple-900/20">
                    <div className="mt-4 prose prose-invert prose-purple max-w-none text-sm leading-relaxed">
                      {reading.reading.split('\n').map((line, i) => {
                        if (line.startsWith('**') && line.endsWith('**')) {
                          return <h3 key={i} className="text-purple-300 font-semibold mt-4 mb-1 text-base">{line.replace(/\*\*/g, '')}</h3>;
                        }
                        if (line.startsWith('**')) {
                          const parts = line.split('**');
                          return (
                            <p key={i} className="text-purple-100/80 mb-2">
                              <strong className="text-purple-300">{parts[1]}</strong>
                              {parts[2]}
                            </p>
                          );
                        }
                        if (line.startsWith('*') && line.endsWith('*')) {
                          return <p key={i} className="text-purple-400/50 text-xs mt-4 italic">{line.replace(/\*/g, '')}</p>;
                        }
                        if (line.trim()) {
                          return <p key={i} className="text-purple-100/80 mb-2">{line}</p>;
                        }
                        return null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}

            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg shadow-purple-500/25"
            >
              <Hand className="w-5 h-5" />
              Nueva Lectura
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
