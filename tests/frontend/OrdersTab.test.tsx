import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const mocked = vi.hoisted(() => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn(),
  apiGet: vi.fn(),
  apiPut: vi.fn(),
  exportToCSV: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: mocked.useQuery,
  useMutation: mocked.useMutation,
  useQueryClient: mocked.useQueryClient,
}));

vi.mock('../../src/services/api', () => ({
  apiClient: {
    get: (...args: any[]) => mocked.apiGet(...args),
    put: (...args: any[]) => mocked.apiPut(...args),
  },
}));

vi.mock('../../src/utils/exportToCSV', () => ({
  exportToCSV: (...args: any[]) => mocked.exportToCSV(...args),
}));

import { OrdersTab } from '../../src/components/dashboard/OrdersTab';

describe('OrdersTab', () => {
  const invalidateQueries = vi.fn();

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
    mocked.useMutation.mockReturnValue({ mutate: vi.fn() });
  });

  it('muestra estado de carga mientras consulta ordenes', () => {
    mocked.useQuery.mockReturnValue({ data: undefined, isLoading: true, error: null });

    render(<OrdersTab company={company} />);

    expect(screen.getByText(/Cargando pedidos.../i)).toBeInTheDocument();
  });

  it('renderiza ordenes cuando la consulta es exitosa', () => {
    mocked.useQuery.mockReturnValue({
      data: {
        data: [
          {
            id: 'o1',
            createdAt: '2026-07-18T12:00:00.000Z',
            customerName: 'Juan Perez',
            deliveryMethod: 'delivery',
            status: 'Pendiente',
            total: 25,
            subtotal: 25,
            discount: 0,
            items: [{ name: 'Burger', qty: 1, price: 25 }],
          },
        ],
        totalPages: 1,
      },
      isLoading: false,
      error: null,
    });

    render(<OrdersTab company={company} />);

    expect(screen.getByText('Juan Perez')).toBeInTheDocument();
    expect(screen.getByText(/Burger/i)).toBeInTheDocument();
  });

  it('muestra estado vacio cuando no hay ordenes', () => {
    mocked.useQuery.mockReturnValue({
      data: { data: [], totalPages: 1 },
      isLoading: false,
      error: null,
    });

    render(<OrdersTab company={company} />);

    expect(screen.getByText(/Aún no tienes pedidos registrad/i)).toBeInTheDocument();
  });

  it('ante falla de red en consulta cae en estado vacio', () => {
    mocked.useQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('network down'),
    });

    render(<OrdersTab company={company} />);

    expect(screen.getByText(/Aún no tienes pedidos registrad/i)).toBeInTheDocument();
  });

  it('actualiza estado de orden e invalida cache en flujo exitoso', async () => {
    mocked.apiPut.mockResolvedValueOnce({ ok: true });
    mocked.useQuery.mockReturnValue({
      data: {
        data: [
          {
            id: 'o1',
            createdAt: '2026-07-18T12:00:00.000Z',
            customerName: 'Juan Perez',
            deliveryMethod: 'delivery',
            status: 'Pendiente',
            total: 25,
            subtotal: 25,
            discount: 0,
            items: [{ name: 'Burger', qty: 1, price: 25 }],
          },
        ],
        totalPages: 1,
      },
      isLoading: false,
      error: null,
    });

    render(<OrdersTab company={company} />);

    fireEvent.change(screen.getByDisplayValue('Pendiente'), { target: { value: 'Pagado' } });

    await waitFor(() => {
      expect(mocked.apiPut).toHaveBeenCalledWith('/api/orders/o1/status', { status: 'Pagado' });
    });

    expect(invalidateQueries).toHaveBeenCalled();
  });
});
