import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight, ArrowLeft, ShieldCheck, CreditCard, Upload, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { apiClient } from '../services/api';

// Display names shown to the customer differ from the exact values the
// `companies.plan` / `payments.plan` CHECK constraints accept in Supabase.
const PLAN_BILLING_KEY: Record<string, 'Emprendedor' | 'Negocio' | 'Empresa'> = {
  emprendedor: 'Emprendedor',
  negocio: 'Negocio',
  empresa: 'Empresa',
};

const PLAN_DETAILS = {
  'emprendedor': {
    name: 'Emprendedor',
    price: 15,
    features: [
      'Hasta 50 productos',
      'Catálogo Digital',
      'Pedidos por WhatsApp',
      'Código QR para compartir'
    ]
  },
  'negocio': {
    name: 'Negocio Pequeño',
    price: 39,
    features: [
      'Hasta 500 productos',
      'Punto de Venta (POS)',
      'Control de Inventario',
      'Gestión de Clientes (CRM)'
    ]
  },
  'empresa': {
    name: 'Empresa',
    price: 79,
    features: [
      'Productos Ilimitados',
      'Todo lo del plan Negocio',
      'Múltiples sucursales',
      'Soporte prioritario'
    ]
  }
};

type CheckoutStep = 'summary' | 'payment-method' | 'payment-details' | 'register' | 'success';

export default function Checkout() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  
  const selectedPlan = PLAN_DETAILS[(planId as keyof typeof PLAN_DETAILS) || 'negocio'];
  const planKey = PLAN_BILLING_KEY[(planId as string) || 'negocio'] || 'Negocio';
  
  const [step, setStep] = useState<CheckoutStep>('summary');
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    password: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState({ companyName: "WowSmart SAC", accountNumber: "999 888 777" });
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string | null>(null);
  const [proofError, setProofError] = useState<string | null>(null);

  const ALLOWED_PROOF_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  const MAX_PROOF_SIZE_MB = 5;

  const handleProofFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setProofError(null);
    if (!file) {
      setProofFile(null);
      setProofPreviewUrl(null);
      return;
    }
    if (!ALLOWED_PROOF_TYPES.includes(file.type)) {
      setProofError('Solo se aceptan archivos JPG, PNG, WEBP o PDF.');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_PROOF_SIZE_MB * 1024 * 1024) {
      setProofError(`El archivo supera el límite de ${MAX_PROOF_SIZE_MB}MB.`);
      e.target.value = '';
      return;
    }
    setProofFile(file);
    setProofPreviewUrl(file.type === 'application/pdf' ? null : URL.createObjectURL(file));
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Strip the "data:<mime>;base64," prefix -- the backend expects raw base64.
        resolve(result.split(',')[1] || '');
      };
      reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
      reader.readAsDataURL(file);
    });
  };

  React.useEffect(() => {
    const saved = localStorage.getItem('paymentSettings');
    if (saved) {
      try {
        setPaymentSettings(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  
  /** Returns the current user's company id, creating one (no trial) if they don't have one yet. */
  const ensureCompanyId = async (businessName: string): Promise<string> => {
    try {
      const dashboard = await apiClient.get('/api/dashboard/me');
      if (dashboard?.company?.id) return dashboard.company.id;
    } catch (err) {
      // No company yet for this user -- fall through and create one.
    }
    const company = await apiClient.post('/api/onboarding', { name: businessName || 'Mi Empresa', isTrial: false });
    return company.id;
  };

  const handlePaymentSubmit = async () => {
    if (!paymentMethod.includes('Tarjeta') && !proofFile) {
      setProofError('Debes subir tu comprobante de pago para continuar.');
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setStep('register');
        return;
      }

      const companyId = await ensureCompanyId(formData.businessName || 'Tu Empresa');
      const proofFilePayload = proofFile
        ? { base64Data: await fileToBase64(proofFile), mimeType: proofFile.type, fileName: proofFile.name }
        : undefined;

      await apiClient.post('/api/checkout/submit-payment', {
        companyId,
        plan: planKey,
        method: paymentMethod,
        proofFile: proofFilePayload,
      });
      setStep('success');
    } catch (err: any) {
      alert(err.message || 'Error al registrar el pago');
    } finally {
      setIsLoading(false);
    }
  };


  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!paymentMethod.includes('Tarjeta') && !proofFile) {
      setProofError('Debes subir tu comprobante de pago para continuar.');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.ownerName,
            business_name: formData.businessName
          }
        }
      });

      if (error) throw error;

      if (!data.session) {
        // Email confirmation is required before we have a session to create
        // the company/payment with. The payment can be completed from the
        // dashboard's upgrade banner once the user confirms and logs in.
        setNeedsEmailConfirmation(true);
        setStep('success');
        return;
      }

      const companyId = await ensureCompanyId(formData.businessName);
      const proofFilePayload = proofFile
        ? { base64Data: await fileToBase64(proofFile), mimeType: proofFile.type, fileName: proofFile.name }
        : undefined;

      await apiClient.post('/api/checkout/submit-payment', {
        companyId,
        plan: planKey,
        method: paymentMethod,
        proofFile: proofFilePayload,
      });

      setStep('success');
    } catch (err: any) {
      alert(err.message || 'Error al registrarse');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-200">
      <header className="bg-white border-b border-slate-200 h-16 flex items-center px-6 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
          <Link to="/" className="text-xl font-bold tracking-tight text-slate-800">
            <img src="/logo.png" alt="WowSmart" className="h-8 object-contain" />
          </Link>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <span className="hidden sm:inline">Pago Seguro</span>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto pt-10 pb-20 px-4">
        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-10 relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 -z-10 rounded-full"></div>
          
          <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-600 -z-10 rounded-full transition-all duration-500`}
            style={{ width: step === 'summary' ? '0%' : step === 'payment-method' ? '33%' : step === 'payment-details' ? '33%' : step === 'register' ? '66%' : '100%' }}
          ></div>

          {[
            { id: 'summary', label: 'Resumen' },
            { id: 'payment-method', label: 'Pago' },
            { id: 'register', label: 'Registro' },
            { id: 'success', label: 'Listo' }
          ].map((s, i) => {
            const isCompleted = 
              (s.id === 'summary' && step !== 'summary') ||
              (s.id === 'payment-method' && (step === 'register' || step === 'success')) ||
              (s.id === 'register' && step === 'success');
              
            const isCurrent = s.id === step || (s.id === 'payment-method' && step === 'payment-details');

            return (
              <div key={s.id} className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors \${
                  isCompleted ? 'bg-indigo-600 border-indigo-600 text-white' : 
                  isCurrent ? 'bg-white border-indigo-600 text-indigo-600' : 'bg-white border-slate-300 text-slate-400'
                }`}>
                  {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
                </div>
                <span className={`text-xs mt-2 font-medium absolute -bottom-6 whitespace-nowrap \${isCurrent || isCompleted ? 'text-slate-800' : 'text-slate-400'}`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-16">
          <AnimatePresence mode="wait">
            
            {/* Step 1: Summary */}
            {step === 'summary' && (
              <motion.div
                key="summary"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden"
              >
                <div className="p-8 border-b border-slate-100 text-center bg-slate-900 text-white">
                  <h2 className="text-2xl font-extrabold tracking-tight mb-2">Plan {selectedPlan.name}</h2>
                  <div className="flex items-end justify-center gap-1 mb-4">
                    <span className="text-5xl font-black">S/ {selectedPlan.price}</span>
                    <span className="text-slate-400 font-medium mb-1">/mes</span>
                  </div>
                  <p className="text-slate-300 text-sm">Cobro mensual recurrente. Cancela cuando quieras.</p>
                </div>

                <div className="p-8">
                  <h3 className="font-bold text-slate-800 mb-4 uppercase tracking-wider text-xs">Lo que incluye:</h3>
                  <ul className="space-y-4 mb-8">
                    {selectedPlan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0" />
                        <span className="text-slate-600 font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button 
                    onClick={() => setStep('payment-method')}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all flex justify-center items-center gap-2"
                  >
                    Continuar al pago <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Payment Method */}
            {step === 'payment-method' && (
              <motion.div
                key="payment-method"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden p-8">
                  <button 
                    onClick={() => setStep('summary')}
                    className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-800 transition-colors mb-6 -ml-2"
                  >
                    <ArrowLeft className="w-4 h-4" /> Volver
                  </button>
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">¿Cómo deseas pagar?</h2>
                    <p className="text-slate-500 font-medium">Selecciona tu método de pago preferido para activar el plan {selectedPlan.name}.</p>
                  </div>

                  <div className="space-y-3 mb-8">
                    {['Tarjeta de Crédito / Débito (Izipay)', 'Yape', 'Plin'].map(method => (
                      <label 
                        key={method} 
                        className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all \${
                          paymentMethod === method ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input 
                            type="radio" 
                            name="paymentMethod" 
                            value={method} 
                            checked={paymentMethod === method}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-5 h-5 text-indigo-600 focus:ring-indigo-600 border-slate-300"
                          />
                          <span className="font-bold text-slate-700">{method}</span>
                        </div>
                        {method.includes('Tarjeta') ? (
                          <div className="flex items-center gap-1">
                             <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Visa.svg/1200px-Visa.svg.png" alt="Visa" className="h-4 object-contain" />
                             <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/MasterCard_Logo.svg/1200px-MasterCard_Logo.svg.png" alt="Mastercard" className="h-4 object-contain ml-1" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center text-xs font-bold text-slate-500">QR</div>
                        )}
                      </label>
                    ))}
                  </div>

                  <button 
                    onClick={() => setStep('payment-details')}
                    disabled={!paymentMethod}
                    className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition-all flex justify-center items-center gap-2 disabled:opacity-50"
                  >
                    Continuar con el pago
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Payment Details */}
            {step === 'payment-details' && (
              <motion.div
                key="payment-details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <button 
                  onClick={() => setStep('payment-method')}
                  className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-800 transition-colors mb-6"
                >
                  <ArrowLeft className="w-4 h-4" /> Cambiar método
                </button>

                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-8 border-b border-slate-100 text-center bg-slate-50">
                    <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 font-bold text-xs rounded-full mb-4 uppercase tracking-widest">
                      Plan {selectedPlan.name}
                    </span>
                    <div className="text-sm font-bold text-slate-500 mb-1">Monto a pagar</div>
                    <div className="text-4xl font-black text-slate-900">S/ {selectedPlan.price.toFixed(2)}</div>
                  </div>

                  <div className="p-8">
                    {paymentMethod.includes('Tarjeta') ? (
                      <div className="max-w-md mx-auto text-left">
                        <div className="mb-6 flex justify-between items-center">
                           <p className="text-slate-600 font-medium">Ingresa los datos de tu tarjeta de crédito o débito.</p>
                           <div className="flex gap-2">
                             <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Visa.svg/1200px-Visa.svg.png" alt="Visa" className="h-6" />
                             <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/MasterCard_Logo.svg/1200px-MasterCard_Logo.svg.png" alt="Mastercard" className="h-6" />
                           </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Número de Tarjeta</label>
                            <input type="text" placeholder="0000 0000 0000 0000" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                          </div>
                          <div className="flex gap-4">
                            <div className="w-1/2">
                              <label className="block text-sm font-bold text-slate-700 mb-1">Vencimiento (MM/AA)</label>
                              <input type="text" placeholder="MM/AA" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                            </div>
                            <div className="w-1/2">
                              <label className="block text-sm font-bold text-slate-700 mb-1">CVC</label>
                              <input type="text" placeholder="123" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Nombre en la tarjeta</label>
                            <input type="text" placeholder="Juan Pérez" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                          </div>
                          
                          <div className="flex items-center gap-2 mt-4 text-xs text-slate-500 justify-center">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            Pagos 100% seguros procesados por <span className="font-bold text-slate-700">Izipay</span>
                          </div>
                          
                          <button 
                            onClick={handlePaymentSubmit}
                            disabled={isLoading}
                            className="w-full mt-4 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition-all flex justify-center items-center gap-2 disabled:opacity-70"
                          >
                            {isLoading ? (
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                              'Pagar S/ ' + selectedPlan.price.toFixed(2)
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="text-center mb-8">
                          <p className="text-slate-600 font-medium mb-4">Escanea el código QR de <strong>{paymentMethod}</strong> para realizar el pago.</p>
                          <div className="w-48 h-48 bg-white border-2 border-slate-200 rounded-2xl mx-auto flex items-center justify-center p-2 shadow-sm">
                            {/* Simulación de QR */}
                            <div className="w-full h-full bg-slate-900 rounded-xl flex items-center justify-center relative overflow-hidden">
                              <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 gap-1 p-2">
                                 {Array.from({length: 16}).map((_, i) => (
                                   <div key={i} className={`bg-white rounded-sm \${i % 2 === 0 ? 'opacity-90' : 'opacity-40'}`}></div>
                                 ))}
                              </div>
                              <div className="w-12 h-12 bg-white relative z-10 rounded shadow-md flex items-center justify-center font-black text-slate-900 text-xs">
                                {paymentMethod}
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-slate-500 mt-4">A nombre de: {paymentSettings.companyName}<br/>Número: {paymentSettings.accountNumber}</p>
                        </div>

                        <div className="border-t border-slate-100 pt-8">
                          <label className="block text-sm font-bold text-slate-700 mb-4 text-center">Sube tu comprobante de pago</label>

                          {proofFile ? (
                            <div className="border-2 border-emerald-200 bg-emerald-50/50 rounded-2xl p-4 mb-4 flex items-center gap-4">
                              {proofPreviewUrl ? (
                                <img src={proofPreviewUrl} alt="Vista previa del comprobante" className="w-16 h-16 object-cover rounded-lg border border-slate-200" />
                              ) : (
                                <div className="w-16 h-16 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-xs font-bold text-slate-500">PDF</div>
                              )}
                              <div className="flex-1 text-left min-w-0">
                                <p className="text-sm font-bold text-slate-800 truncate">{proofFile.name}</p>
                                <p className="text-xs text-slate-500">{(proofFile.size / 1024).toFixed(0)} KB</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => { setProofFile(null); setProofPreviewUrl(null); }}
                                className="text-xs font-bold text-rose-600 hover:text-rose-800 px-2"
                              >
                                Quitar
                              </button>
                            </div>
                          ) : (
                            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer mb-4 relative group">
                              <input type="file" accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf" onChange={handleProofFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2 group-hover:text-indigo-500 transition-colors" />
                              <p className="text-sm font-medium text-slate-600">Haz clic para seleccionar archivo</p>
                              <p className="text-xs text-slate-400 mt-1">PNG, JPG, WEBP o PDF (Max. {MAX_PROOF_SIZE_MB}MB)</p>
                            </div>
                          )}

                          {proofError && (
                            <p className="text-sm text-rose-600 font-medium mb-4 text-center">{proofError}</p>
                          )}

                          <button 
                            onClick={handlePaymentSubmit}
                            disabled={isLoading || !proofFile}
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all flex justify-center items-center gap-2 disabled:opacity-70"
                          >
                            {isLoading ? (
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                              'He realizado el pago'
                            )}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Register Account */}
            {step === 'register' && (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden p-8">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">¡Pago Confirmado!</h2>
                    <p className="text-slate-500 font-medium">Solo falta crear tu cuenta para comenzar a usar WowSmart.</p>
                  </div>
                  
                  <div className="mb-8 pb-8 border-b border-slate-200">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Nombre de tu Negocio <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-700 font-medium"
                      placeholder="Ej. Mi Tiendita"
                      required
                    />
                  </div>
                  
                  <form onSubmit={handleRegisterSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Nombre Completo</label>
                      <input 
                        type="text" 
                        name="ownerName"
                        value={formData.ownerName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Correo Electrónico</label>
                      <input 
                        type="email" 
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Contraseña</label>
                      <input 
                        type="password" 
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        required
                        minLength={6}
                      />
                    </div>
                    
                    <button 
                      type="submit"
                      disabled={isLoading}
                      className="w-full mt-4 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition-all flex justify-center items-center gap-2 disabled:opacity-70"
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        'Crear cuenta y Finalizar'
                      )}
                    </button>
                  </form>
                </div>
              </motion.div>
            )}

            {/* Step 5: Success / Validation Pending */}
            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden p-10 text-center"
              >
                <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <div className="w-16 h-16 bg-amber-200 rounded-full flex items-center justify-center animate-pulse">
                     <ShieldCheck className="w-8 h-8 text-amber-600" />
                  </div>
                </div>
                
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-4">Cuenta Creada</h2>
                
                <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl mb-8 text-left max-w-sm mx-auto">
                   <div className="flex justify-between mb-2">
                     <span className="text-slate-500 font-medium">Estado:</span>
                     <span className="font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded text-xs uppercase tracking-wider">Pendiente</span>
                   </div>
                   <div className="flex justify-between mb-2">
                     <span className="text-slate-500 font-medium">Empresa:</span>
                     <span className="font-bold text-slate-800">{formData.businessName || 'Tu Negocio'}</span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-slate-500 font-medium">Suscripción:</span>
                     <span className="font-bold text-slate-400">No activa (Bloqueada)</span>
                   </div>
                </div>

                <p className="text-slate-600 mb-8 max-w-md mx-auto leading-relaxed">
                  {needsEmailConfirmation ? (
                    <><strong className="text-slate-800 block mb-2">Confirma tu correo para continuar.</strong> Te enviamos un enlace de confirmación a {formData.email}. Una vez que confirmes e inicies sesión, podrás completar tu pago desde el panel.</>
                  ) : (
                    <>Hemos recibido tu comprobante de pago. Nuestro equipo lo está verificando y <strong>activará tu cuenta en breve</strong>. Recibirás una notificación por correo cuando esté listo.</>
                  )}
                </p>

                <Link 
                  to="/dashboard"
                  className="inline-block py-3.5 px-8 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all"
                >
                  Ir al panel de control
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
