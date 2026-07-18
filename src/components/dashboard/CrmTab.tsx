import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Company, CRMDeal } from '../../types';
import { apiClient } from '../../services/api';

interface CrmTabProps {
  company: Company | null;
}

const formatMoney = (amount: number, currency: string) => `${currency} ${amount.toFixed(2)}`;

export function CrmTab({ company }: CrmTabProps) {
  const currency = company?.currency || 'S/';

  const { data, isLoading } = useQuery({
    queryKey: ['crmDeals', company?.id],
    queryFn: () => apiClient.get(`/api/crm-deals?companyId=${company?.id}`),
    enabled: !!company?.id,
  });

  const deals: CRMDeal[] = data?.data || [];
  const pipelineValue = deals.reduce((sum, deal) => sum + (Number(deal.value) || 0), 0);
  const wonDeals = deals.filter((deal) => deal.stage === 'Ganado').length;

  return (
    <div id="crm" className="max-w-5xl">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">CRM</h1>
        <p className="text-slate-500 mt-1">Gestiona oportunidades y seguimiento comercial</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Oportunidades</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{deals.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Valor del Pipeline</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{formatMoney(pipelineValue, currency)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Negocios Ganados</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{wonDeals}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-slate-800">Pipeline Comercial</h3>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Cargando oportunidades...</div>
        ) : deals.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-slate-700 font-semibold">Aún no tienes oportunidades CRM registradas.</p>
            <p className="text-slate-500 text-sm mt-2">Cuando registres prospectos y negocios, aparecerán aquí.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-4 font-semibold text-slate-700">Cliente</th>
                  <th className="p-4 font-semibold text-slate-700">Oportunidad</th>
                  <th className="p-4 font-semibold text-slate-700">Etapa</th>
                  <th className="p-4 font-semibold text-slate-700 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deals.map((deal) => (
                  <tr key={deal.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-slate-800 font-medium">{deal.customerName || 'Sin nombre'}</td>
                    <td className="p-4 text-slate-700">{deal.title}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
                        {deal.stage}
                      </span>
                    </td>
                    <td className="p-4 text-right font-bold text-slate-800">{formatMoney(Number(deal.value) || 0, currency)}</td>
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
