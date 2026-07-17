import React, { useState } from 'react';
import { Download, TrendingUp, TrendingDown, Package, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { Company, Product } from '../../types';
import { exportToCSV } from '../../utils/exportToCSV';
import { apiClient } from "../../services/api";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface InventoryTabProps {
  company: Company | null;
}

export function InventoryTab({ company }: InventoryTabProps) {
  const queryClient = useQueryClient();
  const [isAddingMovement, setIsAddingMovement] = useState(false);
  const [newMovement, setNewMovement] = useState({ type: 'Entrada', qty: 1, date: new Date().toISOString().split('T')[0], productId: '', notes: '' });

  const { data: productsData } = useQuery({
    queryKey: ['products', company?.id],
    queryFn: () => apiClient.get(`/api/products?companyId=${company?.id}&limit=500`),
    enabled: !!company?.id
  });
  const products = productsData?.data || [];

  const { data: movementsData } = useQuery({
    queryKey: ['inventoryMovements', company?.id],
    queryFn: () => apiClient.get(`/api/inventory-movements?companyId=${company?.id}`),
    enabled: !!company?.id
  });
  const inventoryMovements = movementsData?.data || [];

  const { data: analyticsData } = useQuery({
    queryKey: ['inventoryAnalytics', company?.id],
    queryFn: () => apiClient.get(`/api/inventory-analytics?companyId=${company?.id}`),
    enabled: !!company?.id
  });
  const inventoryAnalytics = analyticsData?.data || { totalItems: 0, lowStock: 0, totalValue: 0 };

  const addMovementMutation = useMutation({
    mutationFn: (movement: any) => apiClient.post("/api/inventory-movements", { ...movement, companyId: company?.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventoryMovements'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryAnalytics'] });
      setIsAddingMovement(false);
      setNewMovement({ type: 'Entrada', qty: 1, date: new Date().toISOString().split('T')[0], productId: '', notes: '' });
    }
  });

  return (
    <div id="inventory" className="max-w-5xl">
      <header className="mb-10">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Inventario</h1>
            <p className="text-slate-500 mt-1">Control de stock y movimientos</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => exportToCSV("Inventario", products)} className="bg-white text-slate-700 border border-slate-200 font-medium px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2">
              <Download className="w-4 h-4" /> CSV
            </button>
            <button onClick={() => setIsAddingMovement(!isAddingMovement)} className="bg-indigo-600 text-white font-bold px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors">
              {isAddingMovement ? 'Cerrar' : '+ Registrar Movimiento'}
            </button>
          </div>
        </div>
      </header>

      {isAddingMovement && (
        <motion.div initial={{opacity: 0, y: -10}} animate={{opacity: 1, y: 0}} className="bg-white border border-slate-200 p-6 rounded-2xl mb-8 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4">Nuevo Movimiento de Inventario</h3>
          <form onSubmit={(e) => {
            e.preventDefault();
            addMovementMutation.mutate(newMovement as any);
          }} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Producto</label>
              <select required value={newMovement.productId} onChange={e => setNewMovement({...newMovement, productId: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-xl">
                <option value="">Seleccionar Producto...</option>
                {products.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
              <select value={newMovement.type} onChange={e => setNewMovement({...newMovement, type: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-xl">
                <option>Entrada</option>
                <option>Salida</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad</label>
              <input required type="number" min="1" value={newMovement.qty} onChange={e => setNewMovement({...newMovement, qty: parseInt(e.target.value)})} className="w-full p-2.5 border border-slate-300 rounded-xl" />
            </div>
            <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors" disabled={addMovementMutation.isPending}>
              Guardar
            </button>
          </form>
        </motion.div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Package className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Productos</p>
            <p className="text-2xl font-bold text-slate-900">{inventoryAnalytics.totalItems}</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><AlertTriangle className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-medium text-slate-500">Stock Bajo</p>
            <p className="text-2xl font-bold text-slate-900">{inventoryAnalytics.lowStock}</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><TrendingUp className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-medium text-slate-500">Valor Inventario</p>
            <p className="text-2xl font-bold text-slate-900">${inventoryAnalytics.totalValue?.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800">Últimos Movimientos</h3>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-4 font-semibold text-slate-700">Fecha</th>
              <th className="p-4 font-semibold text-slate-700">Producto</th>
              <th className="p-4 font-semibold text-slate-700">Tipo</th>
              <th className="p-4 font-semibold text-slate-700 text-right">Cantidad</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {inventoryMovements.map((m: any) => {
              const product = products.find((p: any) => p.id === m.productId);
              return (
                <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 text-slate-600">{new Date(m.date).toLocaleDateString()}</td>
                  <td className="p-4 font-medium text-slate-900">{product?.name || 'Desconocido'}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${m.type === 'Entrada' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {m.type === 'Entrada' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {m.type}
                    </span>
                  </td>
                  <td className="p-4 text-right font-bold text-slate-700">{m.qty}</td>
                </tr>
              );
            })}
            {inventoryMovements.length === 0 && (
              <tr><td colSpan={4} className="p-8 text-center text-slate-500">No hay movimientos registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
