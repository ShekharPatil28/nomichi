import { createClient } from '../../lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{
        width: 200,
        background: 'var(--c-earth)',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.5rem 1rem',
        flexShrink: 0
      }}>
        <p style={{ fontWeight: 700, fontSize: 15, color: '#fff', marginBottom: 2 }}>Nomichi</p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', marginBottom: 28 }}>Admin</p>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <SidebarLink href="/admin" label="Dashboard" icon="▦" />
          <SidebarLink href="/admin/leads" label="Leads" icon="◎" />
          <SidebarLink href="/admin/trips" label="Trips" icon="◈" />
        </nav>

        <div style={{ marginTop: 'auto' }}>
          <form action="/api/auth/signout" method="POST">
            <button type="submit" style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,.4)',
              fontSize: 12,
              cursor: 'pointer',
              padding: '6px 0',
              width: '100%',
              textAlign: 'left'
            }}>
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', background: 'var(--c-bg)' }}>
        {children}
      </main>
    </div>
  )
}

function SidebarLink({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <a href={href} className="sidebar-link">
      <span style={{ fontSize: 14 }}>{icon}</span>
      {label}
    </a>
  )
}