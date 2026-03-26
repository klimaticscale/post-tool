import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

const client = new Anthropic()

const SYSTEM_PROMPT = `You are an expert LinkedIn ghostwriter for Klimatic Group. You write posts that feel raw, real, and human — not corporate, not polished.

VOICE & TONE:
- Raw and conversational, never polished or professional-sounding
- Unfiltered emotional reactions mid-post: "So unfair!", "BAM!", "Honestly?", "Wait."
- Punctuation expresses emotion: ellipses for tension, exclamation marks for energy, line breaks for drama
- 1-2 relevant emoji max, used sparingly for emphasis
- First person, but NEVER start with "I"
- Use "we" when speaking to shared human experience

STRUCTURE:
- Hook leads IMMEDIATELY with the paradox or tension — zero warm-up, zero context-setting
- Short paragraphs: 1-3 sentences max, often just one
- Fragment lists hit harder than full sentences — use them
- End with a punchy single line OR a question that stops the scroll

STRICT BANS:
- No m-dashes (use comma, period, ellipsis, or line break instead)
- Never start with "I"
- Never use: leverage, dive into, delve, foster, navigate, landscape, unlock, empower, streamline, utilize, comprehensive, robust, synergy, cutting-edge, holistic, paradigm, spearhead, game-changer, transformative

Return only the post text. No commentary, no labels, no extra formatting.`

export async function POST(request) {
  try {
    const body = await request.json()
    const { background, hooks, simple, unexpected, concrete, credible, emotional, story } = body

    const parts = [
      background && `BACKGROUND / INSPIRATION:\n${background}`,
      hooks && `HOOK IDEAS:\n${hooks}`,
      simple && `SIMPLE — one core idea: ${simple}`,
      unexpected && `UNEXPECTED — surprising angle: ${unexpected}`,
      concrete && `CONCRETE — specific detail or moment: ${concrete}`,
      credible && `CREDIBLE — why they should believe you: ${credible}`,
      emotional && `EMOTIONAL — feeling to leave reader with: ${emotional}`,
      story && `STORY — arc (start / change / end): ${story}`,
    ].filter(Boolean)

    if (parts.length === 0) {
      return NextResponse.json({ error: 'At least one field is required' }, { status: 400 })
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `Write a LinkedIn post using this material:\n\n${parts.join('\n\n')}`,
      }],
    })

    return NextResponse.json({ post: response.content[0].text.trim() })
  } catch (error) {
    console.error('Generation error:', error)
    const message = error?.status === 401
      ? 'Invalid API key. Check your ANTHROPIC_API_KEY.'
      : 'Failed to generate post. Please try again.'
    return NextResponse.json({ error: message }, { status: error?.status ?? 500 })
  }
}
