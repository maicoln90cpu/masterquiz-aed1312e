import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorState } from '../error-state';

describe('ErrorState', () => {
  it('renderiza título padrão quando omitido', () => {
    render(<ErrorState />);
    expect(screen.getByText('Algo deu errado')).toBeInTheDocument();
  });

  it('renderiza mensagem técnica', () => {
    render(<ErrorState message="Network failure" />);
    expect(screen.getByText('Network failure')).toBeInTheDocument();
  });

  it('mostra botão retry e dispara callback', () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);
    fireEvent.click(screen.getByRole('button', { name: /tentar novamente/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('desabilita retry quando offline', () => {
    render(<ErrorState onRetry={() => {}} isOffline />);
    expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeDisabled();
    expect(screen.getByText(/você está offline/i)).toBeInTheDocument();
  });

  it('desabilita retry enquanto isRetrying', () => {
    render(<ErrorState onRetry={() => {}} isRetrying />);
    expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeDisabled();
  });

  it('possui role="alert" para acessibilidade', () => {
    render(<ErrorState />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});