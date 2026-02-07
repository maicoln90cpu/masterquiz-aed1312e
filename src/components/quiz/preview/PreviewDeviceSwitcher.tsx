import { Button } from '@/components/ui/button';
import { Smartphone, Monitor, Tablet } from 'lucide-react';
import type { DeviceMode } from '@/hooks/useQuizPreviewState';

interface PreviewDeviceSwitcherProps {
  deviceMode: DeviceMode;
  onDeviceModeChange: (mode: DeviceMode) => void;
}

export const PreviewDeviceSwitcher = ({ deviceMode, onDeviceModeChange }: PreviewDeviceSwitcherProps) => (
  <div className="flex items-center gap-1">
    <Button
      variant={deviceMode === 'mobile' ? 'default' : 'ghost'}
      size="sm"
      onClick={() => onDeviceModeChange('mobile')}
      className="h-8 w-8 p-0"
    >
      <Smartphone className="h-4 w-4" />
    </Button>
    <Button
      variant={deviceMode === 'tablet' ? 'default' : 'ghost'}
      size="sm"
      onClick={() => onDeviceModeChange('tablet')}
      className="h-8 w-8 p-0"
    >
      <Tablet className="h-4 w-4" />
    </Button>
    <Button
      variant={deviceMode === 'desktop' ? 'default' : 'ghost'}
      size="sm"
      onClick={() => onDeviceModeChange('desktop')}
      className="h-8 w-8 p-0"
    >
      <Monitor className="h-4 w-4" />
    </Button>
  </div>
);
