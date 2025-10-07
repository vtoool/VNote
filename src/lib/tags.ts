export const quickTags = ['pain', 'impact', 'req', 'objection', 'next'] as const

export type QuickTag = typeof quickTags[number]
