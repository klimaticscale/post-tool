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
      system: 'You extract concise, specific SUCCESs framework values from provided content to help write a LinkedIn post. Return only valid JSON, no commentary.',
      messages: [{
        role: 'user',
        content: `Given this background inspiration, suggest concise values for each SUCCESs framework field. Be specific and concrete, not generic. Max 1-2 sentences per field.

BACKGROUND:
${background}

Return exactly this JSON (no extra text):
{
  "simple": "the single core message or idea",
  "unexpected": "the surprising or counterintuitive angle",
  "concrete": "a specific detail, number, moment, or real example",
  "credible": "the experience, data, or position that makes this credible",
  "emotional": "the feeling to leave the reader with",
  "story": "the arc: situation / change or challenge / outcome"
}`
      }],
    })

    const raw = response.content[0].text
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('Failed to parse autofill response')
    const data = JSON.parse(match[0])
    return NextResponse.json(data)
  } catch (error) {
    console.error('Autofill error:', error)
    return NextResponse.json({ error: 'Failed to auto-fill fields' }, { status: 500 })
  }
}
