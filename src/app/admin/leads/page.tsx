'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '../../../lib/supabase/client'
import type { Lead, Trip, Note, LeadStatus } from '../../../lib/types'

const STAGES = ['NEW', 'CONTACTED', 'QUALIFIED', 'VIBE_CHECK_SENT', 'CONFIRMED', 'NOT_A_FIT'] as const
const STAGE_LABELS: Record<string, string> = {
  NEW: 'New', CONTACTED: 'Contacted', QUALIFIED: 'Qualified',
  VIBE_CHECK_SENT: 'Vibe Check Sent', CONFIRMED: 'Confirmed', NOT_A_FIT: 'Not a Fit'
}
const OWNERS = ['Ravi', 'Divya', 'Shirin', 'Karthik']

function fmt(date: string) {
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
function fmtTs(ts: string) {
  return new Date(ts).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}
function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStage, setFilterStage] = useState('')
  const [filterTrip, setFilterTrip] = useState('')
  const [filterOwner, setFilterOwner] = useState('')
  const [selLead, setSelLead] = useState<Lead | null>(null)

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const [{ data: leadsData }, { data: tripsData }] = await Promise.all([
      supabase.from('leads').select('*').order('created_at', { ascending: false }),
      supabase.from('trips').select('*').order('start_date')
    ])
    setLeads(leadsData || [])
    setTrips(tripsData || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Realtime — new lead appears instantly
  useEffect(() => {
    const supabase = createClient()
    const sub = supabase
      .channel('leads-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads' }, payload => {
        setLeads(prev => [payload.new as Lead, ...prev])
      })
      .subscribe()
    return () => { sub.unsubscribe() }
  }, [])

  function updateLead(id: string, patch: Partial<Lead>) {
    const supabase = createClient()
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l))
    if (selLead?.id === id) setSelLead(prev => prev ? { ...prev, ...patch } : prev)
    supabase.from('leads').update(patch).eq('id', id)
  }

  const filtered = leads.filter(l => {
    const q = search.toLowerCase()
    if (q && !l.name.toLowerCase().includes(q) && !l.email?.toLowerCase().includes(q)) return false
    if (filterStage && l.status !== filterStage) return false
    if (filterTrip && l.trip_id !== filterTrip) return false
    if (filterOwner && l.owner !== filterOwner) return false
    return true
  })

  if (loading) return <div style={{ padding: '2rem', color: 'var(--c-muted)' }}>Loading…</div>

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* ── Lead list ── */}
      <div style={{
        width: selLead ? 360 : '100%',
        borderRight: selLead ? '1px solid var(--c-border)' : 'none',
        overflow: 'auto', padding: '1.5rem 1rem', flexShrink: 0
      }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--c-earth)', marginBottom: 4 }}>Leads</h1>
        <p style={{ fontSize: 13, color: 'var(--c-muted)', marginBottom: 16 }}>
          {filtered.length} of {leads.length} lead{leads.length !== 1 ? 's' : ''}
        </p>

        {/* Filters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          <input
            placeholder="Search name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <select value={filterStage} onChange={e => setFilterStage(e.target.value)}>
              <option value="">All stages</option>
              {STAGES.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
            </select>
            <select value={filterTrip} onChange={e => setFilterTrip(e.target.value)}>
              <option value="">All trips</option>
              {trips.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <select value={filterOwner} onChange={e => setFilterOwner(e.target.value)}>
              <option value="">All owners</option>
              {OWNERS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>

        {/* Lead cards */}
        {filtered.length === 0 && (
          <p style={{ color: 'var(--c-muted)', fontSize: 13, padding: '2rem 0' }}>
            No leads match your filters.
          </p>
        )}
        {filtered.map(l => {
          const trip = trips.find(t => t.id === l.trip_id)
          return (
            <div
              key={l.id}
              onClick={() => setSelLead(l)}
              style={{
                // background: '#fff',
                border: selLead?.id === l.id ? '1.5px solid var(--c-accent)' : '1px solid var(--c-border)',
                borderRadius: 12, padding: '0.9rem 1rem', marginBottom: 8,
                cursor: 'pointer',
                background: selLead?.id === l.id ? '#FFF8F3' : '#fff'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'var(--c-sand)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, color: 'var(--c-earth)', flexShrink: 0
                  }}>
                    {initials(l.name)}
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--c-earth)' }}>{l.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--c-muted)' }}>{trip?.name || '—'}</p>
                  </div>
                </div>
                <StageBadge status={l.status} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: 11, color: 'var(--c-muted)' }}>
                  {l.owner ? `👤 ${l.owner}` : 'Unassigned'} · {l.group_type}
                </p>
                {l.vibe_fit && <VibeBadge fit={l.vibe_fit} />}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Lead detail ── */}
      {selLead && (
        <div style={{ flex: 1, overflow: 'auto' }}>
          <LeadDetail
            lead={selLead}
            trips={trips}
            onUpdate={patch => updateLead(selLead.id, patch)}
            onClose={() => setSelLead(null)}
          />
        </div>
      )}
    </div>
  )
}

// ── Lead Detail ──────────────────────────────────────────────────────────────
function LeadDetail({ lead, trips, onUpdate, onClose }: {
  lead: Lead
  trips: Trip[]
  onUpdate: (patch: Partial<Lead>) => void
  onClose: () => void
}) {
  const [notes, setNotes] = useState<Note[]>([])
  const [noteText, setNoteText] = useState('')
  const [addingNote, setAddingNote] = useState(false)
  const [aiWa, setAiWa] = useState('')
  const [aiSum, setAiSum] = useState('')
  const [aiLoading, setAiLoading] = useState({ wa: false, sum: false })
  const trip = trips.find(t => t.id === lead.trip_id)
  const [pendingStatus, setPendingStatus] = useState<LeadStatus>(lead.status)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const fetchNotes = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.from('notes').select('*').eq('lead_id', lead.id).order('created_at')
    setNotes(data || [])
  }, [lead.id])

  useEffect(() => {
    fetchNotes()
    setAiWa('')
    setAiSum('')
  }, [fetchNotes])

  useEffect(() => {
    setPendingStatus(lead.status)
  }, [lead.id])

  async function addNote() {
    if (!noteText.trim()) return
    setAddingNote(true)
    const supabase = createClient()
    const { data } = await supabase.from('notes').insert([{
      lead_id: lead.id,
      content: noteText,
      created_by: 'Team'
    }]).select().single()
    if (data) setNotes(prev => [...prev, data])
    setNoteText('')
    setAddingNote(false)
  }

  async function genWhatsApp() {
    setAiLoading(a => ({ ...a, wa: true }))
    const res = await fetch('/api/ai/whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead, trip })
    })
    const data = await res.json()
    setAiWa(data.message || 'Could not generate.')
    setAiLoading(a => ({ ...a, wa: false }))
  }

  async function genSummary() {
    setAiLoading(a => ({ ...a, sum: true }))
    const res = await fetch('/api/ai/summarise', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead, trip, notes })
    })
    const data = await res.json()
    setAiSum(data.summary || 'Could not generate.')
    setAiLoading(a => ({ ...a, sum: false }))
  }

  async function saveStage() {
  setSaving(true)
  const supabase = createClient()
  await supabase.from('leads').update({ status: pendingStatus }).eq('id', lead.id)
  onUpdate({ status: pendingStatus as Lead['status'] })
  setSaving(false)
  setSaved(true)
  setTimeout(() => setSaved(false), 2000)
}

  function copy(text: string) {
    navigator.clipboard.writeText(text)
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: 640 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%', background: 'var(--c-sand)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, color: 'var(--c-earth)', fontSize: 13
          }}>
            {initials(lead.name)}
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: 17, color: 'var(--c-earth)' }}>{lead.name}</p>
            <p style={{ fontSize: 12, color: 'var(--c-muted)' }}>{lead.email} · {lead.phone}</p>
          </div>
        </div>
        <button onClick={onClose} style={{
          background: 'transparent', border: '1px solid var(--c-border)',
          borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontSize: 13
        }}>✕</button>
      </div>

      {/* Pipeline */}
      <Section title="Pipeline stage">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          {STAGES.map(s => (
            <button
              key={s}
              onClick={() => setPendingStatus(s)}
              style={{
                padding: '5px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                border: '1px solid var(--c-border)',
                background: pendingStatus === s ? 'var(--c-accent)' : 'transparent',
                color: pendingStatus === s ? '#fff' : 'var(--c-sub)',
                fontWeight: pendingStatus === s ? 600 : 400
              }}
            >
              {STAGE_LABELS[s]}
            </button>
          ))}
       </div>
       <button
          onClick={saveStage}
          disabled={saving || pendingStatus === lead.status}
          style={{
            padding: '8px 20px', background: 'var(--c-accent)', color: '#fff',
            border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 13,
            cursor: 'pointer',
            opacity: (saving || pendingStatus === lead.status) ? .5 : 1
          }}
        >
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save stage'}
        </button>
      </Section>

      {/* Info */}
      <Section title="Enquiry details">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
          <InfoRow label="Trip" value={trip?.name || '—'} />
          <InfoRow label="Group" value={lead.group_type} />
          <InfoRow label="Preferred month" value={lead.preferred_month} />
          <InfoRow label="Received" value={fmtTs(lead.created_at)} />
        </div>
        {lead.vibe_text && (
          <div style={{ marginTop: 12, padding: '12px', background: 'var(--c-sand)', borderRadius: 10 }}>
            <p style={{ fontSize: 11, color: 'var(--c-muted)', marginBottom: 4 }}>What they said</p>
            <p style={{ fontSize: 13, color: 'var(--c-earth)', fontStyle: 'italic', lineHeight: 1.7 }}>
              `{lead.vibe_text}`
            </p>
          </div>
        )}
        {lead.vibe_fit && (
          <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
            <VibeBadge fit={lead.vibe_fit} />
            <p style={{ fontSize: 12, color: 'var(--c-muted)' }}>{lead.vibe_reason}</p>
          </div>
        )}
      </Section>

      {/* Owner */}
      <Section title="Owner">
        <select
          value={lead.owner || ''}
          onChange={e => onUpdate({ owner: e.target.value })}
          style={{ maxWidth: 200 }}
        >
          <option value="">Unassigned</option>
          {OWNERS.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </Section>

      {/* AI */}
      <div style={{
        background: 'linear-gradient(135deg, #FFF8F3 0%, #FFF3DC 100%)',
        border: '1px solid #F0C890', borderRadius: 12, padding: '1rem', marginBottom: 16
      }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#7A4E00', marginBottom: 10 }}>✦ AI assist</p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <button onClick={genWhatsApp} disabled={aiLoading.wa} style={{
            flex: 1, padding: '8px', border: '1px solid var(--c-border)',
            borderRadius: 8, background: '#fff', cursor: 'pointer',
            fontSize: 12, color: 'var(--c-earth)', opacity: aiLoading.wa ? .6 : 1
          }}>
            {aiLoading.wa ? 'Drafting…' : 'Draft WhatsApp →'}
          </button>
          <button onClick={genSummary} disabled={aiLoading.sum} style={{
            flex: 1, padding: '8px', border: '1px solid var(--c-border)',
            borderRadius: 8, background: '#fff', cursor: 'pointer',
            fontSize: 12, color: 'var(--c-earth)', opacity: aiLoading.sum ? .6 : 1
          }}>
            {aiLoading.sum ? 'Summarising…' : 'Summarise log →'}
          </button>
        </div>
        {aiWa && (
          <div style={{ marginBottom: 10 }}>
            <p style={{ fontSize: 11, color: 'var(--c-muted)', marginBottom: 4 }}>WhatsApp draft</p>
            <div style={{ background: '#fff', borderRadius: 8, padding: '10px 12px', fontSize: 13, lineHeight: 1.7, color: 'var(--c-earth)' }}>
              {aiWa}
            </div>
            <button onClick={() => copy(aiWa)} style={{
              marginTop: 6, padding: '4px 12px', fontSize: 11,
              background: 'transparent', border: '1px solid var(--c-border)',
              borderRadius: 6, cursor: 'pointer', color: 'var(--c-sub)'
            }}>
              Copy
            </button>
          </div>
        )}
        {aiSum && (
          <div>
            <p style={{ fontSize: 11, color: 'var(--c-muted)', marginBottom: 4 }}>Log summary</p>
            <div style={{ background: '#fff', borderRadius: 8, padding: '10px 12px', fontSize: 13, lineHeight: 1.7, color: 'var(--c-earth)' }}>
              {aiSum}
            </div>
          </div>
        )}
      </div>

      {/* Notes */}
      <Section title="Call log & notes">
        {notes.length === 0 && (
          <p style={{ color: 'var(--c-muted)', fontSize: 12, marginBottom: 12 }}>
            No notes yet. Add the first one after a call.
          </p>
        )}
        {notes.map(n => (
          <div key={n.id} style={{
            borderLeft: '2px solid var(--c-accent)',
            paddingLeft: 10, marginBottom: 14
          }}>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--c-earth)' }}>{n.content}</p>
            <p style={{ fontSize: 11, color: 'var(--c-muted)', marginTop: 3 }}>
              {n.created_by} · {fmtTs(n.created_at)}
            </p>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <textarea
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            placeholder="What happened on the call? What's the next action?"
            rows={2}
            style={{ flex: 1, resize: 'none' }}
          />
          <button onClick={addNote} disabled={addingNote} style={{
            background: 'var(--c-accent)', color: '#fff', border: 'none',
            borderRadius: 10, padding: '8px 14px', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, alignSelf: 'flex-end',
            opacity: addingNote ? .7 : 1
          }}>
            Add
          </button>
        </div>
      </Section>
    </div>
  )
}

// ── Small reusable bits ───────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--c-border)', borderRadius: 14, padding: '1.25rem', marginBottom: 12 }}>
      <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--c-muted)', marginBottom: 12 }}>
        {title}
      </p>
      {children}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontSize: 11, color: 'var(--c-muted)', marginBottom: 2 }}>{label}</p>
      <p style={{ fontWeight: 500, textTransform: 'capitalize' }}>{value}</p>
    </div>
  )
}

function StageBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    NEW: { bg: '#E3F0FF', color: '#1A4A8A' },
    CONTACTED: { bg: '#FFF3DC', color: '#7A4E00' },
    QUALIFIED: { bg: '#E8F5E9', color: '#1B5E20' },
    VIBE_CHECK_SENT: { bg: '#F3E5F5', color: '#4A148C' },
    CONFIRMED: { bg: '#E0F7FA', color: '#006064' },
    NOT_A_FIT: { bg: '#FFEBEE', color: '#B71C1C' },
  }
  const c = colors[status] || { bg: '#eee', color: '#333' }
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
      background: c.bg, color: c.color
    }}>
      {STAGE_LABELS[status] || status}
    </span>
  )
}

function VibeBadge({ fit }: { fit: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    high: { bg: '#E8F5E9', color: '#1B5E20' },
    medium: { bg: '#FFF3DC', color: '#7A4E00' },
    low: { bg: '#FFEBEE', color: '#B71C1C' },
  }
  const c = colors[fit] || { bg: '#eee', color: '#333' }
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
      background: c.bg, color: c.color
    }}>
      {fit} fit
    </span>
  )
}