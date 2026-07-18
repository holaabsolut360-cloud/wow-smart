import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const mocked = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  getSession: vi.fn(),
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
  };
});

vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: mocked.signInWithPassword,
      signUp: mocked.signUp,
      resetPasswordForEmail: mocked.resetPasswordForEmail,
      getSession: mocked.getSession,
    },
  },
}));

import Auth from '../../src/pages/Auth';

describe('Auth page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.pushState({}, '', '/auth');
    vi.spyOn(window, 'alert').mockImplementation(() => {});

    mocked.signInWithPassword.mockResolvedValue({ error: null });
    mocked.signUp.mockResolvedValue({ data: { session: null }, error: null });
    mocked.resetPasswordForEmail.mockResolvedValue({ error: null });
    mocked.getSession.mockResolvedValue({ data: { session: null } });
  });

  it('login exitoso navega al dashboard', async () => {
    render(
      <MemoryRouter>
        <Auth />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getAllByPlaceholderText('tu@correo.com')[0], { target: { value: 'demo@wow.com' } });
    fireEvent.change(screen.getAllByPlaceholderText('••••••••')[0], { target: { value: 'Password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Ingresar/i }));

    await waitFor(() => {
      expect(mocked.signInWithPassword).toHaveBeenCalledWith({
        email: 'demo@wow.com',
        password: 'Password123',
      });
      expect(mocked.navigateMock).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('login con error muestra alerta', async () => {
    mocked.signInWithPassword.mockResolvedValue({ error: { message: 'credenciales invalidas' } });

    render(
      <MemoryRouter>
        <Auth />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getAllByPlaceholderText('tu@correo.com')[0], { target: { value: 'x@x.com' } });
    fireEvent.change(screen.getAllByPlaceholderText('••••••••')[0], { target: { value: 'bad' } });
    fireEvent.click(screen.getByRole('button', { name: /Ingresar/i }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('credenciales invalidas');
    });
  });

  it('registro exitoso sin sesion muestra pantalla de correo enviado', async () => {
    window.history.pushState({}, '', '/auth?mode=register');

    render(
      <MemoryRouter>
        <Auth />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText('Juan Pérez'), { target: { value: 'QA User' } });
    fireEvent.change(screen.getByPlaceholderText('tu@correo.com'), { target: { value: 'qa@wow.com' } });
    fireEvent.change(screen.getByPlaceholderText('Mínimo 8 caracteres'), { target: { value: 'Password123' } });
    fireEvent.click(screen.getByLabelText(/Acepto los/i));
    fireEvent.click(screen.getByRole('button', { name: /Crear cuenta/i }));

    await waitFor(() => {
      expect(mocked.signUp).toHaveBeenCalled();
      expect(screen.getByText(/Revisa tu correo/i)).toBeInTheDocument();
    });
  });

  it('recuperacion con error muestra alerta', async () => {
    mocked.resetPasswordForEmail.mockResolvedValue({ error: { message: 'smtp unavailable' } });

    render(
      <MemoryRouter>
        <Auth />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getAllByRole('button', { name: /¿Olvidaste tu contraseña?/i })[0]);
    fireEvent.change(screen.getAllByPlaceholderText('tu@correo.com')[0], { target: { value: 'qa@wow.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Enviar instrucciones/i }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('smtp unavailable');
    });
  });
});
