const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'

export function createId(prefix = ''): string {
  const random = Array.from({ length: 8 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('')
  return `${prefix}${prefix ? '-' : ''}${random}`
}
