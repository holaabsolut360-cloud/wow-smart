import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { PlusCircle, Trash2, Upload } from 'lucide-react';
import { Company, Customer } from '../../types';
import { Download } from 'lucide-react';
import { exportToCSV } from '../../utils/exportToCSV';
import { apiClient } from "../../services/api";
import { readSheet } from 'read-excel-file/browser';
import Papa from 'papaparse';

interface CustomersTabProps {
  company: Company | null;
}

export function CustomersTab({ company }: CustomersTabProps) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const limit = 20;
  
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({});

  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState('');
  const [importError, setImportError] = useState('');

  const { data: customersData, isLoading } = useQuery({
    queryKey: ['customers', company?.id, page],
    queryFn: async () => {
      if (!company?.id) return { data: [], total: 0, totalPages: 0 };
      const res = await apiClient.get(`/api/customers?companyId=${company.id}&page=${page}&limit=${limit}`);
      return res;
    },
    enabled: !!company?.id,
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete('/api/customers/' + id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customers'] })
  });
  const customers = customersData?.data || [];
  const totalPages = customersData?.totalPages || 1;

  const addMutation = useMutation({
    mutationFn: async (customer: Partial<Customer>) => {
      const res = await apiClient.post("/api/customers", {
        ...customer,
        companyId: company?.id,
        createdAt: new Date().toISOString()
      });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers', company?.id] });
      setIsAddingCustomer(false);
      setNewCustomer({});
    },
    onError: (err: any) => {
      alert(err.message || 'No se pudo guardar el cliente. Verifica los datos e inténtalo de nuevo.');
    }
  });

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    if (!newCustomer.name?.trim()) {
      alert('El nombre completo es obligatorio.');
      return;
    }
    addMutation.mutate(newCustomer);
  };

  // Mismo patrón seguro que ProductsTab.tsx: lectura 100% en el navegador
  // con read-excel-file (.xlsx) y papaparse (.csv) — sin la librería xlsx,
  // que tenía vulnerabilidades sin parche. El archivo nunca se sube a
  // ningún servidor ni se guarda en ningún lado: se lee, se convierte en
  // filas de datos, y esas filas van directo a /api/customers, que ya
  // exige sesión iniciada y aísla los datos por empresa (RLS) — ninguna
  // otra empresa puede ver estos clientes, ni existe un "archivo" que
  // proteger después de la carga.
  const normalizeHeader = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, '_')
      .trim();

  const getField = (row: Record<string, any>, keys: string[]) => {
    for (const key of Object.keys(row)) {
      if (keys.includes(normalizeHeader(key))) return row[key];
    }
    return undefined;
  };

  const handleBulkImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !company?.id) return;

    setImportError('');
    setImportMessage('');
    setIsImporting(true);

    try {
      const fileName = file.name.toLowerCase();
      let rows: Record<string, any>[];

      if (fileName.endsWith('.csv')) {
        const text = await file.text();
        const parsed = Papa.parse<Record<string, any>>(text, { header: true, skipEmptyLines: true });
        rows = parsed.data;
      } else if (fileName.endsWith('.xlsx')) {
        const buffer = await file.arrayBuffer();
        const sheetRows = await readSheet(new Blob([buffer]));

        if (!sheetRows.length) {
          throw new Error('El archivo no contiene filas con datos.');
        }

        const [headerRow, ...dataRows] = sheetRows;
        const headers = headerRow.map(h => String(h ?? '').trim());
        rows = dataRows
          .filter(r => r.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== ''))
          .map(r => {
            const obj: Record<string, any> = {};
            headers.forEach((header, i) => {
              if (header) obj[header] = r[i];
            });
            return obj;
          });
      } else {
        throw new Error('El formato .xls (Excel 97-2003) ya no es compatible. Vuelve a guardar el archivo como .xlsx o .csv desde Excel/Google Sheets e inténtalo de nuevo.');
      }

      if (!rows.length) {
        throw new Error('El archivo no contiene filas con datos.');
      }

      const parsedCustomers: Partial<Customer>[] = [];
      let skipped = 0;

      for (const row of rows) {
        const name = String(getField(row, ['nombre', 'nombre_completo', 'name', 'cliente']) || '').trim();
        if (!name) {
          skipped += 1;
          continue;
        }

        parsedCustomers.push({
          name,
          phone: String(getField(row, ['telefono', 'teléfono', 'phone', 'celular', 'whatsapp']) || '').trim() || undefined,
          email: String(getField(row, ['email', 'correo', 'correo_electronico']) || '').trim() || undefined,
          address: String(getField(row, ['direccion', 'dirección', 'address']) || '').trim() || undefined,
          documentNumber: String(getField(row, ['dni', 'ruc', 'dni_ruc', 'documentnumber', 'documento']) || '').trim() || undefined,
          notes: String(getField(row, ['notas', 'notes', 'observaciones']) || '').trim() || undefined,
        });
      }

      if (!parsedCustomers.length) {
        throw new Error('No se encontraron clientes válidos. Asegúrate de incluir una columna de nombre.');
      }

      const results = await Promise.allSettled(
        parsedCustomers.map((customer) =>
          apiClient.post('/api/customers', {
            ...customer,
            companyId: company.id,
            createdAt: new Date().toISOString(),
          }),
        ),
      );

      const successCount = results.filter((result) => result.status === 'fulfilled').length;
      const failCount = results.length - successCount;

      queryClient.invalidateQueries({ queryKey: ['customers', company?.id] });

      setImportMessage(
        `Importación completada: ${successCount} cliente(s) creados${skipped ? `, ${skipped} fila(s) omitidas por no tener nombre` : ''}${failCount ? `, ${failCount} fallidas` : ''}.`,
      );
    } catch (err: any) {
      setImportError(err.message || 'No se pudo procesar el archivo.');
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  return (
    <>
      {isLoading ? (
        <div className="py-20 text-center text-slate-500">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          Cargando clientes...
        </div>
      ) : (
          <div id="customers" className="max-w-5xl">
            <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-10">
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Directorio de Clientes</h1>
                <p className="text-slate-500 mt-1">Conoce a tus clientes más leales y contáctalos fácilmente</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    const data = customers.map(c => ({
                      ID: c.id,
                      Nombre: c.name,
                      Teléfono: c.phone || '',
                      Email: c.email || '',
                      Dirección: c.address || '',
                      'DNI/RUC': c.documentNumber || '',
                      Notas: c.notes || '',
                      Fecha_Registro: new Date(c.createdAt).toLocaleString()
                    }));
                    exportToCSV(`clientes_${new Date().toISOString().split('T')[0]}.csv`, data);
                  }}
                  className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <Download className="w-4 h-4" /> CSV
                </button>
                <label className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer">
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleBulkImport}
                    className="hidden"
                    disabled={isImporting}
                  />
                  <Upload className="w-4 h-4" /> {isImporting ? 'Importando...' : 'Importar Excel/CSV'}
                </label>
                <button 
                  onClick={() => setIsAddingCustomer(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <PlusCircle className="w-5 h-5" /> Nuevo Cliente
                </button>
              </div>
            </header>

            {(importMessage || importError) && (
              <div className={`mb-6 p-4 rounded-xl border ${importError ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                {importError || importMessage}
              </div>
            )}

            {isAddingCustomer && (
              <motion.div initial={{opacity: 0, y: -10}} animate={{opacity: 1, y: 0}} className="mb-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <form onSubmit={handleAddCustomer} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nombre Completo</label>
                    <input 
                      type="text" 
                      required
                      value={newCustomer.name || ''}
                      onChange={e => setNewCustomer({...newCustomer, name: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Dirección (Opcional)</label>
                    <input 
                      type="text" 
                      value={newCustomer.address || ''}
                      onChange={e => setNewCustomer({...newCustomer, address: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Teléfono (WhatsApp)</label>
                    <input 
                      type="tel" 
                      value={newCustomer.phone || ''}
                      onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Correo Electrónico (Opcional)</label>
                    <input 
                      type="email" 
                      value={newCustomer.email || ''}
                      onChange={e => setNewCustomer({...newCustomer, email: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">DNI o RUC (Opcional)</label>
                    <input 
                      type="text" 
                      value={newCustomer.documentNumber || ''}
                      onChange={e => setNewCustomer({...newCustomer, documentNumber: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Notas / Preferencias (Opcional)</label>
                    <input 
                      type="text" 
                      value={newCustomer.notes || ''}
                      onChange={e => setNewCustomer({...newCustomer, notes: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2 flex justify-end gap-3 mt-2 pt-4 border-t border-slate-100">
                    <button type="button" onClick={() => setIsAddingCustomer(false)} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors">Cancelar</button>
                    <button type="submit" disabled={addMutation.isPending} className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-60">
                      {addMutation.isPending ? 'Guardando...' : 'Guardar Cliente'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
            
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-xs">
                    <tr>
                      <th className="px-6 py-4">Cliente</th>
                      <th className="px-6 py-4 text-center">Pedidos</th>
                      <th className="px-6 py-4 text-right">Total Gastado</th>
                      <th className="px-6 py-4">Último Pedido / Fecha Reg.</th>
                      <th className="px-6 py-4">Contacto</th>
                      <th className="px-6 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                          Aún no hay clientes registrados.
                        </td>
                      </tr>
                    ) : customers.map((c, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{c.name}</div>
                          <div className="text-slate-500 text-xs">{c.phone || 'Sin número'}</div>
                          {c.email && <div className="text-slate-400 text-xs">{c.email}</div>}
                          {c.address && <div className="text-slate-400 text-xs">{c.address}</div>}
                          {c.documentNumber && <div className="text-slate-400 text-xs">Doc: {c.documentNumber}</div>}
                          {c.notes && <div className="text-slate-400 text-xs italic">Nota: {c.notes}</div>}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center justify-center bg-indigo-50 text-indigo-700 font-bold px-2.5 py-1 rounded-full text-xs">
                            {c.ordersCount ?? 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-slate-900">
                          {company?.currency || 'S/'} {(c.totalSpent ?? 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-xs">
                          {c.lastOrder ? new Date(c.lastOrder).toLocaleDateString() : new Date(c.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          {c.phone && (
                            <a 
                              href={`https://wa.me/${c.phone.replace(/\+/g, '')}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium text-xs bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              <span>📱</span> Escribir
                            </a>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {c.id ? (
                            <button onClick={() => deleteCustomerMutation.mutate(c.id!)} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Eliminar registro manual">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Automático</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
