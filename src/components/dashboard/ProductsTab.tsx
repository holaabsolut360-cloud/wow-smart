import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ExternalLink, Plus, Trash2, Edit2, Lock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { readSheet } from 'read-excel-file/browser';
import Papa from 'papaparse';
import { Company, Product, Category } from '../../types';
import { ImageUpload } from '../ImageUpload';
import { apiClient } from "../../services/api";
import { calculatePricing } from '../../utils/pricingCalculator';

interface ProductsTabProps {
  company: Company | null;
  categories: Category[];
}

// Determina a qué plan conviene subir según el plan actual de la empresa.
// Devuelve null si ya está en el plan más alto (Empresa).
const getNextPlan = (currentPlan?: string | null): { slug: string; name: string } | null => {
  const plan = (currentPlan || '').trim();
  if (plan === 'Emprendedor') return { slug: 'negocio', name: 'Negocio Pequeño' };
  if (plan === 'Negocio Pequeño') return { slug: 'empresa', name: 'Empresa' };
  return null;
};

export function ProductsTab({ company, categories }: ProductsTabProps) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState('');
  const [importError, setImportError] = useState('');
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitMessage, setLimitMessage] = useState('');
  const limit = 20;

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', company?.id, page],
    queryFn: async () => {
      if (!company?.id) return { data: [], total: 0, totalPages: 0 };
      const res = await apiClient.get(`/api/products?companyId=${company.id}&page=${page}&limit=${limit}`);
      return res;
    },
    enabled: !!company?.id,
  });

  const products = productsData?.data || [];
  const totalPages = productsData?.totalPages || 1;

  const addMutation = useMutation({
    mutationFn: async (newProduct: Partial<Product>) => {
      if (newProduct.id) {
        const res = await apiClient.put(`/api/products/${newProduct.id}`, newProduct);
        return res;
      } else {
        const res = await apiClient.post("/api/products", {
            companyId: company?.id,
            ...newProduct
          });
        return res;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', company?.id] });
      setIsAdding(false);
      setNewProd({});
    },
    onError: (error: any) => {
      const message = String(error?.message || '');
      if (message.includes('LIMITE_PLAN_ALCANZADO')) {
        const match = message.match(/LIMITE_PLAN_ALCANZADO:\s*(.+)/);
        setLimitMessage(match ? match[1] : 'Alcanzaste el límite de productos de tu plan actual.');
        setShowLimitModal(true);
      } else {
        alert(message || 'No se pudo guardar el producto.');
      }
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', company?.id] });
    }
  });

  const [isAdding, setIsAdding] = useState(false);
  const [newProd, setNewProd] = useState<Partial<Product>>({});

  const defaultTaxRate = Number(company?.taxRate ?? 18);
  const resolvedTaxRate = Number(newProd.taxRate ?? defaultTaxRate);
  const purchaseCost = Number(newProd.purchaseCost ?? 0);
  const marginPercent = Number(newProd.marginPercent ?? 0);

  const financial = useMemo(() => calculatePricing({
    purchaseCost,
    marginPercent,
    taxRate: resolvedTaxRate,
  }), [marginPercent, purchaseCost, resolvedTaxRate]);

  const normalize = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, '_')
      .trim();

  const getField = (row: Record<string, any>, keys: string[]) => {
    for (const key of Object.keys(row)) {
      const normalizedKey = normalize(key);
      if (keys.includes(normalizedKey)) return row[key];
    }
    return undefined;
  };

  const toNumber = (value: any): number | undefined => {
    if (value === null || value === undefined || value === '') return undefined;
    if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
    const normalized = String(value).replace(/[^0-9,.-]/g, '').replace(',', '.');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : undefined;
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
        // read-excel-file devuelve filas como arrays (no objetos con
        // headers como nombre de propiedad, a diferencia de la librería
        // xlsx anterior). Reconstruimos esa misma forma de objeto por
        // fila, usando la primera fila como encabezados, para que
        // getField() siga funcionando exactamente igual que antes sin
        // tocar el resto de la lógica de importación.
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
        // .xls (formato binario antiguo, anterior a Excel 2007) ya no
        // tiene una librería de lectura mantenida y libre de
        // vulnerabilidades conocidas para uso en navegador. Se pide
        // reexportar en un formato moderno en vez de fallar en silencio.
        throw new Error('El formato .xls (Excel 97-2003) ya no es compatible. Vuelve a guardar el archivo como .xlsx o .csv desde Excel/Google Sheets e inténtalo de nuevo.');
      }

      if (!rows.length) {
        throw new Error('El archivo no contiene filas con datos.');
      }

      const parsedProducts: Partial<Product>[] = [];
      let skipped = 0;

      for (const row of rows) {
        const name = String(getField(row, ['nombre', 'name', 'producto']) || '').trim();
        const price = toNumber(getField(row, ['precio', 'price']));

        if (!name || price === undefined) {
          skipped += 1;
          continue;
        }

        const salePrice = toNumber(getField(row, ['precio_oferta', 'sale_price', 'saleprice']));
        const stock = toNumber(getField(row, ['stock', 'cantidad', 'inventario']));
        const purchaseCostValue = toNumber(getField(row, ['precio_compra', 'costo', 'purchase_cost', 'cost']));
        const marginValue = toNumber(getField(row, ['rentabilidad', 'margen', 'margin_percent', 'ganancia_pct']));
        const taxRateValue = toNumber(getField(row, ['impuesto', 'tax_rate', 'igv']));
        const itemTypeRaw = String(getField(row, ['tipo', 'item_type', 'tipo_item']) || 'Producto').trim().toLowerCase();
        const itemType = itemTypeRaw.includes('serv') ? 'Servicio' : 'Producto';

        parsedProducts.push({
            itemType,
          name,
          category: String(getField(row, ['categoria', 'category']) || 'General').trim(),
          price,
          salePrice,
            stock: itemType === 'Servicio' ? null : stock,
          sku: String(getField(row, ['sku', 'codigo', 'codigo_interno']) || '').trim(),
          barcode: String(getField(row, ['barcode', 'codigo_barras']) || '').trim(),
          desc: String(getField(row, ['descripcion', 'description']) || '').trim(),
          image: String(getField(row, ['imagen', 'image']) || '').trim(),
            purchaseCost: purchaseCostValue,
            marginPercent: marginValue,
            taxRate: taxRateValue ?? defaultTaxRate,
        });
      }

      if (!parsedProducts.length) {
        throw new Error('No se encontraron productos válidos. Asegúrate de incluir columnas de nombre y precio.');
      }

      const results = await Promise.allSettled(
        parsedProducts.map((product) =>
          apiClient.post('/api/products', { companyId: company.id, ...product }),
        ),
      );

      const successCount = results.filter((result) => result.status === 'fulfilled').length;
      const failCount = results.length - successCount;
      const limitHit = results.some(
        (result) => result.status === 'rejected' && String((result as any).reason?.message || '').includes('LIMITE_PLAN_ALCANZADO')
      );

      queryClient.invalidateQueries({ queryKey: ['products', company?.id] });

      if (limitHit) {
        setLimitMessage('Algunos productos no se importaron porque alcanzaste el límite de tu plan actual.');
        setShowLimitModal(true);
      }

      setImportMessage(
        `Importación completada: ${successCount} producto(s) creados${skipped ? `, ${skipped} fila(s) omitidas` : ''}${failCount ? `, ${failCount} fallidas` : ''}.`,
      );
    } catch (err: any) {
      setImportError(err.message || 'No se pudo procesar el archivo.');
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const itemType = newProd.itemType || 'Producto';
    addMutation.mutate({
      ...newProd,
      itemType,
      taxRate: newProd.taxRate ?? defaultTaxRate,
      stock: itemType === 'Servicio' ? null : newProd.stock,
    });
  };

  const handleEdit = (product: Product) => {
    setNewProd({
      ...product,
      itemType: product.itemType || 'Producto',
      taxRate: product.taxRate ?? defaultTaxRate,
    });
    setIsAdding(true);
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    await apiClient.delete(`/api/products/${id}`);
    queryClient.invalidateQueries({ queryKey: ['products'] }); //products.filter(p => p.id !== id));
  };

  const isServiceBusiness = company?.businessType === 'Estudio de Abogados' || company?.businessType === 'Servicios Profesionales' || company?.businessType === 'Agencia de Publicidad' || company?.businessType === 'Imprenta';
  const termProductsTitle = isServiceBusiness ? 'Servicios' : 'Productos';

  const nextPlan = getNextPlan(company?.plan);

  return (
          <>
            {showLimitModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={() => setShowLimitModal(false)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white rounded-3xl shadow-xl max-w-md w-full p-8 text-center"
                >
                  <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Lock className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-3">
                    Alcanzaste el límite de tu plan
                  </h2>
                  <p className="text-slate-500 mb-8">
                    {limitMessage || 'Alcanzaste el límite de productos de tu plan actual.'}
                  </p>
                  {nextPlan ? (
                    <Link
                      to={`/checkout/${nextPlan.slug}`}
                      className="w-full inline-flex justify-center items-center gap-2 py-3.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all mb-3"
                    >
                      Mejorar a plan {nextPlan.name} <ArrowRight className="w-5 h-5" />
                    </Link>
                  ) : (
                    <p className="text-slate-500 text-sm mb-3">
                      Ya tienes el plan más alto disponible. Contáctanos si necesitas más capacidad.
                    </p>
                  )}
                  <button
                    onClick={() => setShowLimitModal(false)}
                    className="w-full py-3 text-slate-500 font-semibold hover:text-slate-700 transition-colors"
                  >
                    Cerrar
                  </button>
                </motion.div>
              </motion.div>
            )}

            <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-10">
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{termProductsTitle}</h1>
                <p className="text-slate-500 mt-1">Gestiona tu catálogo en línea</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link to={`/c/${company?.slug}`} target="_blank" className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50 shadow-sm transition-colors">
                  <ExternalLink className="w-5 h-5" />
                  Ver Catálogo
                </Link>
                <label className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50 shadow-sm transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleBulkImport}
                    className="hidden"
                    disabled={isImporting}
                  />
                  {isImporting ? 'Importando...' : 'Importar CSV/Excel'}
                </label>
                <button 
                  onClick={() => { setNewProd({ itemType: 'Producto', taxRate: defaultTaxRate }); setIsAdding(true); }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-sm transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Nuevo Producto
                </button>
              </div>
            </header>

            {(importMessage || importError) && (
              <div className={`mb-6 p-4 rounded-xl border ${importError ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                {importError || importMessage}
              </div>
            )}

            {isAdding && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm mb-8"
              >
                <h2 className="text-xl font-bold mb-6 text-slate-800">{newProd.id ? 'Editar Producto' : 'Agregar Producto'}</h2>
                <form onSubmit={handleAddProduct} className="grid grid-cols-2 gap-5">
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-bold text-slate-700 mb-1">Tipo de Ítem</label>
                    <select
                      value={newProd.itemType || 'Producto'}
                      onChange={(e) => {
                        const nextType = e.target.value as 'Producto' | 'Servicio';
                        setNewProd({
                          ...newProd,
                          itemType: nextType,
                          stock: nextType === 'Servicio' ? null : newProd.stock,
                          minStock: nextType === 'Servicio' ? undefined : newProd.minStock,
                        });
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                    >
                      <option value="Producto">Producto</option>
                      <option value="Servicio">Servicio</option>
                    </select>
                  </div>

                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-bold text-slate-700 mb-1">Nombre</label>
                    <input 
                      required
                      type="text" 
                      value={newProd.name || ''}
                      onChange={e => setNewProd({...newProd, name: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all" 
                      placeholder="Ej. Taza personalizada" 
                    />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-bold text-slate-700 mb-1">Categoría</label>
                    <input 
                      required
                      type="text" 
                      value={newProd.category || ''}
                      onChange={e => setNewProd({...newProd, category: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all" 
                      placeholder="Ej. Tazas" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Precio de Compra ({company?.currency || 'S/'})</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newProd.purchaseCost ?? ''}
                      onChange={e => setNewProd({ ...newProd, purchaseCost: e.target.value === '' ? undefined : Number(e.target.value) })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Rentabilidad (%)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newProd.marginPercent ?? ''}
                      onChange={e => setNewProd({ ...newProd, marginPercent: e.target.value === '' ? undefined : Number(e.target.value) })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                      placeholder="30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Impuesto (%)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newProd.taxRate ?? defaultTaxRate}
                      onChange={e => setNewProd({ ...newProd, taxRate: e.target.value === '' ? defaultTaxRate : Number(e.target.value) })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                      placeholder="18"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Precio ({company?.currency || 'S/'})</label>
                    <input 
                      required
                      type="number" 
                      value={newProd.price || ''}
                      onChange={e => setNewProd({...newProd, price: Number(e.target.value)})}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all" 
                      placeholder="0.00" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Precio Oferta ({company?.currency || 'S/'}) - Opcional</label>
                    <input 
                      type="number" 
                      value={newProd.salePrice || ''}
                      onChange={e => setNewProd({...newProd, salePrice: Number(e.target.value)})}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all" 
                      placeholder="0.00" 
                    />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-bold text-slate-700 mb-1">Stock (Unidades)</label>
                    <input 
                      type="number" 
                      value={newProd.stock ?? ''}
                      onChange={e => setNewProd({...newProd, stock: e.target.value === '' ? null : Number(e.target.value)})}
                      disabled={newProd.itemType === 'Servicio'}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all" 
                      placeholder={newProd.itemType === 'Servicio' ? 'No aplica para servicios' : 'Ilimitado si se deja en blanco'} 
                    />
                  </div>

                  <div className="col-span-2 grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase">Ganancia Neta</p>
                      <p className="text-lg font-bold text-emerald-700">{company?.currency || 'S/'} {financial.profitAmount.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase">Precio Venta Neto</p>
                      <p className="text-lg font-bold text-slate-900">{company?.currency || 'S/'} {financial.netSalePrice.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase">Precio Final (+IGV)</p>
                      <p className="text-lg font-bold text-indigo-700">{company?.currency || 'S/'} {financial.finalPrice.toFixed(2)}</p>
                      <p className="text-xs text-slate-500">Incluye impuesto {financial.taxRate.toFixed(2)}%</p>
                    </div>
                  </div>

                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-bold text-slate-700 mb-1">SKU</label>
                    <input 
                      type="text" 
                      value={newProd.sku || ''}
                      onChange={e => setNewProd({...newProd, sku: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all" 
                      placeholder="Código interno" 
                    />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-bold text-slate-700 mb-1">Código de Barras</label>
                    <input 
                      type="text" 
                      value={newProd.barcode || ''}
                      onChange={e => setNewProd({...newProd, barcode: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all" 
                      placeholder="Código de barras" 
                    />
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-bold text-slate-700">Variantes (Ej: Tallas, Colores)</label>
                      <button 
                        type="button"
                        onClick={() => setNewProd({...newProd, variants: [...(newProd.variants || []), { name: '', options: [] }]})}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        + Añadir Variante
                      </button>
                    </div>
                    {newProd.variants?.map((variant, i) => (
                      <div key={i} className="mb-3 p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-3">
                        <div className="flex gap-3 items-center">
                          <input 
                            type="text"
                            placeholder="Nombre de Variante (Ej: Talla)"
                            value={variant.name}
                            onChange={(e) => {
                              const newVars = [...(newProd.variants || [])];
                              newVars[i].name = e.target.value;
                              setNewProd({...newProd, variants: newVars});
                            }}
                            className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none"
                          />
                          <button 
                            type="button"
                            onClick={() => {
                              const newVars = [...(newProd.variants || [])];
                              newVars.splice(i, 1);
                              setNewProd({...newProd, variants: newVars});
                            }}
                            className="text-red-500 hover:text-red-700 p-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <input 
                          type="text"
                          placeholder="Opciones separadas por coma (Ej: S, M, L, XL)"
                          value={variant.options.join(', ')}
                          onChange={(e) => {
                            const newVars = [...(newProd.variants || [])];
                            newVars[i].options = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                            setNewProd({...newProd, variants: newVars});
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="col-span-2">
                    <ImageUpload 
                      label="Imagen del producto"
                      value={newProd.image || ''}
                      onChange={base64 => setNewProd({...newProd, image: base64})}
                      aspectRatio="square"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1">Descripción</label>
                    <textarea 
                      value={newProd.desc || ''}
                      onChange={e => setNewProd({...newProd, desc: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all" 
                      rows={3} 
                    />
                  </div>
                  <div className="col-span-2 flex gap-3 pt-2">
                    <button type="submit" className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-sm">Guardar Producto</button>
                    <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors">Cancelar</button>
                  </div>
                </form>
              </motion.div>
            )}

            
            {isLoading ? (
              <div className="col-span-full py-20 text-center text-slate-500">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                Cargando productos...
              </div>
            ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

              {products.map(p => (
                <div key={p.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
                  <div className="h-48 bg-slate-100 relative">
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">📦</div>
                    )}
                    {p.salePrice && (
                      <div className="absolute top-3 right-3 bg-red-500 text-white text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md">OFERTA</div>
                    )}
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-1">{p.category}</div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{p.itemType || 'Producto'}</div>
                    <h3 className="font-bold text-lg text-slate-800 mb-2 line-clamp-1">{p.name}</h3>
                    <div className="flex items-end gap-2 mb-4 flex-1">
                      {p.salePrice ? (
                        <>
                          <span className="text-2xl font-bold text-slate-900">{company?.currency || 'S/'} {p.salePrice}</span>
                          <span className="text-sm text-slate-400 line-through mb-1">{company?.currency || 'S/'} {p.price}</span>
                        </>
                      ) : (
                        <span className="text-2xl font-bold text-slate-900">{company?.currency || 'S/'} {p.price}</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(p)} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors flex justify-center items-center gap-2 text-sm">
                        <Edit2 className="w-4 h-4" /> Editar
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="w-10 flex items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {products.length === 0 && !isAdding && (
                <div className="col-span-full py-20 text-center text-slate-500 border-2 border-dashed border-slate-200 rounded-2xl bg-white">
                  No tienes productos en tu catálogo aún.<br/>
                  Agrega el primero para empezar a vender.
                </div>
              )}
            </div>
            )}
            
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8 col-span-full">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-4 py-2 border border-slate-200 rounded-lg disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className="text-slate-600 font-medium">Página {page} de {totalPages}</span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-4 py-2 border border-slate-200 rounded-lg disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            )}

            </>


  );
}
