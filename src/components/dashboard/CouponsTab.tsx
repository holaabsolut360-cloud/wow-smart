import React from 'react';
import { motion } from 'motion/react';
import { Company } from '../../types';
import { Plus, Trash2 } from 'lucide-react';

interface CouponsTabProps {
  company: Company | null;
  setCompany: React.Dispatch<React.SetStateAction<Company | null>>;
}

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../services/api';

export function CouponsTab({ company, setCompany }: CouponsTabProps) {
  const queryClient = useQueryClient();
  const updateCompanyMutation = useMutation({
    mutationFn: (company: any) => apiClient.post('/api/companies/' + company.id, company),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['company'] })
  });
  return (
          <div id="coupons" className="max-w-3xl">
            <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-10">
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Cupones</h1>
                <p className="text-slate-500 mt-1">Crea descuentos especiales para tus clientes</p>
              </div>
              <button 
                onClick={() => setCompany(c => c ? {...c, coupons: [...(c.coupons || []), { id: Date.now().toString(), code: 'NUEVO', discountType: 'percentage', discountValue: 10, active: true }]} : null)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-sm transition-colors"
              >
                <Plus className="w-5 h-5" />
                Nuevo Cupón
              </button>
            </header>
            
            <div className="space-y-4">
              {company?.coupons?.map((coupon, i) => (
                <div key={coupon.id} className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <div className="flex-1 grid grid-cols-2 gap-4 w-full">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Código</label>
                      <input 
                        type="text"
                        value={coupon.code}
                        onChange={(e) => {
                          const newCoupons = [...(company.coupons || [])];
                          newCoupons[i].code = e.target.value.toUpperCase();
                          setCompany({...company, coupons: newCoupons});
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-mono uppercase text-slate-900 focus:border-indigo-500 outline-none"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1 flex gap-2">
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo</label>
                        <select 
                          value={coupon.discountType}
                          onChange={(e) => {
                            const newCoupons = [...(company.coupons || [])];
                            newCoupons[i].discountType = e.target.value as any;
                            setCompany({...company, coupons: newCoupons});
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-slate-900 focus:border-indigo-500 outline-none"
                        >
                          <option value="percentage">% Porcentaje</option>
                          <option value="fixed">{company?.currency || 'S/'} Fijo</option>
                        </select>
                      </div>
                      <div className="w-24">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Valor</label>
                        <input 
                          type="number"
                          value={coupon.discountValue}
                          onChange={(e) => {
                            const newCoupons = [...(company.coupons || [])];
                            newCoupons[i].discountValue = Number(e.target.value);
                            setCompany({...company, coupons: newCoupons});
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-slate-900 focus:border-indigo-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0 justify-between sm:justify-start">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={coupon.active}
                        onChange={(e) => {
                          const newCoupons = [...(company.coupons || [])];
                          newCoupons[i].active = e.target.checked;
                          setCompany({...company, coupons: newCoupons});
                        }}
                        className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm font-bold text-slate-700">Activo</span>
                    </label>
                    <button 
                      onClick={() => {
                        const newCoupons = [...(company.coupons || [])];
                        newCoupons.splice(i, 1);
                        setCompany({...company, coupons: newCoupons});
                      }}
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {(!company?.coupons || company.coupons.length === 0) && (
                <div className="py-20 text-center text-slate-500 border-2 border-dashed border-slate-200 rounded-2xl bg-white">
                  No tienes cupones de descuento.
                </div>
              )}
            </div>
            {company?.coupons && company.coupons.length > 0 && (
              <div className="mt-8">
                <button onClick={() => updateCompanyMutation.mutate(company)} className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-sm">Guardar Cupones</button>
              </div>
            )}
          </div>


  );
}
