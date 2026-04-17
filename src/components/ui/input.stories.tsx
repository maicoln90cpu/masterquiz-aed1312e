import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './input';
import { Label } from './label';

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: { placeholder: 'Digite algo…' },
};

export const Email: Story = {
  args: { type: 'email', placeholder: 'voce@exemplo.com' },
};

export const Disabled: Story = {
  args: { disabled: true, placeholder: 'Desabilitado' },
};

export const WithLabel: Story = {
  render: () => (
    <div className="grid w-full max-w-sm gap-1.5">
      <Label htmlFor="email">E-mail</Label>
      <Input id="email" type="email" placeholder="voce@exemplo.com" />
    </div>
  ),
};
