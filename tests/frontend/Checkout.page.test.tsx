import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const mocked = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  getUser: vi.fn(),
  signUp: vi.fn(),
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}));

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mocked.navigateMock,
    useParams: () => ({ planId: 'negocio' }),
  };
});

vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: mocked.getUser,
      signUp: mocked.signUp,
    },
  },
}));

vi.mock('../../src/services/api', () => ({
  apiClient: {
    get: (...args: any[]) => mocked.apiGet(...args),
    post: (...args: any[]) => mocked.apiPost(...args),
  },
}));

import Checkout from '../../src/pages/Checkout';

describe('Checkout page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:preview');

    mocked.getUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'owner@wow.com' } } });
    mocked.signUp.mockResolvedValue({ data: { session: null }, error: null });
    mocked.apiGet.mockResolvedValue({ company: { id: 'c1' } });
    mocked.apiPost.mockResolvedValue({ ok: true });
  });

  async function goToPaymentDetails(container: HTMLElement) {
    fireEvent.click(screen.getAllByRole('button', { name: /Continuar al pago/i })[0]);

    await waitFor(() => {
      const yapeInput = container.querySelector('input[name="paymentMethod"][value="Yape"]') as HTMLInputElement | null;
      expect(yapeInput).toBeTruthy();
      if (yapeInput) fireEvent.click(yapeInput);
    });

    fireEvent.click(screen.getAllByRole('button', { name: /Continuar con el pago/i })[0]);
  }

  it('bloquea el envio cuando falta comprobante en Yape/Plin', async () => {
    const view = render(
      <MemoryRouter>
        <Checkout />
      </MemoryRouter>,
    );

    await goToPaymentDetails(view.container);
    const submitButton = screen.getByRole('button', { name: /He realizado el pago/i });

    expect(submitButton).toBeDisabled();
    expect(mocked.apiPost).not.toHaveBeenCalledWith('/api/checkout/submit-payment', expect.anything());
  });

  it('flujo exitoso con usuario autenticado y comprobante', async () => {
    const view = render(
      <MemoryRouter>
        <Checkout />
      </MemoryRouter>,
    );

    await goToPaymentDetails(view.container);

    const fileInput = view.container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['proof-bytes'], 'proof.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    fireEvent.click(screen.getByRole('button', { name: /He realizado el pago/i }));

    await waitFor(() => {
      expect(mocked.apiPost).toHaveBeenCalledWith('/api/checkout/submit-payment', expect.objectContaining({
        companyId: 'c1',
        plan: 'Negocio',
        method: 'Yape',
      }));
      expect(screen.getByText(/Cuenta Creada/i)).toBeInTheDocument();
    });
  });

  it('si falla API de pago muestra alerta de error', async () => {
    mocked.apiPost.mockRejectedValueOnce(new Error('API caida'));

    const view = render(
      <MemoryRouter>
        <Checkout />
      </MemoryRouter>,
    );

    await goToPaymentDetails(view.container);
    const fileInput = view.container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['proof-bytes'], 'proof.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: /He realizado el pago/i }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('API caida');
    });
  });

  it('si no hay usuario autenticado deriva al paso de registro', async () => {
    mocked.getUser.mockResolvedValueOnce({ data: { user: null } });

    const view = render(
      <MemoryRouter>
        <Checkout />
      </MemoryRouter>,
    );

    await goToPaymentDetails(view.container);
    const fileInput = view.container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['proof-bytes'], 'proof.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: /He realizado el pago/i }));

    expect(await screen.findByText(/¡Pago Confirmado!/i)).toBeInTheDocument();
  });
});
