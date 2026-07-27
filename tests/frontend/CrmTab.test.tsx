import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../src/services/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import { apiClient } from '../../src/services/api';
import { CrmTab } from '../../src/components/dashboard/CrmTab';
import type { Company, CRMDeal } from '../../src/types';

const mockCompany: Company = {
  id: 'company-1',
  userId: 'user-1',
  name: 'Empresa de Prueba',
  slug: 'empresa-de-prueba',
  plan: 'pro',
  color: '#6366f1',
  whatsapp: '51999999999',
  logo: '',
  currency: 'S/',
};

const renderWithClient = (ui: React.ReactElement) => {
  // retry:false evita que un test de "estado de error" se quede
  // reintentando durante segundos antes de que vitest reporte el fallo.
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};

describe('CrmTab', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset();
  });

  it('no se queda pegado en "Cargando oportunidades..." cuando no hay empresa seleccionada (regresión del bug de isLoading infinito)', () => {
    // Antes del fix: con company=null, React Query dejaba enabled:false,
    // y `isLoading` se quedaba en `true` para siempre (nunca llegaba a
    // resolver ni a fallar), mostrando el spinner de texto de forma
    // permanente. Este test evita que ese bug vuelva a colarse.
    renderWithClient(<CrmTab company={null} />);

    expect(screen.queryByText(/Cargando oportunidades/i)).toBeNull();
    expect(screen.getByText(/Selecciona una empresa para ver su CRM/i)).toBeTruthy();
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it('muestra el estado vacío con botón para crear la primera oportunidad cuando la empresa no tiene deals', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: [] });

    renderWithClient(<CrmTab company={mockCompany} />);

    expect(await screen.findByText(/Aún no tienes oportunidades CRM registradas/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Registrar la primera oportunidad/i })).toBeTruthy();
  });

  it('renderiza el tablero Kanban con las oportunidades agrupadas por etapa y calcula el valor ganado', async () => {
    const deals: CRMDeal[] = [
      {
        id: 'deal-1',
        companyId: 'company-1',
        customerName: 'Juan Pérez',
        title: 'Cotización 100 tazas',
        value: 250,
        stage: 'Nuevo',
        createdAt: '2026-07-01T00:00:00.000Z',
        updatedAt: '2026-07-01T00:00:00.000Z',
      },
      {
        id: 'deal-2',
        companyId: 'company-1',
        customerName: 'María López',
        title: 'Pedido corporativo',
        value: 1200,
        stage: 'Ganado',
        createdAt: '2026-07-02T00:00:00.000Z',
        updatedAt: '2026-07-02T00:00:00.000Z',
      },
    ];
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: deals });

    renderWithClient(<CrmTab company={mockCompany} />);

    expect(await screen.findByText('Cotización 100 tazas')).toBeTruthy();
    expect(screen.getByText('Pedido corporativo')).toBeTruthy();
    expect(screen.getByText('Juan Pérez')).toBeTruthy();
    expect(screen.getByText('María López')).toBeTruthy();

    // Tarjeta de métrica "Valor Ganado" = suma de deals en etapa "Ganado" (solo el de S/ 1200).
    // Aparece dos veces en el DOM: una en la tarjeta de métrica y otra en
    // la tarjeta del deal dentro del Kanban — ambas correctas.
    expect(screen.getAllByText('S/ 1200.00').length).toBeGreaterThanOrEqual(2);
  });
});
