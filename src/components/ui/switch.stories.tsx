import type { Meta, StoryObj } from '@storybook/react';
import { Label } from './label';
import { Switch } from './switch';

const meta: Meta<typeof Switch> = {
  title: 'UI/Switch',
  component: Switch,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Switch>;

export const Default: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Switch id="analytics" defaultChecked />
      <Label htmlFor="analytics">Ativar analytics</Label>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="grid gap-3">
      <div className="flex items-center gap-3">
        <Switch id="disabled-off" disabled />
        <Label htmlFor="disabled-off">Desabilitado</Label>
      </div>
      <div className="flex items-center gap-3">
        <Switch id="disabled-on" disabled defaultChecked />
        <Label htmlFor="disabled-on">Desabilitado ativo</Label>
      </div>
    </div>
  ),
};
