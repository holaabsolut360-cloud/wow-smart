import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Company, CRMDeal } from '../../types';
import { apiClient } from '../../services/api';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

interface CrmTabProps {
  company: Company | null;
}

const STAGES: CRMDeal['stage'][] = ['Nuevo', 'Contactado', 'En Negociación', 'Ganado', 'Perdido'];

const STAGE_COLORS: Record<string, string> = {
  'Nuevo': 'bg-slate-100 text-slate-700',
  'Contactado': 'bg-blue-100 text-blue-700',
  'En Negociación': 'bg-amber-100 text-amber-700',
  'Ganado': 'bg-emerald-100 text-emerald-700',
  'Perdido': 'bg-rose-100 text-rose-700',
};

const formatMoney = (amount: number, currency: string) => `${currency} ${amount.toFixed(2)}`;

const EMPTY_FORM = {
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  title: '',
  value: '',
  stage: 'Nuevo' as CRMDeal['stage'],
  notes: '',
};

export function CrmTab({ company }: CrmTabProps) {
  const currency = company?.currency || 'S/';
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data, isLoading } = useQuery({
    queryKey: ['crmDeals', company?.id],
    queryFn: () => apiClient.get(`/api/crm-deals?companyId=${company?.id}`),
    enabled: !!company?.id,
  });

  const deals: CRMDeal[] = data?.data || [];
  const pipelineValue = deals.reduce((sum, deal) => sum + (Number(deal.value) || 0), 0);
  const wonDeals = deals.filter((deal) => deal.stage === 'Ganado').length;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['crmDeals', company?.id] });

  const createMutation = useMutation({
    mutationFn: (payload: any) => apiClient.post('/api/crm-deals', { ...payload, companyId: company?.id }),
    onSuccess: () => { invalidate(); closeModal(); },
    onError: (err: any) => alert(err.message || 'No se pudo crear la oportunidad'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => apiClient.put(`/api/crm-deals/${id}`, payload),
    onSuccess: () => { invalidate(); closeModal(); },
    onError: (err: any) => alert(err.message || 'No se pudo actualizar la oportunidad'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/crm-deals/${id}`),
    onSuccess: invalidate,
    onError: (err: any) => alert(err.message || 'No se pudo eliminar la oportunidad'),
  });

  const moveStageMutation = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) => apiClient.put(`/api/crm-deals/${id}`, { stage }),
    onSuccess: invalidate,
    onError: (err: any) => alert(err.message || 'No se pudo mover la oportunidad'),
  });

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const openNewModal = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowModal(true);
  };

  const openEditModal = (deal: CRMDeal) => {
    setForm({
      customerName: deal.customerName || '',
      customerPhone: deal.customerPhone || '',
      customerEmail: deal.customerEmail || '',
      title: deal.title || '',
      value: String(deal.value ?? ''),
      stage: deal.stage,
      notes: deal.notes || '',
    });
    setEditingId(deal.id);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName.trim() || !form.title.trim()) {
      alert('El nombre del cliente y el título de la oportunidad son obligatorios.');
      return;
    }
    const payload = {
      customerName: form.customerName,
      customerPhone: form.customerPhone || undefined,
      customerEmail: form.customerEmail || undefined,
      title: form.title,
      value: Number(form.value) || 0,
      stage: form.stage,
      notes: form.notes || undefined,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar esta oportunidad? Esta acción no se puede deshacer.')) {
      deleteMutation.mutate(id);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div id="crm" className="max-w-6xl">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">CRM</h1>
          <p className="text-slate-500 mt-1">Gestiona oportunidades y seguimiento comercial</p>
        </div>
        <button
          onClick={openNewModal}
          className="flex items-center gap-2 bg-indigo-600 text-white font-bold px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Nueva Oportunidad
        </button>
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

      {isLoading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center text-slate-500">
          Cargando oportunidades...
        </div>
      ) : deals.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 text-center">
          <p className="text-slate-700 font-semibold">Aún no tienes oportunidades CRM registradas.</p>
          <p className="text-slate-500 text-sm mt-2 mb-4">Registra prospectos y negocios en curso para darles seguimiento.</p>
          <button onClick={openNewModal} className="inline-flex items-center gap-2 bg-indigo-600 text-white font-bold px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors">
            <Plus className="w-4 h-4" /> Registrar la primera oportunidad
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {STAGES.map(stage => {
            const stageDeals = deals.filter(d => d.stage === stage);
            const stageValue = stageDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
            return (
              <div key={stage} className="bg-slate-50 rounded-2xl border border-slate-200 flex flex-col">
                <div className="p-4 border-b border-slate-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${STAGE_COLORS[stage]}`}>{stage}</span>
                    <span className="text-xs text-slate-400 font-bold">{stageDeals.length}</span>
                  </div>
                  <div className="text-xs text-slate-500">{formatMoney(stageValue, currency)}</div>
                </div>
                <div className="p-3 space-y-3 flex-1 min-h-[80px]">
                  {stageDeals.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-4">Sin oportunidades</p>
                  )}
                  {stageDeals.map(deal => (
                    <div key={deal.id} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-bold text-slate-800 text-sm leading-tight">{deal.title}</p>
                        <div className="flex gap-1 flex-shrink-0">
                          <button onClick={() => openEditModal(deal)} className="text-slate-400 hover:text-indigo-600 transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(deal.id)} className="text-slate-400 hover:text-rose-600 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mb-2">{deal.customerName || 'Sin nombre'}</p>
                      <p className="text-sm font-bold text-slate-900 mb-3">{formatMoney(Number(deal.value) || 0, currency)}</p>
                      <select
                        value={deal.stage}
                        onChange={e => moveStageMutation.mutate({ id: deal.id, stage: e.target.value })}
                        className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-indigo-500 bg-slate-50"
                      >
                        {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Nueva/Editar Oportunidad */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeModal}></div>
          <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">{editingId ? 'Editar Oportunidad' : 'Nueva Oportunidad'}</h2>
              <button onClick={closeModal} className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nombre del Cliente *</label>
                <input required value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Teléfono</label>
                  <input value={form.customerPhone} onChange={e => setForm({ ...form, customerPhone: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Correo</label>
                  <input type="email" value={form.customerEmail} onChange={e => setForm({ ...form, customerEmail: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Título de la Oportunidad *</label>
                <input required placeholder="Ej: Cotización 100 tazas personalizadas" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Valor Estimado ({currency})</label>
                  <input type="number" min="0" step="0.01" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Etapa</label>
                  <select value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value as CRMDeal['stage'] })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all">
                    {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Notas (Opcional)</label>
                <textarea rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors">Cancelar</button>
                <button type="submit" disabled={isSaving} className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-60">
                  {isSaving ? 'Guardando...' : editingId ? 'Guardar Cambios' : 'Crear Oportunidad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
