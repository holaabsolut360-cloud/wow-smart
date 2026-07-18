import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const mocked = vi.hoisted(() => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn(),
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  apiDelete: vi.fn(),
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
    put: (...args: any[]) => mocked.apiPut(...args),
    delete: (...args: any[]) => mocked.apiDelete(...args),
  },
}));

vi.mock('../../src/components/ImageUpload', () => ({
  ImageUpload: ({ label }: { label: string }) => <div>{label}</div>,
}));

import { ProductsTab } from '../../src/components/dashboard/ProductsTab';

describe('ProductsTab', () => {
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

  it('muestra estado de carga mientras consulta productos', () => {
    mocked.useQuery.mockReturnValue({ data: undefined, isLoading: true, error: null });

    render(
      <MemoryRouter>
        <ProductsTab company={company} categories={[]} />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Cargando productos.../i)).toBeInTheDocument();
  });

  it('renderiza listado de productos cuando la carga es exitosa', () => {
    mocked.useQuery.mockReturnValue({
      data: {
        data: [
          { id: 'p1', name: 'Producto 1', category: 'General', price: 10, image: '', salePrice: null },
        ],
        totalPages: 1,
      },
      isLoading: false,
      error: null,
    });

    render(
      <MemoryRouter>
        <ProductsTab company={company} categories={[]} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Producto 1')).toBeInTheDocument();
    expect(screen.getByText(/General/i)).toBeInTheDocument();
  });

  it('muestra estado vacio cuando no hay productos', () => {
    mocked.useQuery.mockReturnValue({
      data: { data: [], totalPages: 1 },
      isLoading: false,
      error: null,
    });

    render(
      <MemoryRouter>
        <ProductsTab company={company} categories={[]} />
      </MemoryRouter>,
    );

    expect(screen.getByText(/No tienes productos en tu catálogo aún/i)).toBeInTheDocument();
  });

  it('en error de red de consulta mantiene fallback de estado vacio', () => {
    mocked.useQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('network down'),
    });

    render(
      <MemoryRouter>
        <ProductsTab company={company} categories={[]} />
      </MemoryRouter>,
    );

    expect(screen.getByText(/No tienes productos en tu catálogo aún/i)).toBeInTheDocument();
  });

  it('abre formulario y ejecuta mutacion al guardar producto', async () => {
    mocked.useQuery.mockReturnValue({
      data: { data: [], totalPages: 1 },
      isLoading: false,
      error: null,
    });

    render(
      <MemoryRouter>
        <ProductsTab company={company} categories={[]} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /Nuevo Producto/i }));

    fireEvent.change(screen.getByPlaceholderText('Ej. Taza personalizada'), { target: { value: 'Taza' } });
    fireEvent.change(screen.getByPlaceholderText('Ej. Tazas'), { target: { value: 'Hogar' } });

    const numericInputs = screen.getAllByRole('spinbutton');
    fireEvent.change(numericInputs[0], { target: { value: '10' } });

    fireEvent.click(screen.getByRole('button', { name: /Guardar Producto/i }));

    await waitFor(() => {
      expect(mutate).toHaveBeenCalled();
    });
  });
});
