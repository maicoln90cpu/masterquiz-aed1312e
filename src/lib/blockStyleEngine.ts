/**
 * Motor de Estilo Tipado — Fonte única de verdade para formatação de blocos.
 * 
 * Define quais blocos suportam quais propriedades de estilo,
 * aplica defaults globais na criação, e resolve estilo efetivo no render.
 */

import type { BlockType, QuizBlock } from "@/types/blocks";

// ============================================
// CAPABILITY MATRIX
// ============================================

export interface StyleCapabilities {
  align: boolean;
  fontSize: boolean;
  fontFamily: boolean;
}

/**
 * Matriz central: quais tipos de bloco suportam quais estilos.
 * Se o tipo não está aqui, NÃO suporta nenhum estilo.
 */
const CAPABILITIES: Partial<Record<BlockType, StyleCapabilities>> = {
  text:              { align: true,  fontSize: true,  fontFamily: true },
  callout:           { align: true,  fontSize: true,  fontFamily: true },
  quote:             { align: true,  fontSize: true,  fontFamily: true },
  iconList:          { align: true,  fontSize: false, fontFamily: true },
  banner:            { align: true,  fontSize: true,  fontFamily: true },
  testimonial:       { align: true,  fontSize: false, fontFamily: false },
  accordion:         { align: false, fontSize: false, fontFamily: true },
  socialProof:       { align: true,  fontSize: false, fontFamily: false },
  badgeRow:          { align: true,  fontSize: false, fontFamily: false },
  progressMessage:   { align: true,  fontSize: true,  fontFamily: true },
  recommendation:    { align: true,  fontSize: false, fontFamily: false },
  button:            { align: true,  fontSize: false, fontFamily: false },
  price:             { align: true,  fontSize: false, fontFamily: false },
};

const NO_CAPABILITIES: StyleCapabilities = { align: false, fontSize: false, fontFamily: false };

export function getStyleCapabilities(type: BlockType): StyleCapabilities {
  return CAPABILITIES[type] || NO_CAPABILITIES;
}

export function hasAnyStyleCapability(type: BlockType): boolean {
  const cap = getStyleCapabilities(type);
  return cap.align || cap.fontSize || cap.fontFamily;
}

// ============================================
// APPLY GLOBAL DEFAULTS ON BLOCK CREATION
// ============================================

interface GlobalStyle {
  globalTextAlign?: string;
  globalFontSize?: string;
  globalFontFamily?: string;
}

/**
 * Aplica defaults globais a um bloco recém-criado, respeitando a matriz.
 * Retorna o bloco modificado (mutação segura pois é bloco novo).
 */
export function applyGlobalDefaultsOnCreate(
  block: QuizBlock,
  global: GlobalStyle
): QuizBlock {
  const cap = getStyleCapabilities(block.type);
  const b = block as any;

  if (cap.align && global.globalTextAlign && global.globalTextAlign !== 'left') {
    b.alignment = global.globalTextAlign;
  }
  if (cap.fontSize && global.globalFontSize && global.globalFontSize !== 'medium') {
    b.fontSize = global.globalFontSize;
  }
  if (cap.fontFamily && global.globalFontFamily && global.globalFontFamily !== 'sans') {
    b.fontFamily = global.globalFontFamily;
  }

  return block;
}

// ============================================
// VALID VALUES (for Select normalization)
// ============================================

const VALID_ALIGN = ['left', 'center', 'right'];
const VALID_FONT_SIZE = ['small', 'medium', 'large', 'xl'];

/**
 * Normaliza um valor para garantir que está nas opções válidas do Select.
 * Retorna o valor se válido, ou o fallback.
 */
export function normalizeAlign(value: string | undefined): string {
  if (value && VALID_ALIGN.includes(value)) return value;
  return 'left';
}

export function normalizeFontSize(value: string | undefined): string {
  if (value && VALID_FONT_SIZE.includes(value)) return value;
  return 'medium';
}
