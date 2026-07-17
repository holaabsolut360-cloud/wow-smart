import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Product, Ingredient, Company } from '../../types';
import { Trash2 } from 'lucide-react';
import { apiClient } from "../../services/api";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface RecipesTabProps {
  company: Company | null;
}

export function RecipesTab({ company }: RecipesTabProps) {
  const queryClient = useQueryClient();
  const [isAddingIngredient, setIsAddingIngredient] = useState(false);
  const [newIngredient, setNewIngredient] = useState<Partial<Ingredient>>({
    name: '',
    unit: 'kg',
    costPerUnit: 0,
    stock: 0,
  });
  
  const [addingRecipeFor, setAddingRecipeFor] = useState<string | null>(null);
  const [newRecipeItem, setNewRecipeItem] = useState<{ingredientId: string, qty: number}>({ ingredientId: '', qty: 1 });

  const { data: productsData } = useQuery({
    queryKey: ['products', company?.id],
    queryFn: () => apiClient.get(`/api/products?companyId=${company?.id}&limit=500`),
    enabled: !!company?.id
  });
  const products = productsData?.data || [];

  const { data: ingredientsData } = useQuery({
    queryKey: ['ingredients', company?.id],
    queryFn: () => apiClient.get(`/api/ingredients?companyId=${company?.id}`),
    enabled: !!company?.id
  });
  const ingredients = ingredientsData?.data || [];

  const addIngredientMutation = useMutation({
    mutationFn: (ingredient: any) => apiClient.post("/api/ingredients", { ...ingredient, companyId: company?.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      setIsAddingIngredient(false);
      setNewIngredient({ name: '', unit: 'kg', costPerUnit: 0, stock: 0 });
    }
  });

  const deleteIngredientMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/ingredients/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
    }
  });

  const updateProductRecipeMutation = useMutation({
    mutationFn: ({ id, recipe }: { id: string, recipe: any }) => apiClient.put(`/api/products/${id}`, { recipe }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
  });

  return (
    <div id="recipes" className="max-w-5xl">
      <header className="flex justify-between items-start mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Recetas e Insumos</h1>
          <p className="text-slate-500 mt-1">Gestiona los ingredientes que componen tus productos</p>
        </div>
        <button 
          onClick={() => setIsAddingIngredient(!isAddingIngredient)}
          className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 shadow-sm transition-colors"
        >
          {isAddingIngredient ? 'Cancelar' : '+ Nuevo Insumo'}
        </button>
      </header>

      {isAddingIngredient && (
        <motion.div initial={{opacity: 0, y: -10}} animate={{opacity: 1, y: 0}} className="mb-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4">Añadir Insumo (Materia Prima)</h3>
          <form onSubmit={(e) => {
            e.preventDefault();
            addIngredientMutation.mutate(newIngredient);
          }} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nombre del Insumo</label>
              <input type="text" required value={newIngredient.name || ''} onChange={e => setNewIngredient({...newIngredient, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Ej. Harina de trigo, Tomates..." />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Unidad de Medida</label>
              <input type="text" required value={newIngredient.unit || ''} onChange={e => setNewIngredient({...newIngredient, unit: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="kg, gr, ml, unidad" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Stock Inicial</label>
              <input type="number" required value={newIngredient.stock || ''} onChange={e => setNewIngredient({...newIngredient, stock: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="0" />
            </div>
            <div className="md:col-span-4 flex justify-end gap-3 mt-4">
              <button type="button" onClick={() => setIsAddingIngredient(false)} className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">Cancelar</button>
              <button type="submit" className="px-6 py-3 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors">Guardar Insumo</button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm mb-10">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Nombre</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Unidad</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Stock</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {ingredients.map((ing: Ingredient) => (
              <tr key={ing.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-bold text-slate-900">{ing.name}</td>
                <td className="px-6 py-4 text-slate-500">{ing.unit}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${ing.stock <= 10 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {ing.stock}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => deleteIngredientMutation.mutate(ing.id)}
                    className="text-red-500 hover:text-red-700 font-bold text-sm"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {ingredients.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                  No hay insumos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className="text-xl font-bold text-slate-800 mb-6">Recetas por Producto</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {products.map((p: Product) => (
          <div key={p.id} className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <h3 className="font-bold text-slate-900 mb-2">{p.name}</h3>
            <div className="space-y-2 mb-4">
              {p.recipe && p.recipe.length > 0 ? (
                p.recipe.map((r: any, idx: number) => {
                  const ing = ingredients.find((i: Ingredient) => i.id === r.ingredientId);
                  return (
                    <div key={idx} className="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
                      <span className="text-slate-600 flex-1">{ing ? ing.name : 'Insumo eliminado'}</span>
                      <span className="font-bold text-slate-900 mr-3">{r.qty} {ing?.unit}</span>
                      <button 
                        onClick={() => {
                          const newRecipe = p.recipe?.filter((_: any, i: number) => i !== idx);
                          updateProductRecipeMutation.mutate({ id: p.id, recipe: newRecipe });
                        }}
                        className="text-red-400 hover:text-red-600 font-bold"
                      >
                        ×
                      </button>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-slate-400 italic">Sin receta asignada</p>
              )}
            </div>

            {addingRecipeFor === p.id ? (
              <div className="flex gap-2 items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                <select 
                  value={newRecipeItem.ingredientId}
                  onChange={e => setNewRecipeItem({...newRecipeItem, ingredientId: e.target.value})}
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none"
                >
                  <option value="">Selecciona insumo...</option>
                  {ingredients.map((ing: Ingredient) => <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>)}
                </select>
                <input 
                  type="number" 
                  value={newRecipeItem.qty}
                  onChange={e => setNewRecipeItem({...newRecipeItem, qty: Number(e.target.value)})}
                  className="w-20 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none text-center"
                  placeholder="Cant."
                />
                <button 
                  onClick={() => {
                    if (!newRecipeItem.ingredientId || newRecipeItem.qty <= 0) return;
                    const newRecipe = [...(p.recipe || []), newRecipeItem];
                    updateProductRecipeMutation.mutate({ id: p.id, recipe: newRecipe }, {
                      onSuccess: () => {
                        setAddingRecipeFor(null);
                        setNewRecipeItem({ ingredientId: '', qty: 1 });
                      }
                    });
                  }}
                  className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold hover:bg-indigo-700 transition-colors"
                >
                  +
                </button>
                <button 
                  onClick={() => setAddingRecipeFor(null)}
                  className="w-8 h-8 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center font-bold hover:bg-slate-300 transition-colors"
                >
                  ×
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setAddingRecipeFor(p.id)}
                className="text-indigo-600 font-bold text-sm hover:underline"
              >
                + Agregar Ingrediente
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
