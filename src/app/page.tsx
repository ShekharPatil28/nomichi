'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '../lib/supabase/client'
import type { Trip } from '../lib/types'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const GROUP_TYPES = ['solo','friends','couple','family']

type FormState = {
  name: string
  phone: string
  email: string
  trip_id: string
  group_type: string
  preferred_month: string
  vibe_text: string
}

const emptyForm: FormState = {
  name: '', phone: '', email: '', trip_id: '',
  group_type: 'solo', preferred_month: '', vibe_text: ''
}

function fmt(date: string) {
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
function rupee(n: number) {
  return '₹' + Number(n).toLocaleString('en-IN')
}

export default function PublicPage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [errors, setErrors] = useState<Partial<FormState>>({})
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [showForm, setShowForm] = useState(false)

  const fetchTrips = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('trips')
      .select('*')
      .eq('status', 'open')
      .order('start_date')
    setTrips(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchTrips()
  }, [fetchTrips])

  function selectTrip(trip: Trip) {
    setSelectedTrip(trip)
    setForm(f => ({ ...f, trip_id: trip.id }))
    setShowForm(true)
    setTimeout(() => {
      document.getElementById('enquiry-form')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  function validate(): Partial<FormState> {
    const e: Partial<FormState> = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!/^[6-9]\d{9}$/.test(form.phone)) e.phone = 'Enter a valid 10-digit Indian mobile number'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.trip_id) e.trip_id = 'Select a trip'
    if (!form.preferred_month) e.preferred_month = 'Pick a month'
    if (!form.vibe_text.trim()) e.vibe_text = 'Tell us what you are hoping for'
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setStatus('submitting')
    try {
      const supabase = createClient()
      const { error } = await supabase.from('leads').insert([{
        trip_id: form.trip_id,
        name: form.name,
        phone: form.phone,
        email: form.email,
        group_type: form.group_type,
        preferred_month: form.preferred_month,
        vibe_text: form.vibe_text,
        status: 'NEW'
      }])
      if (error) throw error

      // Fire vibe fit scoring in background
      fetch('/api/ai/vibefit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form, trip: selectedTrip })
      }).catch(() => {})

      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  // ── Success state ──
  if (status === 'success') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: 'var(--c-bg)', padding: '2rem'
      }}>
        <div style={{ textAlign: 'center', maxWidth: 480 }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🌿</div>
          <h2 style={{ fontSize: 26, fontWeight: 700, color: 'var(--c-earth)', marginBottom: 10 }}>
            You are on our radar.
          </h2>
          <p style={{ color: 'var(--c-sub)', lineHeight: 1.8, fontSize: 15, marginBottom: 24 }}>
            We have received your enquiry for{' '}
            <strong>{selectedTrip?.name}</strong>.
            Someone from our team will reach out within 24 hours — usually sooner.
          </p>
          <p style={{ fontSize: 13, color: 'var(--c-muted)' }}>
            Check your inbox and WhatsApp. We will find you.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--c-bg)' }}>

      {/* ── Hero ── */}
      <div style={{
        background: 'linear-gradient(160deg, #1A3A4A 0%, #2D1B0E 100%)',
        color: '#fff', padding: '3.5rem 1.5rem 2.5rem', textAlign: 'center'
      }}>
        <p style={{
          fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,.45)', marginBottom: 10
        }}>
          Nomichi Travel
        </p>
        <h1 style={{
          fontSize: 'clamp(30px, 6vw, 52px)', fontWeight: 800,
          lineHeight: 1.12, marginBottom: 14
        }}>
          Trips worth<br />the time off.
        </h1>
        <p style={{
          color: 'rgba(255,255,255,.6)', maxWidth: 400,
          margin: '0 auto', lineHeight: 1.8, fontSize: 15
        }}>
          Small groups. Curated destinations. The kind of travel that actually changes something in you.
        </p>
      </div>

      <div style={{ maxWidth: 880, margin: '0 auto', padding: '2.5rem 1rem' }}>

        {/* ── Trips ── */}
        <p style={{
          fontSize: 11, fontWeight: 600, letterSpacing: '.1em',
          textTransform: 'uppercase', color: 'var(--c-muted)', marginBottom: 16
        }}>
          Open trips
        </p>

        {loading && (
          <p style={{ color: 'var(--c-muted)', fontSize: 13 }}>Loading trips…</p>
        )}

        {!loading && trips.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--c-muted)' }}>
            <p style={{ fontSize: 15, marginBottom: 6 }}>No open trips right now.</p>
            <p style={{ fontSize: 13 }}>Check back soon — we are always planning something.</p>
          </div>
        )}

        <div style={{
          display: 'grid', gap: 16,
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          marginBottom: '3rem'
        }}>
          {trips.map(trip => (
            <div
              key={trip.id}
              style={{
                background: '#fff', border: selectedTrip?.id === trip.id
                  ? '1.5px solid var(--c-accent)' : '1px solid var(--c-border)',
                borderRadius: 16, padding: '1.25rem',
                transition: 'transform .15s, box-shadow .15s',
                cursor: 'pointer'
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'none'
              }}
            >
              <p style={{ fontSize: 11, color: 'var(--c-muted)', marginBottom: 4 }}>
                {trip.destination}
              </p>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--c-earth)', marginBottom: 6 }}>
                {trip.name}
              </h3>
              <p style={{ fontSize: 12, color: 'var(--c-sub)', lineHeight: 1.6, marginBottom: 12 }}>
                {trip.description}
              </p>
              <div style={{ borderTop: '1px solid var(--c-border)', paddingTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <p style={{ fontSize: 10, color: 'var(--c-muted)', marginBottom: 2 }}>from</p>
                    <p style={{ fontWeight: 700, color: 'var(--c-accent)', fontSize: 16 }}>
                      {rupee(trip.price_gst)}
                      <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--c-muted)' }}> incl. GST</span>
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 11, color: 'var(--c-muted)' }}>
                      {fmt(trip.start_date)} –<br />{fmt(trip.end_date)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => selectTrip(trip)}
                  style={{
                    width: '100%', padding: '9px', background: 'var(--c-accent)',
                    color: '#fff', border: 'none', borderRadius: 10,
                    fontWeight: 600, fontSize: 13, cursor: 'pointer'
                  }}
                >
                  Enquire about this trip
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ── Enquiry form ── */}
        {showForm && (
          <div id="enquiry-form">
            <p style={{
              fontSize: 11, fontWeight: 600, letterSpacing: '.1em',
              textTransform: 'uppercase', color: 'var(--c-muted)', marginBottom: 16
            }}>
              Your enquiry
            </p>

            {/* Selected trip summary */}
            {selectedTrip && (
              <div style={{
                background: 'var(--c-sand)', border: '1px solid var(--c-border)',
                borderRadius: 12, padding: '12px 16px', marginBottom: 16
              }}>
                <p style={{ fontWeight: 600, color: 'var(--c-earth)', fontSize: 14 }}>
                  {selectedTrip.name}
                </p>
                <p style={{ fontSize: 12, color: 'var(--c-sub)', marginTop: 2 }}>
                  {selectedTrip.destination} · {fmt(selectedTrip.start_date)} – {fmt(selectedTrip.end_date)} · {rupee(selectedTrip.price_gst)} incl. GST
                </p>
              </div>
            )}

            <div style={{
              background: '#fff', border: '1px solid var(--c-border)',
              borderRadius: 16, padding: '1.5rem'
            }}>
              <form onSubmit={handleSubmit} noValidate>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Your name" error={errors.name}>
                    <input
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Priya Sharma"
                    />
                  </Field>
                  <Field label="WhatsApp number" error={errors.phone}>
                    <input
                      value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="9876543210"
                      maxLength={10}
                    />
                  </Field>
                </div>

                <Field label="Email" error={errors.email}>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="priya@email.com"
                  />
                </Field>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Trip" error={errors.trip_id}>
                    <select
                      value={form.trip_id}
                      onChange={e => {
                        const t = trips.find(x => x.id === e.target.value)
                        setSelectedTrip(t || null)
                        setForm(f => ({ ...f, trip_id: e.target.value }))
                      }}
                    >
                      <option value="">Select a trip</option>
                      {trips.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Who is travelling">
                    <select
                      value={form.group_type}
                      onChange={e => setForm(f => ({ ...f, group_type: e.target.value }))}
                    >
                      {GROUP_TYPES.map(g => (
                        <option key={g} value={g}>
                          {g.charAt(0).toUpperCase() + g.slice(1)}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <Field label="Preferred month" error={errors.preferred_month}>
                  <select
                    value={form.preferred_month}
                    onChange={e => setForm(f => ({ ...f, preferred_month: e.target.value }))}
                  >
                    <option value="">Pick a month</option>
                    {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </Field>

                <Field label="What are you hoping this trip feels like?" error={errors.vibe_text}>
                  <textarea
                    value={form.vibe_text}
                    onChange={e => setForm(f => ({ ...f, vibe_text: e.target.value }))}
                    rows={4}
                    placeholder="Tell us in your own words — not just 'adventure' or 'relaxation'. We read these carefully."
                    style={{ resize: 'none' }}
                  />
                </Field>

                {status === 'error' && (
                  <p style={{ color: '#C0392B', fontSize: 12, marginBottom: 12 }}>
                    Something went wrong. Try again in a moment.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  style={{
                    width: '100%', padding: '12px', background: 'var(--c-accent)',
                    color: '#fff', border: 'none', borderRadius: 10,
                    fontWeight: 600, fontSize: 14, cursor: 'pointer',
                    opacity: status === 'submitting' ? .7 : 1
                  }}
                >
                  {status === 'submitting' ? 'Sending…' : 'Send my enquiry →'}
                </button>

              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, error, children }: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{
        fontSize: 12, fontWeight: 500, color: 'var(--c-sub)',
        display: 'block', marginBottom: 4
      }}>
        {label}
      </label>
      {children}
      {error && (
        <p style={{ color: '#C0392B', fontSize: 11, marginTop: 3 }}>{error}</p>
      )}
    </div>
  )
}