import type { Meta, StoryObj } from '@storybook/react';
import { Label } from './label';
import { Textarea } from './textarea';

const meta: Meta<typeof Textarea> = {
  title: 'UI/Textarea',
  component: Textarea,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  render: () => (
    <div className="grid w-full max-w-md gap-1.5">
      <Label htmlFor="description">Descrição</Label>
      <Textarea id="description" placeholder="Explique o objetivo do quiz…" />
    </div>
  ),
};

export const WithError: Story = {
  render: () => (
    <div className="grid w-full max-w-md gap-1.5">
      <Label htmlFor="message">Mensagem</Label>
      <Textarea id="message" aria-invalid className="border-destructive focus-visible:ring-destructive" defaultValue="Curto" />
      <p className="text-xs text-destructive">A mensagem precisa ter pelo menos 20 caracteres.</p>
    </div>
  ),
};
