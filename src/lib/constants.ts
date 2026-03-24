/**
 * Application Constants
 * Centralized magic numbers and configuration values
 */

// Pagination & Limits
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  RESPONSES_PER_PAGE: 25,
  LEADS_PER_PAGE: 20,
  AUDIT_LOGS_PER_PAGE: 50,
  WEBHOOK_LOGS_PER_PAGE: 25,
} as const;

// Rate Limiting
export const RATE_LIMITS = {
  QUIZ_SUBMISSIONS_PER_MINUTE: 10,
  API_REQUESTS_PER_MINUTE: 100,
  LOGIN_ATTEMPTS_PER_HOUR: 5,
  WEBHOOK_REQUESTS_PER_MINUTE: 100,
  AI_GENERATIONS_TIMEOUT_MS: 60000,
} as const;

// File Upload Limits
export const FILE_LIMITS = {
  MAX_IMAGE_SIZE_MB: 5,
  MAX_VIDEO_SIZE_MB: 100,
  MAX_AUDIO_SIZE_MB: 10,
  MAX_PDF_SIZE_MB: 20,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/quicktime'],
  ALLOWED_AUDIO_TYPES: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a'],
} as const;

// Cache & Session
export const CACHE = {
  IP_CACHE_TIMEOUT_MS: 30 * 60 * 1000, // 30 minutes
  SUBSCRIPTION_CHECK_INTERVAL_MS: 60 * 1000, // 1 minute
  STALE_TIME_MS: 5 * 60 * 1000, // 5 minutes for React Query
  GC_TIME_MS: 30 * 60 * 1000, // 30 minutes for React Query garbage collection
} as const;

// Quiz Configuration
export const QUIZ = {
  MIN_QUESTIONS: 1,
  MAX_QUESTIONS_FREE: 10,
  MAX_QUESTIONS_PAID: 50,
  MIN_OPTIONS: 2,
  MAX_OPTIONS_SINGLE: 5,
  MAX_OPTIONS_MULTIPLE: 7,
  MAX_TITLE_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_QUESTION_TEXT_LENGTH: 500,
  MAX_OPTION_TEXT_LENGTH: 200,
} as const;

// Plan Defaults
export const PLAN_DEFAULTS = {
  FREE_QUIZ_LIMIT: 3,
  FREE_RESPONSE_LIMIT: 100,
  FREE_LEAD_LIMIT: 50,
  PAID_QUIZ_LIMIT: 10,
  PAID_RESPONSE_LIMIT: 1000,
  PAID_LEAD_LIMIT: 500,
} as const;

// UI Configuration
export const UI = {
  TOAST_DURATION_MS: 5000,
  DEBOUNCE_MS: 500,
  AUTO_SAVE_DEBOUNCE_MS: 2000,
  ANIMATION_DURATION_MS: 300,
  MOBILE_BREAKPOINT_PX: 768,
  TABLET_BREAKPOINT_PX: 1024,
} as const;

// Analytics Events
export const ANALYTICS_EVENTS = {
  QUIZ_VIEW: 'view',
  QUIZ_START: 'start',
  QUIZ_COMPLETE: 'complete',
  VIDEO_VIEW: 'VideoView',
  VIDEO_PROGRESS_25: 'VideoProgress25',
  VIDEO_PROGRESS_50: 'VideoProgress50',
  VIDEO_PROGRESS_75: 'VideoProgress75',
  VIDEO_COMPLETE: 'VideoComplete',
} as const;

// Lead Statuses
export const LEAD_STATUS = {
  NEW: 'new',
  CONTACTED: 'contacted',
  QUALIFIED: 'qualified',
  CONVERTED: 'converted',
  LOST: 'lost',
} as const;

// Quiz Statuses
export const QUIZ_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  ARCHIVED: 'archived',
} as const;

// Template Names
export const TEMPLATES = {
  MODERNO: 'moderno',
  COLORIDO: 'colorido',
  PROFISSIONAL: 'profissional',
  CRIATIVO: 'criativo',
  ELEGANTE: 'elegante',
  VIBRANTE: 'vibrante',
  MINIMALISTA: 'minimalista',
  ESCURO: 'escuro',
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500,
} as const;

// Emoji Categories for Quiz Options
export const EMOJI_CATEGORIES = {
  popular: ['✅', '❌', '⭐', '💡', '🎯', '🔥', '💪', '❤️', '👍', '👎', '✨', '🏅', '💯', '🙏', '🤝'],
  expressions: ['😊', '😃', '😎', '🤔', '😍', '🥳', '😅', '🤩', '😂', '🙌', '🥺', '😤', '🤗', '😱', '🫡'],
  business: ['📊', '📈', '💼', '💰', '🏆', '📝', '💎', '🚀', '📱', '💻', '🏢', '📋', '🗂️', '📌', '🔑'],
  lifestyle: ['🏠', '🌴', '✈️', '🎉', '🌿', '🌈', '☀️', '🌙', '🎁', '🎊', '🛍️', '💅', '🎵', '🎬', '📸'],
  health: ['🥗', '🏃', '🧘', '💊', '🩺', '🧠', '💤', '🍎', '💧', '🌟', '🏋️', '🩹', '🫀', '🦷', '👁️'],
  education: ['📖', '🎓', '✏️', '🎨', '🔬', '🛠️', '📚', '🧪', '🔍', '💭', '🗺️', '📐', '🧮', '🏫', '📏'],
  food: ['🍕', '🍔', '🥤', '☕', '🍷', '🎂', '🍿', '🍦', '🥑', '🍳', '🍣', '🥐', '🍜', '🧁', '🫖'],
  nature: ['🌸', '🌺', '🌻', '🍃', '🌊', '⛰️', '🌲', '🦋', '🐾', '🌍', '🐶', '🐱', '🦊', '🐝', '🌵'],
  gestures: ['👋', '🤙', '✌️', '🤞', '🫶', '👏', '🤲', '💅', '🫵', '☝️', '✋', '🖐️', '🤘', '🫰', '👌'],
  sports: ['⚽', '🏀', '🎾', '🏐', '🏈', '🏊', '🚴', '🎯', '🥊', '🏆', '🎳', '⛷️', '🏄', '🤸', '🧗'],
  symbols: ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '🅰️', '🅱️', '➡️', '⬅️', '🔄', '⬆️', '⬇️', '🔗', '⚡', '♻️'],
} as const;

export type EmojiCategoryKey = keyof typeof EMOJI_CATEGORIES;
