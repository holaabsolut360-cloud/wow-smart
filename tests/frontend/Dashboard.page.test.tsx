import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const mocked = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  signOut: vi.fn(),
  apiGet: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mocked.navigateMock,
  };
});

vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    auth: {
      signOut: mocked.signOut,
    },
  },
}));

vi.mock('../../src/services/api', () => ({
  apiClient: {
    get: (...args: any[]) => mocked.apiGet(...args),
    post: vi.fn(),
  },
}));

vi.mock('../../src/components/PosSystem', () => ({ PosSystem: () => <div>POS Mock</div> }));
vi.mock('../../src/components/dashboard/CategoriesTab', () => ({ CategoriesTab: () => <div>Categories Mock</div> }));
vi.mock('../../src/components/dashboard/CouponsTab', () => ({ CouponsTab: () => <div>Coupons Mock</div> }));
vi.mock('../../src/components/dashboard/DebtsTab', () => ({ DebtsTab: () => <div>Debts Mock</div> }));
vi.mock('../../src/components/dashboard/SettingsTab', () => ({ SettingsTab: () => <div>Settings Mock</div> }));
vi.mock('../../src/components/dashboard/InventoryTab', () => ({ InventoryTab: () => <div>Inventory Mock</div> }));
vi.mock('../../src/components/dashboard/SecurityTab', () => ({ SecurityTab: () => <div>Security Mock</div> }));
vi.mock('../../src/components/dashboard/SuppliersTab', () => ({ SuppliersTab: () => <div>Suppliers Mock</div> }));
vi.mock('../../src/components/dashboard/CrmTab', () => ({ CrmTab: () => <div>CRM Mock</div> }));
vi.mock('../../src/components/dashboard/AnalyticsTab', () => ({ AnalyticsTab: () => <div>Analytics Mock</div> }));
vi.mock('../../src/components/dashboard/ExpensesTab', () => ({ ExpensesTab: () => <div>Expenses Mock</div> }));
vi.mock('../../src/components/dashboard/ProductsTab', () => ({ ProductsTab: () => <div>Products Mock</div> }));
vi.mock('../../src/components/dashboard/OrdersTab', () => ({ OrdersTab: () => <div>Orders Mock</div> }));
vi.mock('../../src/components/dashboard/CustomersTab', () => ({ CustomersTab: () => <div>Customers Mock</div> }));
vi.mock('../../src/components/ImageUpload', () => ({ ImageUpload: () => <div>ImageUpload Mock</div> }));
vi.mock('qrcode.react', () => ({ QRCodeSVG: () => <div>QR Mock</div> }));

import Dashboard from '../../src/pages/Dashboard';

describe('Dashboard page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocked.apiGet.mockResolvedValue({
      company: {
        id: 'c1',
        slug: 'demo',
        businessType: 'Restaurante',
        plan: 'Negocio',
        subscriptionStatus: 'Prueba Gratuita',
        subscriptionEndsAt: '2099-12-31T00:00:00.000Z',
        currency: 'S/',
        color: '#4f46e5',
        categories: [],
      },
      analytics: {
        todayRevenue: 0,
        todayExpenseTotal: 0,
        todayProfit: 0,
        totalRevenue: 0,
        totalExpenses: 0,
        totalProfit: 0,
        totalOrdersCount: 0,
        avgTicket: 0,
        revenueData: [],
        topProducts: [],
      },
      inventoryAnalytics: {},
      auditLogs: [],
      systemUsers: [],
      backups: [],
      batches: [],
    });
  });

  it('carga datos y renderiza el panel principal', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Cargando.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(mocked.apiGet).toHaveBeenCalledWith('/api/dashboard/1');
      expect(screen.getByText('POS Mock')).toBeInTheDocument();
      expect(screen.getByText(/Estás en el período de Prueba Gratuita/i)).toBeInTheDocument();
    });
  });

  it('si no existe empresa redirige al onboarding', async () => {
    mocked.apiGet.mockRejectedValueOnce({ status: 404, message: 'Company not found' });

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(mocked.navigateMock).toHaveBeenCalledWith('/auth?mode=onboarding');
    });
  });

  it('logout cierra sesion y redirige al inicio', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );

    await screen.findByText('POS Mock');

    fireEvent.click(screen.getAllByRole('button', { name: /Salir/i })[0]);

    await waitFor(() => {
      expect(mocked.signOut).toHaveBeenCalledTimes(1);
      expect(mocked.navigateMock).toHaveBeenCalledWith('/');
    });
  });
});
