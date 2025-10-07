import { Template, Script, QuestionVariant } from './storage'
import { createId } from './id'

function variants(base: string[]): QuestionVariant[] {
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

const firstContactChecklistItems = [
  'Introduce self + Business-Tickets; share why you’re calling',
  'Confirm traveler’s name and spelling (NATO if needed)',
  'Ask if this is their first time working with us',
  'Capture how they found us / referral source',
  'Confirm From, To, Dates, and OW/RT structure',
  'Log date flexibility in both directions',
  'Check airport flexibility for departure and arrival',
  'Note passenger count; gather children and ages',
  'Confirm preferred cabin and usual cabin',
  'Record airline preferences and reasons',
  'Record airline dislikes and reasons',
  'Capture prior route or carrier experience',
  'Document miles importance and programs',
  'Set limits for max stops, layovers, and total travel time',
  'Verify mixed-cabin on short legs acceptable',
  'Verify separate tickets acceptable',
  'List specific timing or routing preferences',
  'Note desired detail level when presenting options',
  'Capture market knowledge / best offer seen so far',
  'Document budget range',
  'Record booking timing expectations',
  'Collect full passenger names as on passport',
  'Recap key details back to the caller',
  'Confirm best email/phone and SMS permission',
  'Re-introduce self; set research & follow-up expectation',
  'Mention info email; schedule next call and commit to time'
]

const businessTicketsScript: Script = {
  id: createId('script'),
  title: 'Business Tickets Discovery',
  sections: [
    {
      id: createId('section'),
      title: 'Greeting & Consent',
      cues: '~30 sec • open warmly and confirm time to chat',
      questions: [
        {
          id: createId('question'),
          label: 'Quick intro + consent',
          tags: ['Identity'],
          variants: variants([
            "Hello, this is {agent}, a travel manager at Business-Tickets.com where you requested an airline ticket. Is this a good time to talk?",
            "Hi, my name is {agent} with Business-Tickets.com following up on your ticket request. Do you have a moment now?",
            "Good day, {agent} here from Business-Tickets.com about your airfare inquiry. Is now still convenient to chat?"
          ]),
          inputs: [
            {
              id: 'consent_to_chat',
              label: 'Caller confirmed they can talk now',
              type: 'checkbox',
              description: 'Mark once the traveler gives the go-ahead to proceed.'
            }
          ]
        }
      ]
    },
    {
      id: createId('section'),
      title: 'Identity & Relationship',
      cues: '~2 min • confirm how to address them and prior context',
      questions: [
        {
          id: createId('question'),
          label: 'Preferred name',
          tags: ['Identity'],
          variants: variants([
            'May I have your name please—how should I address you?',
            'Could you confirm how I should address you during the call?',
            'To make sure I note it correctly, what name would you like me to use?'
          ]),
          inputs: [
            {
              id: 'customer_name',
              label: 'Traveler name',
              type: 'shortText',
              placeholder: 'Full name or nickname to use'
            }
          ]
        },
        {
          id: createId('question'),
          label: 'History with Business-Tickets',
          tags: ['Identity'],
          variants: variants([
            'Have you worked with Business-Tickets.com before, or is this your first time calling?',
            'Is this your first time working with Business-Tickets.com or have we helped you previously?',
            'Have you spoken with anyone at Business-Tickets.com before, and do you recall who assisted you?'
          ]),
          inputs: [
            {
              id: 'history_status',
              label: 'Worked with us before',
              type: 'select',
              options: [
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
                { value: 'unsure', label: 'Not sure' }
              ]
            },
            {
              id: 'prior_agent',
              label: 'Prior agent name',
              type: 'shortText',
              placeholder: 'Who did they work with?'
            },
            {
              id: 'routing_preference',
              label: 'Preference on who assists',
              type: 'select',
              options: [
                { value: 'keep_agent', label: 'Stay with the same agent if possible' },
                { value: 'any_agent', label: 'Happy with anyone on the team' },
                { value: 'agent_unavailable', label: 'Open if prior agent is unavailable' },
                { value: 'no_preference', label: 'No preference' }
              ]
            }
          ]
        },
        {
          id: createId('question'),
          label: 'How they found us',
          tags: ['Source'],
          variants: variants([
            'How did you hear about Business-Tickets.com?',
            'Did someone refer you to Business-Tickets.com, or did you find us another way?',
            'Just so I note it correctly, how did Business-Tickets.com come to your attention?'
          ]),
          inputs: [
            {
              id: 'source_channel',
              label: 'Discovery channel',
              type: 'select',
              options: [
                { value: 'google', label: 'Google' },
                { value: 'ads', label: 'Ads / social' },
                { value: 'referral_company', label: 'Referral to the company' },
                { value: 'referral_agent', label: 'Referral to a specific agent' },
                { value: 'repeat', label: 'Repeat client' },
                { value: 'other', label: 'Other source' }
              ]
            },
            {
              id: 'ref_agent',
              label: 'Referring agent or contact',
              type: 'shortText',
              placeholder: 'Name of referrer if shared',
              description: 'Highlight if they expect a warm handoff to a specific advisor.'
            }
          ]
        }
      ]
    },
    {
      id: createId('section'),
      title: 'Trip Blueprint',
      cues: '~8–10 min • route, schedule, and flexibility',
      questions: [
        {
          id: createId('question'),
          label: 'Trip snapshot',
          tags: ['Trip'],
          variants: variants([
            'Let me confirm the itinerary: you’re flying from _____ to _____ on _____ and returning on _____. Does that look right?',
            'I want to double-check the trip details—departing from _____ to _____ on _____ with the return on _____. Is that correct?',
            'To make sure I have it accurate: departing _____ to _____ on _____ and returning _____; is that the plan?'
          ]),
          inputs: [
            { id: 'from_airport', label: 'Origin airport', type: 'shortText', placeholder: 'e.g., JFK' },
            { id: 'to_airport', label: 'Destination airport', type: 'shortText', placeholder: 'e.g., SIN' },
            { id: 'out_date', label: 'Outbound date', type: 'date' },
            { id: 'return_date', label: 'Return date', type: 'date', description: 'Leave blank for one-way.' },
            {
              id: 'itinerary_type',
              label: 'Trip type',
              type: 'select',
              options: [
                { value: 'ow', label: 'One-way' },
                { value: 'rt', label: 'Round trip' },
                { value: 'oj', label: 'Open-jaw / multi-city' }
              ]
            }
          ]
        },
        {
          id: createId('question'),
          label: 'Date flexibility',
          tags: ['Flexibility'],
          variants: variants([
            'Are your travel dates flexible if I find a better fare or itinerary?',
            'If the price is better, how much flexibility do you have on the departure or return dates?',
            'Would you be able to move your dates slightly if it helped secure a better deal?'
          ]),
          inputs: [
            {
              id: 'date_flex_range',
              label: 'Date flexibility',
              type: 'select',
              options: [
                { value: 'none', label: 'No flexibility' },
                { value: 'plusminus1', label: '±1 day' },
                { value: 'plusminus3', label: '±2–3 days' },
                { value: 'plusminus7', label: '±1 week' }
              ]
            },
            {
              id: 'date_flex_notes',
              label: 'Notes on flexibility',
              type: 'shortText',
              placeholder: 'Blackout dates or key events'
            }
          ]
        },
        {
          id: createId('question'),
          label: 'Airport flexibility',
          tags: ['Flexibility'],
          variants: variants([
            'Is your departure or arrival airport flexible if it helps with the fare?',
            'Would you consider alternate airports for departure or arrival to improve options?',
            'Are there nearby airports you would be open to if it leads to better availability?'
          ]),
          inputs: [
            {
              id: 'alt_depart_airports',
              label: 'Alternate departure airports',
              type: 'tags',
              placeholder: 'List codes like EWR, LGA'
            },
            {
              id: 'alt_arrive_airports',
              label: 'Alternate arrival airports',
              type: 'tags',
              placeholder: 'List codes like HND, NGO'
            },
            {
              id: 'airport_flex_notes',
              label: 'Airport notes',
              type: 'longText',
              placeholder: 'Any strict avoids or must-use airports'
            }
          ]
        }
      ]
    },
    {
      id: createId('section'),
      title: 'Travel Party & Cabin',
      cues: '~6 min • travelers, comfort, and loyalty',
      questions: [
        {
          id: createId('question'),
          label: 'Passengers',
          tags: ['Pax', 'Passengers'],
          variants: variants([
            'How many passengers will be traveling?',
            'Who is taking the trip, and are there any children traveling?',
            'Can you confirm the passenger count and let me know if there are any children with ages?'
          ]),
          inputs: [
            { id: 'adult_count', label: 'Adults', type: 'number', placeholder: 'Number of adults' },
            { id: 'child_count', label: 'Children', type: 'number', placeholder: 'Number of children' },
            { id: 'child_ages', label: 'Children ages', type: 'shortText', placeholder: 'e.g., 3 & 7' }
          ]
        },
        {
          id: createId('question'),
          label: 'Cabin preference',
          tags: ['Cabin', 'Req'],
          variants: variants([
            'What cabin class would you like to book for this trip?',
            'Do you usually travel in that cabin class, or is it specific to this trip?',
            'If I find a good deal in a higher cabin, would you be open to considering it?'
          ]),
          inputs: [
            {
              id: 'cabin_preference',
              label: 'Desired cabin',
              type: 'select',
              options: [
                { value: 'first', label: 'First' },
                { value: 'business', label: 'Business' },
                { value: 'premium', label: 'Premium economy' },
                { value: 'economy', label: 'Economy' }
              ]
            },
            {
              id: 'usual_cabin',
              label: 'Usual cabin',
              type: 'select',
              options: [
                { value: 'same', label: 'Same as this trip' },
                { value: 'different', label: 'Usually different cabin' }
              ]
            },
            {
              id: 'consider_first_upgrade',
              label: 'Consider first class if ~+$1k?',
              type: 'checkbox'
            }
          ]
        },
        {
          id: createId('question'),
          label: 'Airline likes and dislikes',
          tags: ['Airline', 'Preferences'],
          variants: variants([
            'Do you have any airline preferences or airlines you prefer to avoid?',
            'Are there carriers you would like me to prioritize or skip?',
            'Any airlines you’ve had great or poor experiences with that I should note?'
          ]),
          inputs: [
            { id: 'preferred_airlines', label: 'Preferred airlines', type: 'tags', placeholder: 'Add preferred carriers' },
            { id: 'avoid_airlines', label: 'Airlines to avoid', type: 'tags', placeholder: 'Carriers to skip' },
            { id: 'airline_notes', label: 'Notes', type: 'longText', placeholder: 'Reasons or nuances' }
          ]
        },
        {
          id: createId('question'),
          label: 'Route or carrier experience',
          tags: ['Airline'],
          variants: variants([
            'Have you flown with this airline or on this route before? What was the experience like?',
            'Have you traveled to this destination previously, and how did it go?',
            'Any previous experiences on this route or carrier that I should keep in mind?'
          ]),
          inputs: [
            { id: 'route_experience', label: 'Prior experience notes', type: 'longText', placeholder: 'Highlights, misses, lessons learned' }
          ]
        },
        {
          id: createId('question'),
          label: 'Loyalty & miles',
          tags: ['Loyalty'],
          variants: variants([
            'Is it important for you to earn frequent flyer miles on this trip?',
            'Which mileage accounts do you have, and do you need this trip to credit to them?',
            'If we find a better fare on another airline, could you forego the miles?'
          ]),
          inputs: [
            { id: 'miles_important', label: 'Miles matter for this trip', type: 'checkbox' },
            { id: 'ffp_programs', label: 'Programs to credit', type: 'tags', placeholder: 'e.g., SQ PPS, AF Flying Blue' },
            {
              id: 'ok_to_skip_miles',
              label: 'Okay to skip miles if pricing wins',
              type: 'checkbox'
            }
          ]
        }
      ]
    },
    {
      id: createId('section'),
      title: 'Journey Preferences',
      cues: '~5 min • stops, tradeoffs, and presentation style',
      questions: [
        {
          id: createId('question'),
          label: 'Stops & timing guardrails',
          tags: ['Stops', 'Timing'],
          variants: variants([
            'How many stops are you comfortable with if the fare is right?',
            'What is the shortest and longest layover you would consider?',
            'What is the maximum total travel time you would accept?'
          ]),
          inputs: [
            {
              id: 'max_stops',
              label: 'Max stops',
              type: 'select',
              options: [
                { value: 'nonstop', label: '0 (non-stop only)' },
                { value: 'one', label: '1 stop max' },
                { value: 'two', label: '2+ stops okay' }
              ]
            },
            { id: 'min_layover', label: 'Minimum layover', type: 'time' },
            { id: 'max_layover', label: 'Maximum layover', type: 'time' },
            { id: 'max_travel_time', label: 'Max total travel time', type: 'time' }
          ]
        },
        {
          id: createId('question'),
          label: 'Tradeoffs',
          tags: ['Tradeoffs', 'Objection'],
          variants: variants([
            'Would it work if some shorter legs were in a lower cabin to save on the fare?',
            'Would you consider separate tickets—even if it means rechecking bags—if it lowered the price?',
            'Are mixed cabins or separate tickets acceptable when they provide better value?'
          ]),
          inputs: [
            { id: 'mixed_cabin_ok', label: 'Okay with mixed-cabin itineraries', type: 'checkbox' },
            { id: 'separate_ticket_ok', label: 'Okay with separate tickets', type: 'checkbox' },
            { id: 'tradeoff_notes', label: 'Tradeoff notes', type: 'longText', placeholder: 'Any limits or red lines' }
          ]
        },
        {
          id: createId('question'),
          label: 'Specific preferences',
          tags: ['Preferences'],
          variants: variants([
            'Do you have any specific requests or things I should note while building options?',
            'Are there any departure or arrival times, routes, or other details you want me to prioritize?',
            'Is there anything you want to avoid during the trip that I should capture?'
          ]),
          inputs: [
            { id: 'must_haves', label: 'Must-haves / avoids', type: 'longText', placeholder: 'Note timing, routing, or service preferences' }
          ]
        },
        {
          id: createId('question'),
          label: 'How to present options',
          tags: ['Presentation'],
          variants: variants([
            'When I present the options, beyond the itinerary and price, would you like details like aircraft, seats, lounges, or service quality?',
            'Do you prefer a detailed breakdown of features such as cabin type, reputation, and amenities, or just the essentials?',
            'Should I include information about aircraft models, seat types, lounges, and other features when I review the options with you?'
          ]),
          inputs: [
            { id: 'want_details', label: 'Wants detailed breakdown', type: 'checkbox' },
            {
              id: 'detail_facets',
              label: 'Details to include',
              type: 'multiSelect',
              options: [
                { value: 'aircraft', label: 'Aircraft type' },
                { value: 'seat', label: 'Seat / suite type' },
                { value: 'layout', label: 'Cabin layout' },
                { value: 'catering', label: 'Catering' },
                { value: 'lounges', label: 'Lounges' },
                { value: 'airport_ratings', label: 'Airport ratings' }
              ]
            }
          ]
        }
      ]
    },
    {
      id: createId('section'),
      title: 'Market & Budget Signals',
      cues: '~4 min • calibrate offers and urgency',
      questions: [
        {
          id: createId('question'),
          label: 'Market intel',
          tags: ['Market', 'Next'],
          variants: variants([
            'Do you have any current offers you’d like to compare with ours?',
            'Have you researched other travel sites yet, and what was the best deal you found?',
            'What’s the best fare you’ve seen so far, and where did you see it?'
          ]),
          inputs: [
            { id: 'best_price_seen', label: 'Best price seen', type: 'shortText', placeholder: 'e.g., $4,200 RT' },
            { id: 'where_seen', label: 'Where spotted', type: 'shortText', placeholder: 'Agency, OTA, airline, etc.' },
            { id: 'market_notes', label: 'Market notes', type: 'longText', placeholder: 'Strengths or weaknesses of the offer' }
          ]
        },
        {
          id: createId('question'),
          label: 'Budget range',
          tags: ['Budget', 'Req'],
          variants: variants([
            'We work with discounted private fares—what budget range should I target for this trip?',
            'To focus my search, what price range would you be comfortable with?',
            'Would a budget of $___ to $___ work for you, or do you have a specific number in mind?'
          ]),
          inputs: [
            { id: 'min_budget', label: 'Target low end', type: 'currency', placeholder: 'Minimum budget' },
            { id: 'max_budget', label: 'Target high end', type: 'currency', placeholder: 'Stretch budget' },
            { id: 'ok_single_price', label: 'Okay with single target price', type: 'checkbox' }
          ]
        },
        {
          id: createId('question'),
          label: 'Booking timing',
          tags: ['Timing', 'Next'],
          variants: variants([
            'When are you planning to make the booking? Seats do get more expensive as availability drops.',
            'How soon would you like to finalize the booking so I can pace the search appropriately?',
            'What timeline are you working with to confirm the flights?'
          ]),
          inputs: [
            {
              id: 'booking_timing',
              label: 'Booking horizon',
              type: 'select',
              options: [
                { value: 'today', label: 'Today' },
                { value: '1-3-days', label: '1–3 days' },
                { value: 'this-week', label: 'This week' },
                { value: 'later', label: 'Later / just exploring' }
              ]
            },
            { id: 'timing_notes', label: 'Timing notes', type: 'longText', placeholder: 'Decision makers, approvals, etc.' }
          ]
        }
      ]
    },
    {
      id: createId('section'),
      title: 'Passenger & Contact Details',
      cues: '~3 min • accurate names and follow-up info',
      questions: [
        {
          id: createId('question'),
          label: 'Passenger names',
          tags: ['Passengers'],
          variants: variants([
            'Could you provide the passengers’ full names exactly as they appear on the passports?',
            'Please share each traveler’s full passport name so I can lock in the right fares.',
            'May I have the exact spelling of each passenger’s name as per the passport?'
          ]),
          inputs: [
            { id: 'names_raw', label: 'Names as on passport', type: 'longText', placeholder: 'List each traveler' }
          ]
        },
        {
          id: createId('question'),
          label: 'Best contacts',
          tags: ['Contacts'],
          variants: variants([
            'What is the best email address and phone number to reach you for updates?',
            'Could you confirm the best email and phone for follow-ups, and if text messages are okay?',
            'Where should I send the itinerary options, and is the provided phone number good for calls and texts?'
          ]),
          inputs: [
            { id: 'contact_email', label: 'Primary email', type: 'email', placeholder: 'name@company.com' },
            { id: 'contact_phone', label: 'Best phone', type: 'phone', placeholder: '+1 415…' },
            { id: 'sms_ok', label: 'Okay to text updates', type: 'checkbox' }
          ]
        }
      ]
    },
    {
      id: createId('section'),
      title: 'Recap & Next Steps',
      cues: '~2 min • confirm summary and follow-up plan',
      questions: [
        {
          id: createId('question'),
          label: 'Recap',
          tags: ['Recap'],
          variants: variants([
            'Let me quickly recap the key details to ensure I have everything correct.',
            'I’ll summarize what we discussed—please let me know if I missed anything.',
            'I’d like to review the travel details and preferences with you—does that all sound right?'
          ]),
          inputs: [
            { id: 'recap', label: 'Recap notes', type: 'longText', placeholder: 'Key takeaways for follow-up' }
          ]
        },
        {
          id: createId('question'),
          label: 'Next step & follow-up',
          tags: ['Next'],
          variants: variants([
            'I’ll research the best private fares and call you back in about an hour—will you be available then?',
            'The search is manual, so I’ll get to work and follow up shortly—what time should I call you back?',
            'I’ll send over our company information and reconnect after I’ve gathered options—when is the best time to reach you?'
          ]),
          inputs: [
            { id: 'callback_time', label: 'Callback target time', type: 'time' },
            { id: 'agree_callback', label: 'Client agreed to the callback plan', type: 'checkbox' },
            {
              id: 'send_company_info',
              label: 'Resources to send',
              type: 'longText',
              placeholder: 'Company info, sample itineraries, etc.'
            }
          ]
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
    name: 'Business Tickets Discovery',
    description: 'Structured discovery for premium-cabin flight searches. Friendly phrasing, branching, and recap/next-steps baked in.',
    script: businessTicketsScript,
    personalBullets: [
      'Flag referral expectations or past agent preference',
      'Capture cabin, budget, and flexibility guardrails',
      'Confirm promised follow-up timing'
    ],
    defaultCards: [
      {
        type: 'checklist',
        title: 'First-Contact Assessment',
        checklistItems: firstContactChecklistItems,
        tags: ['checklist', 'first-contact'],
        color: '#eef2ff'
      }
    ]
  },
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
