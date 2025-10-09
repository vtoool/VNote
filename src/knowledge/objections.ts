import type { ObjectionPlaybookEntry } from '../engine/types'

export const OBJECTION_LIBRARY: ObjectionPlaybookEntry[] = [
  {
    category: 'price',
    summary: 'Budget or price resistance around investing in VNote.',
    triggers: ['expensive', 'budget', 'cost', 'pricing'],
    counters: [
      'Anchor the ROI: highlight saved ramp time and fewer lost deals from better note capture.',
      'Reframe the spend as a pilot: position a 90-day rollout with measurable milestones.',
      'Bundle enablement value: pair pricing with coaching templates and success resources.'
    ],
    followUps: [
      'What does success look like for this initiative and how are you measuring it today?',
      'If we could prove a 3x return in the first quarter, who else would need to see that business case?'
    ]
  },
  {
    category: 'timing',
    summary: 'Customer hesitates because of competing priorities or timing.',
    triggers: ['later', 'not now', 'next quarter', 'timing'],
    counters: [
      'Isolate the blocker: ask which priority would be displaced and what solving this unlocks.',
      'Introduce a phased start: propose starting with a focused team to build the win story.',
      'Highlight cost of inaction: quantify meetings lost without shared discovery notes.'
    ],
    followUps: [
      'What deadline is driving your current priority stack?',
      'Who owns the initiative that would be impacted if we paused for 30 days to validate this?'
    ]
  },
  {
    category: 'authority',
    summary: 'Champion lacks full decision power or needs internal buy-in.',
    triggers: ['need approval', 'my boss', 'committee', 'sign-off'],
    counters: [
      'Co-build the business case: offer a short deck tailored for the executive sponsor.',
      'Map the buying circle: confirm influencers and blockers across RevOps, Enablement, and IT.',
      'Share proof points: cite similar teams that gained faster onboarding or deal velocity.'
    ],
    followUps: [
      'Who will ask the toughest question about this change, and how do we get ahead of it?',
      'What criteria will the buying group use to green-light this project?'
    ]
  },
  {
    category: 'need',
    summary: 'Prospect unclear on urgency or sees current workflow as “good enough.”',
    triggers: ['already have', 'good enough', 'status quo', 'maybe later'],
    counters: [
      'Surface hidden friction: spotlight manual follow-up gaps and scattered notes.',
      'Storytell wins: share customer anecdotes tied to rep ramp, conversion, or CSAT gains.',
      'Quantify leakage: calculate deals slipping through because discovery data is siloed.'
    ],
    followUps: [
      'When was the last time a deal stalled because discovery notes were incomplete?',
      'How do you coach new reps today without a shared discovery history?'
    ]
  },
  {
    category: 'risk',
    summary: 'Concerns around implementation effort, change management, or data security.',
    triggers: ['security', 'implementation', 'change management', 'risky'],
    counters: [
      'Outline the launch plan: clarify onboarding checklist, timeline, and success roles.',
      'De-risk security: point to SOC2, data residency, and permission controls in place.',
      'Provide social proof: mention customer testimonials about smooth deployment.'
    ],
    followUps: [
      'Who needs to review the security brief before we continue?',
      'What internal change has gone well recently, and what made it work?'
    ]
  }
]
