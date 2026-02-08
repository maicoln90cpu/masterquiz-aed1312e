import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@/__tests__/test-utils';
import { DashboardTour } from '../onboarding/DashboardTour';

// Mock driver.js
vi.mock('driver.js', () => ({
  driver: vi.fn(() => ({
    setSteps: vi.fn(),
    drive: vi.fn(),
    destroy: vi.fn(),
    hasNextStep: vi.fn(() => false),
  })),
}));

describe('DashboardTour', () => {
  const mockUpdateOnboardingStep = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.removeItem('mq_dashboard_tour_completed');
  });

  it('should render without crashing', () => {
    const { container } = render(
      <DashboardTour updateOnboardingStep={mockUpdateOnboardingStep} />
    );
    expect(container).toBeDefined();
  });

  it('should initialize driver on mount', async () => {
    const { driver } = await import('driver.js');
    render(
      <DashboardTour updateOnboardingStep={mockUpdateOnboardingStep} />
    );
    
    await waitFor(() => {
      expect(driver).toHaveBeenCalled();
    });
  });
});
