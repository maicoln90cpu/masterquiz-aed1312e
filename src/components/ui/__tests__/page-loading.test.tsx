import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageLoading } from '../page-loading';

describe('PageLoading', () => {
  it('renderiza spinner com label padrão', () => {
    render(<PageLoading />);
    expect(screen.getByText('Carregando…')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('aceita label customizado', () => {
    render(<PageLoading label="Buscando dados" />);
    expect(screen.getByText('Buscando dados')).toBeInTheDocument();
  });

  it('renderiza N skeletons no modo skeleton', () => {
    const { container } = render(<PageLoading variant="skeleton" rows={5} />);
    expect(container.querySelectorAll('.animate-pulse').length).toBe(5);
  });

  it('modo inline tem sr-only para leitores de tela', () => {
    render(<PageLoading variant="inline" label="Salvando" />);
    expect(screen.getByText('Salvando')).toBeInTheDocument();
    expect(screen.getByText('Carregando…')).toHaveClass('sr-only');
  });
});