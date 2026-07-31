import React, { useEffect, useState, useMemo } from "react";
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';

import { useParams, Link } from "react-router-dom";
import { motion } from "motion/react";
import { Search, ShoppingCart, Info, Share2, Plus, Minus, Trash2, Instagram, Facebook, MapPin, Clock, Phone, Mail } from "lucide-react";
import { Company, Product } from "../types";
import { apiClient } from "../services/api";
import { resolveCatalogTaxRate, taxLabel } from "../utils/pricingCalculator";
import { ImageUpload } from "../components/ImageUpload";

export default function Catalog() {
  const { slug } = useParams();
  
  const { ref: loadMoreRef, inView } = useInView();
  
  const { data: catalogData, isLoading: loadingCompany } = useQuery({
    queryKey: ['catalog', slug],
    queryFn: async () => {
      const res = await apiClient.get(`/api/catalog/${slug}`);
      
      return res;
    }
  });
  
  const company = catalogData?.company || null;
  
  const {
    data: productsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: loadingProducts
  } = useInfiniteQuery({
    queryKey: ['catalogProducts', company?.id],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => {
      const res = await apiClient.get(`/api/products?companyId=${company?.id}&page=${pageParam}&limit=20`);
      return res;
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage && lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    enabled: !!company?.id,
  });

  const products = useMemo(() => {
    if (!productsData) return [];
    return productsData.pages.flatMap((page: any) => page.data);
  }, [productsData]);

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  const loading = loadingCompany || (loadingProducts && products.length === 0);

  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("Todos");

  // Cart
  const [cart, setCart] = useState<{product: Product, qty: number, variants?: Record<string, string>}[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  // Modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

  // Cotización corporativa por mayor (formulario dentro del modal de producto)
  const [bulkQuoteForm, setBulkQuoteForm] = useState({ quantity: '', contactName: '', companyName: '', ruc: '', message: '' });

  // Delivery & Coupons
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>('delivery');
  const [deliveryData, setDeliveryData] = useState({ address: '', reference: '', recipient: '', phone: '' });
  const [cartPaymentMethod, setCartPaymentMethod] = useState<'Efectivo' | 'Yape' | 'Plin'>('Efectivo');
  const [cartPaymentProof, setCartPaymentProof] = useState('');
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState("");
  const [paymentQrModal, setPaymentQrModal] = useState<'yape' | 'plin' | null>(null);

  const isServiceBusiness = company?.businessType === 'Estudio de Abogados' || company?.businessType === 'Servicios Profesionales' || company?.businessType === 'Agencia de Publicidad' || company?.businessType === 'Imprenta';
  const termProduct = isServiceBusiness ? 'Servicios' : 'Productos';
  const termOrderBtn = isServiceBusiness ? 'Solicitar' : 'Comprar';
  const termAddToCart = isServiceBusiness ? 'Añadir Solicitud' : 'Agregar';
  const termCartTitle = isServiceBusiness ? 'Mi Solicitud' : 'Mi Pedido';
  const termEmptyCart = isServiceBusiness ? 'Tu solicitud está vacía' : 'El carrito está vacío';

  const resolveTaxRate = (product?: Product) => resolveCatalogTaxRate({
    productTaxRate: product?.taxRate,
    companyTaxRate: company?.taxRate,
    companyCurrency: company?.currency,
  });

  const taxText = (rate: number) => taxLabel({
    taxRate: rate,
    companyCountryCode: company?.countryCode,
    companyCurrency: company?.currency,
  });


  useEffect(() => {
    if (company) {
      // SEO Metadata
      if (company.metaTitle) {
        document.title = company.metaTitle;
      } else {
        document.title = `${company.name} | Catálogo Virtual`;
      }

      const existingMetaDesc = document.querySelector('meta[name="description"]');
      if (existingMetaDesc) {
        existingMetaDesc.setAttribute('content', company.metaDescription || `Explora el catálogo de ${company.name}`);
      } else {
        const meta = document.createElement('meta');
        meta.name = 'description';
        meta.content = company.metaDescription || `Explora el catálogo de ${company.name}`;
        document.head.appendChild(meta);
      }

      // Google Analytics
      if (company.googleAnalyticsId && !document.getElementById('ga-script')) {
        const script1 = document.createElement('script');
        script1.id = 'ga-script';
        script1.async = true;
        script1.src = `https://www.googletagmanager.com/gtag/js?id=${company.googleAnalyticsId}`;
        document.head.appendChild(script1);

        const script2 = document.createElement('script');
        script2.id = 'ga-inline';
        script2.innerHTML = `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${company.googleAnalyticsId}');
        `;
        document.head.appendChild(script2);
      }

      // Meta Pixel
      if (company.metaPixelId && !document.getElementById('meta-pixel')) {
        const script = document.createElement('script');
        script.id = 'meta-pixel';
        script.innerHTML = `
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${company.metaPixelId}');
          fbq('track', 'PageView');
        `;
        document.head.appendChild(script);
      }
    }
  }, [company]);


  const storeOpenStatus = React.useMemo(() => {
    if (!company || company.storeHoursType === '24h') return { isOpen: true };
    if (!company.storeSchedule) return { isOpen: true };

    const now = new Date();
    const day = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const todaySchedule = company.storeSchedule[day];

    if (!todaySchedule || !todaySchedule.isOpen) {
      return { isOpen: false, message: 'Cerrado el día de hoy' };
    }

    if (!todaySchedule.openTime || !todaySchedule.closeTime) {
      return { isOpen: true };
    }

    const [openH, openM] = todaySchedule.openTime.split(':').map(Number);
    const [closeH, closeM] = todaySchedule.closeTime.split(':').map(Number);

    const currentTime = now.getHours() * 60 + now.getMinutes();
    const openTime = openH * 60 + openM;
    const closeTime = closeH * 60 + closeM;

    if (currentTime < openTime || currentTime > closeTime) {
      return { isOpen: false, message: `Horario: ${todaySchedule.openTime} - ${todaySchedule.closeTime}` };
    }

    return { isOpen: true };
  }, [company]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">Cargando catálogo...</div>;
  if (!company) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">Catálogo no encontrado</div>;

  const categories = ["Todos", ...Array.from(new Set(products.map(p => p.category)))];
  
  const filteredProducts = products.filter(p => 
    (activeCat === "Todos" || p.category === activeCat) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product: Product, addQty = 1, variants?: Record<string, string>) => {
    // Basic validation to ensure all variants are selected if required
    if (product.variants && product.variants.length > 0 && variants) {
      if (Object.keys(variants).length < product.variants.length) {
        alert("Por favor selecciona todas las opciones (Talla, Color, etc.)");
        return;
      }
    }

    setCart(prev => {
      // Find if we already have this product with EXACTLY the same variants
      const existingIdx = prev.findIndex(i => {
        if (i.product.id !== product.id) return false;
        // Compare variants
        const v1 = i.variants || {};
        const v2 = variants || {};
        const keys1 = Object.keys(v1);
        const keys2 = Object.keys(v2);
        if (keys1.length !== keys2.length) return false;
        return keys1.every(k => v1[k] === v2[k]);
      });

      if (existingIdx !== -1) {
        const newCart = [...prev];
        newCart[existingIdx].qty += addQty;
        return newCart;
      }
      return [...prev, { product, qty: addQty, variants }];
    });
    
    alert("Producto agregado al carrito");
    setSelectedProduct(null);
  };

  const updateQty = (idx: number, delta: number) => {
    setCart(prev => {
      const newCart = [...prev];
      newCart[idx].qty = Math.max(1, newCart[idx].qty + delta);
      return newCart;
    });
  };

  const removeCartItem = (idx: number) => {
    setCart(prev => prev.filter((_, i) => i !== idx));
  };

  const TAX_RATE = 0.18; // IGV Perú

  const subtotal = cart.reduce((acc, item) => acc + (item.product.salePrice || item.product.price) * item.qty, 0);
  let discount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'percentage') {
      discount = subtotal * (appliedCoupon.discountValue / 100);
    } else {
      discount = appliedCoupon.discountValue;
    }
  }
  const netAfterDiscount = Math.max(0, subtotal - discount);
  const taxAmount = netAfterDiscount * TAX_RATE;
  const cartTotal = netAfterDiscount + taxAmount;

  const applyCoupon = () => {
    setCouponError("");
    const coupon = company?.coupons?.find(c => c.code === couponCode.toUpperCase() && c.active);
    if (coupon) {
      setAppliedCoupon(coupon);
    } else {
      setCouponError("Cupón no válido o expirado");
      setAppliedCoupon(null);
    }
  };

  const sendToWhatsApp = async () => {
    if (!deliveryData.recipient || !deliveryData.phone) {
      alert("Por favor completa tu nombre y número de WhatsApp.");
      return;
    }
    if (deliveryMethod === 'delivery') {
      if (!deliveryData.address) {
        alert("Por favor completa la dirección de entrega.");
        return;
      }
    }

    const headerTxt = isServiceBusiness ? 'NUEVA SOLICITUD' : 'NUEVO PEDIDO';
    let msg = `*${headerTxt} - ${company.name}*\n\n`;
    cart.forEach(item => {
      const price = item.product.salePrice || item.product.price;
      const variantStr = item.variants && Object.keys(item.variants).length > 0 
        ? ` (${Object.values(item.variants).join(', ')})` 
        : '';
      msg += `• ${item.qty}x ${item.product.name}${variantStr} — ${company.currency || 'S/'} ${(price * item.qty).toFixed(2)}\n`;
    });
    msg += `\n*Subtotal: ${company.currency || 'S/'} ${subtotal.toFixed(2)}*\n`;
    if (appliedCoupon) {
      msg += `*Descuento (${appliedCoupon.code}): -${company.currency || 'S/'} ${discount.toFixed(2)}*\n`;
    }
    msg += `*IGV (18%): ${company.currency || 'S/'} ${taxAmount.toFixed(2)}*\n`;
    msg += `*TOTAL (${termProduct}): ${company.currency || 'S/'} ${cartTotal.toFixed(2)}*\n\n`;
    
    msg += `*Cliente:* ${deliveryData.recipient} (${deliveryData.phone})\n`;
    msg += `*Método de Entrega:* ${deliveryMethod === 'delivery' ? 'Delivery a domicilio' : 'Recojo en tienda'}\n`;
    if (deliveryMethod === 'delivery') {
      msg += `Dirección: ${deliveryData.address}\n`;
      if (deliveryData.reference) msg += `Referencia: ${deliveryData.reference}\n`;
    }
    msg += `*Método de Pago:* ${cartPaymentMethod}\n`;
    if (cartPaymentMethod !== 'Efectivo') {
      msg += cartPaymentProof
        ? `✅ Comprobante de pago adjuntado, revisar pedido en el panel.\n`
        : `⚠️ Aún no envió el comprobante de pago, por favor solicitarlo.\n`;
    }

    // Save order in backend
    const orderData = {
      companyId: company.id,
      customerName: deliveryData.recipient || 'Cliente Anónimo',
      customerPhone: deliveryData.phone,
      deliveryMethod,
      address: deliveryData.address,
      reference: deliveryData.reference,
      items: cart.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        price: item.product.salePrice || item.product.price,
        qty: item.qty,
        variants: item.variants
      })),
      total: cartTotal,
      subtotal,
      discount,
      tax: taxAmount,
      couponCode: appliedCoupon?.code,
      paymentMethod: cartPaymentMethod,
      paymentProof: cartPaymentProof || undefined,
    };
    try {
      await apiClient.post('/api/orders', orderData);
    } catch(err) {
      console.error("Error guardando orden:", err);
    }

    window.open(`https://wa.me/${company.whatsapp}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const sendBulkQuoteToWhatsApp = () => {
    if (!company?.whatsapp) {
      alert("Esta empresa no tiene un número de WhatsApp configurado.");
      return;
    }
    if (!bulkQuoteForm.contactName.trim()) {
      alert("Por favor completa tu nombre de contacto.");
      return;
    }
    if (!selectedProduct) return;

    let msg = `*COTIZACIÓN CORPORATIVA POR MAYOR - ${company.name}*\n\n`;
    msg += `Producto: ${selectedProduct.name}\n`;
    if (bulkQuoteForm.quantity) msg += `Cantidad aproximada: ${bulkQuoteForm.quantity}\n`;
    msg += `Contacto: ${bulkQuoteForm.contactName}\n`;
    if (bulkQuoteForm.companyName) msg += `Empresa: ${bulkQuoteForm.companyName}\n`;
    if (bulkQuoteForm.ruc) msg += `RUC: ${bulkQuoteForm.ruc}\n`;
    if (bulkQuoteForm.message) msg += `\nMensaje adicional:\n${bulkQuoteForm.message}\n`;

    window.open(`https://wa.me/${company.whatsapp}?text=${encodeURIComponent(msg)}`, "_blank");
    setBulkQuoteForm({ quantity: '', contactName: '', companyName: '', ruc: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20 selection:bg-indigo-200">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200 p-4 md:px-10 flex items-center justify-between">
        <div className="font-display text-2xl font-bold tracking-widest text-slate-800" style={{ color: company.color }}>
          {company.name}
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setCartOpen(true)}
            className="relative p-2.5 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ShoppingCart className="w-5 h-5" />
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                {cart.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Promotional Banner */}
      {company.banner && (
        <div className="w-full bg-slate-900">
          <div className="max-w-[1600px] mx-auto">
            <img src={company.banner} alt="Promoción" className="w-full max-h-[300px] object-contain mx-auto" />
          </div>
        </div>
      )}

      {/* Hero */}
      <section className={`${company.banner ? 'pt-10' : 'pt-20'} pb-10 px-6 text-center max-w-4xl mx-auto`}>
        {!storeOpenStatus.isOpen && (
          <div className="inline-block bg-red-100 text-red-700 px-4 py-2 rounded-full font-bold text-sm mb-6 border border-red-200">
            ⚠️ {storeOpenStatus.message}
          </div>
        )}
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight" style={{ color: company.color }}>{company.name}</h1>
        <p className="text-slate-500 text-lg">Catálogo Digital Oficial</p>
      </section>

      {/* Social Media Floating Links */}
      {(company.instagram || company.facebook || company.tiktok) && (
        <div className="fixed right-6 bottom-24 z-40 flex flex-col gap-3">
          {company.instagram && (
            <a href={company.instagram} target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-pink-600 hover:scale-110 transition-transform border border-slate-100">
              <Instagram className="w-6 h-6" />
            </a>
          )}
          {company.facebook && (
            <a href={company.facebook} target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-blue-600 hover:scale-110 transition-transform border border-slate-100">
              <Facebook className="w-6 h-6" />
            </a>
          )}
          {company.tiktok && (
            <a href={company.tiktok} target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-black rounded-full shadow-lg flex items-center justify-center text-white hover:scale-110 transition-transform border border-slate-100">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                <path d="M15 21V3a8 8 0 0 1 8 8" />
              </svg>
            </a>
          )}
        </div>
      )}

      {/* Filters & Search */}
      <div className="sticky top-[73px] z-40 bg-white/80 backdrop-blur-lg border-b border-slate-200 py-4 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 items-center">
          <div className="relative w-full md:w-96 flex-shrink-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar producto..." 
              className="w-full bg-white border border-slate-200 rounded-full pl-12 pr-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all shadow-sm"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto w-full pb-2 scrollbar-hide">
            <button 
              onClick={() => setActiveCat('Todos')}
              className={`flex flex-col items-center justify-center min-w-[70px] p-2 rounded-2xl transition-all border shadow-sm ${
                activeCat === 'Todos' 
                  ? `bg-indigo-50 border-indigo-200` 
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-xl mb-1">
                📦
              </div>
              <span className="text-xs font-bold text-slate-700">Todos</span>
            </button>
            {company.categories && company.categories.length > 0 ? company.categories.map(cat => (
              <button 
                key={cat.id}
                onClick={() => setActiveCat(cat.name)}
                className={`flex flex-col items-center justify-center min-w-[70px] p-2 rounded-2xl transition-all border shadow-sm ${
                  activeCat === cat.name 
                    ? `bg-indigo-50 border-indigo-200` 
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden mb-1">
                  {cat.image ? <img src={cat.image} className="w-full h-full object-cover" /> : <span className="text-xl">🏷️</span>}
                </div>
                <span className="text-xs font-bold text-slate-700 truncate w-full text-center">{cat.name}</span>
              </button>
            )) : categories.filter(c => c !== 'Todos').map(cat => (
              <button 
                key={cat}
                onClick={() => setActiveCat(cat)}
                className={`flex flex-col items-center justify-center min-w-[70px] p-2 rounded-2xl transition-all border shadow-sm ${
                  activeCat === cat 
                    ? `bg-indigo-50 border-indigo-200` 
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-xl mb-1">
                  🏷️
                </div>
                <span className="text-xs font-bold text-slate-700 truncate w-full text-center">{cat}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {filteredProducts.map(p => {
            const hasDiscount = p.salePrice && p.salePrice < p.price;
            const productTaxRate = resolveTaxRate(p);
            return (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={p.id} 
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col cursor-pointer"
                onClick={() => { setSelectedProduct(p); setQty(1); }}
              >
                <div className="aspect-square bg-slate-100 relative overflow-hidden">
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">📦</div>
                  )}
                  {hasDiscount && (
                    <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-rose-500 text-white text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded sm:rounded-md uppercase tracking-wider">
                      -{Math.round(((p.price - p.salePrice!) / p.price) * 100)}%
                    </div>
                  )}
                </div>
                <div className="p-3 sm:p-5 flex flex-col flex-1">
                  <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: company.color }}>{p.category}</div>
                  <h3 className="font-bold text-slate-800 text-xs sm:text-[15px] leading-tight mb-2 line-clamp-2">{p.name}</h3>
                  
                  <div className="flex items-center gap-1 text-amber-400 text-[9px] sm:text-[10px] mb-1.5 hidden sm:flex">
                    ★★★★★ <span className="text-slate-500 ml-1">4.9</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mb-2">
                    {p.stock === 0 ? (
                      <>
                        <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-red-500"></div>
                        <span className="text-red-500">Agotado</span>
                      </>
                    ) : (
                      <>
                        <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-emerald-500"></div>
                        <span className="text-emerald-500">
                          {p.stock ? `En Stock: ${p.stock}` : 'Disponible'}
                        </span>
                      </>
                    )}
                  </div>

                  {p.desc && (
                    <p className="text-[10px] sm:text-xs text-slate-500 line-clamp-2 mb-3 sm:mb-4 flex-1">
                      {p.desc}
                    </p>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-end justify-between mt-auto pt-3 sm:pt-4 border-t border-slate-100 gap-2 sm:gap-0">
                    <div className="flex flex-col gap-0 sm:gap-0.5">
                      {hasDiscount ? (
                        <>
                          <span className="text-[9px] sm:text-xs text-slate-400 line-through">{company.currency || 'S/'} {p.price.toFixed(2)}</span>
                          <span className="text-sm sm:text-lg font-bold text-slate-900">{company.currency || 'S/'} {p.salePrice!.toFixed(2)}</span>
                          {productTaxRate > 0 && <span className="text-[9px] sm:text-[10px] text-slate-500 font-semibold">{taxText(productTaxRate)}</span>}
                        </>
                      ) : (
                        <>
                          <span className="text-sm sm:text-lg font-bold text-slate-900">{company.currency || 'S/'} {p.price.toFixed(2)}</span>
                          {productTaxRate > 0 && <span className="text-[9px] sm:text-[10px] text-slate-500 font-semibold">{taxText(productTaxRate)}</span>}
                        </>
                      )}
                    </div>
                    <div className="flex gap-1.5 sm:gap-2">
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          if (p.stock === 0) {
                            alert("Producto agotado");
                            return;
                          }
                          if (p.variants && p.variants.length > 0) {
                            setSelectedProduct(p); setQty(1);
                            return;
                          }
                          addToCart(p); 
                        }} 
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:text-indigo-500 hover:border-indigo-200 hover:bg-indigo-50 transition-all shadow-sm bg-white"
                      >
                        <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedProduct(p); setQty(1); }}
                        className={`px-2 sm:px-4 h-8 sm:h-10 rounded-lg sm:rounded-xl font-bold text-white text-[10px] sm:text-xs transition-colors shadow-sm flex-1 sm:flex-none whitespace-nowrap ${p.stock === 0 ? 'bg-slate-300 cursor-not-allowed' : ''}`}
                        style={p.stock === 0 ? {} : { backgroundColor: '#20bd5a' }}
                      >
                        {p.stock === 0 ? 'Agotado' : termOrderBtn}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
        {filteredProducts.length === 0 && (
          <div className="text-center py-20 text-slate-500">
            No se encontraron {termProduct.toLowerCase()}.
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-6 mt-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-3 mb-3">
              {company.logo && (
                <div className="h-10 w-10 rounded-lg bg-white flex items-center justify-center overflow-hidden flex-shrink-0 p-1">
                  <img src={company.logo} alt={company.name} className="max-h-full max-w-full object-contain" />
                </div>
              )}
              <h2 className="text-xl font-bold text-white">{company.name}</h2>
            </div>
            {company.description && <p className="text-sm max-w-md">{company.description}</p>}
          </div>

          {(company.address || company.hours || company.whatsapp || company.email) && (
            <div>
              <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-3">Contacto</h3>
              <div className="space-y-2 text-sm">
                {company.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{company.address}</span>
                  </div>
                )}
                {company.hours && (
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span className="whitespace-pre-line">{company.hours}</span>
                  </div>
                )}
                {company.whatsapp && (
                  <a href={`https://wa.me/${company.whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition-colors">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <span>{company.whatsapp}</span>
                  </a>
                )}
                {company.email && (
                  <a href={`mailto:${company.email}`} className="flex items-center gap-2 hover:text-white transition-colors">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span>{company.email}</span>
                  </a>
                )}
              </div>
            </div>
          )}

          <div>
            {company.socialLinks && company.socialLinks.length > 0 && (
              <>
                <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-3">Síguenos</h3>
                <div className="flex flex-wrap gap-4">
                  {company.socialLinks.map((link, i) => (
                    <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors text-sm font-medium">
                      {link.platform}
                    </a>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </footer>

      {/* Cart Drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setCartOpen(false)}></div>
          <motion.div 
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            className="w-full max-w-md bg-white border-l border-slate-200 h-full relative z-10 flex flex-col shadow-2xl"
          >
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">{termCartTitle}</h2>
              <button onClick={() => setCartOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 transition-colors">&#10005;</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
              {cart.length === 0 ? (
                <div className="text-center text-slate-500 py-20">{termEmptyCart}</div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item, idx) => {
                    const price = item.product.salePrice || item.product.price;
                    return (
                      <div key={`${item.product.id}-${idx}`} className="flex gap-4 items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0">
                          {item.product.image ? <img src={item.product.image} className="w-full h-full object-cover" /> : null}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-slate-800 truncate">{item.product.name}</h4>
                          {item.variants && Object.keys(item.variants).length > 0 && (
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {Object.entries(item.variants).map(([k, v]) => `${k}: ${v}`).join(', ')}
                            </div>
                          )}
                          <div className="text-slate-500 text-xs mt-1">{company.currency || 'S/'} {price.toFixed(2)}</div>
                          <div className="flex items-center gap-3 mt-2">
                            <button onClick={() => updateQty(idx, -1)} className="w-6 h-6 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200"><Minus className="w-3 h-3" /></button>
                            <span className="text-sm font-bold text-slate-900 w-4 text-center">{item.qty}</span>
                            <button onClick={() => updateQty(idx, 1)} className="w-6 h-6 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200"><Plus className="w-3 h-3" /></button>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <button onClick={() => removeCartItem(idx)} className="text-red-500 hover:text-red-700 p-1"><Trash2 className="w-4 h-4" /></button>
                          <div className="font-bold text-slate-900">{company.currency || 'S/'} {(price * item.qty).toFixed(2)}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            {cart.length > 0 && (
              <div className="p-6 border-t border-slate-200 bg-white">
                <div className="mb-6 space-y-4">
                  <h4 className="font-bold text-slate-800 text-sm">Método de entrega</h4>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setDeliveryMethod('delivery')}
                      className={`flex-1 py-2.5 rounded-xl border text-sm font-bold transition-all ${deliveryMethod === 'delivery' ? 'border-transparent text-white' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                      style={deliveryMethod === 'delivery' ? { backgroundColor: company.color } : {}}
                    >
                      Delivery
                    </button>
                    <button 
                      onClick={() => setDeliveryMethod('pickup')}
                      className={`flex-1 py-2.5 rounded-xl border text-sm font-bold transition-all ${deliveryMethod === 'pickup' ? 'border-transparent text-white' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                      style={deliveryMethod === 'pickup' ? { backgroundColor: company.color } : {}}
                    >
                      Recojo
                    </button>
                  </div>
                  
                  <div className="space-y-3 pt-4">
                    <input 
                      type="text" 
                      placeholder="Nombre completo *"
                      value={deliveryData.recipient}
                      onChange={e => setDeliveryData({...deliveryData, recipient: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-colors"
                    />
                    <input 
                      type="text" 
                      placeholder="Número de WhatsApp *"
                      value={deliveryData.phone}
                      onChange={e => setDeliveryData({...deliveryData, phone: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  {deliveryMethod === 'delivery' && (
                    <div className="space-y-3 pt-3">
                      <div className="text-xs text-slate-500 bg-indigo-50 p-3 rounded-lg text-indigo-700 flex items-start gap-2 mb-2">
                        <span>ℹ️</span> El costo de envío se calculará y coordinará por WhatsApp según tu ubicación.
                      </div>
                      <input 
                        type="text" 
                        placeholder="Dirección exacta *"
                        value={deliveryData.address}
                        onChange={e => setDeliveryData({...deliveryData, address: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-colors"
                      />
                      <input 
                        type="text" 
                        placeholder="Referencia (Opcional)"
                        value={deliveryData.reference}
                        onChange={e => setDeliveryData({...deliveryData, reference: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  )}

                  {(company.yapeNumber || company.plinNumber) && (
                    <div className="pt-4 mt-2 border-t border-slate-100">
                      <h4 className="font-bold text-slate-800 text-sm mb-3">Método de pago</h4>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCartPaymentMethod('Efectivo')}
                          className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all ${cartPaymentMethod === 'Efectivo' ? 'border-transparent text-white' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                          style={cartPaymentMethod === 'Efectivo' ? { backgroundColor: company.color } : {}}
                        >
                          Efectivo
                        </button>
                        {company.yapeNumber && (
                          <button
                            onClick={() => setCartPaymentMethod('Yape')}
                            className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all ${cartPaymentMethod === 'Yape' ? 'border-transparent text-white bg-[#7400b8]' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                          >
                            Yape
                          </button>
                        )}
                        {company.plinNumber && (
                          <button
                            onClick={() => setCartPaymentMethod('Plin')}
                            className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all ${cartPaymentMethod === 'Plin' ? 'border-transparent text-white bg-teal-600' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                          >
                            Plin
                          </button>
                        )}
                      </div>

                      {cartPaymentMethod !== 'Efectivo' && (
                        <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                          <div className="flex items-center gap-4">
                            {(cartPaymentMethod === 'Yape' ? company.yapeQr : company.plinQr) ? (
                              <img
                                src={cartPaymentMethod === 'Yape' ? company.yapeQr : company.plinQr}
                                alt={`QR ${cartPaymentMethod}`}
                                className="w-20 h-20 object-contain rounded-lg border border-slate-200 bg-white p-1 flex-shrink-0"
                              />
                            ) : (
                              <div className="w-20 h-20 flex-shrink-0 rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-400 text-center px-1">
                                Sin QR
                              </div>
                            )}
                            <div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Número {cartPaymentMethod}</div>
                              <div className="text-lg font-black text-slate-900">
                                {cartPaymentMethod === 'Yape' ? company.yapeNumber : company.plinNumber}
                              </div>
                            </div>
                          </div>

                          <ImageUpload
                            label="Adjuntar comprobante (opcional, agiliza tu pedido)"
                            hint="Si lo adjuntas ahora, no tendrás que enviarlo por WhatsApp después."
                            value={cartPaymentProof}
                            onChange={setCartPaymentProof}
                            aspectRatio="square"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="pt-4 mt-2 border-t border-slate-100">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Cupón de Descuento</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={couponCode}
                        onChange={e => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Ej. VERANO20"
                        disabled={!!appliedCoupon}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-indigo-500 uppercase font-mono"
                      />
                      {appliedCoupon ? (
                        <button 
                          onClick={() => { setAppliedCoupon(null); setCouponCode(""); }}
                          className="px-4 py-2 rounded-lg bg-red-50 text-red-600 font-bold text-sm hover:bg-red-100 transition-colors"
                        >
                          Quitar
                        </button>
                      ) : (
                        <button 
                          onClick={applyCoupon}
                          className="px-4 py-2 rounded-lg bg-slate-800 text-white font-bold text-sm hover:bg-slate-700 transition-colors"
                        >
                          Aplicar
                        </button>
                      )}
                    </div>
                    {couponError && <div className="text-xs text-red-500 mt-1">{couponError}</div>}
                    {appliedCoupon && <div className="text-xs text-emerald-600 font-bold mt-1">¡Cupón aplicado exitosamente!</div>}
                  </div>
                </div>

                <div className="flex justify-between items-center mb-2 pt-4 border-t border-slate-100">
                  <span className="text-slate-500 font-medium">Subtotal</span>
                  <span className="font-bold text-slate-700">{company.currency || 'S/'} {subtotal.toFixed(2)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-emerald-600 font-medium text-sm">Descuento ({appliedCoupon.code})</span>
                    <span className="font-bold text-emerald-600 text-sm">-{company.currency || 'S/'} {discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-500 font-medium text-sm">IGV (18%)</span>
                  <span className="font-bold text-slate-600 text-sm">{company.currency || 'S/'} {taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mb-6 pt-2">
                  <span className="text-slate-900 font-bold text-lg">Total</span>
                  <span className="text-2xl font-bold text-slate-900">{company.currency || 'S/'} {cartTotal.toFixed(2)}</span>
                </div>
                {!storeOpenStatus.isOpen && (
                  <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm font-bold mb-4 text-center">
                    ⚠️ {storeOpenStatus.message}
                  </div>
                )}
                <button 
                  onClick={sendToWhatsApp}
                  disabled={!storeOpenStatus.isOpen}
                  className={`w-full py-3.5 rounded-xl font-semibold text-white shadow-md transition-all ${!storeOpenStatus.isOpen ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={{ backgroundColor: !storeOpenStatus.isOpen ? '#94a3b8' : company.color }}
                >
                  {storeOpenStatus.isOpen ? (isServiceBusiness ? 'Solicitar por WhatsApp' : 'Pedir por WhatsApp') : 'Tienda Cerrada'}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center md:p-6 lg:p-12">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setSelectedProduct(null)}></div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative z-10 w-full max-w-7xl bg-white md:rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden h-[100dvh] md:h-[85vh]"
          >
            <button 
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 md:bg-slate-100/80 backdrop-blur flex items-center justify-center text-slate-600 hover:bg-white hover:text-slate-900 transition-all z-20 shadow-sm border border-slate-200 md:border-transparent"
            >
              &#10005;
            </button>

            {/* Left: Image */}
            <div className="w-full h-[45vh] md:h-auto md:w-3/5 lg:w-2/3 bg-slate-50 relative flex-shrink-0 flex items-center justify-center p-6 md:p-12 border-b md:border-b-0 md:border-r border-slate-100">
              {selectedProduct.image ? (
                <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-contain drop-shadow-sm" />
              ) : (
                <div className="text-6xl opacity-20 flex items-center justify-center">📦</div>
              )}
            </div>

            {/* Right: Details */}
            <div className="w-full h-[55vh] md:h-auto md:w-2/5 lg:w-1/3 p-6 md:p-10 flex flex-col overflow-y-auto bg-white pb-24 md:pb-10">
              {(() => {
                const selectedTaxRate = resolveTaxRate(selectedProduct);
                const selectedPrice = selectedProduct.salePrice || selectedProduct.price;
                return (
                  <div className="mb-4">
                    <p className="text-xs font-bold text-slate-500 uppercase">Precio</p>
                    <p className="text-2xl font-extrabold text-slate-900">{company.currency || 'S/'} {selectedPrice.toFixed(2)}</p>
                    {selectedTaxRate > 0 && (
                      <p className="text-xs text-slate-500 font-semibold">{taxText(selectedTaxRate)}</p>
                    )}
                  </div>
                );
              })()}
              <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: company.color }}>{selectedProduct.category}</div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">{selectedProduct.name}</h2>
              
              <div className="flex items-center gap-2 mb-4 text-sm font-semibold">
                {selectedProduct.stock === 0 ? (
                  <>
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span className="text-red-500">Agotado</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="text-emerald-500">
                      {selectedProduct.stock ? `En Stock: ${selectedProduct.stock} unidades` : 'Disponible'}
                    </span>
                  </>
                )}
              </div>

              {selectedProduct.desc && (
                <p className="text-slate-600 text-sm leading-relaxed mb-6">
                  {selectedProduct.desc}
                </p>
              )}

              {selectedProduct.salePrice && selectedProduct.salePrice < selectedProduct.price && (
                <div className="inline-block bg-rose-500 text-white text-xs font-bold px-2 py-1 rounded-md mb-4 self-start">
                  -{Math.round(((selectedProduct.price - selectedProduct.salePrice) / selectedProduct.price) * 100)}% de descuento
                </div>
              )}

              {/* Variants Selector */}
              {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                <div className="mb-6 space-y-4">
                  {selectedProduct.variants.map((v, i) => (
                    <div key={i}>
                      <div className="text-sm font-bold text-slate-700 mb-2">{v.name}</div>
                      <div className="flex flex-wrap gap-2">
                        {v.options.map((opt, j) => {
                          const isSelected = selectedVariants[v.name] === opt;
                          return (
                            <button
                              key={j}
                              onClick={() => setSelectedVariants(prev => ({...prev, [v.name]: opt}))}
                              className={`px-3 py-1.5 rounded-lg border text-sm font-semibold transition-all ${
                                isSelected 
                                  ? 'border-transparent text-white' 
                                  : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'
                              }`}
                              style={isSelected ? { backgroundColor: company.color } : {}}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick Buy Section */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cantidad</div>
                  <div className="flex items-center gap-2">
                      <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-8 h-8 rounded-lg text-white flex items-center justify-center font-bold" style={{ backgroundColor: company.color }}>-</button>
                      <input type="number" value={qty} readOnly className="w-12 h-8 text-center border border-slate-200 rounded-lg text-sm font-bold bg-white" />
                      <button 
                        onClick={() => {
                          if (selectedProduct.stock && qty >= selectedProduct.stock) {
                            alert(`Solo hay ${selectedProduct.stock} unidades en stock.`);
                            return;
                          }
                          setQty(qty + 1);
                        }} 
                        className="w-8 h-8 rounded-lg text-white flex items-center justify-center font-bold" 
                        style={{ backgroundColor: company.color }}
                      >
                        +
                      </button>
                  </div>
                  <div className="text-right">
                      <div className="text-xs text-slate-400">Subtotal</div>
                      <div className="font-bold text-lg text-slate-900">
                        {company.currency || 'S/'} {((selectedProduct.salePrice || selectedProduct.price) * qty).toFixed(2)}
                      </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      if (selectedProduct.stock === 0) {
                        alert("Producto agotado");
                        return;
                      }
                      addToCart(selectedProduct, qty, selectedVariants);
                    }}
                    className="w-12 h-12 flex-shrink-0 flex items-center justify-center border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition-colors text-slate-600 shadow-sm"
                  >
                    <ShoppingCart className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => {
                      if (!storeOpenStatus.isOpen) {
                        alert(storeOpenStatus.message);
                        return;
                      }
                      if (selectedProduct.stock === 0) {
                        alert("Producto agotado");
                        return;
                      }
                      if (selectedProduct.variants && selectedProduct.variants.length > 0) {
                        if (Object.keys(selectedVariants).length < selectedProduct.variants.length) {
                          alert("Por favor selecciona todas las opciones (Talla, Color, etc.)");
                          return;
                        }
                      }
                      const price = selectedProduct.salePrice || selectedProduct.price;
                      const quickSubtotal = price * qty;
                      const quickTax = quickSubtotal * TAX_RATE;
                      const quickTotal = quickSubtotal + quickTax;
                      const variantStr = Object.keys(selectedVariants).length > 0 
                        ? ` (${Object.values(selectedVariants).join(', ')})` 
                        : '';
                      const headerTitle = isServiceBusiness ? '*NUEVA SOLICITUD RÁPIDA*' : '*COMPRA RÁPIDA*';
                      const msg = `${headerTitle}\n\n${termProduct.slice(0, -1)}: ${selectedProduct.name}${variantStr}\nCantidad: ${qty}\nSubtotal: ${company.currency || 'S/'} ${quickSubtotal.toFixed(2)}\nIGV (18%): ${company.currency || 'S/'} ${quickTax.toFixed(2)}\nTotal: ${company.currency || 'S/'} ${quickTotal.toFixed(2)}`;
                      window.open(`https://wa.me/${company.whatsapp}?text=${encodeURIComponent(msg)}`, "_blank");
                    }}
                    disabled={!storeOpenStatus.isOpen}
                    className={`flex-1 rounded-xl text-white font-bold transition-colors shadow-sm ${!storeOpenStatus.isOpen ? 'opacity-50 cursor-not-allowed' : ''}`}
                    style={{ backgroundColor: !storeOpenStatus.isOpen ? '#94a3b8' : company.color }}
                  >
                    {storeOpenStatus.isOpen ? (isServiceBusiness ? 'Solicitar ahora' : 'Comprar en un click') : 'Tienda Cerrada'}
                  </button>
                </div>
                
                {(company.yapeNumber || company.plinNumber) && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {company.yapeNumber && (
                      <button onClick={() => setPaymentQrModal('yape')} className="py-2.5 rounded-xl border border-[#7400b8]/30 bg-[#7400b8]/5 text-[#7400b8] font-bold text-sm hover:bg-[#7400b8]/10 transition-colors">
                        Pagar con Yape
                      </button>
                    )}
                    {company.plinNumber && (
                      <button onClick={() => setPaymentQrModal('plin')} className="py-2.5 rounded-xl border border-teal-200 bg-teal-50 text-teal-700 font-bold text-sm hover:bg-teal-100 transition-colors">
                        Pagar con Plin
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Invoice Form */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-xs text-slate-400">¿Prefieres una cotización corporativa por mayor?</span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex gap-3">
                  <input type="number" min="1" value={bulkQuoteForm.quantity} onChange={e => setBulkQuoteForm({ ...bulkQuoteForm, quantity: e.target.value })} placeholder="Ej: 100" className="w-1/3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-slate-300" />
                  <input type="text" value={bulkQuoteForm.contactName} onChange={e => setBulkQuoteForm({ ...bulkQuoteForm, contactName: e.target.value })} placeholder="Nombre de Contacto" className="w-2/3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-slate-300" />
                </div>
                <div className="flex gap-3">
                  <input type="text" value={bulkQuoteForm.companyName} onChange={e => setBulkQuoteForm({ ...bulkQuoteForm, companyName: e.target.value })} placeholder="Empresa SAC" className="w-1/2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-slate-300" />
                  <input type="text" value={bulkQuoteForm.ruc} onChange={e => setBulkQuoteForm({ ...bulkQuoteForm, ruc: e.target.value })} placeholder="RUC" className="w-1/2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-slate-300" />
                </div>
                <textarea value={bulkQuoteForm.message} onChange={e => setBulkQuoteForm({ ...bulkQuoteForm, message: e.target.value })} placeholder="Mensaje adicional (Color, logo, detalle...)" rows={2} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-slate-300"></textarea>
                
                <button onClick={sendBulkQuoteToWhatsApp} className="w-full py-3 rounded-xl bg-[#25D366] text-white font-bold hover:bg-[#20bd5a] transition-colors shadow-sm flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Enviar consulta por WhatsApp
                </button>
                <div className="text-[10px] text-center text-slate-400 mt-2 font-medium">Te responderemos a la brevedad</div>
              </div>

              <div className="mt-8 text-[10px] text-slate-400 font-bold tracking-wider uppercase border-t border-slate-100 pt-4">
                NOTA: BRINDAMOS FACTURA Y ENVÍO A NIVEL NACIONAL
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal Pagar con Yape / Plin */}
      {paymentQrModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setPaymentQrModal(null)}></div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 text-center"
          >
            <button
              onClick={() => setPaymentQrModal(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-all"
            >
              &#10005;
            </button>

            <h3 className={`text-lg font-extrabold mb-1 ${paymentQrModal === 'yape' ? 'text-[#7400b8]' : 'text-teal-700'}`}>
              Paga con {paymentQrModal === 'yape' ? 'Yape' : 'Plin'}
            </h3>
            <p className="text-slate-500 text-sm mb-5">
              Escanea el código QR o transfiere directamente al número indicado.
              {selectedProduct && (
                <> Total a pagar (con IGV incluido): <strong>{company.currency || 'S/'} {((selectedProduct.salePrice || selectedProduct.price) * qty * (1 + TAX_RATE)).toFixed(2)}</strong></>
              )}
            </p>

            {(paymentQrModal === 'yape' ? company.yapeQr : company.plinQr) ? (
              <img
                src={paymentQrModal === 'yape' ? company.yapeQr : company.plinQr}
                alt={`QR ${paymentQrModal === 'yape' ? 'Yape' : 'Plin'}`}
                className="w-56 h-56 object-contain mx-auto mb-5 border border-slate-200 rounded-xl p-2"
              />
            ) : (
              <div className="w-56 h-56 mx-auto mb-5 border border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-400 text-sm px-4">
                Este negocio aún no subió su QR de {paymentQrModal === 'yape' ? 'Yape' : 'Plin'}
              </div>
            )}

            <div className="bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 mb-5">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Número {paymentQrModal === 'yape' ? 'Yape' : 'Plin'}</div>
              <div className="text-2xl font-black text-slate-900 tracking-wide">
                {paymentQrModal === 'yape' ? company.yapeNumber : company.plinNumber}
              </div>
            </div>

            <p className="text-slate-400 text-xs">
              Una vez realizado el pago, envía tu comprobante por WhatsApp para confirmar tu {isServiceBusiness ? 'solicitud' : 'pedido'}.
            </p>
          </motion.div>
        </div>
      )}

    </div>
  );
}
