import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Company } from '../../types';

interface AnalyticsTabProps {
  company: Company | null;
  analytics: any;
}

export function AnalyticsTab({ company, analytics }: AnalyticsTabProps) {
  return (
          <div id="analytics" className="max-w-5xl">
            <header className="mb-10">
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Resumen del Negocio</h1>
              <p className="text-slate-500 mt-1">Métricas en tiempo real, ventas y rendimiento</p>
            </header>

            <h2 className="text-xl font-bold text-slate-800 mb-4">Hoy</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-2xl shadow-md text-white">
                <div className="text-sm font-bold text-indigo-100 uppercase tracking-wider mb-2">Ventas del Día</div>
                <div className="text-4xl font-extrabold">{company?.currency || 'S/'} {analytics.todayRevenue.toFixed(2)}</div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Gastos del Día</div>
                <div className="text-3xl font-extrabold text-red-500">{company?.currency || 'S/'} {analytics.todayExpenseTotal.toFixed(2)}</div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Utilidad del Día</div>
                <div className={`text-3xl font-extrabold ${analytics.todayProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {company?.currency || 'S/'} {analytics.todayProfit.toFixed(2)}
                </div>
              </div>
            </div>

            <h2 className="text-xl font-bold text-slate-800 mb-4">Histórico General</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-10">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ingresos Totales</div>
                <div className="text-2xl font-extrabold text-slate-900">{company?.currency || 'S/'} {analytics.totalRevenue.toFixed(2)}</div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Gastos Totales</div>
                <div className="text-2xl font-extrabold text-red-500">{company?.currency || 'S/'} {analytics.totalExpenses.toFixed(2)}</div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Utilidad Neta (Flujo)</div>
                <div className={`text-2xl font-extrabold ${analytics.totalProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {company?.currency || 'S/'} {analytics.totalProfit.toFixed(2)}
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Pedidos</div>
                <div className="text-2xl font-extrabold text-slate-900">{analytics.totalOrdersCount}</div>
                <div className="text-xs text-slate-400 mt-1">Ticket: {company?.currency || 'S/'} {analytics.avgTicket.toFixed(2)}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-lg text-slate-800 mb-6">Ingresos (Últimos días)</h3>
                {analytics.revenueData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <XAxis dataKey="date" tick={{fontSize: 12, fill: '#64748b'}} tickLine={false} axisLine={false} />
                        <YAxis tick={{fontSize: 12, fill: '#64748b'}} tickLine={false} axisLine={false} tickFormatter={(val) => `${company?.currency || 'S/'}${val}`} />
                        <Tooltip 
                          cursor={{fill: '#f1f5f9'}}
                          contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                          formatter={(value: number) => [`${company?.currency || 'S/'} ${value.toFixed(2)}`, 'Ingresos']}
                        />
                        <Bar dataKey="revenue" fill={company?.color || '#4f46e5'} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-slate-400">Sin datos suficientes</div>
                )}
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-lg text-slate-800 mb-6">Productos Estrella (Cantidades vendidas)</h3>
                {analytics.topProducts.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.topProducts.map((p, i) => (
                      <div key={i} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">#{i+1}</div>
                          <div className="font-semibold text-slate-800 truncate max-w-[150px] sm:max-w-[200px]">{p.name}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-slate-900">{p.qty} unids.</div>
                          <div className="text-xs text-slate-500">{company?.currency || 'S/'} {p.revenue.toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-slate-400">Sin datos suficientes</div>
                )}
              </div>
            </div>
          </div>

  );
}
