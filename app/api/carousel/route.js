import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

const client = new Anthropic()

export async function POST(request) {
  try {
    const { post } = await request.json()
    if (!post?.trim()) {
      return NextResponse.json({ error: 'Post text is required' }, { status: 400 })
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      system: `You are an expert at breaking LinkedIn posts into carousel slide content for design tools like Canva.

SLIDE RULES:
- 3 to 6 slides total
- Headline: max 8 words, punchy and direct, no filler
- Body: 1-2 short lines only, expands on the headline with a specific point or emotion
- Slide 1 is the hook — it must stop the scroll
- Last slide is the CTA or punchline
- Keep the raw, conversational voice of the original post
- No corporate language, no m-dashes, no AI-isms

Return only valid JSON, no extra text:
{
  "slides": [
    { "headline": "...", "body": "..." }
  ]
}`,
      messages: [{
        role: 'user',
        content: `Break this LinkedIn post into carousel slides:\n\n${post}`
      }],
    })

    const raw = response.content[0].text
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('Failed to parse carousel response')
    const data = JSON.parse(match[0])
    return NextResponse.json(data)
  } catch (error) {
    console.error('Carousel error:', error)
    return NextResponse.json({ error: 'Failed to generate carousel' }, { status: 500 })
  }
}
