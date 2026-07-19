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
  Image as ImageIcon,
  FileText
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
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [empresasLoading, setEmpresasLoading] = useState(false);
  const [empresasError, setEmpresasError] = useState('');

  const [suscripciones, setSuscripciones] = useState<any[]>([]);
  const [suscripcionesLoading, setSuscripcionesLoading] = useState(false);
  const [suscripcionesError, setSuscripcionesError] = useState('');
  const [pagosLoading, setPagosLoading] = useState(false);
  const [pagosError, setPagosError] = useState('');

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


  const fetchPagosPendientes = async () => {
    setPagosLoading(true);
    setPagosError('');
    try {
      const res = await fetch('/api/superadmin/pagos-pendientes');
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'No se pudieron cargar los pagos pendientes');
      }
      const { data } = await res.json();
      setPendingPayments(data || []);
    } catch (err: any) {
      setPagosError(err.message || 'Error al cargar pagos pendientes');
    } finally {
      setPagosLoading(false);
    }
  };

  const fetchSuscripciones = async () => {
    setSuscripcionesLoading(true);
    setSuscripcionesError('');
    try {
      const res = await fetch('/api/superadmin/suscripciones');
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'No se pudieron cargar las suscripciones');
      }
      const { data } = await res.json();
      setSuscripciones(data || []);
    } catch (err: any) {
      setSuscripcionesError(err.message || 'Error al cargar suscripciones');
    } finally {
      setSuscripcionesLoading(false);
    }
  };

  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState('');

  const fetchDashboard = async () => {
    setDashboardLoading(true);
    setDashboardError('');
    try {
      const res = await fetch('/api/superadmin/dashboard');
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'No se pudieron cargar las métricas');
      }
      setDashboardStats(await res.json());
    } catch (err: any) {
      setDashboardError(err.message || 'Error al cargar el dashboard');
    } finally {
      setDashboardLoading(false);
    }
  };

  const [auditLogsSA, setAuditLogsSA] = useState<any[]>([]);
  const [planes, setPlanes] = useState<any[]>([]);
  const [planesLoading, setPlanesLoading] = useState(false);
  const [planesError, setPlanesError] = useState('');
  const [nuevoPlan, setNuevoPlan] = useState({ name: '', price: '', description: '' });
  const [nuevaFeature, setNuevaFeature] = useState<Record<string, string>>({});

  const [promociones, setPromociones] = useState<any[]>([]);
  const [promocionesLoading, setPromocionesLoading] = useState(false);
  const [promocionesError, setPromocionesError] = useState('');
  const [nuevaPromo, setNuevaPromo] = useState({ code: '', discountType: 'percentage', discountValue: '', expiresAt: '' });

  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);
  const [adminUsersError, setAdminUsersError] = useState('');
  const [nuevoAdmin, setNuevoAdmin] = useState({ email: '', password: '' });

  const [tickets, setTickets] = useState<any[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketsError, setTicketsError] = useState('');
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  const [reportes, setReportes] = useState<any>(null);
  const [reportesLoading, setReportesLoading] = useState(false);
  const [reportesError, setReportesError] = useState('');

  const [crmLeads, setCrmLeads] = useState<any[]>([]);
  const [crmLoading, setCrmLoading] = useState(false);
  const [crmError, setCrmError] = useState('');

  const [reclamos, setReclamos] = useState<any[]>([]);
  const [reclamosLoading, setReclamosLoading] = useState(false);
  const [reclamosError, setReclamosError] = useState('');
  const [auditoriaLoading, setAuditoriaLoading] = useState(false);
  const [auditoriaError, setAuditoriaError] = useState('');

  const fetchAuditoria = async () => {
    setAuditoriaLoading(true);
    setAuditoriaError('');
    try {
      const res = await fetch('/api/superadmin/auditoria');
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'No se pudo cargar la auditoría');
      }
      const { data } = await res.json();
      setAuditLogsSA(data || []);
    } catch (err: any) {
      setAuditoriaError(err.message || 'Error al cargar la auditoría');
    } finally {
      setAuditoriaLoading(false);
    }
  };

  const fetchPlanes = async () => {
    setPlanesLoading(true);
    setPlanesError('');
    try {
      const res = await fetch('/api/superadmin/planes');
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || 'No se pudieron cargar los planes');
      const { data } = await res.json();
      setPlanes(data || []);
    } catch (err: any) {
      setPlanesError(err.message || 'Error al cargar planes');
    } finally {
      setPlanesLoading(false);
    }
  };

  const fetchPromociones = async () => {
    setPromocionesLoading(true);
    setPromocionesError('');
    try {
      const res = await fetch('/api/superadmin/promociones');
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || 'No se pudieron cargar las promociones');
      const { data } = await res.json();
      setPromociones(data || []);
    } catch (err: any) {
      setPromocionesError(err.message || 'Error al cargar promociones');
    } finally {
      setPromocionesLoading(false);
    }
  };

  const fetchAdminUsers = async () => {
    setAdminUsersLoading(true);
    setAdminUsersError('');
    try {
      const res = await fetch('/api/superadmin/usuarios');
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || 'No se pudieron cargar los administradores');
      const { data } = await res.json();
      setAdminUsers(data || []);
    } catch (err: any) {
      setAdminUsersError(err.message || 'Error al cargar administradores');
    } finally {
      setAdminUsersLoading(false);
    }
  };

  const fetchTickets = async () => {
    setTicketsLoading(true);
    setTicketsError('');
    try {
      const res = await fetch('/api/superadmin/soporte');
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || 'No se pudieron cargar los tickets');
      const { data } = await res.json();
      setTickets(data || []);
    } catch (err: any) {
      setTicketsError(err.message || 'Error al cargar tickets');
    } finally {
      setTicketsLoading(false);
    }
  };

  const fetchReportes = async () => {
    setReportesLoading(true);
    setReportesError('');
    try {
      const res = await fetch('/api/superadmin/reportes');
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || 'No se pudieron cargar los reportes');
      const { data } = await res.json();
      setReportes(data);
    } catch (err: any) {
      setReportesError(err.message || 'Error al cargar reportes');
    } finally {
      setReportesLoading(false);
    }
  };

  const fetchCrmLeads = async () => {
    setCrmLoading(true);
    setCrmError('');
    try {
      const res = await fetch('/api/superadmin/crm-leads');
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || 'No se pudieron cargar los leads');
      const { data } = await res.json();
      setCrmLeads(data || []);
    } catch (err: any) {
      setCrmError(err.message || 'Error al cargar CRM');
    } finally {
      setCrmLoading(false);
    }
  };

  const fetchReclamos = async () => {
    setReclamosLoading(true);
    setReclamosError('');
    try {
      const res = await fetch('/api/superadmin/reclamos');
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || 'No se pudieron cargar los reclamos');
      const { data } = await res.json();
      setReclamos(data || []);
    } catch (err: any) {
      setReclamosError(err.message || 'Error al cargar el libro de reclamaciones');
    } finally {
      setReclamosLoading(false);
    }
  };

  const handleAtenderReclamo = async (id: string) => {
    try {
      const res = await fetch(`/api/superadmin/reclamos/${id}/atender`, { method: 'PUT' });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || 'No se pudo actualizar el reclamo');
      await Promise.all([fetchReclamos(), fetchAuditoria()]);
    } catch (err: any) {
      alert(err.message || 'Error al actualizar el reclamo');
    }
  };

  // --- Acciones: Planes ---
  const handleCrearPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/superadmin/planes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nuevoPlan.name, price: nuevoPlan.price, description: nuevoPlan.description, features: [] }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || 'No se pudo crear el plan');
      setNuevoPlan({ name: '', price: '', description: '' });
      await Promise.all([fetchPlanes(), fetchAuditoria()]);
    } catch (err: any) {
      alert(err.message || 'Error al crear el plan');
    }
  };

  const handleTogglePlanActivo = async (id: string, active: boolean) => {
    try {
      const res = await fetch(`/api/superadmin/planes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || 'No se pudo actualizar el plan');
      await Promise.all([fetchPlanes(), fetchAuditoria()]);
    } catch (err: any) {
      alert(err.message || 'Error al actualizar el plan');
    }
  };

  const handleEliminarPlan = async (id: string) => {
    if (!confirm('¿Eliminar este plan? Esta acción no se puede deshacer.')) return;
    try {
      const res = await fetch(`/api/superadmin/planes/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || 'No se pudo eliminar el plan');
      await Promise.all([fetchPlanes(), fetchAuditoria()]);
    } catch (err: any) {
      alert(err.message || 'Error al eliminar el plan');
    }
  };

  // --- Acciones: Funcionalidades (features por plan) ---
  const handleAgregarFeature = async (plan: any) => {
    const nueva = (nuevaFeature[plan.id] || '').trim();
    if (!nueva) return;
    const features = [...(plan.features || []), nueva];
    try {
      const res = await fetch(`/api/superadmin/planes/${plan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || 'No se pudo agregar la funcionalidad');
      setNuevaFeature(prev => ({ ...prev, [plan.id]: '' }));
      await fetchPlanes();
    } catch (err: any) {
      alert(err.message || 'Error al agregar la funcionalidad');
    }
  };

  const handleQuitarFeature = async (plan: any, feature: string) => {
    const features = (plan.features || []).filter((f: string) => f !== feature);
    try {
      const res = await fetch(`/api/superadmin/planes/${plan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || 'No se pudo quitar la funcionalidad');
      await fetchPlanes();
    } catch (err: any) {
      alert(err.message || 'Error al quitar la funcionalidad');
    }
  };

  // --- Acciones: Promociones ---
  const handleCrearPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/superadmin/promociones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevaPromo),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || 'No se pudo crear la promoción');
      setNuevaPromo({ code: '', discountType: 'percentage', discountValue: '', expiresAt: '' });
      await Promise.all([fetchPromociones(), fetchAuditoria()]);
    } catch (err: any) {
      alert(err.message || 'Error al crear la promoción');
    }
  };

  const handleTogglePromo = async (id: string, active: boolean) => {
    try {
      const res = await fetch(`/api/superadmin/promociones/${id}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || 'No se pudo actualizar la promoción');
      await Promise.all([fetchPromociones(), fetchAuditoria()]);
    } catch (err: any) {
      alert(err.message || 'Error al actualizar la promoción');
    }
  };

  const handleEliminarPromo = async (id: string) => {
    if (!confirm('¿Eliminar esta promoción?')) return;
    try {
      const res = await fetch(`/api/superadmin/promociones/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || 'No se pudo eliminar la promoción');
      await Promise.all([fetchPromociones(), fetchAuditoria()]);
    } catch (err: any) {
      alert(err.message || 'Error al eliminar la promoción');
    }
  };

  // --- Acciones: Usuarios Administradores ---
  const handleCrearAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/superadmin/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoAdmin),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || 'No se pudo crear el administrador');
      setNuevoAdmin({ email: '', password: '' });
      await Promise.all([fetchAdminUsers(), fetchAuditoria()]);
    } catch (err: any) {
      alert(err.message || 'Error al crear el administrador');
    }
  };

  const handleToggleAdmin = async (id: string, active: boolean) => {
    try {
      const res = await fetch(`/api/superadmin/usuarios/${id}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || 'No se pudo actualizar el administrador');
      await Promise.all([fetchAdminUsers(), fetchAuditoria()]);
    } catch (err: any) {
      alert(err.message || 'Error al actualizar el administrador');
    }
  };

  const handleEliminarAdmin = async (id: string) => {
    if (!confirm('¿Eliminar el acceso de este administrador?')) return;
    try {
      const res = await fetch(`/api/superadmin/usuarios/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || 'No se pudo eliminar el administrador');
      await Promise.all([fetchAdminUsers(), fetchAuditoria()]);
    } catch (err: any) {
      alert(err.message || 'Error al eliminar el administrador');
    }
  };

  // --- Acciones: Soporte ---
  const handleResponderTicket = async (id: string) => {
    const reply = (replyDrafts[id] || '').trim();
    if (!reply) { alert('Escribe una respuesta antes de enviar.'); return; }
    try {
      const res = await fetch(`/api/superadmin/soporte/${id}/responder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || 'No se pudo responder el ticket');
      setReplyDrafts(prev => ({ ...prev, [id]: '' }));
      await Promise.all([fetchTickets(), fetchAuditoria()]);
    } catch (err: any) {
      alert(err.message || 'Error al responder el ticket');
    }
  };

  const handleCerrarTicket = async (id: string) => {
    try {
      const res = await fetch(`/api/superadmin/soporte/${id}/cerrar`, { method: 'PUT' });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || 'No se pudo cerrar el ticket');
      await Promise.all([fetchTickets(), fetchAuditoria()]);
    } catch (err: any) {
      alert(err.message || 'Error al cerrar el ticket');
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchPagosPendientes();
      fetchSuscripciones();
      fetchDashboard();
      fetchAuditoria();
      fetchPlanes();
      fetchPromociones();
      fetchAdminUsers();
      fetchTickets();
      fetchReportes();
      fetchCrmLeads();
      fetchReclamos();
    }
  }, [isAuthenticated]);

  const fetchEmpresas = async () => {
    setEmpresasLoading(true);
    setEmpresasError('');
    try {
      const res = await fetch('/api/superadmin/empresas');
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'No se pudieron cargar las empresas');
      }
      const { data } = await res.json();
      setEmpresas(data || []);
    } catch (err: any) {
      setEmpresasError(err.message || 'Error al cargar empresas');
    } finally {
      setEmpresasLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchEmpresas();
    }
  }, [isAuthenticated]);

  const handleApprovePayment = async (id: string) => {
    try {
      const res = await fetch(`/api/superadmin/pagos-pendientes/${id}/aprobar`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'No se pudo aprobar el pago');
      }
      await Promise.all([fetchPagosPendientes(), fetchSuscripciones(), fetchEmpresas(), fetchDashboard(), fetchAuditoria()]);
      alert('Pago aprobado. La suscripción se ha activado y se ha enviado el comprobante por correo.');
    } catch (err: any) {
      alert(err.message || 'Error al aprobar el pago');
    }
  };

  const handleRejectPayment = async (id: string) => {
    try {
      const res = await fetch(`/api/superadmin/pagos-pendientes/${id}/rechazar`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'No se pudo rechazar el pago');
      }
      await fetchPagosPendientes();
      alert('Pago rechazado. Se ha notificado al cliente para que suba un nuevo comprobante.');
    } catch (err: any) {
      alert(err.message || 'Error al rechazar el pago');
    }
  };

  const updateEmpresaEstado = async (id: string, estado: 'Activa' | 'Suspendida') => {
    const previous = empresas;
    // Actualización optimista para que la UI responda al instante
    setEmpresas(prev => prev.map(emp => emp.id === id ? { ...emp, estado } : emp));
    try {
      const res = await fetch(`/api/superadmin/empresas/${id}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'No se pudo actualizar el estado');
      }
      fetchAuditoria();
    } catch (err: any) {
      setEmpresas(previous); // revertir si falla
      alert(err.message || 'Error al actualizar el estado de la empresa');
    }
  };

  const handleActivarEmpresa = (id: string) => updateEmpresaEstado(id, 'Activa');
  const handleSuspenderEmpresa = (id: string) => updateEmpresaEstado(id, 'Suspendida');

  const handleRenovarSuscripcion = async (id: string) => {
    try {
      const res = await fetch(`/api/superadmin/empresas/${id}/renovar`, { method: 'PUT' });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'No se pudo renovar la suscripción');
      }
      await Promise.all([fetchSuscripciones(), fetchEmpresas(), fetchDashboard(), fetchAuditoria()]);
      alert('Suscripción renovada por 30 días.');
    } catch (err: any) {
      alert(err.message || 'Error al renovar la suscripción');
    }
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
    { id: 'reclamos', label: 'Libro de Reclamaciones', icon: FileText },
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
            <div>
              {dashboardError && (
                <div className="mb-4 p-3 rounded-lg bg-rose-50 text-rose-700 text-sm">{dashboardError}</div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="text-slate-500 text-sm font-bold mb-2">Total Empresas</div>
                  <div className="text-4xl font-black text-slate-800">
                    {dashboardLoading ? '—' : (dashboardStats?.totalEmpresas ?? 0)}
                  </div>
                  {!dashboardLoading && (
                    <div className={`text-sm font-bold mt-2 ${dashboardStats?.totalEmpresasCambioPct >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {dashboardStats?.totalEmpresasCambioPct >= 0 ? '+' : ''}{dashboardStats?.totalEmpresasCambioPct ?? 0}% este mes
                    </div>
                  )}
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="text-slate-500 text-sm font-bold mb-2">Ingresos del Mes</div>
                  <div className="text-4xl font-black text-slate-800">
                    {dashboardLoading ? '—' : `S/ ${dashboardStats?.ingresosMes ?? 0}`}
                  </div>
                  {!dashboardLoading && (
                    <div className={`text-sm font-bold mt-2 ${dashboardStats?.ingresosMesCambioPct >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {dashboardStats?.ingresosMesCambioPct >= 0 ? '+' : ''}{dashboardStats?.ingresosMesCambioPct ?? 0}% vs. mes anterior
                    </div>
                  )}
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="text-slate-500 text-sm font-bold mb-2">Suscripciones Activas</div>
                  <div className="text-4xl font-black text-slate-800">
                    {dashboardLoading ? '—' : (dashboardStats?.suscripcionesActivas ?? 0)}
                  </div>
                  <div className="text-slate-400 text-sm font-bold mt-2">
                    {dashboardLoading ? '' : `${dashboardStats?.retencionPct ?? 0}% de retención`}
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="text-slate-500 text-sm font-bold mb-2">Pagos Pendientes</div>
                  <div className="text-4xl font-black text-slate-800">
                    {dashboardLoading ? '—' : (dashboardStats?.pagosPendientes ?? 0)}
                  </div>
                  <div className="text-amber-500 text-sm font-bold mt-2">
                    {dashboardLoading ? '' : 'por revisar'}
                  </div>
                </div>
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
              {pagosError && (
                <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 text-rose-700 text-sm">{pagosError}</div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                      <th className="p-4 font-bold border-b border-slate-200">Empresa</th>
                      <th className="p-4 font-bold border-b border-slate-200">Plan</th>
                      <th className="p-4 font-bold border-b border-slate-200">Monto</th>
                      <th className="p-4 font-bold border-b border-slate-200">Método</th>
                      <th className="p-4 font-bold border-b border-slate-200">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {pagosLoading && (
                      <tr><td colSpan={5} className="p-6 text-center text-slate-400">Cargando pagos pendientes...</td></tr>
                    )}
                    {!pagosLoading && pendingPayments.length === 0 && !pagosError ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-500">
                          No hay pagos pendientes de validación en este momento.
                        </td>
                      </tr>
                    ) : (
                      pendingPayments.map(payment => (
                        <tr key={payment.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="p-4 font-bold text-slate-800">{payment.businessName}</td>
                          <td className="p-4 text-slate-600">
                            <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded font-medium text-xs">{payment.plan}</span>
                          </td>
                          <td className="p-4 font-bold text-slate-800">S/ {payment.amount}</td>
                          <td className="p-4 text-slate-600">{payment.method || '-'}</td>
                          <td className="p-4 flex gap-2">
                            <button onClick={() => handleApprovePayment(payment.id)} className="flex items-center gap-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-3 py-1.5 rounded-lg font-bold transition-colors">
                              <CheckCircle className="w-4 h-4" /> Aprobar
                            </button>
                            <button onClick={() => handleRejectPayment(payment.id)} className="flex items-center gap-1 bg-rose-100 text-rose-700 hover:bg-rose-200 px-3 py-1.5 rounded-lg font-bold transition-colors">
                              <XCircle className="w-4 h-4" /> Rechazar
                            </button>
                          </td>
                        </tr>
                      ))
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
              {empresasError && (
                <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 text-rose-700 text-sm">{empresasError}</div>
              )}
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
                    {empresasLoading && (
                      <tr><td colSpan={5} className="p-6 text-center text-slate-400">Cargando empresas...</td></tr>
                    )}
                    {!empresasLoading && empresas.length === 0 && !empresasError && (
                      <tr><td colSpan={5} className="p-6 text-center text-slate-400">Aún no hay empresas registradas.</td></tr>
                    )}
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
              {suscripcionesError && (
                <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 text-rose-700 text-sm">{suscripcionesError}</div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                      <th className="p-4 font-bold border-b border-slate-200">Empresa</th>
                      <th className="p-4 font-bold border-b border-slate-200">Plan</th>
                      <th className="p-4 font-bold border-b border-slate-200">Precio (S/)</th>
                      <th className="p-4 font-bold border-b border-slate-200">Estado</th>
                      <th className="p-4 font-bold border-b border-slate-200">Método</th>
                      <th className="p-4 font-bold border-b border-slate-200">Vencimiento</th>
                      <th className="p-4 font-bold border-b border-slate-200 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {suscripcionesLoading && (
                      <tr><td colSpan={7} className="p-6 text-center text-slate-400">Cargando suscripciones...</td></tr>
                    )}
                    {!suscripcionesLoading && suscripciones.length === 0 && !suscripcionesError && (
                      <tr><td colSpan={7} className="p-6 text-center text-slate-400">Aún no hay suscripciones registradas.</td></tr>
                    )}
                    {suscripciones.map(sub => (
                      <tr key={sub.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="p-4 font-bold text-slate-800">{sub.empresa}</td>
                        <td className="p-4 text-slate-600">{sub.plan}</td>
                        <td className="p-4 text-slate-600">{sub.precio || '-'}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded font-medium text-xs ${
                            sub.estado === 'Activa' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                          }`}>
                            {sub.estado}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500">{sub.metodoPago || '-'}</td>
                        <td className="p-4 text-slate-600">{sub.vencimiento}</td>
                        <td className="p-4 flex gap-2 justify-end">
                          <button onClick={() => handleRenovarSuscripcion(sub.id)} className="text-emerald-600 hover:text-emerald-800 font-medium text-sm bg-emerald-50 px-3 py-1 rounded-lg">Renovar 30 días</button>
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

          {activeTab === 'auditoria' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-lg font-bold text-slate-800">Auditoría del Panel SuperAdmin</h2>
                <p className="text-slate-500 text-sm">Registro de las últimas 100 acciones realizadas.</p>
              </div>
              {auditoriaError && (
                <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 text-rose-700 text-sm">{auditoriaError}</div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                      <th className="p-4 font-bold border-b border-slate-200">Fecha</th>
                      <th className="p-4 font-bold border-b border-slate-200">Acción</th>
                      <th className="p-4 font-bold border-b border-slate-200">Objetivo</th>
                      <th className="p-4 font-bold border-b border-slate-200">Detalles</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {auditoriaLoading && (
                      <tr><td colSpan={4} className="p-6 text-center text-slate-400">Cargando auditoría...</td></tr>
                    )}
                    {!auditoriaLoading && auditLogsSA.length === 0 && !auditoriaError && (
                      <tr><td colSpan={4} className="p-6 text-center text-slate-400">Aún no hay acciones registradas.</td></tr>
                    )}
                    {auditLogsSA.map(log => (
                      <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="p-4 text-slate-500 whitespace-nowrap">{new Date(log.fecha).toLocaleString('es-PE')}</td>
                        <td className="p-4">
                          <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded font-bold text-xs">{log.accion}</span>
                        </td>
                        <td className="p-4 font-medium text-slate-800">{log.objetivo}</td>
                        <td className="p-4 text-slate-600">{log.detalles}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'planes' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-lg font-bold text-slate-800 mb-4">Nuevo Plan</h2>
                <form onSubmit={handleCrearPlan} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input required placeholder="Nombre" value={nuevoPlan.name} onChange={e => setNuevoPlan({ ...nuevoPlan, name: e.target.value })} className="px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500" />
                  <input required type="number" placeholder="Precio (S/)" value={nuevoPlan.price} onChange={e => setNuevoPlan({ ...nuevoPlan, price: e.target.value })} className="px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500" />
                  <input placeholder="Descripción" value={nuevoPlan.description} onChange={e => setNuevoPlan({ ...nuevoPlan, description: e.target.value })} className="px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500" />
                  <button type="submit" className="bg-indigo-600 text-white rounded-lg font-bold px-4 py-2 hover:bg-indigo-700">Crear Plan</button>
                </form>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {planesError && <div className="m-6 p-3 rounded-lg bg-rose-50 text-rose-700 text-sm">{planesError}</div>}
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                      <th className="p-4 font-bold border-b border-slate-200">Plan</th>
                      <th className="p-4 font-bold border-b border-slate-200">Precio</th>
                      <th className="p-4 font-bold border-b border-slate-200">Descripción</th>
                      <th className="p-4 font-bold border-b border-slate-200">Estado</th>
                      <th className="p-4 font-bold border-b border-slate-200 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {planesLoading && <tr><td colSpan={5} className="p-6 text-center text-slate-400">Cargando planes...</td></tr>}
                    {!planesLoading && planes.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-slate-400">Aún no hay planes creados.</td></tr>}
                    {planes.map(plan => (
                      <tr key={plan.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="p-4 font-bold text-slate-800">{plan.name}</td>
                        <td className="p-4 text-slate-600">S/ {plan.price}</td>
                        <td className="p-4 text-slate-500">{plan.description || '-'}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded font-medium text-xs ${plan.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {plan.active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="p-4 flex gap-2 justify-end">
                          <button onClick={() => handleTogglePlanActivo(plan.id, !plan.active)} className="text-slate-600 hover:text-indigo-600 font-medium text-sm border border-slate-200 px-3 py-1 rounded-lg">
                            {plan.active ? 'Desactivar' : 'Activar'}
                          </button>
                          <button onClick={() => handleEliminarPlan(plan.id)} className="text-rose-600 hover:text-rose-800 font-medium text-sm bg-rose-50 px-3 py-1 rounded-lg">Eliminar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'funcionalidades' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-1">Funcionalidades por Plan</h2>
              <p className="text-slate-500 text-sm mb-6">Agrega o quita las funcionalidades incluidas en cada plan.</p>
              {planesLoading && <p className="text-slate-400 text-sm">Cargando planes...</p>}
              {!planesLoading && planes.length === 0 && <p className="text-slate-400 text-sm">Crea primero un plan en la pestaña "Planes".</p>}
              <div className="space-y-6">
                {planes.map(plan => (
                  <div key={plan.id} className="border border-slate-200 rounded-xl p-4">
                    <div className="font-bold text-slate-800 mb-3">{plan.name}</div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {(plan.features || []).map((f: string) => (
                        <span key={f} className="bg-indigo-50 text-indigo-700 text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-2">
                          {f}
                          <button onClick={() => handleQuitarFeature(plan, f)} className="text-indigo-400 hover:text-indigo-700 font-bold">×</button>
                        </span>
                      ))}
                      {(plan.features || []).length === 0 && <span className="text-slate-400 text-sm">Sin funcionalidades asignadas.</span>}
                    </div>
                    <div className="flex gap-2">
                      <input
                        placeholder="Nueva funcionalidad"
                        value={nuevaFeature[plan.id] || ''}
                        onChange={e => setNuevaFeature(prev => ({ ...prev, [plan.id]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAgregarFeature(plan))}
                        className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button onClick={() => handleAgregarFeature(plan)} className="bg-slate-800 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-slate-700">Agregar</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'promociones' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-lg font-bold text-slate-800 mb-4">Nueva Promoción</h2>
                <form onSubmit={handleCrearPromo} className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <input required placeholder="Código (ej. VERANO20)" value={nuevaPromo.code} onChange={e => setNuevaPromo({ ...nuevaPromo, code: e.target.value })} className="px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500" />
                  <select value={nuevaPromo.discountType} onChange={e => setNuevaPromo({ ...nuevaPromo, discountType: e.target.value })} className="px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="percentage">% Porcentaje</option>
                    <option value="fixed">S/ Monto fijo</option>
                  </select>
                  <input required type="number" placeholder="Valor" value={nuevaPromo.discountValue} onChange={e => setNuevaPromo({ ...nuevaPromo, discountValue: e.target.value })} className="px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500" />
                  <input type="date" value={nuevaPromo.expiresAt} onChange={e => setNuevaPromo({ ...nuevaPromo, expiresAt: e.target.value })} className="px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500" />
                  <button type="submit" className="bg-indigo-600 text-white rounded-lg font-bold px-4 py-2 hover:bg-indigo-700">Crear</button>
                </form>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {promocionesError && <div className="m-6 p-3 rounded-lg bg-rose-50 text-rose-700 text-sm">{promocionesError}</div>}
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                      <th className="p-4 font-bold border-b border-slate-200">Código</th>
                      <th className="p-4 font-bold border-b border-slate-200">Descuento</th>
                      <th className="p-4 font-bold border-b border-slate-200">Vence</th>
                      <th className="p-4 font-bold border-b border-slate-200">Estado</th>
                      <th className="p-4 font-bold border-b border-slate-200 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {promocionesLoading && <tr><td colSpan={5} className="p-6 text-center text-slate-400">Cargando promociones...</td></tr>}
                    {!promocionesLoading && promociones.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-slate-400">Aún no hay promociones creadas.</td></tr>}
                    {promociones.map((promo: any) => (
                      <tr key={promo.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="p-4 font-mono font-bold text-slate-800">{promo.code}</td>
                        <td className="p-4 text-slate-600">{promo.discount_value}{promo.discount_type === 'percentage' ? '%' : ' soles'}</td>
                        <td className="p-4 text-slate-500">{promo.expires_at || 'Sin vencimiento'}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded font-medium text-xs ${promo.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {promo.active ? 'Activa' : 'Inactiva'}
                          </span>
                        </td>
                        <td className="p-4 flex gap-2 justify-end">
                          <button onClick={() => handleTogglePromo(promo.id, !promo.active)} className="text-slate-600 hover:text-indigo-600 font-medium text-sm border border-slate-200 px-3 py-1 rounded-lg">
                            {promo.active ? 'Desactivar' : 'Activar'}
                          </button>
                          <button onClick={() => handleEliminarPromo(promo.id)} className="text-rose-600 hover:text-rose-800 font-medium text-sm bg-rose-50 px-3 py-1 rounded-lg">Eliminar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'usuarios' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-lg font-bold text-slate-800 mb-4">Nuevo Administrador</h2>
                <form onSubmit={handleCrearAdmin} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input required type="email" placeholder="Correo" value={nuevoAdmin.email} onChange={e => setNuevoAdmin({ ...nuevoAdmin, email: e.target.value })} className="px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500" />
                  <input required type="password" placeholder="Contraseña (mín. 8 caracteres)" value={nuevoAdmin.password} onChange={e => setNuevoAdmin({ ...nuevoAdmin, password: e.target.value })} className="px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500" />
                  <button type="submit" className="bg-indigo-600 text-white rounded-lg font-bold px-4 py-2 hover:bg-indigo-700">Crear Administrador</button>
                </form>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {adminUsersError && <div className="m-6 p-3 rounded-lg bg-rose-50 text-rose-700 text-sm">{adminUsersError}</div>}
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                      <th className="p-4 font-bold border-b border-slate-200">Correo</th>
                      <th className="p-4 font-bold border-b border-slate-200">Estado</th>
                      <th className="p-4 font-bold border-b border-slate-200">Último acceso</th>
                      <th className="p-4 font-bold border-b border-slate-200 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {adminUsersLoading && <tr><td colSpan={4} className="p-6 text-center text-slate-400">Cargando administradores...</td></tr>}
                    {!adminUsersLoading && adminUsers.length === 0 && (
                      <tr><td colSpan={4} className="p-6 text-center text-slate-400">Solo existe la cuenta maestra configurada por variables de entorno. Crea aquí administradores adicionales.</td></tr>
                    )}
                    {adminUsers.map((admin: any) => (
                      <tr key={admin.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="p-4 font-bold text-slate-800">{admin.email}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded font-medium text-xs ${admin.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {admin.active ? 'Activo' : 'Desactivado'}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500">{admin.last_login_at ? new Date(admin.last_login_at).toLocaleString('es-PE') : 'Nunca'}</td>
                        <td className="p-4 flex gap-2 justify-end">
                          <button onClick={() => handleToggleAdmin(admin.id, !admin.active)} className="text-slate-600 hover:text-indigo-600 font-medium text-sm border border-slate-200 px-3 py-1 rounded-lg">
                            {admin.active ? 'Desactivar' : 'Activar'}
                          </button>
                          <button onClick={() => handleEliminarAdmin(admin.id)} className="text-rose-600 hover:text-rose-800 font-medium text-sm bg-rose-50 px-3 py-1 rounded-lg">Eliminar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'soporte' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-lg font-bold text-slate-800">Tickets de Soporte</h2>
                <p className="text-slate-500 text-sm">Tickets abiertos por los negocios que usan la plataforma.</p>
              </div>
              {ticketsError && <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 text-rose-700 text-sm">{ticketsError}</div>}
              <div className="divide-y divide-slate-100">
                {ticketsLoading && <p className="p-6 text-center text-slate-400 text-sm">Cargando tickets...</p>}
                {!ticketsLoading && tickets.length === 0 && !ticketsError && (
                  <p className="p-6 text-center text-slate-400 text-sm">No hay tickets de soporte abiertos en este momento.</p>
                )}
                {tickets.map((t: any) => (
                  <div key={t.id} className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-bold text-slate-800">{t.business_name || t.email || 'Cliente'}</span>
                        <span className={`ml-3 px-2 py-1 rounded font-medium text-xs ${t.status === 'Abierto' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{t.status}</span>
                      </div>
                      <span className="text-slate-400 text-xs">{new Date(t.created_at).toLocaleString('es-PE')}</span>
                    </div>
                    <div className="font-medium text-slate-700 mb-1">{t.subject}</div>
                    <p className="text-slate-600 text-sm mb-3">{t.message}</p>
                    {t.reply && (
                      <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600 mb-3">
                        <span className="font-bold text-slate-700">Respuesta enviada:</span> {t.reply}
                      </div>
                    )}
                    {t.status === 'Abierto' && (
                      <div className="flex gap-2">
                        <input
                          placeholder="Escribe una respuesta..."
                          value={replyDrafts[t.id] || ''}
                          onChange={e => setReplyDrafts(prev => ({ ...prev, [t.id]: e.target.value }))}
                          className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button onClick={() => handleResponderTicket(t.id)} className="bg-indigo-600 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-indigo-700">Responder</button>
                        <button onClick={() => handleCerrarTicket(t.id)} className="text-slate-500 hover:text-rose-600 text-sm font-medium px-3 py-2 rounded-lg border border-slate-200">Cerrar</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'reportes' && (
            <div className="space-y-6">
              {reportesError && <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-sm">{reportesError}</div>}
              {reportesLoading && <p className="text-slate-400 text-sm">Cargando reportes...</p>}
              {!reportesLoading && reportes && (
                <>
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h2 className="text-lg font-bold text-slate-800 mb-4">Ingresos Aprobados (últimos 30 días)</h2>
                    {reportes.ingresosPorDia.length === 0 ? (
                      <p className="text-slate-400 text-sm">Aún no hay pagos aprobados en este periodo.</p>
                    ) : (
                      <div className="space-y-2">
                        {reportes.ingresosPorDia.map((d: any) => (
                          <div key={d.fecha} className="flex items-center gap-3">
                            <span className="text-slate-500 text-xs w-24">{d.fecha}</span>
                            <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                              <div className="bg-indigo-500 h-3" style={{ width: `${Math.min(100, (d.total / Math.max(...reportes.ingresosPorDia.map((x: any) => x.total))) * 100)}%` }} />
                            </div>
                            <span className="text-slate-700 text-xs font-bold w-16 text-right">S/ {d.total}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                      <h2 className="text-lg font-bold text-slate-800 mb-4">Empresas por Plan</h2>
                      <div className="space-y-2">
                        {reportes.empresasPorPlan.map((p: any) => (
                          <div key={p.plan} className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">{p.plan}</span>
                            <span className="font-bold text-slate-800">{p.total}</span>
                          </div>
                        ))}
                        {reportes.empresasPorPlan.length === 0 && <p className="text-slate-400 text-sm">Sin datos.</p>}
                      </div>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                      <h2 className="text-lg font-bold text-slate-800 mb-4">Pagos por Estado (30 días)</h2>
                      <div className="space-y-2">
                        {reportes.pagosPorEstado.map((p: any) => (
                          <div key={p.estado} className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">{p.estado}</span>
                            <span className="font-bold text-slate-800">{p.total}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'crm' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-lg font-bold text-slate-800">CRM Comercial — Leads en Prueba Gratuita</h2>
                <p className="text-slate-500 text-sm">Empresas en periodo de prueba, ordenadas por proximidad de vencimiento.</p>
              </div>
              {crmError && <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 text-rose-700 text-sm">{crmError}</div>}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                      <th className="p-4 font-bold border-b border-slate-200">Empresa</th>
                      <th className="p-4 font-bold border-b border-slate-200">Plan interesado</th>
                      <th className="p-4 font-bold border-b border-slate-200">Registro</th>
                      <th className="p-4 font-bold border-b border-slate-200">Vence prueba</th>
                      <th className="p-4 font-bold border-b border-slate-200">Días restantes</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {crmLoading && <tr><td colSpan={5} className="p-6 text-center text-slate-400">Cargando leads...</td></tr>}
                    {!crmLoading && crmLeads.length === 0 && !crmError && (
                      <tr><td colSpan={5} className="p-6 text-center text-slate-400">No hay empresas en prueba gratuita actualmente.</td></tr>
                    )}
                    {crmLeads.map((lead: any) => (
                      <tr key={lead.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="p-4 font-bold text-slate-800">{lead.empresa}</td>
                        <td className="p-4 text-slate-600">{lead.plan}</td>
                        <td className="p-4 text-slate-500">{lead.registro}</td>
                        <td className="p-4 text-slate-500">{lead.vencimiento || '-'}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded font-medium text-xs ${lead.diasRestantes !== null && lead.diasRestantes <= 3 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                            {lead.diasRestantes !== null ? `${lead.diasRestantes} días` : '-'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'reclamos' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-lg font-bold text-slate-800">Libro de Reclamaciones</h2>
                <p className="text-slate-500 text-sm">Reclamos y quejas registrados por consumidores, conforme al Código de Protección y Defensa del Consumidor.</p>
              </div>
              {reclamosError && <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 text-rose-700 text-sm">{reclamosError}</div>}
              <div className="divide-y divide-slate-100">
                {reclamosLoading && <p className="p-6 text-center text-slate-400 text-sm">Cargando reclamos...</p>}
                {!reclamosLoading && reclamos.length === 0 && !reclamosError && (
                  <p className="p-6 text-center text-slate-400 text-sm">Aún no se ha registrado ningún reclamo o queja.</p>
                )}
                {reclamos.map((r: any) => (
                  <div key={r.id} className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-bold text-slate-800">{r.nombres} {r.apellidos}</span>
                        <span className={`ml-3 px-2 py-1 rounded font-medium text-xs ${r.tipo === 'Reclamo' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'}`}>{r.tipo}</span>
                        <span className={`ml-2 px-2 py-1 rounded font-medium text-xs ${r.status === 'Pendiente' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>{r.status}</span>
                      </div>
                      <span className="text-slate-400 text-xs">{new Date(r.created_at).toLocaleString('es-PE')}</span>
                    </div>
                    <div className="text-xs text-slate-500 mb-2">
                      {r.tipo_documento} {r.numero_documento} · {r.email} · {r.telefono}
                    </div>
                    <p className="text-slate-700 text-sm mb-1"><span className="font-bold">Detalle:</span> {r.detalle}</p>
                    <p className="text-slate-600 text-sm mb-3"><span className="font-bold">Pedido:</span> {r.pedido}</p>
                    {r.status === 'Pendiente' && (
                      <button onClick={() => handleAtenderReclamo(r.id)} className="text-emerald-600 hover:text-emerald-800 font-medium text-sm bg-emerald-50 px-3 py-1.5 rounded-lg">
                        Marcar como atendido
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab !== 'dashboard' && activeTab !== 'pagos' && activeTab !== 'empresas' && activeTab !== 'suscripciones' && activeTab !== 'configuracion' && activeTab !== 'auditoria' && activeTab !== 'planes' && activeTab !== 'funcionalidades' && activeTab !== 'promociones' && activeTab !== 'usuarios' && activeTab !== 'soporte' && activeTab !== 'reportes' && activeTab !== 'crm' && activeTab !== 'reclamos' && (
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
    </div>
  );
}
