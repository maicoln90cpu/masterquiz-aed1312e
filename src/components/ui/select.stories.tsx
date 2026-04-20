import type { Meta, StoryObj } from '@storybook/react';
import { Search } from 'lucide-react';
import { Input } from './input';
import { Label } from './label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from './select';

const meta: Meta<typeof Select> = {
  title: 'UI/Select',
  component: Select,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Select>;

export const Default: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-[240px]">
        <SelectValue placeholder="Selecione um plano" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="free">Gratuito</SelectItem>
        <SelectItem value="pro">Pro</SelectItem>
        <SelectItem value="premium">Premium</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const WithGroups: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-[280px]">
        <SelectValue placeholder="Escolha uma integração" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Marketing</SelectLabel>
          <SelectItem value="gtm">Google Tag Manager</SelectItem>
          <SelectItem value="pixel">Facebook Pixel</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Mensagens</SelectLabel>
          <SelectItem value="egoi">E-goi</SelectItem>
          <SelectItem value="whatsapp">WhatsApp</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
};

export const WithSearch: Story = {
  render: () => (
    <div className="grid w-[280px] gap-2">
      <Label htmlFor="integration-search">Buscar integração</Label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input id="integration-search" className="pl-9" placeholder="Digite para filtrar…" />
      </div>
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Resultado da busca" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="gtm">Google Tag Manager</SelectItem>
          <SelectItem value="egoi">E-goi</SelectItem>
          <SelectItem value="whatsapp">WhatsApp</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};
