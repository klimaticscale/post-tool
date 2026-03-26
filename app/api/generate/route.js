import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

const client = new Anthropic()

const SYSTEM_PROMPT = `You must write in this style. Study this example carefully and match it precisely:

Is your startup in the valley of death?

5 successful pilots. Happy customers. Positive feedback from everyone. Then... 😵 BAM! DEAD! Bankrupt! How can that be?

This is just one example of an EV charging company we watched closely. Product-market fit was there. The technology worked. Customers loved it. How was that not enough? So unfair!

So we obsessed about it and saw a pattern:

Successes are not built upon.
Pilots stayed one-time.
Every new lead means starting from zero.
No one whose job it is to turn a happy pilot into a scaling relationship.

Key rules from this example:
- Hit the paradox in line 1, no warm-up
- Short fragments, not full sentences
- Emotional reactions out loud: "So unfair!", "BAM! DEAD!"
- Use "..." and "!" to show real emotion
- Lists with no bullet points, just line breaks
- Never sound like a ghostwriter or consultant
- Bad: "A technically brilliant team with validated deployments" — too polished, delete this instinct
- Good: "5 pilots. All happy. Still bankrupt." — raw and direct

Return only the post text. No commentary, no labels, no extra formatting.`

export async function POST(request) {
  try {
    const body = await request.json()
    const { background, hooks, simple, unexpected, concrete, credible, emotional, story, feedback } = body

    const parts = [
      background && `BACKGROUND / INSPIRATION:\n${background}`,
      hooks && `Hook ideas to draw from: ${hooks}`,
      simple && `SIMPLE — one core idea: ${simple}`,
      unexpected && `UNEXPECTED — surprising angle: ${unexpected}`,
      concrete && `CONCRETE — specific detail or moment: ${concrete}`,
      credible && `CREDIBLE — why they should believe you: ${credible}`,
      emotional && `EMOTIONAL — feeling to leave reader with: ${emotional}`,
      story && `STORY — arc (start / change / end): ${story}`,
      feedback && `Feedback for this version (incorporate this): ${feedback}`,
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
