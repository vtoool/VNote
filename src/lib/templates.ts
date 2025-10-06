import { Template } from './storage'
import { createId } from './id'

function variants(base: string[]): any[] {
  return base.map((text, index) => ({
    id: createId('variant'),
    text,
    tone: index === 0 ? 'warm' : index === 1 ? 'curious' : 'direct'
  }))
}

const travelAgentScript = {
  id: createId('script'),
  title: 'Travel Agent Discovery',
  sections: [
    {
      id: createId('section'),
      title: 'Context',
      cues: 'Warm welcome and purpose',
      questions: [
        {
          id: createId('question'),
          label: 'What prompted your travel plans?',
          tags: ['context'],
          timeboxSeconds: 60,
          variants: variants([
            "Out of curiosity, what sparked the idea for this trip?",
            'In your words, what brings you to plan this getaway now?',
            'What’s the key driver for this travel plan?'
          ])
        },
        {
          id: createId('question'),
          label: 'Who is traveling?',
          tags: ['context'],
          variants: variants([
            'Who will be joining you on this journey?',
            'Who should we make this adventure perfect for?',
            'Who’s on the manifest so far?'
          ])
        }
      ]
    },
    {
      id: createId('section'),
      title: 'Route & Cabin',
      cues: 'Explore logistics',
      questions: [
        {
          id: createId('question'),
          label: 'Any must-visit stops?',
          tags: ['route'],
          variants: variants([
            'Are there spots that are absolutely on your list?',
            'Is there anywhere you’d love to weave into the journey?',
            'Any must-haves for the route?'
          ])
        },
        {
          id: createId('question'),
          label: 'Comfort preferences',
          tags: ['comfort'],
          variants: variants([
            'How do you imagine the cabin or seats feeling?',
            'What does comfort look like for you in transit?',
            'Any non-negotiables for how you travel?'
          ])
        }
      ]
    },
    {
      id: createId('section'),
      title: 'Budget & Flexibility',
      cues: 'Calibrate expectations',
      questions: [
        {
          id: createId('question'),
          label: 'Budget guardrails',
          tags: ['budget'],
          variants: variants([
            'What budget range feels good for this experience?',
            'Where would you like to keep the investment?',
            'What’s the comfortable spend ceiling?'
          ])
        }
      ]
    },
    {
      id: createId('section'),
      title: 'Decision Process',
      cues: 'Understand timeline',
      questions: [
        {
          id: createId('question'),
          label: 'Decision makers',
          tags: ['decision'],
          variants: variants([
            'Who else weighs in on the final go-ahead?',
            'Who helps you greenlight the itinerary?',
            'Anyone else we should keep in the loop?'
          ])
        }
      ]
    },
    {
      id: createId('section'),
      title: 'Compliance/Security',
      cues: 'Travel requirements',
      questions: [
        {
          id: createId('question'),
          label: 'Special requirements',
          tags: ['compliance'],
          variants: variants([
            'Are there compliance or documentation needs we should respect?',
            'Any security notes we should keep in mind?',
            'What paperwork or policies should we prepare for?'
          ])
        }
      ]
    },
    {
      id: createId('section'),
      title: 'Next Steps',
      cues: 'Summarize plan',
      questions: [
        {
          id: createId('question'),
          label: 'Wrap-up',
          tags: ['next'],
          variants: variants([
            'What would feel like a great next step from here?',
            'How would you like us to follow up after this?',
            'What’s the ideal action you’d like to see next?'
          ])
        }
      ]
    }
  ]
}

const saasScript = {
  id: createId('script'),
  title: 'B2B SaaS Discovery',
  sections: [
    {
      id: createId('section'),
      title: 'Snapshot',
      cues: 'Set context',
      questions: [
        {
          id: createId('question'),
          label: 'Current tools',
          tags: ['context'],
          timeboxSeconds: 45,
          variants: variants([
            'Walk me through the stack you’re using today.',
            'What tools are powering this part of the business now?',
            'What’s the current setup look like on your side?'
          ])
        },
        {
          id: createId('question'),
          label: 'Trigger event',
          tags: ['pain'],
          variants: variants([
            'What happened that made exploring options urgent?',
            'Was there a moment that kicked off the search?',
            'What changed recently that prompted this conversation?'
          ])
        }
      ]
    },
    {
      id: createId('section'),
      title: 'Impact',
      cues: 'Dig deeper',
      questions: [
        {
          id: createId('question'),
          label: 'Business impact',
          tags: ['impact'],
          variants: variants([
            'What happens if this stays as-is for another quarter?',
            'How does this ripple across the team today?',
            'What’s the downstream effect if nothing changes?'
          ])
        }
      ]
    },
    {
      id: createId('section'),
      title: 'Requirements',
      cues: 'Must-haves',
      questions: [
        {
          id: createId('question'),
          label: 'Critical capabilities',
          tags: ['req'],
          variants: variants([
            'What absolutely needs to be true for this to work?',
            'What boxes do we have to tick without fail?',
            'What would make this a non-starter if missing?'
          ])
        }
      ]
    },
    {
      id: createId('section'),
      title: 'Objections',
      cues: 'Surface concerns',
      questions: [
        {
          id: createId('question'),
          label: 'Possible blockers',
          tags: ['objection'],
          variants: variants([
            'What concerns might come up from your stakeholders?',
            'Any objections you’ve heard internally so far?',
            'Where do you expect pushback?'
          ])
        }
      ]
    },
    {
      id: createId('section'),
      title: 'Next Steps',
      cues: 'Align on path',
      questions: [
        {
          id: createId('question'),
          label: 'Decision timeline',
          tags: ['next'],
          variants: variants([
            'When would you ideally make a decision?',
            'What does the path to a yes look like?',
            'When do you want this up and running?'
          ])
        }
      ]
    }
  ]
}

const supportScript = {
  id: createId('script'),
  title: 'Support Triage',
  sections: [
    {
      id: createId('section'),
      title: 'Snapshot',
      cues: 'Understand the issue quickly',
      questions: [
        {
          id: createId('question'),
          label: 'Issue summary',
          tags: ['context'],
          variants: variants([
            'In your words, what seems to be happening?',
            'What’s the quick version of the issue you’re seeing?',
            'Give me the headline of what you’re running into.'
          ])
        }
      ]
    },
    {
      id: createId('section'),
      title: 'Impact',
      cues: 'Gauge severity',
      questions: [
        {
          id: createId('question'),
          label: 'Effect on work',
          tags: ['impact'],
          variants: variants([
            'How is this slowing you down today?',
            'What can’t you get done because of this?',
            'What’s the ripple effect on your customers or team?'
          ])
        }
      ]
    },
    {
      id: createId('section'),
      title: 'Next Steps',
      cues: 'Close with clarity',
      questions: [
        {
          id: createId('question'),
          label: 'Follow-up',
          tags: ['next'],
          variants: variants([
            'What does success look like once we resolve this?',
            'What should we keep you posted on as we work?',
            'How would you like updates from here?'
          ])
        }
      ]
    }
  ]
}

export const builtInTemplates: Template[] = [
  {
    id: createId('template'),
    name: 'Travel Agent Discovery',
    description: 'Guide travelers through planning with warmth and precision.',
    script: travelAgentScript,
    personalBullets: ['Confirm traveler names', 'Verify loyalty programs', 'Capture must-haves']
  },
  {
    id: createId('template'),
    name: 'B2B SaaS Discovery',
    description: 'Dig into pains, impact, and decision process for SaaS buyers.',
    script: saasScript,
    personalBullets: ['Ask about existing contracts', 'Note integration requirements', 'Capture security questions']
  },
  {
    id: createId('template'),
    name: 'Support Triage',
    description: 'Keep support conversations calm and focused on next steps.',
    script: supportScript,
    personalBullets: ['Document environment details', 'Check recent changes', 'Offer follow-up time']
  }
]
