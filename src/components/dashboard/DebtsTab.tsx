import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Company, Debt } from '../../types';
import { apiClient } from '../../services/api';

interface DebtsTabProps {
  company: Company | null;
}

const formatMoney = (amount: number, currency: string) => `${currency} ${amount.toFixed(2)}`;

export function DebtsTab({ company }: DebtsTabProps) {
  const currency = company?.currency || 'S/';

  const { data, isLoading } = useQuery({
    queryKey: ['debts', company?.id],
    queryFn: () => apiClient.get(`/api/debts?companyId=${company?.id}`),
    enabled: !!company?.id,
  });

  const debts: Debt[] = data?.data || [];
  const totalPending = debts.reduce((sum, debt) => sum + (Number(debt.remainingAmount) || 0), 0);
  const overdueCount = debts.filter((debt) => debt.status === 'Vencido').length;

  return (
    <div id="debts" className="max-w-5xl">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Cuentas por Cobrar</h1>
        <p className="text-slate-500 mt-1">Controla saldos pendientes y vencimientos</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Deudas Registradas</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{debts.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Total por Cobrar</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{formatMoney(totalPending, currency)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Vencidas</p>
          <p className="text-2xl font-bold text-rose-700 mt-1">{overdueCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-slate-800">Detalle de Cuentas</h3>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Cargando cuentas por cobrar...</div>
        ) : debts.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-slate-700 font-semibold">No hay cuentas por cobrar registradas.</p>
            <p className="text-slate-500 text-sm mt-2">Cuando generes ventas al crédito, aparecerán aquí.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-4 font-semibold text-slate-700">Motivo</th>
                  <th className="p-4 font-semibold text-slate-700">Estado</th>
                  <th className="p-4 font-semibold text-slate-700">Vencimiento</th>
                  <th className="p-4 font-semibold text-slate-700 text-right">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {debts.map((debt) => (
                  <tr key={debt.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-slate-800 font-medium">{debt.reason || 'Sin detalle'}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                        debt.status === 'Vencido'
                          ? 'bg-rose-100 text-rose-700'
                          : debt.status === 'Pagado'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                      }`}>
                        {debt.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600">{debt.dueDate ? new Date(debt.dueDate).toLocaleDateString() : 'Sin fecha'}</td>
                    <td className="p-4 text-right font-bold text-slate-800">
                      {formatMoney(Number(debt.remainingAmount) || 0, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
