import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: Request) {
  const { lead, trip } = await req.json()

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `You are writing a first WhatsApp message for Nomichi, a curated travel brand. Warm, brief, personal — never corporate.
Trip: "${trip?.name}" (${trip?.destination}), ${trip?.start_date} to ${trip?.end_date}, ₹${trip?.price_gst} incl GST
Traveller: ${lead.name}, travelling ${lead.group_type}, preferred month: ${lead.preferred_month}
They said: "${lead.vibe_text}"
Write a first WhatsApp message under 80 words. No subject line. Sign off as "— Nomichi". Do not use emojis.`
    }]
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  return NextResponse.json({ message: text })
}