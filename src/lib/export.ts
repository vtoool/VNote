import { saveAs } from 'file-saver'
import { Canvas, Card, Project, Template } from './storage'

function formatCard(card: Card): string {
  const header = `- [${card.type.toUpperCase()}] ${card.title || 'Untitled'}\n`
  const body = card.content ? `  ${card.content.replace(/\n/g, '\n  ')}\n` : ''
  let extra = ''
  if (card.type === 'checklist') {
    extra = card.checklist.map((item) => `  - [${item.completed ? 'x' : ' '}] ${item.text}`).join('\n')
    if (extra) extra += '\n'
  }
  if (card.type === 'question') {
    extra = `  Answer: ${card.answer || '—'}\n`
  }
  if (card.type === 'media' && card.dataUrl) {
    extra += `  Media attached (${Math.round(card.dataUrl.length / 1024)}kb)\n`
  }
  return header + body + extra
}

export function exportProjectToJson(project: Project) {
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' })
  saveAs(blob, `${project.name.replace(/\s+/g, '-')}-${new Date().toISOString()}.json`)
}

export function exportProjectToText(project: Project) {
  const lines: string[] = []
  lines.push(`# ${project.name}`)
  lines.push(`Last updated: ${new Date(project.updatedAt).toLocaleString()}`)
  lines.push('')
  project.canvases.forEach((canvas) => {
    lines.push(`## Canvas: ${canvas.name}`)
    canvas.frames.forEach((frame) => {
      lines.push(`### Frame: ${frame.name}`)
    })
    canvas.cards.forEach((card) => {
      lines.push(formatCard(card))
    })
    lines.push('')
  })
  const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' })
  saveAs(blob, `${project.name.replace(/\s+/g, '-')}-${new Date().toISOString()}.md`)
}

export function exportTemplates(templates: Template[]) {
  const blob = new Blob([JSON.stringify(templates, null, 2)], { type: 'application/json' })
  saveAs(blob, `templates-${new Date().toISOString()}.json`)
}

export function serializeCanvas(canvas: Canvas): string {
  return JSON.stringify(canvas)
}
