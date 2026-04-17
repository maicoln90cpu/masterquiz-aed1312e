/**
 * Type shim para Storybook CSF 3.0.
 *
 * Permite que arquivos `*.stories.tsx` compilem sem instalar o Storybook.
 * Quando o Storybook for instalado de fato (ver docs/STORYBOOK.md), este
 * arquivo pode ser removido — os tipos reais virão de `@storybook/react`.
 */
declare module '@storybook/react' {
  import type { ComponentType, ReactElement } from 'react';

  export interface Meta<T = unknown> {
    title?: string;
    component?: T;
    tags?: string[];
    argTypes?: Record<string, unknown>;
    parameters?: Record<string, unknown>;
    decorators?: Array<(Story: ComponentType) => ReactElement>;
  }

  export interface StoryObj<T = unknown> {
    args?: Partial<T extends ComponentType<infer P> ? P : Record<string, unknown>>;
    render?: (args: T extends ComponentType<infer P> ? P : Record<string, unknown>) => ReactElement;
    parameters?: Record<string, unknown>;
  }

  export interface Preview {
    parameters?: Record<string, unknown>;
    decorators?: Array<(Story: ComponentType) => ReactElement>;
  }
}

declare module '@storybook/react-vite' {
  export interface StorybookConfig {
    stories: string[];
    addons?: string[];
    framework?: { name: string; options?: Record<string, unknown> };
    docs?: { autodocs?: string | boolean };
    typescript?: { check?: boolean; reactDocgen?: string };
  }
}
