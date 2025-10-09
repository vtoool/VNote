import {
  Card,
  FieldValue,
  QuestionFieldState,
  QuestionVariant,
  ScriptInput,
  ScriptQuestion
} from './storage'
import { createId } from './id'
import { DEFAULT_CARD_WIDTH } from './canvasLayout'

function cloneFieldValue(value: FieldValue): FieldValue {
  if (Array.isArray(value)) {
    return [...value]
  }
  if (typeof value === 'object' && value !== null) {
    return JSON.parse(JSON.stringify(value))
  }
  return value
}

export function initializeFieldState(input: ScriptInput): QuestionFieldState {
  let value: FieldValue
  switch (input.type) {
    case 'checkbox':
      value = Boolean(input.defaultValue)
      break
    case 'multiSelect':
    case 'tags':
      value = Array.isArray(input.defaultValue) ? [...input.defaultValue] : []
      break
    case 'number':
      value = typeof input.defaultValue === 'number' ? input.defaultValue : null
      break
    default:
      value =
        typeof input.defaultValue === 'string'
          ? input.defaultValue
          : input.defaultValue == null
            ? ''
            : String(input.defaultValue)
  }
  return { ...input, value }
}

interface CreateQuestionCardOptions {
  question: ScriptQuestion
  variant: QuestionVariant
  answer?: string
  extraTags?: string[]
  fields?: QuestionFieldState[]
  position?: { x: number; y: number }
}

export function createQuestionCard({
  question,
  variant,
  answer = '',
  extraTags = [],
  fields,
  position
}: CreateQuestionCardOptions): Card {
  const now = new Date().toISOString()
  const normalizedTags = Array.from(
    new Set([
      'question',
      ...question.tags.map((tag) => tag.toLowerCase()),
      ...extraTags.map((tag) => tag.toLowerCase())
    ])
  )

  const resolvedFields = fields
    ? fields.map((field) => ({ ...field, value: cloneFieldValue(field.value) }))
    : question.inputs?.map((input) => initializeFieldState(input))

  return {
    id: createId('card'),
    type: 'question',
    title: question.label,
    content: variant.text,
    answer,
    variants: question.variants.map((option) => ({ ...option })),
    tags: normalizedTags,
    questionId: question.id,
    fields: resolvedFields,
    pinned: false,
    locked: false,
    color: '#e0e7ff',
    priority: 'medium',
    x: position?.x ?? 0,
    y: position?.y ?? 0,
    width: DEFAULT_CARD_WIDTH,
    createdAt: now,
    updatedAt: now
  }
}
