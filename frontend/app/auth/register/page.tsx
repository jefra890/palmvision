'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, User, Eye, EyeOff, Loader2, Check } from 'lucide-react';
import { useAuth, useToast } from '../../providers';

const registerSchema = z.object({
  name: z.string().min(2, 'Minimo 2 caracteres'),
  email: z.string().email('Email invalido'),
  password: z
    .string()
    .min(8, 'Minimo 8 caracteres')
    .regex(/[A-Z]/, 'Al menos una mayuscula')
    .regex(/[0-9]/, 'Al menos un numero'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const { addToast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch('password', '');

  const passwordRequirements = [
    { met: password.length >= 8, text: 'Minimo 8 caracteres' },
    { met: /[A-Z]/.test(password), text: 'Una letra mayuscula' },
    { met: /[0-9]/.test(password), text: 'Un numero' },
  ];

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const onSubmit = useCallback(async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      const result = await registerUser(data.email, data.password, data.name);
      if (result.requiresVerification) {
        addToast('Cuenta creada! Revisa tu email para verificar.', 'success');
        router.push('/auth/verify-email');
      } else {
        addToast('Cuenta creada! Bienvenido a Tea Divino', 'success');
        router.push('/dashboard');
      }
    } catch (error) {
      addToast('Error al crear la cuenta. Intenta de nuevo.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [registerUser, addToast, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 py-12 px-4">
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: 'radial-gradient(circle at 70% 20%, rgba(168, 85, 247, 0.4) 0%, transparent 50%), radial-gradient(circle at 30% 80%, rgba(251, 191, 36, 0.3) 0%, transparent 50%)'
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
          <div className="text-4xl text-center mb-4">&#10024;</div>
          <h1 className="text-2xl font-bold text-white text-center mb-2">
            Descubre tu destino
          </h1>
          <p className="text-purple-300/70 text-center mb-8">
            Crea tu cuenta y obtén tu primera lectura gratis
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-1">
                Nombre
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400/50" />
                <input
                  type="text"
                  {...register('name')}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-purple-900/30 rounded-lg text-white placeholder-purple-400/30 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Tu nombre"
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>
              )}
            </div>

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
              {/* Password Requirements */}
              <div className="mt-2 space-y-1">
                {passwordRequirements.map((req, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Check className={`w-4 h-4 ${req.met ? 'text-green-400' : 'text-purple-800'}`} />
                    <span className={req.met ? 'text-green-400' : 'text-purple-400/50'}>
                      {req.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-200 mb-1">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400/50" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('confirmPassword')}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-purple-900/30 rounded-lg text-white placeholder-purple-400/30 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-400">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                'Crear mi Cuenta'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-purple-300/70">
            Ya tienes cuenta?{' '}
            <Link
              href="/auth/login"
              className="text-purple-400 hover:text-purple-300 font-medium"
            >
              Inicia Sesion
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
