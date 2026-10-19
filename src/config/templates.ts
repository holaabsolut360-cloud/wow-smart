// Plantillas por rubro: productos de ejemplo editables para arrancar en minutos.
export type RubroKey = 'restaurante' | 'tienda' | 'accesorios';

export interface TemplateProduct { name: string; desc: string; price: number; category: string; }

export const RUBRO_TEMPLATES: Record<RubroKey, { label: string; businessType: string; emoji: string; products: TemplateProduct[] }> = {
  restaurante: {
    label: 'Restaurante / comida', businessType: 'Restaurante', emoji: '🍽️',
    products: [
      { name: 'Lomo saltado', desc: 'Clásico peruano con papas fritas y arroz. (Ejemplo: edítalo con tu plato)', price: 28, category: 'Platos de fondo' },
      { name: 'Ceviche de pescado', desc: 'Pescado fresco, limón, ají limo y camote. (Ejemplo)', price: 30, category: 'Platos de fondo' },
      { name: 'Chicha morada 1 L', desc: 'Bebida natural de maíz morado. (Ejemplo)', price: 10, category: 'Bebidas' },
    ],
  },
  tienda: {
    label: 'Tienda / bodega', businessType: 'Tienda', emoji: '🛍️',
    products: [
      { name: 'Polo básico de algodón', desc: 'Tallas S a XL. (Ejemplo: edítalo con tu producto)', price: 35, category: 'Ropa' },
      { name: 'Pack de abarrotes', desc: 'Arroz, azúcar y aceite. (Ejemplo)', price: 45, category: 'Abarrotes' },
      { name: 'Gaseosa 1.5 L', desc: 'Bebida helada. (Ejemplo)', price: 7.5, category: 'Bebidas' },
    ],
  },
  accesorios: {
    label: 'Accesorios / regalos', businessType: 'Accesorios', emoji: '⌚',
    products: [
      { name: 'Reloj clásico', desc: 'Correa de cuero, resistente al agua. (Ejemplo: edítalo con tu producto)', price: 120, category: 'Relojes' },
      { name: 'Pulsera de acero', desc: 'Acero inoxidable, no se oxida. (Ejemplo)', price: 45, category: 'Joyería' },
      { name: 'Caja de regalo', desc: 'Empaque premium con tarjeta. (Ejemplo)', price: 15, category: 'Regalos' },
    ],
  },
};

// Normaliza un número peruano para wa.me: 9 dígitos que empiezan con 9 -> 51 + número.
export const normalizeWhatsapp = (raw: string | null | undefined): string => {
  const d = String(raw || '').replace(/\D/g, '');
  if (/^9\d{8}$/.test(d)) return '51' + d;
  return d;
};
export const isValidWhatsapp = (raw: string | null | undefined) => /^\d{10,15}$/.test(normalizeWhatsapp(raw));
