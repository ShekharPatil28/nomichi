'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '../../lib/supabase/client'
import type { Lead, Trip } from '../../lib/types'

const STAGES = ['NEW', 'CONTACTED', 'QUALIFIED', 'VIBE_CHECK_SENT', 'CONFIRMED', 'NOT_A_FIT']
const STAGE_LABELS: Record<string, string> = {
  NEW: 'New', CONTACTED: 'Contacted', QUALIFIED: 'Qualified',
  VIBE_CHECK_SENT: 'Vibe Check Sent', CONFIRMED: 'Confirmed', NOT_A_FIT: 'Not a Fit'
}

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const [{ data: leadsData }, { data: tripsData }] = await Promise.all([
      supabase.from('leads').select('*'),
      supabase.from('trips').select('*')
    ])
    setLeads(leadsData || [])
    setTrips(tripsData || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Realtime — update dashboard when any lead changes
  useEffect(() => {
    const supabase = createClient()
    const sub = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'leads'
      }, () => {
        // Any change to leads — refetch everything
        fetchData()
      })
      .subscribe()
    return () => { sub.unsubscribe() }
  }, [fetchData])

  const byStage = STAGES.map(s => ({
    stage: s,
    label: STAGE_LABELS[s],
    count: leads.filter(l => l.status === s).length
  }))

  const byTrip = trips.map(t => ({
    name: t.name,
    count: leads.filter(l => l.trip_id === t.id).length
  })).filter(x => x.count > 0)

  const maxBar = Math.max(...byTrip.map(x => x.count), 1)

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long'
  })

  if (loading) return (
    <div style={{ padding: '2rem', color: 'var(--c-muted)' }}>Loading…</div>
  )

  return (
    <div style={{ padding: '2rem', maxWidth: 900 }}>
      <p style={{ fontWeight: 700, fontSize: 22, color: 'var(--c-earth)', marginBottom: 2 }}>
       Hey Admin ! 👋
      </p>
      <p style={{ color: 'var(--c-muted)', fontSize: 13, marginBottom: 28 }}>{today}</p>

      {/* Pipeline overview */}
      <p style={{
        fontSize: 11, fontWeight: 600, letterSpacing: '.08em',
        textTransform: 'uppercase', color: 'var(--c-muted)', marginBottom: 12
      }}>
        Pipeline overview
      </p>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
        gap: 12, marginBottom: 32
      }}>
        <div style={{
          background: '#fff', border: '1px solid var(--c-border)',
          borderRadius: 14, padding: '1.25rem', textAlign: 'center'
        }}>
          <p style={{ fontSize: 36, fontWeight: 700, color: 'var(--c-accent)' }}>
            {leads.length}
          </p>
          <p style={{ fontSize: 11, color: 'var(--c-muted)' }}>Total leads</p>
        </div>
        {byStage.map(s => (
          <div key={s.stage} style={{
            background: '#fff', border: '1px solid var(--c-border)',
            borderRadius: 14, padding: '1.25rem', textAlign: 'center'
          }}>
            <p style={{ fontSize: 30, fontWeight: 700, color: 'var(--c-earth)' }}>
              {s.count}
            </p>
            <p style={{ fontSize: 11, color: 'var(--c-muted)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Leads per trip */}
      <p style={{
        fontSize: 11, fontWeight: 600, letterSpacing: '.08em',
        textTransform: 'uppercase', color: 'var(--c-muted)', marginBottom: 12
      }}>
        Leads per trip
      </p>
      <div style={{
        background: '#fff', border: '1px solid var(--c-border)',
        borderRadius: 14, padding: '1.25rem'
      }}>
        {byTrip.length === 0 && (
          <p style={{ color: 'var(--c-muted)', fontSize: 13 }}>
            No leads yet. They will show up here once travellers start enquiring.
          </p>
        )}
        {byTrip.map(x => (
          <div key={x.name} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <p style={{ fontSize: 13, color: 'var(--c-sub)', fontWeight: 500 }}>{x.name}</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-earth)' }}>{x.count}</p>
            </div>
            <div style={{ background: 'var(--c-sand)', borderRadius: 4, height: 7 }}>
              <div style={{
                background: 'var(--c-accent)', borderRadius: 4, height: 7,
                width: `${(x.count / maxBar) * 100}%`,
                transition: 'width .4s'
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}