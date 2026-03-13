import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Tea Divino by Ajuua - Lectura de Palma con IA',
  description: 'Descubre tu destino en la palma de tu mano con inteligencia artificial',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="min-h-screen bg-gray-950 font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
