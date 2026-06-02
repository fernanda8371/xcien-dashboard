export function Badge({ children, variant = 'gray' }) {
  const styles = {
    warn:  { background: '#FAEEDA', color: '#854F0B' },
    ok:    { background: '#EAF3DE', color: '#3B6D11' },
    info:  { background: '#E6F1FB', color: '#185FA5' },
    gray:  { background: '#F1EFE8', color: '#5F5E5A' },
    danger:{ background: '#FCEBEB', color: '#791F1F' },
  }
  return (
    <span style={{
      ...styles[variant],
      fontSize: 10, padding: '2px 8px',
      borderRadius: 6, fontWeight: 500, whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  )
}

export function ProgressBar({ value, max, color = '#1D9E75', height = 6 }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  const barColor = pct >= 90 ? '#E24B4A' : pct >= 70 ? '#EF9F27' : color
  return (
    <div style={{ background: '#e5e7eb', borderRadius: 3, overflow: 'hidden', height }}>
      <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: 3, transition: 'width 0.3s' }} />
    </div>
  )
}

export function StatCard({ label, value, sub, subColor }) {
  return (
    <div style={{
      background: 'var(--bg-secondary, #f9fafb)', borderRadius: 8,
      padding: '12px 14px',
    }}>
      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 500, color: '#111827' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: subColor || '#6b7280', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

export function TypeBadge({ tipo }) {
  const map = {
    Micro:       { bg: '#E6F1FB', color: '#185FA5' },
    PyMe:        { bg: '#E1F5EE', color: '#0F6E56' },
    Empresarial: { bg: '#EEEDFE', color: '#3C3489' },
    Corporativo: { bg: '#FAEEDA', color: '#854F0B' },
  }
  const s = map[tipo] || map.Micro
  return (
    <span style={{
      fontSize: 10, padding: '2px 8px', borderRadius: 6,
      background: s.bg, color: s.color, fontWeight: 500,
    }}>
      {tipo}
    </span>
  )
}

export function MockBanner() {
  return (
    <div style={{
      background: '#FAEEDA', borderBottom: '1px solid #FAC775',
      padding: '6px 20px', fontSize: 12, color: '#854F0B',
      display: 'flex', alignItems: 'center', gap: 6,
    }}>
      ⚠ Modo demo — datos simulados. Configura .env con tus credenciales de Supabase para datos reales.
    </div>
  )
}
