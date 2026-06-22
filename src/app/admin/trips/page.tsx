'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '../../../lib/supabase/client'
import type { Trip } from '../../../lib/types'

type TripForm = {
  name: string
  destination: string
  start_date: string
  end_date: string
  price_gst: string | number
  total_seats: string | number
  status: string
  description: string
}

const empty: TripForm = {
  name: '', destination: '', start_date: '', end_date: '',
  price_gst: '', total_seats: '', status: 'open', description: ''
}

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Trip | null>(null)
  const [form, setForm] = useState<TripForm>(empty)
  const [saving, setSaving] = useState(false)

  // FIX 1 — fetchTrips defined with useCallback so useEffect dependency is stable
  const fetchTrips = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.from('trips').select('*').order('start_date')
    setTrips(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchTrips()
  }, [fetchTrips])

  function openNew() {
    setEditing(null)
    setForm(empty)
    setShowForm(true)
  }

  function openEdit(trip: Trip) {
    setEditing(trip)
    setForm({
      name: trip.name,
      destination: trip.destination,
      start_date: trip.start_date,
      end_date: trip.end_date,
      price_gst: trip.price_gst,
      total_seats: trip.total_seats,
      status: trip.status,
      description: trip.description || ''
    })
    setShowForm(true)
  }

  async function save() {
    if (!form.name || !form.destination || !form.start_date || !form.end_date || !form.price_gst || !form.total_seats) {
      alert('Please fill in all required fields')
      return
    }
    setSaving(true)
    const supabase = createClient()
    const payload = {
      ...form,
      price_gst: Number(form.price_gst),
      total_seats: Number(form.total_seats),
    }

    // FIX 2 — capture editing.id into a local const before any async/callback
    if (editing !== null) {
      const editingId = editing.id
      await supabase.from('trips').update(payload).eq('id', editingId)
      setTrips(prev => prev.map(t => t.id === editingId ? { ...t, ...payload } : t))
    } else {
      const { data } = await supabase.from('trips').insert([payload]).select().single()
      if (data) setTrips(prev => [...prev, data])
    }

    setSaving(false)
    setShowForm(false)
  }

  function fmt(date: string) {
    return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  function rupee(n: number) {
    return '₹' + Number(n).toLocaleString('en-IN')
  }

  if (loading) return <div style={{ padding: '2rem', color: 'var(--c-muted)' }}>Loading…</div>

  return (
    <div style={{ padding: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--c-earth)' }}>Trips</h1>
          <p style={{ fontSize: 13, color: 'var(--c-muted)', marginTop: 2 }}>
            {trips.length} trip{trips.length !== 1 ? 's' : ''} · open trips appear on the public page
          </p>
        </div>
        <button onClick={openNew} style={{
          background: 'var(--c-accent)', color: '#fff', border: 'none',
          borderRadius: 10, padding: '9px 18px', fontWeight: 600,
          fontSize: 13, cursor: 'pointer'
        }}>
          + New trip
        </button>
      </div>

      {/* Empty state */}
      {trips.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--c-muted)' }}>
          <p style={{ fontSize: 15, marginBottom: 8 }}>No trips yet.</p>
          <p style={{ fontSize: 13 }}>Create your first trip and it will appear on the public enquiry page.</p>
        </div>
      )}

      {/* Trip cards */}
      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {trips.map(t => (
          <div key={t.id} style={{
            background: '#fff', border: '1px solid var(--c-border)',
            borderRadius: 14, padding: '1.25rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--c-earth)', marginBottom: 2 }}>{t.name}</p>
                <p style={{ fontSize: 12, color: 'var(--c-muted)' }}>{t.destination}</p>
              </div>
              <span style={{
                padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                background: t.status === 'open' ? '#E8F5E9' : '#FFEBEE',
                color: t.status === 'open' ? '#1B5E20' : '#B71C1C'
              }}>
                {t.status}
              </span>
            </div>

            {t.description && (
              <p style={{ fontSize: 12, color: 'var(--c-sub)', lineHeight: 1.6, marginBottom: 12 }}>
                {t.description}
              </p>
            )}

            <div style={{ borderTop: '1px solid var(--c-border)', paddingTop: 12, marginTop: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                <span style={{ color: 'var(--c-muted)' }}>{fmt(t.start_date)} – {fmt(t.end_date)}</span>
                <span style={{ fontWeight: 700, color: 'var(--c-accent)' }}>{rupee(t.price_gst)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--c-muted)' }}>{t.total_seats} seats</span>
                <button onClick={() => openEdit(t)} style={{
                  background: 'transparent', border: '1px solid var(--c-border)',
                  borderRadius: 8, padding: '4px 12px', fontSize: 12,
                  cursor: 'pointer', color: 'var(--c-sub)'
                }}>
                  Edit
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showForm && (
        <div onClick={e => { if (e.target === e.currentTarget) setShowForm(false) }} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)',
          zIndex: 100, display: 'flex', alignItems: 'flex-start',
          justifyContent: 'center', padding: '40px 1rem', overflowY: 'auto'
        }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 580, padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--c-earth)' }}>
                {editing ? 'Edit trip' : 'New trip'}
              </h2>
              <button onClick={() => setShowForm(false)} style={{
                background: 'transparent', border: '1px solid var(--c-border)',
                borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontSize: 13
              }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <Field label="Trip name *">
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Spiti Valley Deep Dive" />
                </Field>
              </div>
              <Field label="Destination *">
                <input value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value }))} placeholder="Himachal Pradesh" />
              </Field>
              <Field label="Status">
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
              </Field>
              <Field label="Start date *">
                <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
              </Field>
              <Field label="End date *">
                <input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
              </Field>
              <Field label="Price incl. GST (₹) *">
                <input type="number" value={form.price_gst} onChange={e => setForm(f => ({ ...f, price_gst: e.target.value }))} placeholder="28500" />
              </Field>
              <Field label="Total seats *">
                <input type="number" value={form.total_seats} onChange={e => setForm(f => ({ ...f, total_seats: e.target.value }))} placeholder="12" />
              </Field>
              <div style={{ gridColumn: '1 / -1' }}>
                <Field label="Short description">
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    rows={3} placeholder="One or two lines about the feel of this trip — travellers will read this." />
                </Field>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={() => setShowForm(false)} style={{
                background: 'transparent', border: '1px solid var(--c-border)',
                borderRadius: 10, padding: '9px 18px', cursor: 'pointer',
                fontSize: 13, color: 'var(--c-sub)'
              }}>
                Cancel
              </button>
              <button onClick={save} disabled={saving} style={{
                background: 'var(--c-accent)', color: '#fff', border: 'none',
                borderRadius: 10, padding: '9px 20px', fontWeight: 600,
                fontSize: 13, cursor: 'pointer', opacity: saving ? .7 : 1
              }}>
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Create trip'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--c-sub)', display: 'block', marginBottom: 4 }}>
        {label}
      </label>
      {children}
    </div>
  )
}