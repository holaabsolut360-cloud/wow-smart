import React from 'react';
import { Company, Supplier, PurchaseOrder } from '../../types';
import { apiClient } from "../../services/api";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface SuppliersTabProps {
  company: Company | null;
}

export function SuppliersTab({ company }: SuppliersTabProps) {
  const queryClient = useQueryClient();

  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers', company?.id],
    queryFn: () => apiClient.get(`/api/suppliers?companyId=${company?.id}`),
    enabled: !!company?.id
  });
  const suppliers = suppliersData?.data || [];

  const { data: posData } = useQuery({
    queryKey: ['purchaseOrders', company?.id],
    queryFn: () => apiClient.get(`/api/purchase-orders?companyId=${company?.id}`),
    enabled: !!company?.id
  });
  const purchaseOrders = posData?.data || [];

  const addSupplierMutation = useMutation({
    mutationFn: (supplier: any) => apiClient.post("/api/suppliers", { ...supplier, companyId: company?.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    }
  });

  const addPOMutation = useMutation({
    mutationFn: (po: any) => apiClient.post("/api/purchase-orders", { ...po, companyId: company?.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
    }
  });

  const updatePOStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => apiClient.put(`/api/purchase-orders/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
    }
  });

  return (
    <div id="suppliers" className="max-w-6xl">
      <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Proveedores & Compras</h1>
          <p className="text-slate-500 mt-1">Gestiona tus proveedores y órdenes de compra</p>
        </div>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800">Proveedores</h2>
            <button 
              onClick={() => {
                const name = prompt("Nombre del Proveedor:");
                if (name) {
                  addSupplierMutation.mutate({ name, contact: '', phone: '', email: '', address: '' });
                }
              }}
              className="text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors"
            >
              + Nuevo
            </button>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-4">
            {suppliers.map((s: Supplier) => (
              <div key={s.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50 flex justify-between items-center">
                <div>
                  <div className="font-bold text-slate-900">{s.name}</div>
                  {s.contact && <div className="text-xs text-slate-500">Contacto: {s.contact}</div>}
                  {s.phone && <div className="text-xs text-slate-500">Tel: {s.phone}</div>}
                </div>
                <button className="text-xs font-bold text-indigo-600 hover:underline">Editar</button>
              </div>
            ))}
            {suppliers.length === 0 && (
              <p className="text-center text-sm text-slate-400 py-4">No hay proveedores registrados.</p>
            )}
          </div>
        </div>
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800">Órdenes de Compra</h2>
            <button 
              onClick={() => {
                if (suppliers.length === 0) {
                  alert("Primero debes registrar un proveedor.");
                  return;
                }
                const supplierId = prompt("ID o Nombre del Proveedor (selecciona de la lista):\n" + suppliers.map((s: Supplier) => s.name).join(', '));
                const supp = suppliers.find((s: Supplier) => s.name === supplierId || s.id === supplierId);
                if (supp) {
                  const totalStr = prompt("Total de la orden:");
                  if (totalStr) {
                    addPOMutation.mutate({ 
                      supplierId: supp.id, 
                      date: new Date().toISOString().split('T')[0], 
                      expectedDate: new Date().toISOString().split('T')[0], 
                      status: 'Pendiente', 
                      items: [], 
                      total: parseFloat(totalStr) 
                    });
                  }
                }
              }}
              className="text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors"
            >
              + Nueva Orden
            </button>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-4">
            {purchaseOrders.map((po: PurchaseOrder) => {
              const supp = suppliers.find((s: Supplier) => s.id === po.supplierId);
              return (
                <div key={po.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-slate-900">OC-{po.id.substring(0,6)}</div>
                    <div className="text-xs text-slate-500">{supp?.name || 'Proveedor desconocido'}</div>
                    <div className="text-xs text-slate-500">Total: ${po.total.toFixed(2)}</div>
                  </div>
                  <select
                    value={po.status}
                    onChange={(e) => updatePOStatusMutation.mutate({ id: po.id, status: e.target.value })}
                    className={`text-xs font-bold px-2 py-1 rounded-lg outline-none border ${po.status === 'Recibida' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="Borrador">Borrador</option>
                    <option value="Enviada">Enviada</option>
                    <option value="Recibida">Recibida</option>
                    <option value="Cancelada">Cancelada</option>
                  </select>
                </div>
              );
            })}
            {purchaseOrders.length === 0 && (
              <p className="text-center text-sm text-slate-400 py-4">No hay órdenes de compra.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
