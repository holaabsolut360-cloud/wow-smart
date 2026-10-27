import { track as gaTrack } from '../lib/analytics';
import React, { useState } from 'react';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Mail, Lock, User, ArrowRight, ArrowLeft, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { supabase, pingAuth } from '../lib/supabase';
import Logo from '../components/Logo';
import { RUBRO_TEMPLATES, isValidWhatsapp } from '../config/templates';

type AuthView = 'login' | 'register' | 'forgot-password' | 'reset-sent' | 'registration-sent' | 'onboarding';

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
  // Programa de referidos: ?ref=CODIGO se guarda hasta que el negocio termine su registro.
  const [referralCode] = useState<string>(() => {
    try {
      const fromUrl = new URLSearchParams(window.location.search).get('ref');
      if (fromUrl) localStorage.setItem('ws_ref', fromUrl.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16));
      return localStorage.getItem('ws_ref') || '';
    } catch { return ''; }
  });
  const [companyWhatsapp, setCompanyWhatsapp] = useState('');
  const [rubro, setRubro] = useState<string>('tienda');
  const [useTemplate, setUseTemplate] = useState(true);
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
        const { data: li, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        pingAuth(li.session?.access_token);
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
        pingAuth(data.session?.access_token);
        gaTrack('sign_up', { method: 'email' });
        gaTrack('start_trial', { trial_days: 15 });
        setView(data.session ? 'onboarding' : 'registration-sent');
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
            <img src="/icon.png" alt="WowSmart" className="h-14 w-auto object-contain" />
          </Link>
          
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight mb-6">
            Lleva tu negocio al <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">siguiente nivel.</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-md">
            Gestiona tu catálogo, tus pedidos por WhatsApp y tus ventas desde un solo lugar.
          </p>
        </div>

        <div className="relative z-10 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl max-w-md">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex -space-x-3">
              {['L', 'V', 'A'].map((l) => (
                <div key={l} className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 border-2 border-slate-800 flex items-center justify-center text-white font-black">
                  {l}
                </div>
              ))}
            </div>
            <div className="text-sm">
              <span className="text-slate-300 font-medium">Lux, Varyk Watches y más negocios peruanos ya confían en nosotros</span>
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
                  {referralCode && <p className="mt-3 inline-block text-sm font-bold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700">🎁 Te invitaron: 1 mes gratis al pagar tu primer plan</p>}
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
                      Acepto los <a href="/terminos" target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-bold hover:underline">Términos y Condiciones</a> y la <a href="/privacidad" target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-bold hover:underline">Política de Privacidad</a>.
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
                  <p className="text-slate-500">Paso 1 de 3 · Tus datos básicos. Tienes 15 días de prueba gratis, sin tarjeta.</p>
                  <div className="mt-4 h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full w-1/3 bg-gradient-to-r from-indigo-600 to-violet-600" /></div>
                </div>
                                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (!isValidWhatsapp(companyWhatsapp)) {
                    alert('Ingresa tu número de WhatsApp (ej. 987 654 321). Es por donde te llegarán los pedidos.');
                    return;
                  }
                  setIsLoading(true);
                  try {
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
                      body: JSON.stringify({ name: companyName, whatsapp: companyWhatsapp, rubro, useTemplate: rubro !== 'otro' && useTemplate, referralCode: referralCode || undefined })
                    });

                    if (!res.ok) {
                      const data = await res.json().catch(() => null);
                      throw new Error(data?.error || 'Error creating company');
                    }

                    gaTrack('onboarding_step', { step: 'empresa_creada', rubro, referido: Boolean(referralCode) });
                    try { localStorage.removeItem('ws_ref'); } catch {}
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
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">WhatsApp para recibir pedidos</label>
                    <input
                      type="tel"
                      inputMode="tel"
                      value={companyWhatsapp}
                      onChange={(e) => setCompanyWhatsapp(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-700 font-medium"
                      placeholder="987 654 321"
                      required
                    />
                    <p className="text-xs text-slate-400 mt-1">Sin esto tu catálogo no puede recibir pedidos. Si es de Perú, no hace falta poner +51.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">¿A qué se dedica tu negocio?</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[...Object.entries(RUBRO_TEMPLATES).map(([k, t]) => ({ k, label: t.label, emoji: t.emoji })), { k: 'otro', label: 'Otro rubro', emoji: '✨' }].map(o => (
                        <button type="button" key={o.k} onClick={() => setRubro(o.k)}
                          className={`text-left px-3 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${rubro === o.k ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                          <span className="mr-1">{o.emoji}</span>{o.label}
                        </button>
                      ))}
                    </div>
                    {rubro !== 'otro' && (
                      <label className="flex items-center gap-2 mt-3 text-sm text-slate-600">
                        <input type="checkbox" checked={useTemplate} onChange={e => setUseTemplate(e.target.checked)} className="accent-indigo-600" />
                        Cargar 3 productos de ejemplo para editar (puedes borrarlos luego)
                      </label>
                    )}
                  </div>
                  <button 
                    type="submit" 
                    disabled={isLoading || !companyName || !companyWhatsapp}
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
            {view === 'registration-sent' && (
              <motion.div
                key="registration-sent"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-4">Confirma tu correo</h2>
                <p className="text-slate-500 mb-8 max-w-sm mx-auto">
                  Hemos enviado un enlace de confirmación a <strong>{email}</strong>. Revisa tu bandeja de entrada o la carpeta de spam.
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
