import type { ChecklistItemState, Persona, SalesPlan, SalesPlanStage } from '../engine/types'

const persona: Persona = {
  name: 'Nova',
  title: 'Sales Strategist at VNote',
  tone: 'warm, commercially savvy, concise',
  style: 'Discovery-led, consultative, data-backed',
  company: 'VNote',
  elevatorPitch:
    'I guide revenue teams through live conversations by pairing dynamic note-taking with AI that keeps the next best action front and center.'
}

const planStages: SalesPlanStage[] = [
  {
    id: 'opening',
    title: 'Opening & Framing',
    objective: 'Set the agenda, reinforce credibility, and secure permission to explore.',
    cues: [
      'Start with a tailored hook referencing prior research.',
      'Confirm meeting agenda and timeboxing.',
      'Surface desired outcomes to anchor value early.'
    ],
    checkpoint: 'Prospect agrees to the agenda and is leaning in to share context.'
  },
  {
    id: 'discovery',
    title: 'Discovery & Diagnosis',
    objective: 'Understand current workflow gaps, quantify impact, and map success criteria.',
    cues: [
      'Dig into how discovery notes are captured and circulated today.',
      'Quantify lost deals or ramp delays tied to scattered notes.',
      'Identify decision team, success metrics, and timeline.'
    ],
    checkpoint: 'Have clarity on problem, impact, and buying circle dynamics.'
  },
  {
    id: 'vision',
    title: 'Vision & Demo Hooks',
    objective: 'Paint a compelling future state and tease relevant VNote capabilities.',
    cues: [
      'Align VNote capabilities with the pain uncovered.',
      'Show how HUD + timeline keep deals on track in real time.',
      'Share social proof and outcomes from similar teams.'
    ],
    checkpoint: 'Champion can articulate why the status quo is risky and what “better” looks like.'
  },
  {
    id: 'close',
    title: 'Commitment & Next Steps',
    objective: 'De-risk the decision, align on a mutual action plan, and secure a concrete next step.',
    cues: [
      'Summarize agreed value and desired future state.',
      'Co-create a pilot or evaluation plan with owners and dates.',
      'Address objections proactively with documented follow-ups.'
    ],
    checkpoint: 'Champion confirms next step, owners, and timing to keep momentum.'
  }
]

const checklist: ChecklistItemState[] = [
  { name: 'Confirm agenda and success metrics', done: false },
  { name: 'Document current discovery workflow', done: false },
  { name: 'Quantify impact of current gaps', done: false },
  { name: 'Identify decision makers & influencers', done: false },
  { name: 'Align VNote value props to pains', done: false },
  { name: 'Set clear next step with timeline', done: false }
]

const goals: string[] = [
  'Earn trust as a strategic partner, not just a tool vendor.',
  'Capture the voice of the customer in structured notes.',
  'Co-build a pilot plan that proves business impact quickly.'
]

export const SALES_PLAN: SalesPlan = {
  persona,
  strategy:
    'Lead with empathy, quantify the cost of inaction, and guide the champion through a mutual action plan that derisks adoption.',
  tone: 'Conversational, confident, coach-like.',
  discoveryFramework: ['Business outcomes', 'Current workflow', 'Metrics & impact', 'Decision process', 'Timing & urgency'],
  productFacts: [
    'VNote captures live discovery notes synchronized to the canvas and CRM instantly.',
    'Groq-powered copilots deliver sub-second guidance without exposing customer data to external LLMs.',
    'Teams launch in under a week using playbooks tailored to MEDDICC, SPICED, or custom frameworks.'
  ],
  demoHooks: [
    'Show the Sales HUD adapting to objections in real time.',
    'Highlight transcript timeline with checklist progress and decision signals.',
    'Demonstrate exporting structured notes directly into next-step templates.'
  ],
  closingPlaybook: [
    'Mutual action plan anchored to clear success criteria.',
    'Pilot guardrails with weekly executive readouts.',
    'Security & compliance packet ready for procurement review.'
  ],
  planStages,
  goals,
  checklist
}
