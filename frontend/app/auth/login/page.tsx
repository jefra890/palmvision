'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth, useToast } from '../../providers';

const loginSchema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(8, 'Minimo 8 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { addToast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const onSubmit = useCallback(async (data: LoginForm) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      addToast('Bienvenido de vuelta!', 'success');
      router.push('/dashboard');
    } catch (error) {
      addToast('Email o contraseña incorrectos', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [login, addToast, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 py-12 px-4">
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: 'radial-gradient(circle at 30% 20%, rgba(168, 85, 247, 0.4) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(251, 191, 36, 0.3) 0%, transparent 50%)'
      }} />

      <div className="max-w-md w-full relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-amber-400 flex items-center justify-center">
              <span className="text-white text-lg">&#10070;</span>
            </div>
            <span className="font-bold text-2xl text-white">Tea Divino</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-purple-900/30 rounded-2xl shadow-2xl shadow-purple-500/10 p-8">
          <div className="text-4xl text-center mb-4">&#9995;</div>
          <h1 className="text-2xl font-bold text-white text-center mb-2">
            Bienvenido de vuelta
          </h1>
          <p className="text-purple-300/70 text-center mb-8">
            Inicia sesion para ver tus lecturas
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400/50" />
                <input
                  type="email"
                  {...register('email')}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-purple-900/30 rounded-lg text-white placeholder-purple-400/30 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="tu@email.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-200 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400/50" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  className="w-full pl-10 pr-12 py-3 bg-gray-800 border border-purple-900/30 rounded-lg text-white placeholder-purple-400/30 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400/50 hover:text-purple-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-purple-700 bg-gray-800 text-purple-500 focus:ring-purple-500"
                />
                <span className="text-sm text-purple-300/70">Recordarme</span>
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-sm text-purple-400 hover:text-purple-300"
              >
                Olvidaste tu contraseña?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Iniciar Sesion'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-purple-300/70">
            No tienes cuenta?{' '}
            <Link
              href="/auth/register"
              className="text-purple-400 hover:text-purple-300 font-medium"
            >
              Registrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
