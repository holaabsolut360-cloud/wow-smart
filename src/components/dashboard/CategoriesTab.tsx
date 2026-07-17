import React from 'react';
import { motion } from 'motion/react';
import { Company } from '../../types';
import { Plus, Trash2 } from 'lucide-react';
import { ImageUpload } from '../ImageUpload';

interface CategoriesTabProps {
  company: Company | null;
  setCompany: React.Dispatch<React.SetStateAction<Company | null>>;
}

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../services/api';

export function CategoriesTab({ company, setCompany }: CategoriesTabProps) {
  const queryClient = useQueryClient();
  const updateCompanyMutation = useMutation({
    mutationFn: (company: any) => apiClient.post('/api/companies/' + company.id, company),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['company'] })
  });
  return (
          <div id="categories" className="max-w-3xl">
            <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-10">
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Categorías</h1>
                <p className="text-slate-500 mt-1">Organiza tus productos para facilitar la navegación</p>
              </div>
              <button 
                onClick={() => setCompany(c => c ? {...c, categories: [...(c.categories || []), { id: Date.now().toString(), name: 'Nueva Categoría' }]} : null)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-sm transition-colors"
              >
                <Plus className="w-5 h-5" />
                Nueva Categoría
              </button>
            </header>
            
            <div className="space-y-4">
              {company?.categories?.map((cat, i) => (
                <div key={cat.id} className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                  <div className="w-16">
                    <ImageUpload 
                      label=""
                      value={cat.image || ''}
                      onChange={base64 => {
                        const newCats = [...(company.categories || [])];
                        newCats[i].image = base64;
                        setCompany({...company, categories: newCats});
                      }}
                      aspectRatio="square"
                    />
                  </div>
                  <div className="flex-1">
                    <input 
                      type="text"
                      value={cat.name}
                      onChange={(e) => {
                        const newCats = [...(company.categories || [])];
                        newCats[i].name = e.target.value;
                        setCompany({...company, categories: newCats});
                      }}
                      placeholder="Nombre de la categoría"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <button 
                    onClick={() => {
                      const newCats = [...(company.categories || [])];
                      newCats.splice(i, 1);
                      setCompany({...company, categories: newCats});
                    }}
                    className="w-10 h-10 flex flex-shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {(!company?.categories || company.categories.length === 0) && (
                <div className="py-20 text-center text-slate-500 border-2 border-dashed border-slate-200 rounded-2xl bg-white">
                  No tienes categorías creadas.
                </div>
              )}
            </div>
            {company?.categories && company.categories.length > 0 && (
              <div className="mt-8">
                <button onClick={() => updateCompanyMutation.mutate(company)} className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-sm">Guardar Categorías</button>
              </div>
            )}
          </div>


  );
}
