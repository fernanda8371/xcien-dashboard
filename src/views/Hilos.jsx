import { useMemo, useState } from 'react'
import { NODES } from '../data/network'
import { useClients } from '../lib/hooks'
import { StatCard, Badge, TypeBadge } from '../components/UI'

const HILOS_POR_NODO = 24

const velLabel = (mbps) =>
  typeof mbps === 'number' ? (mbps >= 1000 ? `${mbps / 1000} Gbps` : `${mbps} Mbps`) : mbps

const inputStyle = {
  width: '100%', padding: '7px 10px', fontSize: 13,
  border: '0.5px solid #d1d5db', borderRadius: 6,
  background: '#f9fafb', color: '#111827',
}

export default function Hilos() {
  const { clients, loading, updateClient } = useClients()
  const [nodeSel, setNodeSel] = useState('')
  // Cliente en edición de hilo: { client, node_id }
  const [edit, setEdit] = useState(null)
  const [draft, setDraft] = useState({ hilo: 1, puerto: 1 })
  const [saving, setSaving] = useState(false)

  // node_id -> { nº hilo -> [clientes que lo usan] }
  const ocupacion = useMemo(() => {
    const m = {}
    clients.forEach(c => {
      if (!c.node_id || !c.hilo) return
      if (!m[c.node_id]) m[c.node_id] = {}
      if (!m[c.node_id][c.hilo]) m[c.node_id][c.hilo] = []
      m[c.node_id][c.hilo].push(c)
    })
    return m
  }, [clients])

  const nodos = nodeSel ? NODES.filter(n => n.id === nodeSel) : NODES

  const totalHilos = NODES.length * HILOS_POR_NODO
  const usados = useMemo(
    () => NODES.reduce((acc, n) => acc + Object.keys(ocupacion[n.id] || {}).length, 0),
    [ocupacion]
  )
  const pct = Math.round((usados / totalHilos) * 100)

  // Filas planas para la tabla "qué hilo usa cada cliente"
  const asignaciones = useMemo(
    () => clients
      .filter(c => c.hilo)
      .slice()
      .sort((a, b) => (a.node_id || '').localeCompare(b.node_id || '') || a.hilo - b.hilo),
    [clients]
  )

  // Hilos libres del nodo en edición (incluye el actual del cliente)
  const hilosLibresEdit = useMemo(() => {
    if (!edit) return []
    const usados = clients
      .filter(c => c.node_id === edit.node_id && c.hilo && c.id !== edit.client.id)
      .map(c => Number(c.hilo))
    return Array.from({ length: HILOS_POR_NODO }, (_, i) => i + 1).filter(h => !usados.includes(h))
  }, [clients, edit])

  const openEdit = (client, node_id) => {
    setEdit({ client, node_id })
    setDraft({ hilo: Number(client.hilo) || 1, puerto: Number(client.puerto) || 1 })
  }

  const saveEdit = async () => {
    setSaving(true)
    const { error } = await updateClient(edit.client.id, { hilo: draft.hilo, puerto: draft.puerto })
    setSaving(false)
    if (error) { alert('Error al guardar: ' + (error.message || JSON.stringify(error))); return }
    setEdit(null)
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
        <StatCard label="Hilos totales" value={totalHilos} sub={`${NODES.length} nodos × 24`} />
        <StatCard label="Hilos ocupados" value={usados} sub={`${pct}% de la planta`} subColor={pct >= 80 ? '#E24B4A' : '#6b7280'} />
        <StatCard label="Hilos libres" value={totalHilos - usados} sub="disponibles para alta" />
        <StatCard label="Nodos" value={NODES.length} sub="con 24 hilos c/u" />
      </div>

      {/* Filtro de nodo */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
        <select
          value={nodeSel}
          onChange={e => setNodeSel(e.target.value)}
          style={{ padding: '7px 10px', fontSize: 13, border: '0.5px solid #d1d5db', borderRadius: 6, background: '#f9fafb', color: '#111827' }}
        >
          <option value="">Todos los nodos</option>
          {NODES.map(n => <option key={n.id} value={n.id}>{n.id} — {n.loc}</option>)}
        </select>
        <span style={{ fontSize: 11, color: '#9ca3af' }}>
          Los hilos se dan de alta en Clientes → + Alta cliente. Haz clic en un hilo ocupado para reasignarlo.
        </span>
      </div>

      {/* Mapa de ocupación por nodo */}
      <div style={{ display: 'grid', gridTemplateColumns: nodeSel ? '1fr' : '1fr 1fr', gap: 12, marginBottom: 16 }}>
        {nodos.map(n => {
          const ocup = ocupacion[n.id] || {}
          const usadosNodo = Object.keys(ocup).length
          return (
            <div key={n.id} style={{ background: '#fff', border: '0.5px solid #e5e7eb', borderRadius: 12, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontWeight: 500, fontSize: 13 }}>{n.id} <span style={{ color: '#9ca3af', fontWeight: 400 }}>· {n.loc}</span></span>
                <Badge variant={usadosNodo >= 22 ? 'danger' : usadosNodo >= 16 ? 'warn' : 'ok'}>
                  {usadosNodo}/24 hilos
                </Badge>
              </div>
              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 10 }}>{n.hostname}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 4 }}>
                {Array.from({ length: HILOS_POR_NODO }, (_, i) => i + 1).map(h => {
                  const ocupantes = ocup[h]
                  const libre = !ocupantes
                  const title = libre
                    ? `Hilo ${h} — libre`
                    : `Hilo ${h} — ${ocupantes.map(c => `${c.nombre} (pto ${c.puerto})`).join(', ')} · clic para reasignar`
                  return (
                    <div key={h} title={title}
                      onClick={libre ? undefined : () => openEdit(ocupantes[0], n.id)}
                      style={{
                      aspectRatio: '1 / 1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, borderRadius: 5, cursor: libre ? 'default' : 'pointer',
                      background: libre ? '#f3f4f6' : '#E1F5EE',
                      color: libre ? '#9ca3af' : '#0F6E56',
                      border: `0.5px solid ${libre ? '#e5e7eb' : '#9ed8c2'}`,
                      fontWeight: libre ? 400 : 600,
                    }}>{h}</div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Detalle: qué hilo usa cada cliente */}
      <div style={{ background: '#fff', border: '0.5px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #e5e7eb', fontWeight: 500, fontSize: 14 }}>
          Asignación de hilos por cliente
        </div>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Cargando...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['Nodo', 'Hilo', 'Puerto', 'Cliente', 'Tipo', 'Velocidad'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, fontWeight: 500, color: '#6b7280', borderBottom: '0.5px solid #e5e7eb' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {asignaciones
                .filter(c => !nodeSel || c.node_id === nodeSel)
                .map((c, i) => (
                  <tr key={c.id ?? i} style={{ borderBottom: '0.5px solid #f3f4f6' }}>
                    <td style={{ padding: '8px 12px', color: '#374151', fontWeight: 500 }}>{c.node_id}</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'monospace' }}>{c.hilo}</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'monospace' }}>{c.puerto}</td>
                    <td style={{ padding: '8px 12px' }}>{c.nombre}</td>
                    <td style={{ padding: '8px 12px' }}><TypeBadge tipo={c.tipo} /></td>
                    <td style={{ padding: '8px 12px' }}>{velLabel(c.velocidad_mbps)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de reasignación de hilo */}
      {edit && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }}>
          <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #e5e7eb', padding: 24, width: 340, maxWidth: '95%' }}>
            <h3 style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>Reasignar hilo</h3>
            <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 16 }}>
              {edit.client.nombre} · nodo {edit.node_id}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Hilo</label>
                <select style={inputStyle} value={draft.hilo}
                  onChange={e => setDraft(p => ({ ...p, hilo: +e.target.value }))}>
                  {hilosLibresEdit.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Puerto (1–48)</label>
                <input style={inputStyle} type="number" min="1" max="48" value={draft.puerto}
                  onChange={e => setDraft(p => ({ ...p, puerto: +e.target.value }))} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setEdit(null)}
                style={{ padding: '7px 16px', fontSize: 13, background: 'transparent', border: '0.5px solid #d1d5db', borderRadius: 6, cursor: 'pointer', color: '#6b7280' }}>
                Cancelar
              </button>
              <button onClick={saveEdit} disabled={saving}
                style={{ padding: '7px 16px', fontSize: 13, background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
