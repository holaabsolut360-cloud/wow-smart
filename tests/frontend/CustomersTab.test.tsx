import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../src/services/api', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

import { apiClient } from '../../src/services/api';
import { CustomersTab } from '../../src/components/dashboard/CustomersTab';
import type { Company } from '../../src/types';

const company: Company = {
  id: 'company-1', userId: 'user-1', name: 'Empresa de Prueba', slug: 'empresa-prueba',
  plan: 'pro', color: '#6366f1', whatsapp: '51999999999', logo: '', currency: 'S/',
};

function renderCustomers() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}><CustomersTab company={company} /></QueryClientProvider>);
}

describe('CustomersTab import', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset();
    vi.mocked(apiClient.post).mockReset();
    vi.mocked(apiClient.get).mockResolvedValue({ data: [], total: 0, totalPages: 0 });
    vi.mocked(apiClient.post).mockResolvedValue({ created: 1 });
  });

  it('reads an XLSX file and imports its customer rows', async () => {
    const { container } = renderCustomers();
    await screen.findByText('Directorio de Clientes');
    const input = container.querySelector('input[type="file"]');
    expect(input).not.toBeNull();

    fireEvent.change(input!, { target: { files: [new File(['content'], 'clientes.xlsx')] } });

    expect(await screen.findByText(/Importación completada: 1 cliente creado/i)).toBeTruthy();
    expect(apiClient.post).toHaveBeenCalledWith('/api/customers/import-file', expect.objectContaining({
      companyId: 'company-1', fileName: 'clientes.xlsx', contentBase64: expect.any(String),
    }));
  });

  it('rejects legacy XLS files with an actionable message', async () => {
    const { container } = renderCustomers();
    await screen.findByText('Directorio de Clientes');
    const input = container.querySelector('input[type="file"]');

    fireEvent.change(input!, { target: { files: [new File(['content'], 'clientes.xls')] } });

    expect(await screen.findByText(/Excel 97-2003.*no es compatible/i)).toBeTruthy();
    expect(apiClient.post).not.toHaveBeenCalled();
  });
});
