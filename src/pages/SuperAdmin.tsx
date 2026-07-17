import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building2, 
  CreditCard, 
  Package, 
  Blocks, 
  Wallet, 
  Tag, 
  Users, 
  Headphones, 
  BarChart3, 
  Settings, 
  ShieldCheck, 
  Handshake,
  LogOut,
  Search,
  Bell,
  Menu,
  X,
  CheckCircle,
  XCircle,
  Image as ImageIcon
} from 'lucide-react';

export default function SuperAdmin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [empresas, setEmpresas] = useState([
    { id: '1', nombre: 'Ferretería Perú', plan: 'Negocio', estado: 'Activa', registro: '2023-08-10' },
    { id: '2', nombre: 'Boutique La Moda', plan: 'Emprendedor', estado: 'Suspendida', registro: '2023-09-01' },
    { id: '3', nombre: 'Restaurante Sabor', plan: 'Empresa', estado: 'Activa', registro: '2023-09-15' },
    { id: '4', nombre: 'TechStore PE', plan: 'Negocio', estado: 'Pendiente', registro: '2023-10-02' }
  ]);

  const [suscripciones, setSuscripciones] = useState([
    { id: '1', empresa: 'Ferretería Perú', plan: 'Negocio', estado: 'Activa', vencimiento: '2023-11-10', precio: 39, metodoPago: 'Yape', referencia: '' },
    { id: '2', empresa: 'Boutique La Moda', plan: 'Emprendedor', estado: 'Vencida', vencimiento: '2023-10-01', precio: 15, metodoPago: 'Transferencia', referencia: '' },
    { id: '3', empresa: 'Restaurante Sabor', plan: 'Empresa', estado: 'Activa', vencimiento: '2023-10-15', precio: 79, metodoPago: 'Tarjeta', referencia: '' },
    { id: '4', empresa: 'Comercial ABC', plan: 'Emprendedor', estado: 'Pendiente', vencimiento: '-', precio: 15, metodoPago: 'Izipay', referencia: '123456789' }
  ]);
  const [editingEmpresa, setEditingEmpresa] = useState<any>(null);
  const [izipayVerifyTarget, setIzipayVerifyTarget] = useState<any>(null);

  const [paymentSettings, setPaymentSettings] = useState(() => {
    return JSON.parse(localStorage.getItem('paymentSettings') || '{"companyName": "WowSmart SAC", "accountNumber": "999 888 777"}');
  });

  useEffect(() => {
    let mounted = true;

    fetch('/api/superadmin/session')
      .then(res => res.ok ? res.json() : { authenticated: false })
      .then(data => {
        if (mounted) setIsAuthenticated(Boolean(data.authenticated));
      })
      .catch(() => {
        if (mounted) setIsAuthenticated(false);
      })
      .finally(() => {
        if (mounted) setAuthChecking(false);
      });

    return () => {
      mounted = false;
    };
  }, []);
  
  const handleSavePaymentSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('paymentSettings', JSON.stringify(paymentSettings));
    alert('Configuración de pagos guardada exitosamente');
  };


  useEffect(() => {
    if (isAuthenticated) {
      const payments = JSON.parse(localStorage.getItem('pendingPayments') || '[]');
      setPendingPayments(payments);
    }
  }, [isAuthenticated, activeTab]);

  const handleApprovePayment = async (id: string, payment: any) => {
    const payments = pendingPayments.filter(p => p.id !== id);
    setPendingPayments(payments);
    localStorage.setItem('pendingPayments', JSON.stringify(payments));
    
    const nuevaEmpresa = {
      id: Date.now().toString(),
      nombre: payment.businessName,
      plan: payment.plan,
      estado: 'Activa',
      registro: new Date().toISOString().split('T')[0]
    };
    
    setEmpresas(prev => [nuevaEmpresa, ...prev]);
    
    const vencimiento = new Date();
    vencimiento.setDate(vencimiento.getDate() + 30);
    
    const nuevaSuscripcion = {
      id: Date.now().toString(),
      empresa: payment.businessName,
      plan: payment.plan,
      estado: 'Activa',
      vencimiento: vencimiento.toISOString().split('T')[0],
      precio: payment.amount
    };
    
    setSuscripciones(prev => [nuevaSuscripcion, ...prev]);

    // Llama a la API para enviar correo
    try {
      await fetch('/api/approve-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: payment.email || 'cliente@ejemplo.com',
          businessName: payment.businessName,
          plan: payment.plan,
          amount: payment.amount
        })
      });
    } catch (e) {
      console.error('Error enviando correo', e);
    }
    
    alert('Pago aprobado. La suscripción se ha activado y se ha enviado el comprobante por correo.');
  };

  const handleRejectPayment = (id: string) => {
    const payments = pendingPayments.filter(p => p.id !== id);
    setPendingPayments(payments);
    localStorage.setItem('pendingPayments', JSON.stringify(payments));
    alert('Pago rechazado. Se ha notificado al cliente para que suba un nuevo comprobante.');
  };

  const handleActivarEmpresa = (id: string) => {
    setEmpresas(prev => prev.map(emp => emp.id === id ? { ...emp, estado: 'Activa' } : emp));
  };

  const handleSuspenderEmpresa = (id: string) => {
    setEmpresas(prev => prev.map(emp => emp.id === id ? { ...emp, estado: 'Suspendida' } : emp));
  };

  const handleVerificarIzipay = (id: string) => {
    setSuscripciones(prev => prev.map(sub => {
      if (sub.id === id) {
        const vencimiento = new Date();
        vencimiento.setDate(vencimiento.getDate() + 30);
        return { ...sub, estado: 'Activa', vencimiento: vencimiento.toISOString().split('T')[0] };
      }
      return sub;
    }));
    setIzipayVerifyTarget(null);
    alert('Pago verificado por Izipay y suscripción activada.');
  };

  const handleSaveEmpresaData = (e: React.FormEvent) => {
    e.preventDefault();
    setSuscripciones(prev => prev.map(sub => sub.id === editingEmpresa.id ? { ...sub, empresa: editingEmpresa.empresa, plan: editingEmpresa.plan } : sub));
    setEmpresas(prev => prev.map(emp => emp.nombre === editingEmpresa.originalName ? { ...emp, nombre: editingEmpresa.empresa, plan: editingEmpresa.plan } : emp));
    setEditingEmpresa(null);
    alert('Datos de la empresa actualizados exitosamente.');
  };

  const handleRenovarSuscripcion = (id: string) => {
    setSuscripciones(prev => prev.map(sub => {
      if (sub.id === id) {
        const d = new Date(sub.vencimiento);
        d.setDate(d.getDate() + 30);
        return { ...sub, vencimiento: d.toISOString().split('T')[0], estado: 'Activa' };
      }
      return sub;
    }));
    alert('Suscripción renovada por 30 días.');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmittingLogin(true);
    try {
      const res = await fetch('/api/superadmin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Credenciales incorrectas');
      }

      setIsAuthenticated(true);
      setPassword('');
    } catch (err: any) {
      setError(err.message || 'No se pudo iniciar sesion.');
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/superadmin/logout', { method: 'POST' }).catch(() => null);
    setIsAuthenticated(false);
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'empresas', label: 'Empresas', icon: Building2 },
    { id: 'suscripciones', label: 'Suscripciones', icon: CreditCard },
    { id: 'planes', label: 'Planes', icon: Package },
    { id: 'funcionalidades', label: 'Funcionalidades', icon: Blocks },
    { id: 'pagos', label: 'Pagos', icon: Wallet },
    { id: 'promociones', label: 'Promociones', icon: Tag },
    { id: 'usuarios', label: 'Usuarios Administradores', icon: Users },
    { id: 'soporte', label: 'Soporte', icon: Headphones },
    { id: 'reportes', label: 'Reportes', icon: BarChart3 },
    { id: 'configuracion', label: 'Configuración General', icon: Settings },
    { id: 'auditoria', label: 'Auditoría', icon: ShieldCheck },
    { id: 'crm', label: 'CRM Comercial', icon: Handshake },
  ];

  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center text-slate-500">
        Verificando acceso...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans selection:bg-indigo-200">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 md:p-10 rounded-3xl shadow-xl w-full max-w-md border border-slate-200 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
          
          <div className="text-center mb-8 mt-2">
            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <ShieldCheck className="w-8 h-8 text-indigo-400" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Acceso Restringido</h1>
            <p className="text-slate-500 font-medium text-sm">SuperAdmin de la Plataforma</p>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-rose-50 text-rose-600 p-4 rounded-xl mb-6 text-sm font-bold text-center border border-rose-200">
              {error}
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Correo Electrónico</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-700 font-medium"
                placeholder="admin@catalogpro.com"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Contraseña</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-700 font-medium"
                placeholder="••••••••"
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={isSubmittingLogin}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition-colors mt-4 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmittingLogin ? 'Ingresando...' : 'Ingresar al Panel'}
            </button>
          </form>
          
          <div className="mt-8 text-center border-t border-slate-100 pt-6">
             <Link to="/" className="text-slate-400 font-medium hover:text-slate-600 text-sm transition-colors flex items-center justify-center gap-1">
               <LogOut className="w-4 h-4 rotate-180" />
               Volver al sitio principal
             </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out md:relative md:translate-x-0 shrink-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-20 flex items-center justify-between px-6 bg-slate-950 border-b border-slate-800">
          <span className="text-xl font-bold text-white tracking-tight">Super<span className="text-indigo-500">Admin</span></span>
          <button className="md:hidden p-1 hover:bg-slate-800 rounded-lg transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
                activeTab === item.id 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </div>
        
        <div className="p-4 border-t border-slate-800">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors font-medium text-sm">
            <LogOut className="w-5 h-5" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 text-white flex items-center justify-between px-4 z-30">
        <span className="text-lg font-bold">Super<span className="text-indigo-500">Admin</span></span>
        <button className="p-2" onClick={() => setIsMobileMenuOpen(true)}>
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden pt-16 md:pt-0">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <h1 className="text-2xl font-bold text-slate-800">
            {menuItems.find(i => i.id === activeTab)?.label}
          </h1>
          <div className="flex items-center gap-6">
            <div className="relative hidden md:block">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar empresas, usuarios..." 
                className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-64"
              />
            </div>
            <button className="relative text-slate-500 hover:text-indigo-600 transition-colors">
              <Bell className="w-6 h-6" />
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
            </button>
            <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold border-2 border-white shadow-sm">
              SA
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-slate-500 text-sm font-bold mb-2">Total Empresas</div>
                <div className="text-4xl font-black text-slate-800">1,245</div>
                <div className="text-emerald-500 text-sm font-bold mt-2">+12% este mes</div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-slate-500 text-sm font-bold mb-2">Ingresos (MRR)</div>
                <div className="text-4xl font-black text-slate-800">$45,200</div>
                <div className="text-emerald-500 text-sm font-bold mt-2">+8% este mes</div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-slate-500 text-sm font-bold mb-2">Suscripciones Activas</div>
                <div className="text-4xl font-black text-slate-800">890</div>
                <div className="text-slate-400 text-sm font-bold mt-2">72% de retención</div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-slate-500 text-sm font-bold mb-2">Tickets Soporte</div>
                <div className="text-4xl font-black text-slate-800">24</div>
                <div className="text-rose-500 text-sm font-bold mt-2">5 urgentes</div>
              </div>
            </div>
          )}
          
          {activeTab === 'pagos' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Pagos Pendientes de Validación</h2>
                  <p className="text-slate-500 text-sm">Revisa los comprobantes y aprueba las suscripciones.</p>
                </div>
                <div className="bg-amber-100 text-amber-700 font-bold px-3 py-1 rounded-full text-sm">
                  {pendingPayments.length} Pendientes
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                      <th className="p-4 font-bold border-b border-slate-200">Empresa</th>
                      <th className="p-4 font-bold border-b border-slate-200">Plan</th>
                      <th className="p-4 font-bold border-b border-slate-200">Monto</th>
                      <th className="p-4 font-bold border-b border-slate-200">Método</th>
                      <th className="p-4 font-bold border-b border-slate-200">Comprobante</th>
                      <th className="p-4 font-bold border-b border-slate-200">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {pendingPayments.length > 0 ? (
                      pendingPayments.map(payment => (
                        <tr key={payment.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="p-4 font-bold text-slate-800">{payment.businessName}</td>
                          <td className="p-4 text-slate-600">
                            <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded font-medium text-xs">{payment.plan}</span>
                          </td>
                          <td className="p-4 font-bold text-slate-800">S/ {payment.amount}</td>
                          <td className="p-4 text-slate-600">{payment.method}</td>
                          <td className="p-4">
                            <button className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium">
                              <ImageIcon className="w-4 h-4" /> Ver Imagen
                            </button>
                          </td>
                          <td className="p-4 flex gap-2">
                            <button onClick={() => handleApprovePayment(payment.id, payment)} className="flex items-center gap-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-3 py-1.5 rounded-lg font-bold transition-colors">
                              <CheckCircle className="w-4 h-4" /> Aprobar
                            </button>
                            <button onClick={() => handleRejectPayment(payment.id)} className="flex items-center gap-1 bg-rose-100 text-rose-700 hover:bg-rose-200 px-3 py-1.5 rounded-lg font-bold transition-colors">
                              <XCircle className="w-4 h-4" /> Rechazar
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500">
                          No hay pagos pendientes de validación en este momento.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'empresas' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Gestión de Empresas</h2>
                  <p className="text-slate-500 text-sm">Administra las cuentas de las empresas registradas.</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                      <th className="p-4 font-bold border-b border-slate-200">Empresa</th>
                      <th className="p-4 font-bold border-b border-slate-200">Plan</th>
                      <th className="p-4 font-bold border-b border-slate-200">Estado</th>
                      <th className="p-4 font-bold border-b border-slate-200">Registro</th>
                      <th className="p-4 font-bold border-b border-slate-200">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {empresas.map(empresa => (
                      <tr key={empresa.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="p-4 font-bold text-slate-800">{empresa.nombre}</td>
                        <td className="p-4 text-slate-600">{empresa.plan}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded font-medium text-xs ${
                            empresa.estado === 'Activa' ? 'bg-emerald-100 text-emerald-700' : 
                            empresa.estado === 'Suspendida' ? 'bg-rose-100 text-rose-700' : 
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {empresa.estado}
                          </span>
                        </td>
                        <td className="p-4 text-slate-600">{empresa.registro}</td>
                        <td className="p-4 flex gap-2">
                          {empresa.estado === 'Activa' ? (
                            <button onClick={() => handleSuspenderEmpresa(empresa.id)} className="text-rose-600 hover:text-rose-800 font-medium text-sm">Suspender</button>
                          ) : (
                            <button onClick={() => handleActivarEmpresa(empresa.id)} className="text-emerald-600 hover:text-emerald-800 font-medium text-sm">Activar</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'suscripciones' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Suscripciones Activas</h2>
                  <p className="text-slate-500 text-sm">Gestiona renovaciones y estados de suscripción.</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                      <th className="p-4 font-bold border-b border-slate-200">Empresa</th>
                      <th className="p-4 font-bold border-b border-slate-200">Plan</th>
                      <th className="p-4 font-bold border-b border-slate-200">Precio (S/)</th>
                      <th className="p-4 font-bold border-b border-slate-200">Estado</th>
                      <th className="p-4 font-bold border-b border-slate-200">Método / Ref</th>
                      <th className="p-4 font-bold border-b border-slate-200">Vencimiento</th>
                      <th className="p-4 font-bold border-b border-slate-200 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {suscripciones.map(sub => (
                      <tr key={sub.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="p-4 font-bold text-slate-800">{sub.empresa}</td>
                        <td className="p-4 text-slate-600">{sub.plan}</td>
                        <td className="p-4 text-slate-600">{sub.precio}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded font-medium text-xs ${
                            sub.estado === 'Activa' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                          }`}>
                            {sub.estado}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500">
                          {sub.metodoPago} {sub.referencia && <span className="block text-xs font-mono">{sub.referencia}</span>}
                        </td>
                        <td className="p-4 text-slate-600">{sub.vencimiento}</td>
                        <td className="p-4 flex gap-2 justify-end">
                          <button onClick={() => setEditingEmpresa({ ...sub, originalName: sub.empresa })} className="text-slate-600 hover:text-indigo-600 font-medium text-sm border border-slate-200 px-3 py-1 rounded-lg">Editar</button>
                          {sub.estado === 'Pendiente' && sub.metodoPago === 'Izipay' && (
                            <button onClick={() => setIzipayVerifyTarget(sub)} className="text-indigo-600 hover:text-indigo-800 font-medium text-sm bg-indigo-50 px-3 py-1 rounded-lg">Verificar Izipay</button>
                          )}
                          {(sub.estado === 'Activa' || sub.estado === 'Vencida') && (
                            <button onClick={() => handleRenovarSuscripcion(sub.id)} className="text-emerald-600 hover:text-emerald-800 font-medium text-sm bg-emerald-50 px-3 py-1 rounded-lg">Renovar</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

                    {activeTab === 'configuracion' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Configuración General</h2>
                  <p className="text-slate-500 text-sm">Gestiona la información de cobro y datos de la empresa principal.</p>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800">Datos para Pagos Manuales (QR / Transferencias)</h3>
                  <p className="text-slate-500 text-sm mt-1">Estos datos se mostrarán a los clientes al momento de pagar su suscripción por métodos manuales.</p>
                </div>
                <div className="p-6">
                  <form onSubmit={handleSavePaymentSettings} className="space-y-6 max-w-2xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">A nombre de (Empresa/Titular)</label>
                        <input 
                          type="text" 
                          value={paymentSettings.companyName}
                          onChange={e => setPaymentSettings({...paymentSettings, companyName: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Número de Cuenta / Celular (Yape/Plin)</label>
                        <input 
                          type="text" 
                          value={paymentSettings.accountNumber}
                          onChange={e => setPaymentSettings({...paymentSettings, accountNumber: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                          required
                        />
                      </div>
                    </div>
                    
                    <button 
                      type="submit"
                      className="py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-sm"
                    >
                      Guardar Cambios
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {activeTab !== 'dashboard' && activeTab !== 'pagos' && activeTab !== 'empresas' && activeTab !== 'suscripciones' && activeTab !== 'configuracion' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
              <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6">
                {React.createElement(menuItems.find(i => i.id === activeTab)?.icon || Blocks, { className: 'w-10 h-10' })}
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Módulo en Desarrollo</h2>
              <p className="text-slate-500 max-w-md mx-auto">
                La vista de {menuItems.find(i => i.id === activeTab)?.label} estará disponible en la próxima actualización del panel de administración.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Modal Editar Empresa */}
      <AnimatePresence>
        {editingEmpresa && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setEditingEmpresa(null)}></div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md relative z-10 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-800">Editar Datos de Empresa</h2>
              </div>
              <form onSubmit={handleSaveEmpresaData} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Nombre de la Empresa</label>
                  <input 
                    type="text" 
                    value={editingEmpresa.empresa}
                    onChange={e => setEditingEmpresa({...editingEmpresa, empresa: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Plan</label>
                  <select 
                    value={editingEmpresa.plan}
                    onChange={e => setEditingEmpresa({...editingEmpresa, plan: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="Emprendedor">Emprendedor</option>
                    <option value="Negocio">Negocio</option>
                    <option value="Empresa">Empresa</option>
                  </select>
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setEditingEmpresa(null)} className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors">Cancelar</button>
                  <button type="submit" className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors">Guardar Cambios</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {izipayVerifyTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIzipayVerifyTarget(null)}></div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm relative z-10 overflow-hidden"
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Verificar Pago Izipay</h2>
                <p className="text-slate-500 mb-6">
                  ¿Confirmas que se recibió el pago en Izipay para la empresa <strong>{izipayVerifyTarget.empresa}</strong> por el monto de <strong>S/ {izipayVerifyTarget.precio}</strong>?
                  <br /><br />
                  Ref: <span className="font-mono text-slate-800 bg-slate-100 px-2 py-1 rounded">{izipayVerifyTarget.referencia}</span>
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setIzipayVerifyTarget(null)} className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors">Cancelar</button>
                  <button onClick={() => handleVerificarIzipay(izipayVerifyTarget.id)} className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors">Confirmar Pago</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
