import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '../../../../lib/supabase/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: Request) {
  try {
    const { form, trip } = await req.json()

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 150,
      messages: [{
        role: 'user',
        content: `You are a travel curation assistant for Nomichi.
Trip: "${trip?.name}" — ${trip?.description}
Traveller said: "${form.vibe_text}"
Rate the fit as high, medium, or low.
Reply ONLY as JSON with no extra text: {"fit":"high","reason":"one sentence explanation"}`
      }]
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const parsed = JSON.parse(text)

    // Find the lead we just inserted and update it
    const supabase = await createClient()
    await supabase
      .from('leads')
      .update({ vibe_fit: parsed.fit, vibe_reason: parsed.reason })
      .eq('email', form.email)
      .eq('trip_id', form.trip_id)
      .order('created_at', { ascending: false })
      .limit(1)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}