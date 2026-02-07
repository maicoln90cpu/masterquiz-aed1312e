import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@/__tests__/test-utils';
import { Onboarding } from '../Onboarding';

// Mock useOnboarding hook
vi.mock('@/hooks/useOnboarding', () => ({
  useOnboarding: () => ({
    completeWelcome: vi.fn().mockResolvedValue(undefined),
    status: 'loaded',
  }),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

describe('Onboarding', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when open is false', () => {
    render(<Onboarding open={false} onClose={mockOnClose} />);
    expect(screen.queryByText(/Bem-vindo/i)).not.toBeInTheDocument();
  });

  it('should render welcome dialog when open', () => {
    render(<Onboarding open={true} onClose={mockOnClose} />);
    expect(screen.getByText(/Bem-vindo/i)).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    render(<Onboarding open={true} onClose={mockOnClose} />);
    
    // Find and click the close button (X icon)
    const closeButton = screen.getByRole('button', { name: /fechar|close/i });
    if (closeButton) {
      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });

  it('should display step indicators', () => {
    render(<Onboarding open={true} onClose={mockOnClose} />);
    
    // Check for step indicators (dots)
    const dots = document.querySelectorAll('[class*="rounded-full"]');
    expect(dots.length).toBeGreaterThan(0);
  });
});
