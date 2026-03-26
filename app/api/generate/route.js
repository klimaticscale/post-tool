import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

const client = new Anthropic()

const SYSTEM_PROMPT = `You are an expert LinkedIn ghostwriter. You write posts that feel raw, real, and deeply human. You do NOT write corporate content.

WRITING RULES — follow without exception:

VOICE & TONE:
- Raw and conversational, never polished or professional-sounding
- Unfiltered emotional reactions mid-post: "So unfair!", "BAM!", "Honestly?", "Wait."
- Punctuation expresses emotion: ellipses for tension, exclamation marks for energy, occasional line break for drama
- 1-2 relevant emoji max per post, used sparingly for emphasis
- First person, but NEVER start with "I"
- Use "we" when speaking to shared human experience

STRUCTURE:
- Hook leads IMMEDIATELY with the paradox or tension — zero warm-up, zero context-setting
- Short paragraphs: 1-3 sentences max, often just 1
- Fragment lists hit harder than full sentences. Use them.
- End with a punchy single line OR a question that stops the scroll

STRICT BANS:
- No m-dashes (use comma, period, ellipsis, or line break instead)
- No: leverage, dive into, delve, foster, navigate, landscape, unlock, empower, streamline, utilize, comprehensive, robust, synergy, cutting-edge, holistic, paradigm, spearhead, game-changer, transformative

OUTPUT FORMAT — return exactly this structure, nothing before or after:

<post1>
[Emotional & Personal variation — vulnerability, raw feeling, shared human experience]
</post1>

<post2>
[Provocative & Bold variation — challenges assumptions, contrarian point, bold claim that makes people stop]
</post2>`

export async function POST(request) {
  try {
    const body = await request.json()
    const { background, hooks, simple, unexpected, concrete, credible, emotional, story } = body

    const parts = [
      background && `BACKGROUND / INSPIRATION:\n${background}`,
      hooks && `HOOK IDEAS TO CONSIDER:\n${hooks}`,
      simple && `SIMPLE — one core idea: ${simple}`,
      unexpected && `UNEXPECTED — surprising angle: ${unexpected}`,
      concrete && `CONCRETE — specific detail or moment: ${concrete}`,
      credible && `CREDIBLE — why they should believe you: ${credible}`,
      emotional && `EMOTIONAL — feeling to leave reader with: ${emotional}`,
      story && `STORY — mini arc (start / change / end): ${story}`,
    ].filter(Boolean)

    if (parts.length === 0) {
      return NextResponse.json({ error: 'At least one field is required' }, { status: 400 })
    }

    const userContent = `Write two LinkedIn post variations using this material:\n\n${parts.join('\n\n')}`

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    })

    const text = response.content[0].text

    const post1Match = text.match(/<post1>([\s\S]*?)<\/post1>/)
    const post2Match = text.match(/<post2>([\s\S]*?)<\/post2>/)

    if (!post1Match || !post2Match) {
      console.error('Failed to parse posts from:', text)
      return NextResponse.json({ error: 'Failed to parse generated posts' }, { status: 500 })
    }

    return NextResponse.json({
      post1: post1Match[1].trim(),
      post2: post2Match[1].trim(),
    })
  } catch (error) {
    console.error('Generation error:', error)
    const message = error?.status === 401
      ? 'Invalid API key. Check your ANTHROPIC_API_KEY.'
      : 'Failed to generate posts. Please try again.'
    return NextResponse.json({ error: message }, { status: error?.status ?? 500 })
  }
}
