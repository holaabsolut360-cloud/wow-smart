import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { motion } from "motion/react";
import { Settings, Package, LogOut, Download, Plus, Trash2, Edit2, ExternalLink, PlusCircle, BarChart3, ShieldCheck } from "lucide-react";
import { Company, Product, Expense, Customer, AuditLog, SystemUser, Backup, Ingredient, Debt, DebtPayment, CRMDeal, Supplier, PurchaseOrder, Batch } from "../types";
import { PosSystem } from "../components/PosSystem";
import { CategoriesTab } from '../components/dashboard/CategoriesTab';
import { CouponsTab } from '../components/dashboard/CouponsTab';
import { DebtsTab } from '../components/dashboard/DebtsTab';
import { SettingsTab } from "../components/dashboard/SettingsTab";
import { InventoryTab } from "../components/dashboard/InventoryTab";
import { SecurityTab } from '../components/dashboard/SecurityTab';
import { SuppliersTab } from "../components/dashboard/SuppliersTab";
import { CrmTab } from "../components/dashboard/CrmTab";
import { AnalyticsTab } from "../components/dashboard/AnalyticsTab";
import { ExpensesTab } from "../components/dashboard/ExpensesTab";
import { ProductsTab } from "../components/dashboard/ProductsTab";
import { OrdersTab } from "../components/dashboard/OrdersTab";
import { CustomersTab } from "../components/dashboard/CustomersTab";
import { ImageUpload } from "../components/ImageUpload";
import { QRCodeSVG } from "qrcode.react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

import { exportToCSV } from "../utils/exportToCSV";
import { apiClient } from "../services/api";

export default function Dashboard() {
  const navigate = useNavigate();

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    await supabase.auth.signOut();
    navigate('/');
  };

  const [company, setCompany] = useState<Company | null>(null);
                    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [backups, setBackups] = useState<Backup[]>([]);
      const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<"Administrador" | "Cajero" | "Vendedor" | "Supervisor">("Administrador");

  const hasAccess = (tab: string) => {
    if (currentUserRole === "Administrador") return true;
    if (currentUserRole === "Cajero") return ["pos", "orders"].includes(tab);
    if (currentUserRole === "Vendedor") return ["pos", "orders", "customers", "crm"].includes(tab);
    if (currentUserRole === "Supervisor") return ["pos", "orders", "customers", "crm", "debts", "expenses", "products", "inventory", "categories", "coupons", "recipes", "analytics", "suppliers"].includes(tab);
    return false;
  };

  // Form states
  const [isAdding, setIsAdding] = useState(false);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({ date: new Date().toISOString().split('T')[0] });
  const [addingRecipeFor, setAddingRecipeFor] = useState<string | null>(null);
  const [newRecipeItem, setNewRecipeItem] = useState<{ingredientId: string, qty: number}>({ ingredientId: '', qty: 1 });
  const products: any[] = [];
  const orders: any[] = [];
  const customers: any[] = [];
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'categories' | 'coupons' | 'analytics' | 'customers' | 'expenses' | 'settings' | 'pos' | 'security' | 'recipes' | 'debts' | 'inventory' | 'crm' | 'suppliers'>('pos');

  const isServiceBusiness = company?.businessType === 'Estudio de Abogados' || company?.businessType === 'Servicios Profesionales' || company?.businessType === 'Agencia de Publicidad' || company?.businessType === 'Imprenta';
  const isGastronomic = company?.businessType === 'Restaurante';
  const termProduct = isServiceBusiness ? 'Servicios' : 'Productos';
  const termOrder = isServiceBusiness ? 'Solicitudes' : 'Pedidos';
  const termProductsTitle = isServiceBusiness ? 'Mis Servicios' : 'Mis Productos';

  useEffect(() => {
    // Fetch user 1 dashboard data
    apiClient.get("/api/dashboard/1")
      
      .then(data => {
        setCompany(data.company);
        setAnalytics(data.analytics);
        setInventoryAnalytics(data.inventoryAnalytics);
                
                                                setAuditLogs(data.auditLogs || []);
        setSystemUsers(data.systemUsers || []);
        setBackups(data.backups || []);
                        setBatches(data.batches || []);
        setLoading(false);
      })
      .catch((err: any) => {
        if (err.status === 402) {
          alert('Tu prueba gratuita ha finalizado. Elige un plan para continuar.');
          navigate('/checkout/negocio');
          return;
        }
        if (err.status === 404 || err.message?.includes('Company not found')) {
          navigate('/auth?mode=onboarding');
          return;
        }
        console.error(err);
        setLoading(false);
      });
  }, [navigate]);




  
  

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    const res = await apiClient.post(`/api/companies/${company.id}`, company);
    const updated = await res;
    setCompany(updated);
    alert("Ajustes guardados");
  };

  const [analytics, setAnalytics] = useState<any>({});

  const [inventoryAnalytics, setInventoryAnalytics] = useState<any>({});

  
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">Cargando...</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900 font-sans selection:bg-indigo-200">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 p-4 md:p-6 flex md:flex-col flex-shrink-0 md:sticky md:top-0 md:h-screen md:overflow-y-auto z-10">
        <div className="flex items-center gap-2 mb-0 md:mb-10 mr-auto md:mr-0">
          <img src="/logo.png" alt="WowSmart" className="h-10 object-contain" />
        </div>
        <div className="hidden md:block mb-6">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Simular Rol</label>
          <select value={currentUserRole} onChange={e => {
            const role = e.target.value as any;
            setCurrentUserRole(role);
            setActiveTab("pos");
          }} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-sm outline-none">
            <option value="Administrador">Administrador</option>
            <option value="Supervisor">Supervisor</option>
            <option value="Vendedor">Vendedor</option>
            <option value="Cajero">Cajero</option>
          </select>
        </div>
        <nav className="flex md:flex-1 md:flex-col space-x-2 md:space-x-0 md:space-y-2 mt-4 md:mt-0 overflow-x-auto pb-2 md:pb-0">
          {hasAccess("pos") && <button 
            onClick={() => setActiveTab("pos")} 
            className={`flex items-center gap-2 md:gap-3 px-4 py-2 md:py-3 rounded-xl font-bold transition-colors whitespace-nowrap md:w-full ${activeTab === 'pos' ? 'bg-indigo-600 text-white shadow-md' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
          >
            <span className="text-lg">🛒</span>
            Punto de Venta
          </button>}
          {hasAccess("orders") && <button 
            onClick={() => setActiveTab("orders")} 
            className={`flex items-center gap-2 md:gap-3 px-4 py-2 md:py-3 rounded-xl font-bold transition-colors whitespace-nowrap md:w-full ${activeTab === 'orders' ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-600 font-medium'}`}
          >
            <span className="text-lg">📋</span>
            {termOrder}
          </button>}
          {hasAccess("customers") && <button 
            onClick={() => setActiveTab("customers")} 
            className={`flex items-center gap-2 md:gap-3 px-4 py-2 md:py-3 rounded-xl font-bold transition-colors whitespace-nowrap md:w-full ${activeTab === 'customers' ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-600 font-medium'}`}
          >
            <span className="text-lg">👥</span>
            Clientes
          </button>}
          {hasAccess("crm") && <button 
            onClick={() => setActiveTab("crm")} 
            className={`flex items-center gap-2 md:gap-3 px-4 py-2 md:py-3 rounded-xl font-bold transition-colors whitespace-nowrap md:w-full ${activeTab === 'crm' ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-600 font-medium'}`}
          >
            <span className="text-lg">🤝</span>
            CRM
          </button>}
          {hasAccess("debts") && <button 
            onClick={() => setActiveTab("debts")} 
            className={`flex items-center gap-2 md:gap-3 px-4 py-2 md:py-3 rounded-xl font-bold transition-colors whitespace-nowrap md:w-full ${activeTab === 'debts' ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-600 font-medium'}`}
          >
            <span className="text-lg">💰</span>
            Cuentas por Cobrar
          </button>}
          {hasAccess("expenses") && <button 
            onClick={() => setActiveTab("expenses")} 
            className={`flex items-center gap-2 md:gap-3 px-4 py-2 md:py-3 rounded-xl font-bold transition-colors whitespace-nowrap md:w-full ${activeTab === 'expenses' ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-600 font-medium'}`}
          >
            <span className="text-lg">💸</span>
            Gastos
          </button>}
          {hasAccess("analytics") && <button 
            onClick={() => setActiveTab("analytics")} 
            className={`flex items-center gap-2 md:gap-3 px-4 py-2 md:py-3 rounded-xl font-bold transition-colors whitespace-nowrap md:w-full ${activeTab === 'analytics' ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-600 font-medium'}`}
          >
            <BarChart3 className="w-4 h-4 md:w-5 md:h-5" />
            Analíticas
          </button>}
          {hasAccess("products") && <button 
            onClick={() => setActiveTab("products")} 
            className={`flex items-center gap-2 md:gap-3 px-4 py-2 md:py-3 rounded-xl font-bold transition-colors whitespace-nowrap md:w-full ${activeTab === 'products' ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-600 font-medium'}`}
          >
            <Package className="w-4 h-4 md:w-5 md:h-5" />
            {termProduct}
          </button>}
          {hasAccess("inventory") && <button 
            onClick={() => setActiveTab("inventory")} 
            className={`flex items-center gap-2 md:gap-3 px-4 py-2 md:py-3 rounded-xl font-bold transition-colors whitespace-nowrap md:w-full ${activeTab === 'inventory' ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-600 font-medium'}`}
          >
            <span className="text-lg">📦</span>
            Inventario
          </button>}
          {hasAccess("categories") && <button 
            onClick={() => setActiveTab("categories")} 
            className={`flex items-center gap-2 md:gap-3 px-4 py-2 md:py-3 rounded-xl font-bold transition-colors whitespace-nowrap md:w-full ${activeTab === 'categories' ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-600 font-medium'}`}
          >
            <span className="text-lg">🏷️</span>
            Categorías
          </button>}
          {hasAccess("coupons") && <button 
            onClick={() => setActiveTab("coupons")} 
            className={`flex items-center gap-2 md:gap-3 px-4 py-2 md:py-3 rounded-xl font-bold transition-colors whitespace-nowrap md:w-full ${activeTab === 'coupons' ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-600 font-medium'}`}
          >
            <span className="text-lg">🎟️</span>
            Cupones
          </button>}
          
          {hasAccess("suppliers") && <button 
            onClick={() => setActiveTab("suppliers")} 
            className={`flex items-center gap-2 md:gap-3 px-4 py-2 md:py-3 rounded-xl font-bold transition-colors whitespace-nowrap md:w-full ${activeTab === 'suppliers' ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-600 font-medium'}`}
          >
            <span className="text-lg">🚚</span>
            Proveedores & Compras
          </button>}
          {hasAccess("recipes") && isGastronomic && company?.plan === "pro" && (
            <button 
              onClick={() => setActiveTab('recipes')}
              className={`flex items-center gap-2 md:gap-3 px-4 py-2 md:py-3 rounded-xl transition-colors whitespace-nowrap md:w-full ${activeTab === 'recipes' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-slate-50 text-slate-600 font-medium'}`}
            >
              <span className="text-lg">🍳</span>
              Insumos y Recetas
            </button>
          )}
{hasAccess("settings") && <button 
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-2 md:gap-3 px-4 py-2 md:py-3 rounded-xl transition-colors whitespace-nowrap md:w-full ${activeTab === 'settings' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-slate-50 text-slate-600 font-medium'}`}
          >
            <Settings className="w-4 h-4 md:w-5 md:h-5" />
            Mi Empresa
          </button>}
          {hasAccess("security") && <button 
            onClick={() => setActiveTab("security")}
            className={`flex items-center gap-2 md:gap-3 px-4 py-2 md:py-3 rounded-xl transition-colors whitespace-nowrap md:w-full ${activeTab === 'security' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-slate-50 text-slate-600 font-medium'}`}
          >
            <ShieldCheck className="w-4 h-4 md:w-5 md:h-5" />
            Seguridad
          </button>}
          <div className="md:hidden w-px bg-slate-200 my-2 mx-1 flex-shrink-0" style={{ height: '32px' }}></div>
          <button onClick={handleLogout} className="md:hidden flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-slate-50 text-slate-600 font-medium transition-colors whitespace-nowrap">
            <LogOut className="w-4 h-4" />
            Salir
          </button>
        </nav>
        <div className="hidden md:block pt-6 border-t border-slate-200">
          <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-slate-50 text-slate-600 font-medium transition-colors">
            <LogOut className="w-5 h-5" />
            Salir
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 overflow-y-auto ${activeTab === 'pos' ? 'bg-slate-100 p-0 sm:p-0 md:p-0' : 'p-4 sm:p-8 md:p-12'}`}>
                {company?.subscriptionStatus === 'Prueba Gratuita' && new Date(company.subscriptionEndsAt) < new Date() && (
          <div className="bg-amber-50 border-b border-amber-200 p-4 text-center">
            <h3 className="text-amber-800 font-bold flex justify-center items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              Tu prueba gratuita ha finalizado
            </h3>
            <p className="text-amber-600 text-sm mt-1">
              Para seguir utilizando todas las funcionalidades, por favor suscríbete al plan Emprendedor.
            </p>
            <Link to="/checkout/emprendedor" className="inline-block mt-3 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-lg transition-colors">
              Suscribirme ahora
            </Link>
          </div>
        )}

        {company?.subscriptionStatus === 'Prueba Gratuita' && new Date(company.subscriptionEndsAt) >= new Date() && (
          <div className="bg-indigo-50 border-b border-indigo-200 p-4 text-center">
            <h3 className="text-indigo-800 font-bold flex justify-center items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              Estás en el período de Prueba Gratuita (Vence: {new Date(company.subscriptionEndsAt).toLocaleDateString()})
            </h3>
            <Link to="/checkout/emprendedor" className="inline-block mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition-colors">
              Suscribirme ahora
            </Link>
          </div>
        )}

        {company?.subscriptionStatus === 'Suspendida' && (
          <div className="bg-rose-50 border-b border-rose-200 p-4 text-center">
            <h3 className="text-rose-800 font-bold flex justify-center items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              Suscripción Suspendida
            </h3>
            <p className="text-rose-600 text-sm mt-1">
              Tu cuenta se encuentra suspendida por falta de pago. Por favor, regulariza tu pago para restablecer el acceso a todas las funcionalidades.
            </p>
            <Link to="/checkout/negocio" className="inline-block mt-3 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-lg transition-colors">
              Pagar ahora
            </Link>
          </div>
        )}
        
        {company?.subscriptionStatus === 'Pendiente' && (
          <div className="bg-amber-50 border-b border-amber-200 p-4 text-center">
            <h3 className="text-amber-800 font-bold flex justify-center items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              Pago en Validación
            </h3>
            <p className="text-amber-600 text-sm mt-1">
              Hemos recibido tu comprobante. Nuestro equipo lo está verificando y activará tu cuenta en breve.
            </p>
          </div>
        )}
        
        {activeTab === 'pos' ? (
          <div className="h-full p-4 sm:p-6 md:p-8">
            <PosSystem 
              company={company!} 
              companyId={company?.id || ""}
            />
          </div>
        ) : activeTab === 'products' ? (
          <ProductsTab company={company} categories={company?.categories || []} />
        ) : activeTab === 'orders' ? (
          <OrdersTab company={company} />
        
        
        ) : activeTab === 'customers' ? (
          <CustomersTab company={company} />
        ) : activeTab === 'inventory' ? (
          <InventoryTab company={company} />
        ) : activeTab === 'analytics' ? (
          <AnalyticsTab company={company} analytics={analytics} />
        ) : activeTab === 'expenses' ? (
          <ExpensesTab company={company} />
        ) : activeTab === 'settings' ? (
          <SettingsTab company={company} setCompany={setCompany as any} />
                    ) : activeTab === 'crm' ? (
                  <CrmTab company={company} />
        ) : activeTab === 'debts' ? (
          <DebtsTab company={company} />
        ) : activeTab === 'categories' ? (
          <CategoriesTab company={company} setCompany={setCompany as any} />
        ) : activeTab === 'coupons' ? (
          <CouponsTab company={company} setCompany={setCompany as any} />
        ) : activeTab === 'suppliers' ? (
          <SuppliersTab company={company} />
        ) : activeTab === 'security' ? (
          <SecurityTab systemUsers={systemUsers} backups={backups} auditLogs={auditLogs} />
        ) : null}
      </main>
    </div>
  );
}
