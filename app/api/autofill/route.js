import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

const client = new Anthropic()

export async function POST(request) {
  try {
    const { background } = await request.json()
    if (!background?.trim()) {
      return NextResponse.json({ error: 'Background is required' }, { status: 400 })
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      system: 'You extract concise, specific SUCCESs framework values from provided content to help write a LinkedIn post.',
      messages: [{
        role: 'user',
        content: `Given this background inspiration, suggest concise values for each SUCCESs framework field. Be specific and concrete, not generic. Max 1-2 sentences per field.\n\nBACKGROUND:\n${background}`,
      }],
      output_config: {
        format: {
          type: 'json_schema',
          schema: {
            type: 'object',
            properties: {
              simple:     { type: 'string', description: 'The single core message or idea' },
              unexpected: { type: 'string', description: 'The surprising or counterintuitive angle' },
              concrete:   { type: 'string', description: 'A specific detail, number, moment, or real example' },
              credible:   { type: 'string', description: 'The experience, data, or position that makes this credible' },
              emotional:  { type: 'string', description: 'The feeling to leave the reader with' },
              story:      { type: 'string', description: 'The arc: situation / change or challenge / outcome' },
            },
            required: ['simple', 'unexpected', 'concrete', 'credible', 'emotional', 'story'],
            additionalProperties: false,
          },
        },
      },
    })

    const data = JSON.parse(response.content[0].text)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Autofill error:', error)
    const message = error?.status === 401
      ? 'Invalid API key. Check your ANTHROPIC_API_KEY.'
      : error?.message ?? 'Failed to auto-fill fields'
    return NextResponse.json({ error: message }, { status: error?.status ?? 500 })
  }
}
