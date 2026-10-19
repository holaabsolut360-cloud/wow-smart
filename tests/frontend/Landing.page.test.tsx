import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('motion/react', () => ({
  motion: {
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

import Landing from '../../src/pages/Landing';

describe('Landing page', () => {
  it('el selector anual aplica 20% (S/ 12, 31.20, 63.20)', async () => {
    const { fireEvent } = await import('@testing-library/react');
    render(<MemoryRouter><Landing /></MemoryRouter>);
    fireEvent.click(screen.getByRole('radio', { name: /Anual/i }));
    expect(screen.getByTestId('precio-emprendedor').textContent).toBe('S/ 12');
    expect(screen.getByTestId('precio-negocio').textContent).toBe('S/ 31.20');
    expect(screen.getByTestId('precio-empresa').textContent).toBe('S/ 63.20');
  });

  it('muestra el bloque de doble camino con copy y CTA de prueba gratuita', () => {
    const { container } = render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /Elige cómo quieres comenzar/i })).toBeTruthy();
    expect(
      screen.getByText(
        /Puedes probar WOW SMART completamente gratis durante 15 días o contratar el plan que mejor se adapte a tu negocio desde hoy\./i,
      ),
    ).toBeTruthy();

    expect(screen.getByText(/¿Quieres probar primero\?/i)).toBeTruthy();
    expect(screen.getByText(/Sin tarjeta de crédito • Configuración en menos de 2 minutos/i)).toBeTruthy();

    const trialLink = screen.getByRole('link', { name: /Comenzar Prueba Gratuita/i });
    expect(trialLink.textContent).toContain('Comenzar Prueba Gratuita');
    expect(trialLink.getAttribute('href')).toContain('/auth?mode=register');
    expect(trialLink.getAttribute('href')).toContain('trial=true');
  });

  it('mantiene las 3 tarjetas con CTA de contratación directa y cierre comercial', () => {
    const { container } = render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>,
    );

    expect(screen.getAllByRole('link', { name: /Empieza gratis/i }).length).toBe(3);
    expect(container.querySelector('a[href$="plan=negocio"]')).not.toBeNull();
    expect(screen.getByText(/Prueba 15 días gratis, sin tarjeta/i)).toBeTruthy();
    expect(screen.getByText(/Menos de S\/ 1.30 al día/i)).toBeTruthy();
    expect(screen.getByText(/Sin comisiones por venta/i)).toBeTruthy();
    expect(container.querySelector('a[href^="https://wa.me/51901345791"]')).not.toBeNull();

    expect(container.querySelector('a[href="/checkout/emprendedor"]')).not.toBeNull();
    expect(container.querySelector('a[href="/checkout/negocio"]')).not.toBeNull();
    expect(container.querySelector('a[href="/checkout/empresa"]')).not.toBeNull();

    expect(
      screen.getByText(/¿Necesitas comenzar hoy mismo\? Elige un plan y actívalo al instante\./i),
    ).toBeTruthy();
  });
});
