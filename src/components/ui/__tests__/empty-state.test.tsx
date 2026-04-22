import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from '../empty-state';
import { Users } from 'lucide-react';

describe('EmptyState', () => {
  it('renderiza título obrigatório', () => {
    render(<EmptyState title="Sem dados" />);
    expect(screen.getByText('Sem dados')).toBeInTheDocument();
  });

  it('renderiza descrição opcional', () => {
    render(<EmptyState title="Vazio" description="Crie seu primeiro item" />);
    expect(screen.getByText('Crie seu primeiro item')).toBeInTheDocument();
  });

  it('renderiza CTA e dispara onClick', () => {
    const onClick = vi.fn();
    render(<EmptyState title="Vazio" action={{ label: 'Criar', onClick }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Criar' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('possui role="status" para acessibilidade', () => {
    render(<EmptyState title="X" icon={Users} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});