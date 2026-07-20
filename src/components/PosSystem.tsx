import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDebounce } from 'use-debounce';

import { Company, Product, Customer, OrderItem } from '../types';
import { Search, ShoppingCart, UserPlus, CreditCard, Trash2, Plus, Minus, Tag, Calculator, Package } from 'lucide-react';
import { motion } from 'motion/react';
import { apiClient } from "../services/api";

interface PosSystemProps {
  companyId: string;
  company: Company;
}

export function PosSystem({ companyId, company }: PosSystemProps) {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch] = useDebounce(searchQuery, 500);
  
  const { data: productsData } = useQuery({
    queryKey: ['products', companyId, debouncedSearch, selectedCategory],
    queryFn: async () => {
      let url = `/api/products?companyId=${companyId}&limit=50`;
      if (debouncedSearch) url += `&search=${encodeURIComponent(debouncedSearch)}`;
      return await apiClient.get(url);
    },
    enabled: !!companyId
  });
  const products = productsData?.data || [];

  const [customerSearch, setCustomerSearch] = useState('');
  const [debouncedCustomerSearch] = useDebounce(customerSearch, 500);

  const { data: customersData } = useQuery({
    queryKey: ['customers', companyId, debouncedCustomerSearch],
    queryFn: async () => {
      let url = `/api/customers?companyId=${companyId}&limit=10`;
      if (debouncedCustomerSearch) url += `&search=${encodeURIComponent(debouncedCustomerSearch)}`;
      return await apiClient.get(url);
    },
    enabled: !!companyId
  });
  const customers = customersData?.data || [];

  const addCustomerMutation = useMutation({
    mutationFn: async (customer: Partial<Customer>) => {
      const res = await apiClient.post("/api/customers", { ...customer, companyId });
      return res;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setSelectedCustomer(data);
      setIsCustomerModalOpen(false);
      setNewCustomer({});
    }
  });

  const createOrderMutation = useMutation({
    mutationFn: async (order: any) => {
      const res = await apiClient.post("/api/orders", order);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] }); // stock updates
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    }
  });

  
  
  const [cart, setCart] = useState<(OrderItem & { stock?: number | null })[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(0); // 0 or 0.18
  
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [sellerName, setSellerName] = useState<string>('Vendedor 1');

  // Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'tarjeta' | 'transferencia' | 'yape' | 'plin' | 'mixto' | 'credito' | 'vale'>('efectivo');
  const [amountPaid, setAmountPaid] = useState<number | string>('');

  // Customer Modal
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({});

  
  const filteredProducts = products.filter((p: any) => selectedCategory ? p.category === selectedCategory : true);


  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category).filter(Boolean));
    return Array.from(cats);
  }, [products]);

  const addToCart = (product: Product) => {
    if (product.stock !== null && product.stock !== undefined && product.stock <= 0) {
      alert('¡Producto agotado!');
      return;
    }
    
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        if (product.stock && existing.qty >= product.stock) {
          alert('No hay suficiente stock');
          return prev;
        }
        return prev.map(item => item.productId === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        qty: 1,
        price: product.salePrice || product.price,
        stock: product.stock
      }];
    });
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQty = item.qty + delta;
        if (newQty <= 0) return item; // Handled by remove
        if (item.stock && newQty > item.stock) {
          alert('No hay suficiente stock');
          return item;
        }
        return { ...item, qty: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const totalDiscount = discount;
  const taxableAmount = subtotal - totalDiscount;
  const taxAmount = taxableAmount * taxRate;
  const total = taxableAmount + taxAmount;
  
  const vuelto = paymentMethod === 'efectivo' && Number(amountPaid) > total ? Number(amountPaid) - total : 0;

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    const newOrder = {
      id: Date.now().toString(),
      companyId: company.id,
      customerName: selectedCustomer ? selectedCustomer.name : 'Cliente Genérico',
      customerPhone: selectedCustomer?.phone || '',
      deliveryMethod: 'pickup',
      items: cart,
      subtotal,
      discount: totalDiscount,
      tax: taxAmount,
      total,
      status: paymentMethod === 'credito' ? 'Pendiente' : 'Pagado',
      type: 'pos',
      paymentMethod,
      amountPaid: Number(amountPaid),
      sellerName,
      createdAt: new Date().toISOString()
    };

    try {
      const res = await apiClient.post('/api/orders', newOrder);
      const savedOrder = await res;
      queryClient.invalidateQueries({ queryKey: ['orders'] });

      // Update local product stock
      const updatedProducts = products.map(p => {
        const cartItem = cart.find(c => c.productId === p.id);
        if (cartItem && p.stock !== null && p.stock !== undefined) {
          return { ...p, stock: p.stock - cartItem.qty };
        }
        return p;
      });
      queryClient.invalidateQueries({ queryKey: ['products'] });

      // Clean up cart
      setCart([]);
      setDiscount(0);
      setAmountPaid('');
      setIsPaymentModalOpen(false);
      
      alert('¡Venta registrada con éxito!');
    } catch (err) {
      console.error(err);
      alert('Error al registrar venta');
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name?.trim()) {
      alert('El nombre completo es obligatorio.');
      return;
    }
    try {
      const saved = await apiClient.post("/api/customers", {
        ...newCustomer,
        companyId: company.id,
        createdAt: new Date().toISOString()
      });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setSelectedCustomer(saved);
      setIsCustomerModalOpen(false);
      setNewCustomer({});
    } catch (err: any) {
      alert(err.message || 'No se pudo guardar el cliente. Verifica los datos e inténtalo de nuevo.');
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full gap-6 max-w-[1600px] mx-auto">
      {/* Product Catalog Area */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-[calc(100vh-80px)] md:h-[calc(100vh-40px)]">
        <header className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar por nombre, SKU o código de barras..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <select 
              value={selectedCategory} 
              onChange={e => setSelectedCategory(e.target.value)}
              className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Todas las categorías</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts.map(product => {
              const outOfStock = product.stock !== null && product.stock !== undefined && product.stock <= 0;
              const lowStock = product.stock !== null && product.stock !== undefined && product.stock > 0 && product.stock <= 5;
              
              return (
                <div 
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className={`bg-white border rounded-2xl overflow-hidden cursor-pointer transition-all hover:shadow-md ${outOfStock ? 'opacity-50 border-red-200' : lowStock ? 'border-amber-200' : 'border-slate-200 hover:border-indigo-300'}`}
                >
                  <div className="aspect-square bg-slate-100 relative">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300"><Tag className="w-10 h-10" /></div>
                    )}
                    {product.salePrice && product.salePrice < product.price && (
                      <div className="absolute top-2 right-2 bg-rose-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg">OFERTA</div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="text-sm font-bold text-slate-900 line-clamp-2 leading-tight mb-1">{product.name}</div>
                    <div className="flex items-end justify-between">
                      <div>
                        {product.salePrice ? (
                          <div className="font-extrabold text-indigo-600">{company.currency || 'S/'} {product.salePrice.toFixed(2)}</div>
                        ) : (
                          <div className="font-extrabold text-indigo-600">{company.currency || 'S/'} {product.price.toFixed(2)}</div>
                        )}
                      </div>
                      {product.stock !== null && product.stock !== undefined && (
                        <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${outOfStock ? 'bg-red-100 text-red-700' : lowStock ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                          Stock: {product.stock}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredProducts.length === 0 && (
              <div className="col-span-full py-20 text-center text-slate-400">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No se encontraron productos</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cart Area */}
      <div className="w-full md:w-[400px] flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 h-[calc(100vh-80px)] md:h-[calc(100vh-40px)]">
        <header className="p-4 border-b border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-indigo-600" /> 
              Carrito
            </h2>
            <select 
              value={sellerName}
              onChange={e => setSellerName(e.target.value)}
              className="text-xs bg-slate-100 border-none rounded-lg py-1 px-2 font-medium text-slate-700 outline-none"
            >
              <option>Vendedor 1</option>
              <option>Vendedor 2</option>
              <option>Caja Principal</option>
            </select>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <select 
                value={selectedCustomer?.id || ''}
                onChange={e => {
                  const c = customers.find(x => x.id === e.target.value);
                  setSelectedCustomer(c || null);
                }}
                className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none appearance-none"
              >
                <option value="">Consumidor Final</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>)}
              </select>
            </div>
            <button 
              onClick={() => setIsCustomerModalOpen(true)}
              className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors"
              title="Nuevo Cliente"
            >
              <UserPlus className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <ShoppingCart className="w-16 h-16 mb-4 opacity-20" />
              <p>El carrito está vacío</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {cart.map((item) => (
                <div key={item.productId} className="flex flex-col gap-2 pb-3 border-b border-slate-100">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-sm text-slate-800 line-clamp-1">{item.name}</span>
                    <button onClick={() => removeFromCart(item.productId)} className="text-red-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3 bg-slate-100 rounded-lg p-1">
                      <button onClick={() => updateCartQty(item.productId, -1)} className="p-1 hover:bg-white rounded shadow-sm text-slate-600"><Minus className="w-3 h-3" /></button>
                      <span className="text-sm font-bold w-6 text-center">{item.qty}</span>
                      <button onClick={() => updateCartQty(item.productId, 1)} className="p-1 hover:bg-white rounded shadow-sm text-slate-600"><Plus className="w-3 h-3" /></button>
                    </div>
                    <div className="font-extrabold text-slate-900">
                      {company.currency || 'S/'} {(item.price * item.qty).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200">
          <div className="flex flex-col gap-2 mb-4 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span>{company.currency || 'S/'} {subtotal.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center text-slate-500">
              <span>Descuento</span>
              <input 
                type="number" 
                value={discount || ''} 
                onChange={e => setDiscount(Number(e.target.value))}
                placeholder="0.00"
                className="w-20 text-right px-2 py-1 bg-white border border-slate-200 rounded outline-none"
              />
            </div>
            
            <div className="flex justify-between items-center text-slate-500">
              <div className="flex items-center gap-2">
                <span>Impuestos (IGV/IVA)</span>
                <select value={taxRate} onChange={e => setTaxRate(Number(e.target.value))} className="bg-transparent border-none text-xs outline-none cursor-pointer">
                  <option value={0}>0%</option>
                  <option value={0.18}>18%</option>
                  <option value={0.16}>16%</option>
                  <option value={0.21}>21%</option>
                </select>
              </div>
              <span>{company.currency || 'S/'} {taxAmount.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center text-xl font-extrabold text-slate-900 mt-2 pt-2 border-t border-slate-200">
              <span>Total</span>
              <span>{company.currency || 'S/'} {total.toFixed(2)}</span>
            </div>
          </div>

          <button 
            disabled={cart.length === 0}
            onClick={() => setIsPaymentModalOpen(true)}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl font-bold text-lg shadow-sm transition-colors"
          >
            Cobrar
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <motion.div initial={{opacity: 0, scale: 0.95}} animate={{opacity: 1, scale: 1}} className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-extrabold text-slate-900">Método de Pago</h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">Monto a cobrar</div>
                <div className="text-5xl font-extrabold text-indigo-600">{company.currency || 'S/'} {total.toFixed(2)}</div>
              </div>
              
              <div className="grid grid-cols-3 gap-3 mb-6">
                {['efectivo', 'tarjeta', 'transferencia', 'yape', 'plin', 'mixto'].map(m => (
                  <button 
                    key={m}
                    onClick={() => setPaymentMethod(m as any)}
                    className={`py-3 rounded-xl border-2 font-bold text-sm capitalize transition-all ${paymentMethod === m ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {paymentMethod === 'efectivo' && (
                <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Monto Recibido</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-500">{company.currency || 'S/'}</span>
                    <input 
                      type="number"
                      value={amountPaid}
                      onChange={e => setAmountPaid(e.target.value)}
                      placeholder={total.toFixed(2)}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  {vuelto > 0 && (
                    <div className="mt-3 flex justify-between items-center text-emerald-600 font-bold">
                      <span>Vuelto a entregar:</span>
                      <span className="text-xl">{company.currency || 'S/'} {vuelto.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}

              <button 
                onClick={handleCheckout}
                className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-lg shadow-md transition-all flex justify-center items-center gap-2"
              >
                Confirmar Venta
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Customer Modal */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <motion.div initial={{opacity: 0, scale: 0.95}} animate={{opacity: 1, scale: 1}} className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-extrabold text-slate-900">Nuevo Cliente</h3>
              <button onClick={() => setIsCustomerModalOpen(false)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>
            <form onSubmit={handleAddCustomer} className="p-6">
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nombre Completo</label>
                  <input type="text" required value={newCustomer.name || ''} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Teléfono</label>
                  <input type="tel" value={newCustomer.phone || ''} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none" />
                </div>
              </div>
              <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-sm">Guardar Cliente</button>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}
