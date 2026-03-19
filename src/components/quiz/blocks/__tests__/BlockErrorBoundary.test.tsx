import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BlockErrorBoundary } from '../BlockErrorBoundary';

// ============================================================
// FASE 6 — Testes: BlockErrorBoundary
// ============================================================

const ThrowingComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) throw new Error('Block crash test');
  return <div>Block content OK</div>;
};

describe('BlockErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders children when no error', () => {
    render(
      <BlockErrorBoundary blockType="text">
        <div>Healthy child</div>
      </BlockErrorBoundary>
    );
    expect(screen.getByText('Healthy child')).toBeInTheDocument();
  });

  it('shows fallback UI on child crash', () => {
    render(
      <BlockErrorBoundary blockType="accordion">
        <ThrowingComponent shouldThrow={true} />
      </BlockErrorBoundary>
    );
    expect(screen.getByText(/bloco "accordion" falhou/i)).toBeInTheDocument();
    expect(screen.getByText('Block crash test')).toBeInTheDocument();
  });

  it('shows retry button in error state', () => {
    render(
      <BlockErrorBoundary blockType="price">
        <ThrowingComponent shouldThrow={true} />
      </BlockErrorBoundary>
    );
    expect(screen.getByText(/tentar novamente/i)).toBeInTheDocument();
  });

  it('shows delete button when onDelete provided', () => {
    const onDelete = vi.fn();
    render(
      <BlockErrorBoundary blockType="gallery" onDelete={onDelete}>
        <ThrowingComponent shouldThrow={true} />
      </BlockErrorBoundary>
    );
    expect(screen.getByText(/remover bloco/i)).toBeInTheDocument();
  });

  it('calls onDelete when delete clicked', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    
    render(
      <BlockErrorBoundary blockType="video" onDelete={onDelete}>
        <ThrowingComponent shouldThrow={true} />
      </BlockErrorBoundary>
    );
    
    await user.click(screen.getByText(/remover bloco/i));
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it('hides delete button when no onDelete', () => {
    render(
      <BlockErrorBoundary blockType="text">
        <ThrowingComponent shouldThrow={true} />
      </BlockErrorBoundary>
    );
    expect(screen.queryByText(/remover bloco/i)).not.toBeInTheDocument();
  });
});
