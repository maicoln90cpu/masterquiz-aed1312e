/**
 * Storybook stories — Button
 * Compatible with Storybook CSF 3.0 format.
 *
 * To enable Storybook locally:
 *   npm i -D @storybook/react-vite @storybook/addon-essentials storybook
 *   npx storybook init --type react
 */
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';
import { Loader2, Trash2 } from 'lucide-react';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
    },
    disabled: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: { children: 'Botão padrão' },
};

export const Destructive: Story = {
  args: { variant: 'destructive', children: 'Excluir' },
};

export const Outline: Story = {
  args: { variant: 'outline', children: 'Outline' },
};

export const Secondary: Story = {
  args: { variant: 'secondary', children: 'Secundário' },
};

export const Ghost: Story = {
  args: { variant: 'ghost', children: 'Ghost' },
};

export const Link: Story = {
  args: { variant: 'link', children: 'Link' },
};

export const Loading: Story = {
  render: (args) => (
    <Button {...args} disabled>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Carregando…
    </Button>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <Button variant="destructive">
      <Trash2 className="mr-2 h-4 w-4" />
      Excluir item
    </Button>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};
