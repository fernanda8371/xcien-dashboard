import { NODES } from '../data/network'
import { StatCard, Badge, ProgressBar } from '../components/UI'
import { useNodeStatus } from '../lib/hooks'

export default function Nodos() {
  const { status } = useNodeStatus()

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
        <StatCard label="Total nodos" value="9" sub="Raisecom RAX750" />
        <StatCard label="Hilos FO por nodo" value="48" sub="24 transporte · 24 acceso" />
        <StatCard label="Puertos Iscom5600" value="48" sub="por nodo" />
        <StatCard label="Canales CWDM" value="18" sub="1270–1610 nm · 9 clientes/hilo" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px,1fr))', gap: 12 }}>
        {NODES.map(node => {
          const st = status[node.id] || { hilos_usados: 0, puertos_activos: 0, bw_usado_mbps: 0 }
          const isCore = node.rol.includes('Core')
          const hilosPct = Math.round((st.hilos_usados / node.hilos_acceso) * 100)
          const puertosPct = Math.round((st.puertos_activos / node.puertos_iscom) * 100)
          const bwPct = Math.round((st.bw_usado_mbps / 10000) * 100)
          const isAlert = hilosPct >= 90 || puertosPct >= 90

          return (
            <div key={node.id} style={{
              background: '#fff',
              border: `0.5px solid ${isCore ? '#5DCAA5' : isAlert ? '#F09595' : '#e5e7eb'}`,
              borderRadius: 12,
              padding: 14,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
                <div style={{ fontSize: 15, fontWeight: 500 }}>{node.id}</div>
                {isAlert
                  ? <Badge variant="danger">⚠ Crítico</Badge>
                  : isCore
                    ? <Badge variant="ok">Core</Badge>
                    : <Badge variant="info">{node.anillo}</Badge>
                }
              </div>
              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 12 }}>{node.loc}</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#6b7280', marginBottom: 3 }}>
                    <span>Hilos acceso</span><span>{st.hilos_usados}/{node.hilos_acceso}</span>
                  </div>
                  <ProgressBar value={st.hilos_usados} max={node.hilos_acceso} color="#378ADD" height={4} />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#6b7280', marginBottom: 3 }}>
                    <span>Puertos Iscom</span><span>{st.puertos_activos}/{node.puertos_iscom}</span>
                  </div>
                  <ProgressBar value={st.puertos_activos} max={node.puertos_iscom} color="#1D9E75" height={4} />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#6b7280', marginBottom: 3 }}>
                    <span>BW uso</span><span>{bwPct}%</span>
                  </div>
                  <ProgressBar value={st.bw_usado_mbps} max={10000} color="#7F77DD" height={4} />
                </div>
              </div>

              <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 10 }}>
                {node.ip} · {node.hostname.split('-').slice(-1)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
