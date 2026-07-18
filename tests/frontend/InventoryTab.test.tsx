import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const mocked = vi.hoisted(() => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn(),
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  exportToCSV: vi.fn(),
}));

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: mocked.useQuery,
  useMutation: mocked.useMutation,
  useQueryClient: mocked.useQueryClient,
}));

vi.mock('../../src/services/api', () => ({
  apiClient: {
    get: (...args: any[]) => mocked.apiGet(...args),
    post: (...args: any[]) => mocked.apiPost(...args),
  },
}));

vi.mock('../../src/utils/exportToCSV', () => ({
  exportToCSV: (...args: any[]) => mocked.exportToCSV(...args),
}));

import { InventoryTab } from '../../src/components/dashboard/InventoryTab';

describe('InventoryTab', () => {
  const invalidateQueries = vi.fn();
  const mutate = vi.fn();

  const company = {
    id: 'c1',
    slug: 'demo',
    name: 'Demo',
    userId: 'u1',
    plan: 'Negocio',
    color: '#4f46e5',
    whatsapp: '999',
    logo: '',
    currency: 'S/',
    businessType: 'Restaurante',
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mocked.useQueryClient.mockReturnValue({ invalidateQueries });
    mocked.useMutation.mockReturnValue({ mutate, isPending: false });
  });

  function mockInventoryQueries(params: {
    products?: any[];
    movements?: any[];
    analytics?: any;
    error?: Error;
  }) {
    mocked.useQuery.mockImplementation(({ queryKey }: any) => {
      const key = queryKey?.[0];
      if (key === 'products') {
        return { data: params.products ? { data: params.products } : undefined, error: params.error };
      }
      if (key === 'inventoryMovements') {
        return { data: params.movements ? { data: params.movements } : undefined, error: params.error };
      }
      if (key === 'inventoryAnalytics') {
        return { data: params.analytics ? { data: params.analytics } : undefined, error: params.error };
      }
      return { data: undefined, error: null };
    });
  }

  it('renderiza inventario con datos exitosos', () => {
    mockInventoryQueries({
      products: [{ id: 'p1', name: 'Harina', stock: 10 }],
      movements: [{ id: 'm1', productId: 'p1', type: 'Entrada', qty: 5, date: '2026-07-18' }],
      analytics: { totalItems: 1, lowStock: 0, totalValue: 120.5 },
    });

    render(<InventoryTab company={company} />);

    expect(screen.getByText('Inventario')).toBeInTheDocument();
    expect(screen.getByText('Harina')).toBeInTheDocument();
    const inventoryValueCard = screen.getByText('Valor Inventario').closest('div');
    expect(inventoryValueCard).toHaveTextContent('120.50');
  });

  it('muestra estado vacio cuando no hay movimientos', () => {
    mockInventoryQueries({
      products: [],
      movements: [],
      analytics: { totalItems: 0, lowStock: 0, totalValue: 0 },
    });

    render(<InventoryTab company={company} />);

    expect(screen.getByText('Total Productos')).toBeInTheDocument();
    expect(screen.getByText('Stock Bajo')).toBeInTheDocument();
    expect(screen.getByText(/No hay movimientos registrados/i)).toBeInTheDocument();
  });

  it('fallback ante respuestas fallidas de API en consultas', () => {
    mockInventoryQueries({ error: new Error('network') });

    render(<InventoryTab company={company} />);

    expect(screen.getByText(/No hay movimientos registrados/i)).toBeInTheDocument();
  });

  it('registra movimiento con mutacion cuando formulario es valido', async () => {
    mockInventoryQueries({
      products: [{ id: 'p1', name: 'Harina', stock: 10 }],
      movements: [],
      analytics: { totalItems: 1, lowStock: 0, totalValue: 10 },
    });

    render(<InventoryTab company={company} />);

    fireEvent.click(screen.getByRole('button', { name: /Registrar Movimiento/i }));

    fireEvent.change(screen.getByDisplayValue('Seleccionar Producto...'), { target: { value: 'p1' } });
    const qtyInput = screen.getByDisplayValue('1');
    fireEvent.change(qtyInput, { target: { value: '3' } });

    fireEvent.click(screen.getByRole('button', { name: /Guardar/i }));

    await waitFor(() => {
      expect(mutate).toHaveBeenCalled();
    });
  });
});
