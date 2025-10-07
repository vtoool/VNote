import { saveAs } from 'file-saver'
import { Canvas, Card, Project, Template, QuestionFieldState } from './storage'

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

function collectBusinessTicketsFields(project: Project) {
  const fieldMap = new Map<string, QuestionFieldState>()
  project.canvases.forEach((canvas) => {
    canvas.cards.forEach((card) => {
      if (card.type === 'question') {
        card.fields?.forEach((field) => {
          fieldMap.set(field.id, field)
        })
      }
    })
  })
  return fieldMap
}

const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
})

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric'
})

function optionLabel(field: QuestionFieldState): string | undefined {
  if (typeof field.value !== 'string') return undefined
  return field.options?.find((option) => option.value === field.value)?.label ?? field.value
}

function formatCurrencyValue(value: QuestionFieldState['value']): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return currencyFormatter.format(value)
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return '—'
    const numeric = Number(trimmed.replace(/[^0-9.]/g, ''))
    if (!Number.isNaN(numeric) && numeric > 0) {
      return currencyFormatter.format(numeric)
    }
    return trimmed
  }
  return '—'
}

function formatDateValue(value: QuestionFieldState['value']): string {
  if (typeof value !== 'string' || !value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }
  return dateFormatter.format(parsed)
}

function formatFieldValue(field?: QuestionFieldState): string {
  if (!field) return '—'
  switch (field.type) {
    case 'checkbox':
      return field.value ? 'Yes' : 'No'
    case 'select':
      return optionLabel(field) ?? '—'
    case 'multiSelect':
    case 'tags':
      return Array.isArray(field.value) && field.value.length ? field.value.join(', ') : '—'
    case 'number':
      return typeof field.value === 'number' && Number.isFinite(field.value) ? String(field.value) : '—'
    case 'currency':
      return formatCurrencyValue(field.value)
    case 'date':
      return formatDateValue(field.value)
    case 'time':
      return typeof field.value === 'string' && field.value ? field.value : '—'
    case 'longText':
    case 'shortText':
    case 'email':
    case 'phone':
      return typeof field.value === 'string' && field.value.trim() ? field.value.trim() : '—'
    default:
      return typeof field.value === 'string' && field.value.trim() ? field.value.trim() : '—'
  }
}

function fieldString(field?: QuestionFieldState): string {
  const formatted = formatFieldValue(field)
  return formatted === '—' ? '' : formatted
}

function fieldArray(field?: QuestionFieldState): string[] {
  if (!field) return []
  if (Array.isArray(field.value)) return field.value
  return []
}

function buildBusinessTicketsSummary(project: Project): string[] {
  const fieldMap = collectBusinessTicketsFields(project)
  const getField = (id: string) => fieldMap.get(id)
  const lines: string[] = []

  lines.push(`- Name → ${formatFieldValue(getField('customer_name'))}`)

  const historyField = getField('history_status')
  const priorAgent = fieldString(getField('prior_agent'))
  let historySummary = '—'
  if (historyField) {
    if (historyField.value === 'yes') {
      const base = optionLabel(historyField) ?? 'Yes'
      historySummary = priorAgent ? `${base} • ${priorAgent}` : base
    } else if (historyField.value === 'no') {
      historySummary = 'First-time caller'
    } else if (historyField.value === 'unsure') {
      historySummary = 'Not sure'
    } else {
      historySummary = formatFieldValue(historyField)
    }
  }
  lines.push(`- History with us → ${historySummary}`)

  const sourceLabel = formatFieldValue(getField('source_channel'))
  const refAgent = fieldString(getField('ref_agent'))
  lines.push(`- Source → ${sourceLabel}${refAgent ? ` (${refAgent})` : ''}`)

  const fromAirport = fieldString(getField('from_airport')) || '—'
  const toAirport = fieldString(getField('to_airport')) || '—'
  const outboundDate = formatFieldValue(getField('out_date'))
  const returnDate = formatFieldValue(getField('return_date'))
  const tripType = formatFieldValue(getField('itinerary_type'))
  lines.push(`- Route/Dates → ${fromAirport} → ${toAirport}, ${outboundDate} / ${returnDate} (${tripType})`)

  const dateFlex = formatFieldValue(getField('date_flex_range'))
  const dateFlexNotes = fieldString(getField('date_flex_notes'))
  const departAlternates = fieldArray(getField('alt_depart_airports'))
  const arriveAlternates = fieldArray(getField('alt_arrive_airports'))
  const airportNotes = fieldString(getField('airport_flex_notes'))
  const airportParts: string[] = []
  if (departAlternates.length) {
    airportParts.push(`Depart: ${departAlternates.join('/')}`)
  }
  if (arriveAlternates.length) {
    airportParts.push(`Arrive: ${arriveAlternates.join('/')}`)
  }
  let airportsSummary = airportParts.join('; ')
  if (!airportsSummary) airportsSummary = '—'
  if (airportNotes) {
    airportsSummary = [airportsSummary !== '—' ? airportsSummary : '', airportNotes].filter(Boolean).join(' • ')
    if (!airportsSummary) airportsSummary = airportNotes
  }
  const dateFlexSummary = dateFlexNotes ? `${dateFlex} (${dateFlexNotes})` : dateFlex
  lines.push(`- Flexibility → dates ${dateFlexSummary}, airports ${airportsSummary}`)

  const adultField = getField('adult_count')
  const childField = getField('child_count')
  const adultCount = typeof adultField?.value === 'number' && Number.isFinite(adultField.value) ? adultField.value : '—'
  const childCount = typeof childField?.value === 'number' && Number.isFinite(childField.value) ? childField.value : '—'
  const childAges = fieldString(getField('child_ages')) || '—'
  lines.push(`- Pax → ${adultCount} adults, ${childCount} children (${childAges})`)

  const cabin = formatFieldValue(getField('cabin_preference'))
  const usualCabin = formatFieldValue(getField('usual_cabin'))
  const firstUpgrade = formatFieldValue(getField('consider_first_upgrade'))
  const mixedCabin = formatFieldValue(getField('mixed_cabin_ok'))
  const cabinExtras = firstUpgrade !== '—' ? `; first upgrade? ${firstUpgrade}` : ''
  lines.push(`- Cabin → ${cabin}, usual ${usualCabin}, mixed-cabin OK: ${mixedCabin}${cabinExtras}`)

  const preferredAirlines = formatFieldValue(getField('preferred_airlines'))
  const avoidAirlines = formatFieldValue(getField('avoid_airlines'))
  const priorExperience = fieldString(getField('route_experience')) || formatFieldValue(getField('airline_notes'))
  lines.push(`- Airline prefs/avoids → ${preferredAirlines}/${avoidAirlines}; prior exp: ${priorExperience || '—'}`)

  const milesMatter = formatFieldValue(getField('miles_important'))
  const programs = formatFieldValue(getField('ffp_programs'))
  const skipMiles = formatFieldValue(getField('ok_to_skip_miles'))
  lines.push(`- Miles → important ${milesMatter}, programs ${programs}; ok to skip for price: ${skipMiles}`)

  const stops = formatFieldValue(getField('max_stops'))
  const minLayover = formatFieldValue(getField('min_layover'))
  const maxLayover = formatFieldValue(getField('max_layover'))
  const maxTravel = formatFieldValue(getField('max_travel_time'))
  lines.push(`- Stops/Timing → stops ${stops}, layover ${minLayover}-${maxLayover}, max total ${maxTravel}`)

  const separateTickets = formatFieldValue(getField('separate_ticket_ok'))
  lines.push(`- Tradeoffs → separate tickets ${separateTickets}`)

  lines.push(`- Preferences → ${formatFieldValue(getField('must_haves'))}`)

  const wantDetails = formatFieldValue(getField('want_details'))
  const detailFacets = formatFieldValue(getField('detail_facets'))
  const detailSummary = detailFacets !== '—' ? `${wantDetails} (${detailFacets})` : wantDetails
  lines.push(`- Presentation detail level → ${detailSummary}`)

  const bestPrice = fieldString(getField('best_price_seen')) || '—'
  const whereSeen = fieldString(getField('where_seen'))
  const marketNotes = fieldString(getField('market_notes'))
  let marketSummary = bestPrice
  if (whereSeen) marketSummary += ` @ ${whereSeen}`
  if (marketNotes) marketSummary += ` • ${marketNotes}`
  lines.push(`- Market knowledge → ${marketSummary}`)

  const minBudget = formatFieldValue(getField('min_budget'))
  const maxBudget = formatFieldValue(getField('max_budget'))
  lines.push(`- Budget → ${minBudget}–${maxBudget}`)

  const bookingTiming = formatFieldValue(getField('booking_timing'))
  const timingNotes = fieldString(getField('timing_notes'))
  lines.push(`- Booking timing → ${bookingTiming}${timingNotes ? ` (${timingNotes})` : ''}`)

  lines.push(`- Passenger names → ${formatFieldValue(getField('names_raw'))}`)

  const contactEmail = formatFieldValue(getField('contact_email'))
  const contactPhone = formatFieldValue(getField('contact_phone'))
  const smsOk = formatFieldValue(getField('sms_ok'))
  lines.push(`- Contacts → ${contactEmail}, ${contactPhone}, SMS ${smsOk}`)

  lines.push(`- Recap → ${formatFieldValue(getField('recap'))}`)

  const callbackTime = formatFieldValue(getField('callback_time'))
  const agreeCallback = formatFieldValue(getField('agree_callback'))
  const followUp = fieldString(getField('send_company_info'))
  lines.push(`- Next step → callback ~${callbackTime}, agreed: ${agreeCallback}${followUp ? `; send: ${followUp}` : ''}`)

  return lines
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
  if (project.script.title === 'Business Tickets Discovery') {
    lines.push('## Q & A (Guided)')
    lines.push('')
    lines.push(...buildBusinessTicketsSummary(project))
    lines.push('')
  }
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
