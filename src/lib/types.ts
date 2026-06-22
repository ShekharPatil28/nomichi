export type TripStatus = 'open' | 'closed'
export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'VIBE_CHECK_SENT' | 'CONFIRMED' | 'NOT_A_FIT'
export type GroupType = 'solo' | 'friends' | 'couple' | 'family'
export type VibeFit = 'high' | 'medium' | 'low'

export interface Trip {
  id: string
  name: string
  destination: string
  start_date: string
  end_date: string
  price_gst: number
  total_seats: number
  status: TripStatus
  description: string
  created_at: string
}

export interface Lead {
  id: string
  trip_id: string
  name: string
  phone: string
  email: string
  group_type: GroupType
  preferred_month: string
  vibe_text: string
  status: LeadStatus
  owner: string | null
  vibe_fit: VibeFit | null
  vibe_reason: string | null
  created_at: string
}

export interface Note {
  id: string
  lead_id: string
  content: string
  created_by: string
  created_at: string
}