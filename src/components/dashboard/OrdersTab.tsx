import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Company } from '../../types';
import { exportToCSV } from '../../utils/exportToCSV';
import { Download } from 'lucide-react';
import { apiClient } from "../../services/api";

interface OrdersTabProps {
  company: Company | null;
}

export function OrdersTab({ company }: OrdersTabProps) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['orders', company?.id, page],
    queryFn: async () => {
      if (!company?.id) return { data: [], total: 0, totalPages: 0 };
      const res = await apiClient.get(`/api/orders?companyId=${company.id}&page=${page}&limit=${limit}`);
      return res;
    },
    enabled: !!company?.id,
  });

  const orders = ordersData?.data || [];
  const totalPages = ordersData?.totalPages || 1;

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      await apiClient.put(`/api/orders/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', company?.id] });
    }
  });

  const updateOrderStatus = (id: string, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  const isServiceBusiness = company?.businessType === 'Estudio de Abogados' || company?.businessType === 'Servicios Profesionales' || company?.businessType === 'Agencia de Publicidad' || company?.businessType === 'Imprenta';
  const termOrder = isServiceBusiness ? 'Solicitudes' : 'Pedidos';

  return (
    <>
      {isLoading ? (
        <div className="py-20 text-center text-slate-500">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          Cargando {termOrder.toLowerCase()}...
        </div>
      ) : (
          <div id="orders" className="max-w-5xl">
            <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{termOrder} Recientes</h1>
                <p className="text-slate-500 mt-1">Revisa y gestiona l@s {termOrder.toLowerCase()} de tus clientes</p>
              </div>
              <button
                onClick={() => {
                  const data = orders.map(o => ({
                    ID: o.id,
                    Fecha: new Date(o.createdAt).toLocaleString(),
                    Cliente: o.customerName,
                    Teléfono: o.customerPhone || '',
                    Tipo_Entrega: o.deliveryMethod,
                    Dirección: o.address || '',
                    Estado: o.status,
                    Subtotal: o.subtotal,
                    Descuento: o.discount,
                    Total: o.total,
                    Método_Pago: o.paymentMethod || '',
                    Items: o.items.map((i: any) => `${i.qty}x ${i.name}`).join('; ')
                  }));
                  exportToCSV(`pedidos_${new Date().toISOString().split('T')[0]}.csv`, data);
                }}
                className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold hover:bg-slate-50 transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" /> Exportar CSV
              </button>
            </header>
            
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="py-20 text-center text-slate-500 border-2 border-dashed border-slate-200 rounded-2xl bg-white">
                  Aún no tienes {termOrder.toLowerCase()} registrad@s.
                </div>
              ) : orders.map(order => (
                <div key={order.id} className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
                  <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                    <div>
                      <div className="text-xs text-slate-400 mb-1">Pedido #{order.id.slice(-6)} • {new Date(order.createdAt).toLocaleString()}</div>
                      <h3 className="font-bold text-lg text-slate-800">{order.customerName}</h3>
                      <div className="text-sm text-slate-500">{order.deliveryMethod === 'delivery' ? '🚚 Delivery' : '🏪 Recojo en tienda'}</div>
                      {order.address && <div className="text-sm text-slate-500">{order.address} {order.reference && `(${order.reference})`}</div>}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-slate-900">{company?.currency || 'S/'} {order.total?.toFixed(2)}</div>
                      <select 
                        value={order.status}
                        onChange={async (e) => {
                          const newStatus = e.target.value;
                          await apiClient.put(`/api/orders/${order.id}/status`, { status: newStatus });
                          queryClient.invalidateQueries({ queryKey: ['orders'] });
                        }}
                        className={`mt-2 text-xs font-bold px-3 py-1.5 rounded-full border outline-none cursor-pointer ${
                          order.status === 'Pendiente' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          order.status === 'Pagado' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          order.status === 'Enviado' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                          'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        <option value="Pendiente">Pendiente</option>
                        <option value="Pagado">Pagado</option>
                        <option value="Enviado">Enviado</option>
                        <option value="Entregado">Entregado</option>
                      </select>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 pt-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Productos ({order.items?.length})</h4>
                    <div className="space-y-2">
                      {order.items?.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-slate-700">{item.qty}x {item.name} {item.variants && Object.keys(item.variants).length > 0 ? `(${Object.values(item.variants).join(', ')})` : ''}</span>
                          <span className="font-medium text-slate-900">{company?.currency || 'S/'} {(item.price * item.qty).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    {order.couponCode && (
                      <div className="flex justify-between text-sm mt-2 text-emerald-600 font-medium pt-2 border-t border-slate-50">
                        <span>Descuento ({order.couponCode})</span>
                        <span>-{company?.currency || 'S/'} {order.discount?.toFixed(2)}</span>
                      </div>
                    )}
                    {order.customerPhone && (
                      <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
                        <button 
                          onClick={() => {
                            const msg = `Hola ${order.customerName}, tu pedido #${order.id.slice(-6)} ya está ${order.status.toLowerCase()}.`;
                            window.open(`https://wa.me/${order.customerPhone.replace(/\+/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                          }}
                          className="px-4 py-2 bg-[#25D366] text-white hover:bg-[#1ebd5a] font-bold text-sm rounded-lg transition-colors flex items-center gap-2"
                        >
                          Notificar por WhatsApp
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>


      )}
      
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 border border-slate-200 bg-white rounded-lg disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="text-slate-600 font-medium">Página {page} de {totalPages}</span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 border border-slate-200 bg-white rounded-lg disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      )}
    </>
  );
}
