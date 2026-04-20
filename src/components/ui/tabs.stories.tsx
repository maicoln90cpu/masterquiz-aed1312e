import type { Meta, StoryObj } from '@storybook/react';
import { BarChart3, Settings, Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';

const meta: Meta<typeof Tabs> = {
  title: 'UI/Tabs',
  component: Tabs,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-[420px]">
      <TabsList>
        <TabsTrigger value="overview">Resumo</TabsTrigger>
        <TabsTrigger value="leads">Leads</TabsTrigger>
        <TabsTrigger value="settings">Configurações</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="rounded-md border p-4 text-sm text-muted-foreground">
        Visão geral do desempenho do quiz.
      </TabsContent>
      <TabsContent value="leads" className="rounded-md border p-4 text-sm text-muted-foreground">
        Lista de leads capturados no período.
      </TabsContent>
      <TabsContent value="settings" className="rounded-md border p-4 text-sm text-muted-foreground">
        Ajustes de publicação e aparência.
      </TabsContent>
    </Tabs>
  ),
};

export const Vertical: Story = {
  render: () => (
    <Tabs defaultValue="profile" className="flex w-[560px] gap-4">
      <TabsList className="h-auto flex-col items-stretch justify-start">
        <TabsTrigger value="profile" className="justify-start">Perfil</TabsTrigger>
        <TabsTrigger value="billing" className="justify-start">Cobrança</TabsTrigger>
        <TabsTrigger value="security" className="justify-start">Segurança</TabsTrigger>
      </TabsList>
      <TabsContent value="profile" className="mt-0 flex-1 rounded-md border p-4 text-sm text-muted-foreground">
        Dados públicos exibidos na conta.
      </TabsContent>
      <TabsContent value="billing" className="mt-0 flex-1 rounded-md border p-4 text-sm text-muted-foreground">
        Plano ativo e histórico de cobranças.
      </TabsContent>
      <TabsContent value="security" className="mt-0 flex-1 rounded-md border p-4 text-sm text-muted-foreground">
        Preferências de login e proteção.
      </TabsContent>
    </Tabs>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <Tabs defaultValue="metrics" className="w-[460px]">
      <TabsList>
        <TabsTrigger value="metrics" className="gap-2"><BarChart3 className="h-4 w-4" />Métricas</TabsTrigger>
        <TabsTrigger value="people" className="gap-2"><Users className="h-4 w-4" />Pessoas</TabsTrigger>
        <TabsTrigger value="config" className="gap-2"><Settings className="h-4 w-4" />Config</TabsTrigger>
      </TabsList>
      <TabsContent value="metrics" className="rounded-md border p-4 text-sm text-muted-foreground">Conversões e taxa de conclusão.</TabsContent>
      <TabsContent value="people" className="rounded-md border p-4 text-sm text-muted-foreground">Segmentos de usuários e respostas.</TabsContent>
      <TabsContent value="config" className="rounded-md border p-4 text-sm text-muted-foreground">Integrações e preferências.</TabsContent>
    </Tabs>
  ),
};
