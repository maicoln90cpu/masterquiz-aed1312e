import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Truncate } from '../truncate';

// jsdom não implementa ResizeObserver
beforeAll(() => {
  // @ts-ignore
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

describe('Truncate', () => {
  it('renderiza o texto fornecido', () => {
    render(<Truncate>Texto curto</Truncate>);
    expect(screen.getByText('Texto curto')).toBeInTheDocument();
  });

  it('aplica classe truncate para uma linha', () => {
    const { container } = render(<Truncate>abc</Truncate>);
    expect(container.querySelector('.truncate')).toBeInTheDocument();
  });

  it('aplica line-clamp para multi-linha', () => {
    const { container } = render(<Truncate lines={3}>abc</Truncate>);
    expect(container.querySelector('.line-clamp-3')).toBeInTheDocument();
  });

  it('respeita prop "as"', () => {
    const { container } = render(<Truncate as="h2">Título</Truncate>);
    expect(container.querySelector('h2')).toBeInTheDocument();
  });
});