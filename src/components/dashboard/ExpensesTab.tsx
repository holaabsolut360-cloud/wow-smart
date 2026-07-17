import React, { useState } from 'react';
import { Company, Expense } from '../../types';
import { apiClient } from "../../services/api";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';

interface ExpensesTabProps {
  company: Company | null;
}

export function ExpensesTab({ company }: ExpensesTabProps) {
  const queryClient = useQueryClient();
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({ concept: '', amount: 0, date: new Date().toISOString().split('T')[0] });

  const { data: expensesData } = useQuery({
    queryKey: ['expenses', company?.id],
    queryFn: () => apiClient.get(`/api/expenses?companyId=${company?.id}`),
    enabled: !!company?.id
  });
  const expenses = expensesData?.data || [];

  const addExpenseMutation = useMutation({
    mutationFn: (expense: any) => apiClient.post("/api/expenses", { ...expense, companyId: company?.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setNewExpense({ concept: '', amount: 0, date: new Date().toISOString().split('T')[0] });
    }
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/expenses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    }
  });

  return (
    <div id="expenses" className="max-w-4xl">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Gastos</h1>
        <p className="text-slate-500 mt-1">Registra y controla los gastos operativos</p>
      </header>
      
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
        <h2 className="text-xl font-bold mb-4">Nuevo Gasto</h2>
        <form className="flex flex-wrap gap-4 items-end" onSubmit={(e) => {
          e.preventDefault();
          addExpenseMutation.mutate(newExpense);
        }}>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
            <input required type="text" value={newExpense.concept} onChange={e => setNewExpense({...newExpense, concept: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-xl" />
          </div>
          <div className="w-32">
            <label className="block text-sm font-medium text-slate-700 mb-1">Monto</label>
            <input required type="number" step="0.01" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})} className="w-full p-2.5 border border-slate-300 rounded-xl" />
          </div>
          <div className="w-40">
            <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
            <input required type="date" value={newExpense.date} onChange={e => setNewExpense({...newExpense, date: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-xl" />
          </div>
          <button type="submit" disabled={addExpenseMutation.isPending} className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors">
            Añadir
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-4 font-semibold text-slate-700">Fecha</th>
              <th className="p-4 font-semibold text-slate-700">Descripción</th>
              <th className="p-4 font-semibold text-slate-700">Monto</th>
              <th className="p-4 font-semibold text-slate-700 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {expenses.map((expense: Expense) => (
              <tr key={expense.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 text-slate-600">{new Date(expense.date).toLocaleDateString()}</td>
                <td className="p-4 font-medium text-slate-900">{expense.concept}</td>
                <td className="p-4 font-bold text-slate-700">${expense.amount.toFixed(2)}</td>
                <td className="p-4 text-right">
                  <button onClick={() => deleteExpenseMutation.mutate(expense.id)} className="text-red-500 hover:text-red-700 p-2">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
            {expenses.length === 0 && (
              <tr><td colSpan={4} className="p-8 text-center text-slate-500">No hay gastos registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
