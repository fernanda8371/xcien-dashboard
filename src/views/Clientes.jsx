import { useState, useMemo } from 'react'
import { LineChart, Line, ReferenceLine, YAxis } from 'recharts'
import { StatCard, TypeBadge, Badge } from '../components/UI'
import { useClients, useClientMetrics, evalSla } from '../lib/hooks'

const TIPOS = ['Micro', 'PyMe', 'Empresarial', 'Corporativo']
const NODE_OPTIONS = [
  { id: 'RB5', label: 'RB5 — Norte/Ramos' },
  { id: 'RB8', label: 'RB8 — Noreste' },
  { id: 'RB9', label: 'RB9 — Este' },
  { id: 'RB3', label: 'RB3 — Centro' },
  { id: 'RB6', label: 'RB6 — Cto-Oeste' },
  { id: 'RB7', label: 'RB7 — Sur-centro' },
  { id: 'RB4', label: 'RB4 — Suroeste' },
]
const VELOCIDADES = ['10 Mbps','50 Mbps','100 Mbps','200 Mbps','500 Mbps','1 Gbps','10 Gbps']

const inputStyle = {
  width: '100%', padding: '7px 10px', fontSize: 13,
  border: '0.5px solid #d1d5db', borderRadius: 6,
  background: '#f9fafb', color: '#111827',
}

// Mini-gráfica de BW medido vs meta (línea punteada). Reemplaza el panel de Prometheus.
function Sparkline({ data, meta, ok }) {
  if (!data?.length) return null
  return (
    <LineChart width={90} height={26} data={data} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
      <YAxis hide domain={[0, Math.max(meta * 1.2, ...data.map(d => d.bw_actual_mbps))]} />
      <ReferenceLine y={meta} stroke="#9ca3af" strokeDasharray="2 2" />
      <Line type="monotone" dataKey="bw_actual_mbps" stroke={ok ? '#1D9E75' : '#EF9F27'}
        strokeWidth={1.5} dot={false} isAnimationActive={false} />
    </LineChart>
  )
}

export default function Clientes() {
  const { clients, loading, usingMock, addClient } = useClients()
  const { series, latest } = useClientMetrics(clients)
  const [search, setSearch]       = useState('')
  const [filterTipo, setFilterTipo] = useState('')
  const [filterNode, setFilterNode] = useState('')
  const [showModal, setShowModal]  = useState(false)
  const [saving, setSaving]        = useState(false)
  const [form, setForm] = useState({
    nombre: '', tipo: 'PyMe', node_id: 'RB5',
    velocidad_mbps: 100, hilo: 1, puerto: 1, caja: '',
    puerto_adm: '', meta_bw_mbps: 100, meta_latencia_ms: 50, meta_uptime_pct: 99.5,
  })

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return clients.filter(c =>
      (!q || c.nombre?.toLowerCase().includes(q) || c.node_id?.toLowerCase().includes(q) || String(c.vlan)?.includes(q)) &&
      (!filterTipo || c.tipo === filterTipo) &&
      (!filterNode || c.node_id === filterNode)
    )
  }, [clients, search, filterTipo, filterNode])

  const counts = useMemo(() => {
    const r = { Micro: 0, PyMe: 0, Empresarial: 0, Corporativo: 0 }
    clients.forEach(c => { if (r[c.tipo] !== undefined) r[c.tipo]++ })
    return r
  }, [clients])

  const handleSave = async () => {
    if (!form.nombre.trim()) return
    setSaving(true)
    const nextVlan = 1000 + clients.length + 1
    // Si no capturan meta de BW, se garantiza la velocidad contratada
    const meta_bw_mbps = form.meta_bw_mbps || form.velocidad_mbps
    const { error } = await addClient({ ...form, meta_bw_mbps, vlan: nextVlan, activo: true })
    if (error) alert('Error al guardar: ' + error)
    setSaving(false)
    setShowModal(false)
    setForm({ nombre: '', tipo: 'PyMe', node_id: 'RB5', velocidad_mbps: 100, hilo: 1, puerto: 1, caja: '',
      puerto_adm: '', meta_bw_mbps: 100, meta_latencia_ms: 50, meta_uptime_pct: 99.5 })
  }

  const velLabel = (mbps) => mbps >= 1000 ? `${mbps/1000} Gbps` : `${mbps} Mbps`

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
        <StatCard label="Clientes activos" value={clients.length} sub="+2 IP Transit" />
        <StatCard label="Micro" value={counts.Micro} sub="hasta 50 Mbps" />
        <StatCard label="PyMe"  value={counts.PyMe}  sub="hasta 500 Mbps" />
        <StatCard label="Empresarial / Corp." value={counts.Empresarial + counts.Corporativo} sub="hasta 10 Gbps" />
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          style={{ ...inputStyle, flex: 1, minWidth: 160 }}
          placeholder="Buscar cliente, nodo, VLAN..."
          value={search} onChange={e => setSearch(e.target.value)}
        />
        <select style={inputStyle} value={filterTipo} onChange={e => setFilterTipo(e.target.value)}>
          <option value="">Todos los tipos</option>
          {TIPOS.map(t => <option key={t}>{t}</option>)}
        </select>
        <select style={inputStyle} value={filterNode} onChange={e => setFilterNode(e.target.value)}>
          <option value="">Todos los nodos</option>
          {NODE_OPTIONS.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
        </select>
        <button
          onClick={() => setShowModal(true)}
          style={{
            padding: '7px 16px', fontSize: 13, fontWeight: 500,
            background: '#1D9E75', color: '#fff', border: 'none',
            borderRadius: 6, cursor: 'pointer', whiteSpace: 'nowrap',
          }}
        >
          + Alta cliente
        </button>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '0.5px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Cargando clientes...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {[
                  ['Cliente', '19%'], ['Tipo', '9%'], ['Nodo', '6%'],
                  ['Puerto adm', '13%'], ['VLAN', '6%'], ['Velocidad', '9%'],
                  ['Meta BW', '8%'], ['Monitoreo (BW actual)', '15%'], ['SLA', '9%'],
                ].map(([h, w]) => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontSize: 11, fontWeight: 500, color: '#6b7280', borderBottom: '0.5px solid #e5e7eb', width: w }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>Sin resultados</td></tr>
              ) : (
                filtered.map((c, i) => {
                  const last = latest[c.id]
                  const sla = evalSla(c, last)
                  const metaBw = c.meta_bw_mbps || c.velocidad_mbps
                  return (
                  <tr key={c.id ?? i} style={{ borderBottom: '0.5px solid #f3f4f6' }}>
                    <td style={{ padding: '8px 10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{c.nombre}</td>
                    <td style={{ padding: '8px 10px' }}><TypeBadge tipo={c.tipo} /></td>
                    <td style={{ padding: '8px 10px', color: '#374151' }}>{c.node_id}</td>
                    <td style={{ padding: '8px 10px', color: '#6b7280', fontSize: 11, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.puerto_adm || '—'}</td>
                    <td style={{ padding: '8px 10px', fontFamily: 'monospace' }}>{c.vlan}</td>
                    <td style={{ padding: '8px 10px' }}>{typeof c.velocidad_mbps === 'number' ? velLabel(c.velocidad_mbps) : c.velocidad_mbps}</td>
                    <td style={{ padding: '8px 10px', color: '#6b7280' }}>{velLabel(metaBw)}</td>
                    <td style={{ padding: '4px 10px' }}>
                      {last ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Sparkline data={series[c.id]} meta={metaBw} ok={sla.variant === 'ok'} />
                          <span style={{ fontSize: 11, fontWeight: 500, color: sla.variant === 'ok' ? '#3B6D11' : '#854F0B' }}>
                            {last.online ? `${last.bw_actual_mbps}` : '0'}
                          </span>
                        </div>
                      ) : <span style={{ color: '#9ca3af', fontSize: 11 }}>—</span>}
                    </td>
                    <td style={{ padding: '8px 10px' }}><Badge variant={sla.variant}>{sla.label}</Badge></td>
                  </tr>
                  )
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }}>
          <div style={{
            background: '#fff', borderRadius: 12, border: '0.5px solid #e5e7eb',
            padding: 24, width: 380, maxWidth: '95%',
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 500, marginBottom: 16 }}>Alta de nuevo cliente</h3>

            {[
              { label: 'Nombre / Razón social', key: 'nombre', type: 'text', placeholder: 'Empresa S.A. de C.V.' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 10 }}>
                <label style={{ display: 'block', fontSize: 11, color: '#6b7280', marginBottom: 4 }}>{f.label}</label>
                <input style={inputStyle} type={f.type} placeholder={f.placeholder}
                  value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
              </div>
            ))}

            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Tipo</label>
              <select style={inputStyle} value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))}>
                {TIPOS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Nodo de conexión</label>
              <select style={inputStyle} value={form.node_id} onChange={e => setForm(p => ({ ...p, node_id: e.target.value }))}>
                {NODE_OPTIONS.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Hilo (1–24)</label>
                <input style={inputStyle} type="number" min="1" max="24"
                  value={form.hilo} onChange={e => setForm(p => ({ ...p, hilo: +e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Puerto (1–48)</label>
                <input style={inputStyle} type="number" min="1" max="48"
                  value={form.puerto} onChange={e => setForm(p => ({ ...p, puerto: +e.target.value }))} />
              </div>
            </div>

            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Caja</label>
              <input style={inputStyle} type="text" placeholder={`CAJ-${form.node_id}-01`}
                value={form.caja} onChange={e => setForm(p => ({ ...p, caja: e.target.value }))} />
            </div>

            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Velocidad</label>
              <select style={inputStyle} value={form.velocidad_mbps}
                onChange={e => setForm(p => ({ ...p, velocidad_mbps: parseInt(e.target.value) }))}>
                {[10,50,100,200,500,1000,10000].map(v => (
                  <option key={v} value={v}>{velLabel(v)}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Puerto adm (IP:puerto de gestión)</label>
              <input style={{ ...inputStyle, fontFamily: 'monospace' }} type="text" placeholder="10.10.0.1:8728"
                value={form.puerto_adm} onChange={e => setForm(p => ({ ...p, puerto_adm: e.target.value }))} />
            </div>

            {/* Metas / SLA — lo que monitorea el poller contra lo medido */}
            <div style={{ marginBottom: 6, fontSize: 11, fontWeight: 500, color: '#374151' }}>Metas (SLA)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: '#6b7280', marginBottom: 4 }}>BW garant. (Mbps)</label>
                <input style={inputStyle} type="number" min="0" placeholder={String(form.velocidad_mbps)}
                  value={form.meta_bw_mbps} onChange={e => setForm(p => ({ ...p, meta_bw_mbps: +e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Latencia máx (ms)</label>
                <input style={inputStyle} type="number" min="0"
                  value={form.meta_latencia_ms} onChange={e => setForm(p => ({ ...p, meta_latencia_ms: +e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Uptime (%)</label>
                <input style={inputStyle} type="number" min="0" max="100" step="0.1"
                  value={form.meta_uptime_pct} onChange={e => setForm(p => ({ ...p, meta_uptime_pct: +e.target.value }))} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)}
                style={{ padding: '7px 16px', fontSize: 13, background: 'transparent', border: '0.5px solid #d1d5db', borderRadius: 6, cursor: 'pointer', color: '#6b7280' }}>
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving}
                style={{ padding: '7px 16px', fontSize: 13, background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Guardando...' : 'Registrar cliente'}
              </button>
            </div>

            {usingMock && (
              <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 10, textAlign: 'center' }}>
                Modo demo — configura .env para guardar en Supabase
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
