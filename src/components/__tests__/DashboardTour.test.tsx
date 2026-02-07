import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/__tests__/test-utils';
import { DashboardTour } from '../onboarding/DashboardTour';

// Mock driver.js
vi.mock('driver.js', () => ({
  driver: vi.fn(() => ({
    setSteps: vi.fn(),
    drive: vi.fn(),
    destroy: vi.fn(),
  })),
}));

// Mock useOnboarding hook
vi.mock('@/hooks/useOnboarding', () => ({
  useOnboarding: () => ({
    completeDashboardTour: vi.fn(),
    shouldShowDashboardTour: true,
    status: 'loaded',
  }),
}));

describe('DashboardTour', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    // DashboardTour renders null, so we just verify no errors
    const { container } = render(<DashboardTour />);
    expect(container).toBeDefined();
  });

  it('should initialize driver on mount', async () => {
    const { driver } = await import('driver.js');
    render(<DashboardTour />);
    
    await waitFor(() => {
      expect(driver).toHaveBeenCalled();
    });
  });
});
