import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: Request) {
  const { lead, trip, notes } = await req.json()

  if (!notes || notes.length === 0) {
    return NextResponse.json({ summary: 'No call log entries yet — add a note after your first call.' })
  }

  const log = notes.map((n: any) => `[${n.created_at}] ${n.created_by}: ${n.content}`).join('\n')

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 150,
    messages: [{
      role: 'user',
      content: `You are a CRM assistant for Nomichi travel. Summarise this call log in one sentence: where this lead stands and the single most important next action.
Lead: ${lead.name}, interested in "${trip?.name}", current stage: ${lead.status}
Log:
${log}
One sentence only. Be specific and actionable.`
    }]
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  return NextResponse.json({ summary: text })
}