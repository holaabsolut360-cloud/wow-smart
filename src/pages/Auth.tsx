import React, { useState } from 'react';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Mail, Lock, User, ArrowRight, ArrowLeft, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Logo from '../components/Logo';

type AuthView = 'login' | 'register' | 'forgot-password' | 'reset-sent' | 'onboarding';

export default function Auth() {
  const [view, setView] = useState<AuthView>(
    new URLSearchParams(window.location.search).get('mode') === 'register'
      ? 'register'
      : new URLSearchParams(window.location.search).get('mode') === 'onboarding'
        ? 'onboarding'
        : 'login'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authError = params.get('error_description') || params.get('error');

    if (authError) {
      alert(decodeURIComponent(authError.replace(/\+/g, ' ')));
      window.history.replaceState({}, document.title, window.location.pathname + (params.get('mode') ? `?mode=${params.get('mode')}` : ''));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (view === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        navigate('/dashboard');
      } else if (view === 'register') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: window.location.origin + '/auth?mode=onboarding'
          }
        });
        if (error) throw error;
        setView(data.session ? 'onboarding' : 'reset-sent');
      } else if (view === 'forgot-password') {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        setView('reset-sent');
      }
    } catch (error: any) {
      alert(error.message || 'Error de autenticación');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans selection:bg-indigo-200">
      {/* Left Panel - Brand/Info */}
      <div className="hidden md:flex md:w-1/2 bg-slate-900 text-white p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-1/4 -right-1/4 w-3/4 h-3/4 bg-indigo-600/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-1/4 -left-1/4 w-3/4 h-3/4 bg-blue-600/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2 mb-12 w-fit">
            <Logo size="lg" />
          </Link>
          
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight mb-6">
            Lleva tu negocio al <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">siguiente nivel.</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-md">
            Miles de emprendedores ya están gestionando sus catálogos y ventas por WhatsApp desde un solo lugar.
          </p>
        </div>

        <div className="relative z-10 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl max-w-md">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex -space-x-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full bg-slate-700 border-2 border-slate-800 flex items-center justify-center overflow-hidden">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`} alt="User avatar" className="w-full h-full" />
                </div>
              ))}
            </div>
            <div className="text-sm">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-slate-300 font-medium">+5,000 negocios activos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 relative">
        <Link to="/" className="md:hidden absolute top-6 left-6 flex items-center gap-2">
          <Logo size="sm" />
        </Link>

        <div className="w-full max-w-md mt-16 md:mt-0">
          <AnimatePresence mode="wait">
            {view === 'login' && (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-8">
                  <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Bienvenido de nuevo</h2>
                  <p className="text-slate-500">Ingresa a tu cuenta para gestionar tu negocio.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Correo Electrónico</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-700 font-medium"
                        placeholder="tu@correo.com"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-bold text-slate-700">Contraseña</label>
                      <button 
                        type="button" 
                        onClick={() => setView('forgot-password')}
                        className="text-sm font-bold text-indigo-600 hover:text-indigo-700"
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-700 font-medium"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>
                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>Ingresar <ArrowRight className="w-5 h-5" /></>
                    )}
                  </button>
                </form>

                <p className="mt-8 text-center text-slate-600 font-medium">
                  ¿No tienes una cuenta?{' '}
                  <button 
                    onClick={() => setView('register')}
                    className="text-indigo-600 font-bold hover:text-indigo-700 transition-colors"
                  >
                    Regístrate gratis
                  </button>
                </p>
              </motion.div>
            )}

            {view === 'register' && (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-8">
                  <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Crea tu cuenta</h2>
                  <p className="text-slate-500">Comienza a vender hoy mismo con tu catálogo digital.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Nombre Completo</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-700 font-medium"
                        placeholder="Juan Pérez"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Correo Electrónico</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-700 font-medium"
                        placeholder="tu@correo.com"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Contraseña</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-700 font-medium"
                        placeholder="Mínimo 8 caracteres"
                        required
                        minLength={8}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2 mt-4 mb-6">
                    <input 
                      type="checkbox" 
                      id="terms" 
                      className="mt-1 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                      required
                    />
                    <label htmlFor="terms" className="text-sm text-slate-600">
                      Acepto los <a href="#" className="text-indigo-600 font-bold hover:underline">Términos de servicio</a> y la <a href="#" className="text-indigo-600 font-bold hover:underline">Política de privacidad</a>.
                    </label>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>Crear cuenta <ArrowRight className="w-5 h-5" /></>
                    )}
                  </button>
                </form>

                <p className="mt-8 text-center text-slate-600 font-medium">
                  ¿Ya tienes una cuenta?{' '}
                  <button 
                    onClick={() => setView('login')}
                    className="text-indigo-600 font-bold hover:text-indigo-700 transition-colors"
                  >
                    Inicia sesión
                  </button>
                </p>
              </motion.div>
            )}

            {view === 'forgot-password' && (
              <motion.div
                key="forgot-password"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <button 
                  onClick={() => setView('login')}
                  className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-800 transition-colors mb-8"
                >
                  <ArrowLeft className="w-4 h-4" /> Volver
                </button>
                
                <div className="mb-8">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
                    <ShieldCheck className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Recuperar contraseña</h2>
                  <p className="text-slate-500">Ingresa tu correo electrónico y te enviaremos las instrucciones para restablecer tu contraseña.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Correo Electrónico</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-700 font-medium"
                        placeholder="tu@correo.com"
                        required
                      />
                    </div>
                  </div>
                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      'Enviar instrucciones'
                    )}
                  </button>
                </form>
              </motion.div>
            )}

            
            {view === 'onboarding' && (
              <motion.div
                key="onboarding"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-8">
                  <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Crea tu Empresa</h2>
                  <p className="text-slate-500">Para continuar, necesitamos el nombre de tu negocio.</p>
                </div>
                                <form onSubmit={async (e) => {
                  e.preventDefault();
                  setIsLoading(true);
                  try {
                    const isTrial = new URLSearchParams(window.location.search).get('trial') === 'true';
                    const session = await supabase.auth.getSession();
                    if (!session.data.session) {
                      alert('Primero confirma tu correo o inicia sesión para crear tu empresa.');
                      setView('login');
                      return;
                    }

                    const res = await fetch('/api/onboarding', {
                      method: 'POST',
                      headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + session.data.session.access_token
                      },
                      body: JSON.stringify({ name: companyName, isTrial })
                    });

                    if (!res.ok) {
                      const data = await res.json().catch(() => null);
                      throw new Error(data?.error || 'Error creating company');
                    }

                    navigate('/dashboard');
                  } catch(e: any) {
                    alert(e.message || 'Error creating company');
                  } finally {
                    setIsLoading(false);
                  }
                }} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Nombre de la Empresa</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"></path><path d="M9 8h1"></path><path d="M9 12h1"></path><path d="M9 16h1"></path><path d="M14 8h1"></path><path d="M14 12h1"></path><path d="M14 16h1"></path><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"></path></svg>
                      </div>
                      <input 
                        type="text" 
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-700 font-medium"
                        placeholder="Mi Super Negocio"
                        required
                      />
                    </div>
                  </div>
                  <button 
                    type="submit" 
                    disabled={isLoading || !companyName}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>Continuar <ArrowRight className="w-5 h-5" /></>
                    )}
                  </button>
                </form>
              </motion.div>
            )}
            {view === 'reset-sent' && (
              <motion.div
                key="reset-sent"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-4">Revisa tu correo</h2>
                <p className="text-slate-500 mb-8 max-w-sm mx-auto">
                  Hemos enviado un enlace de recuperación a <strong>{email}</strong>. Por favor, revisa tu bandeja de entrada o carpeta de spam.
                </p>
                <button 
                  onClick={() => setView('login')}
                  className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition-all"
                >
                  Volver al inicio de sesión
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
