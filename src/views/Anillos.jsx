import { RINGS } from '../data/network'
import { StatCard, Badge, ProgressBar } from '../components/UI'
import { useRingStatus } from '../lib/hooks'

export default function Anillos() {
  const { status } = useRingStatus()

  const norte = status['Norte'] || { bw_usado_mbps: 6200, estado: 'ALTO' }
  const sur   = status['Sur']   || { bw_usado_mbps: 5500, estado: 'NORMAL' }

  const rings = [
    { ...RINGS[0], st: norte, color: '#EF9F27', badgeV: 'warn', dotColor: '#1D9E75' },
    { ...RINGS[1], st: sur,   color: '#1D9E75', badgeV: 'ok',   dotColor: '#378ADD' },
  ]

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
        <StatCard label="Capacidad por anillo" value="10 Gbps" sub="Raisecom RAX750" />
        <StatCard label="Utilización Norte" value="62%" sub="Estado: ALTO" subColor="#EF9F27" />
        <StatCard label="Utilización Sur"   value="55%" sub="Estado: NORMAL" subColor="#1D9E75" />
        <StatCard label="Convergencia ERPS" value="<50ms" sub="RPL activo en ambos" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {rings.map(r => {
          const pct = Math.round((r.st.bw_usado_mbps / r.capacidad_mbps) * 100)
          const avail = r.capacidad_mbps - r.st.bw_usado_mbps
          return (
            <div key={r.id} style={{ background: '#fff', border: '0.5px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontWeight: 500, fontSize: 14 }}>{r.nombre}</span>
                <Badge variant={r.badgeV}>{r.st.estado} · {pct}%</Badge>
              </div>
              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 12 }}>
                {r.zona} · {r.estandar} · {r.nodos.length} nodos
              </div>
              <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 34, fontWeight: 500, color: r.color, lineHeight: 1 }}>
                    {r.st.bw_usado_mbps?.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Mbps en uso</div>
                </div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 500, color: '#9ca3af', lineHeight: 1 }}>
                    {avail.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Mbps disponible</div>
                </div>
              </div>
              <ProgressBar value={r.st.bw_usado_mbps} max={r.capacidad_mbps} color={r.color} height={10} />
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>Secuencia del anillo</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                  {r.nodos.map((n, i) => (
                    <span key={n} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{
                        fontSize: 10, padding: '3px 8px', borderRadius: 5,
                        background: n === r.core_nodo ? '#E1F5EE' : '#f3f4f6',
                        color: n === r.core_nodo ? '#0F6E56' : '#374151',
                        border: '0.5px solid #e5e7eb', fontWeight: n === r.core_nodo ? 500 : 400,
                      }}>{n}</span>
                      {i < r.nodos.length - 1 && <span style={{ fontSize: 10, color: '#9ca3af' }}>→</span>}
                    </span>
                  ))}
                  <span style={{ fontSize: 10, color: '#9ca3af' }}>⟲</span>
                  <span style={{
                    fontSize: 10, padding: '3px 8px', borderRadius: 5,
                    background: '#FAEEDA', color: '#854F0B', border: '0.5px solid #FAC775',
                  }}>RPL bloqueado</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Detail table */}
      <div style={{ background: '#fff', border: '0.5px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #e5e7eb', fontWeight: 500, fontSize: 14 }}>
          Utilización detallada — anillos de transporte
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              {['Anillo','Estándar','Nodos','Capacidad','BW usado','Disponible','Saturación','Estado']
                .map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, fontWeight: 500, color: '#6b7280', borderBottom: '0.5px solid #e5e7eb' }}>{h}</th>
                ))}
            </tr>
          </thead>
          <tbody>
            {rings.map(r => {
              const pct = Math.round((r.st.bw_usado_mbps / r.capacidad_mbps) * 100)
              return (
                <tr key={r.id}>
                  <td style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: r.dotColor, display: 'inline-block' }}/>
                    {r.nombre}
                  </td>
                  <td style={{ padding: '10px 12px' }}>{r.estandar}</td>
                  <td style={{ padding: '10px 12px' }}>{r.nodos.length}</td>
                  <td style={{ padding: '10px 12px' }}>10,000 Mbps</td>
                  <td style={{ padding: '10px 12px', fontWeight: 500, color: r.color }}>
                    {r.st.bw_usado_mbps?.toLocaleString()} Mbps
                  </td>
                  <td style={{ padding: '10px 12px', color: '#6b7280' }}>
                    {(r.capacidad_mbps - r.st.bw_usado_mbps).toLocaleString()} Mbps
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ width: 80 }}>
                      <ProgressBar value={r.st.bw_usado_mbps} max={r.capacidad_mbps} color={r.color} height={5} />
                      <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>{pct}%</div>
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <Badge variant={r.badgeV}>{r.st.estado}</Badge>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
