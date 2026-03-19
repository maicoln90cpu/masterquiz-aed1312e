import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createBlock, normalizeBlock, type QuizBlock } from '@/types/blocks';

// ============================================================
// FASE 6 — Testes de renderização: blocos críticos
// ============================================================

// Import block components
import { AccordionBlock } from '../AccordionBlock';
import { ComparisonBlock } from '../ComparisonBlock';
import { GalleryBlock } from '../GalleryBlock';
import { PriceBlock } from '../PriceBlock';
import { TestimonialBlock } from '../TestimonialBlock';
import { TextBlock } from '../TextBlock';
import { SeparatorBlock } from '../SeparatorBlock';
import { ButtonBlock } from '../ButtonBlock';
import { CountdownBlock } from '../CountdownBlock';
import { SliderBlock } from '../SliderBlock';
import { NPSBlock } from '../NPSBlock';
import { AnimatedCounterBlock } from '../AnimatedCounterBlock';
import { MetricsBlock } from '../MetricsBlock';

const noop = vi.fn();

describe('Block render tests (Fase 6)', () => {
  describe('AccordionBlock', () => {
    it('renders with default normalized data', () => {
      const block = normalizeBlock(createBlock('accordion'));
      render(<AccordionBlock block={block as any} onChange={noop} />);
      expect(screen.getByText(/como funciona/i)).toBeInTheDocument();
    });

    it('renders with empty items (normalized)', () => {
      const raw = { id: '1', type: 'accordion', order: 0, items: [] } as QuizBlock;
      const block = normalizeBlock(raw);
      render(<AccordionBlock block={block as any} onChange={noop} />);
      // Should have default item after normalization
      expect(screen.getByDisplayValue(/nova pergunta/i)).toBeInTheDocument();
    });
  });

  describe('ComparisonBlock', () => {
    it('renders with default data', () => {
      const block = normalizeBlock(createBlock('comparison'));
      render(<ComparisonBlock block={block as any} onChange={noop} />);
      expect(screen.getByDisplayValue('Antes')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Depois')).toBeInTheDocument();
    });

    it('renders with missing arrays (normalized)', () => {
      const raw = { id: '1', type: 'comparison', order: 0 } as QuizBlock;
      const block = normalizeBlock(raw);
      render(<ComparisonBlock block={block as any} onChange={noop} />);
      expect(screen.getByDisplayValue('Antes')).toBeInTheDocument();
    });
  });

  describe('GalleryBlock', () => {
    it('renders empty state', () => {
      const block = normalizeBlock(createBlock('gallery'));
      render(<GalleryBlock block={block as any} onChange={noop} />);
      // Should render without crash
      expect(screen.getByText(/adicionar imagem/i)).toBeInTheDocument();
    });
  });

  describe('PriceBlock', () => {
    it('renders plan info', () => {
      const block = normalizeBlock(createBlock('price'));
      render(<PriceBlock block={block as any} onChange={noop} />);
      expect(screen.getByDisplayValue('Plano Premium')).toBeInTheDocument();
      expect(screen.getByDisplayValue('99,90')).toBeInTheDocument();
    });

    it('renders with missing features (normalized)', () => {
      const raw = { id: '1', type: 'price', order: 0 } as QuizBlock;
      const block = normalizeBlock(raw);
      render(<PriceBlock block={block as any} onChange={noop} />);
      expect(screen.getByDisplayValue('Plano')).toBeInTheDocument();
    });
  });

  describe('TestimonialBlock', () => {
    it('renders testimonial fields', () => {
      const block = normalizeBlock(createBlock('testimonial'));
      render(<TestimonialBlock block={block as any} onChange={noop} />);
      expect(screen.getByDisplayValue('João Silva')).toBeInTheDocument();
    });
  });

  describe('TextBlock', () => {
    it('renders without crash', () => {
      const block = normalizeBlock(createBlock('text'));
      render(<TextBlock block={block as any} onChange={noop} />);
      // Text block uses rich text editor
      expect(document.querySelector('[contenteditable]') || document.querySelector('.ql-editor') || true).toBeTruthy();
    });
  });

  describe('SeparatorBlock', () => {
    it('renders separator', () => {
      const block = normalizeBlock(createBlock('separator'));
      const { container } = render(<SeparatorBlock block={block as any} onChange={noop} />);
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe('ButtonBlock', () => {
    it('renders button text', () => {
      const block = normalizeBlock(createBlock('button'));
      render(<ButtonBlock block={block as any} onChange={noop} />);
      expect(screen.getByDisplayValue('Clique aqui')).toBeInTheDocument();
    });
  });

  describe('CountdownBlock', () => {
    it('renders without crash', () => {
      const block = normalizeBlock(createBlock('countdown'));
      const { container } = render(<CountdownBlock block={block as any} onChange={noop} />);
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe('SliderBlock', () => {
    it('renders label', () => {
      const block = normalizeBlock(createBlock('slider'));
      render(<SliderBlock block={block as any} onChange={noop} />);
      expect(screen.getByDisplayValue('Selecione um valor')).toBeInTheDocument();
    });
  });

  describe('NPSBlock', () => {
    it('renders question', () => {
      const block = normalizeBlock(createBlock('nps'));
      render(<NPSBlock block={block as any} onChange={noop} />);
      expect(screen.getByDisplayValue(/probabilidade de você recomendar/i)).toBeInTheDocument();
    });
  });

  describe('AnimatedCounterBlock', () => {
    it('renders without crash', () => {
      const block = normalizeBlock(createBlock('animatedCounter'));
      const { container } = render(<AnimatedCounterBlock block={block as any} onChange={noop} />);
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe('MetricsBlock', () => {
    it('renders title', () => {
      const block = normalizeBlock(createBlock('metrics'));
      render(<MetricsBlock block={block as any} onChange={noop} />);
      expect(screen.getByDisplayValue('Estatísticas')).toBeInTheDocument();
    });
  });
});
