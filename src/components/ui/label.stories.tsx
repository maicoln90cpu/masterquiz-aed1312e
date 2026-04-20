import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './input';
import { Label } from './label';

const meta: Meta<typeof Label> = {
  title: 'UI/Label',
  component: Label,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Label>;

export const WithInput: Story = {
  render: () => (
    <div className="grid w-full max-w-sm gap-1.5">
      <Label htmlFor="company">Empresa</Label>
      <Input id="company" placeholder="Nome da empresa" />
      <p className="text-xs text-muted-foreground">Este nome aparece nos relatórios internos.</p>
    </div>
  ),
};
