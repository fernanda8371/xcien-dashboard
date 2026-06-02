import { RINGS } from '../data/network'
import { StatCard, Badge, ProgressBar } from '../components/UI'
import { useRingStatus } from '../lib/hooks'

// Caja de nodo (RB en verde, core/Internet en azul)
function NodeBox({ x, y, w = 130, h = 56, fill, stroke, title, titleColor, sub, subColor }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="9" fill={fill} stroke={stroke} strokeWidth="1.5" />
      <text x={x + w / 2} y={y + 25} fontSize="16" fontWeight="600" fill={titleColor} textAnchor="middle">{title}</text>
      <text x={x + w / 2} y={y + 43} fontSize="12" fill={subColor} textAnchor="middle">{sub}</text>
    </g>
  )
}

// Píldora "RPL" sobre el enlace bloqueado
function RplPill({ x, y, color }) {
  return (
    <g>
      <rect x={x - 16} y={y - 10} width="32" height="20" rx="10" fill="#fff" stroke={color} strokeWidth="1.3" />
      <text x={x} y={y + 4} fontSize="11" fontWeight="600" fill={color} textAnchor="middle">RPL</text>
    </g>
  )
}

const RB   = { fill: '#E1F5EE', stroke: '#5DCAA5', titleColor: '#0F6E56', subColor: '#4E9E84' }
const CORE = { fill: '#E6F1FB', stroke: '#9CC4EE', titleColor: '#1F3A5F', subColor: '#2C6CB0' }
const ORANGE = '#E07B39'
const PURPLE = '#7C3AED'
const GREY   = '#b0b6bf'

export default function Topologia({ totalClients }) {
  const { status: ringStatus } = useRingStatus()

  const norte = ringStatus['Norte'] || { bw_usado_mbps: 6200, estado: 'ALTO' }
  const sur   = ringStatus['Sur']   || { bw_usado_mbps: 5500, estado: 'NORMAL' }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
        <StatCard label="Nodos activos" value="9" sub="2 core · 7 transporte" />
        <StatCard label="Anillos G.8032" value="2" sub="Norte + Sur" />
        <StatCard label="Salidas internet" value="3" sub="2× IP Transit · 1× LD Mty" />
        <StatCard label="Clientes totales" value={totalClients} sub="+2 IP Transit" />
      </div>

      {/* Diagrama de topología */}
      <div style={{ background: '#fff', border: '0.5px solid #e5e7eb', borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <svg viewBox="0 0 760 840" style={{ width: '100%', height: 'auto', maxWidth: 820, display: 'block', margin: '0 auto' }}
          role="img" aria-label="Diagrama lógico de red XCIEN Saltillo con Anillo Norte y Anillo Sur">

          {/* Título */}
          <text x="380" y="34" fontSize="20" fontWeight="700" fill="#1f2937" textAnchor="middle">Xcien — Saltillo · Topología de red</text>
          <text x="380" y="56" fontSize="13" fill="#6b7280" textAnchor="middle">Dos anillos G.8032 ERPS · Raisecom RAX750 · 10G por enlace</text>

          {/* INTERNET GLOBAL */}
          <rect x="255" y="72" width="250" height="46" rx="9" fill={CORE.fill} stroke={CORE.stroke} strokeWidth="1.5" />
          <text x="380" y="100" fontSize="16" fontWeight="700" fill={CORE.titleColor} textAnchor="middle">INTERNET GLOBAL</text>

          {/* Uplink LD Mty hacia Internet 1 */}
          <line x1="380" y1="118" x2="150" y2="250" stroke={GREY} strokeWidth="2" strokeDasharray="6,5" />
          <text x="300" y="172" fontSize="12" fill="#9ca3af">LD Mty</text>

          {/* ── ANILLO NORTE ── */}
          <text x="95" y="208" fontSize="13" fontWeight="600" fill="#C25E1A">ANILLO NORTE — Ramos Arizpe</text>

          {/* enlaces Norte */}
          <line x1="190" y1="270" x2="305" y2="212" stroke={ORANGE} strokeWidth="3" />
          <line x1="425" y1="212" x2="560" y2="270" stroke={ORANGE} strokeWidth="3" />
          <line x1="612" y1="306" x2="565" y2="382" stroke={ORANGE} strokeWidth="3" />
          <text x="236" y="232" fontSize="12" fill="#C25E1A" textAnchor="middle">IP Transit 1</text>

          {/* RPL Norte: Internet 1 → RB9 */}
          <line x1="180" y1="305" x2="470" y2="405" stroke={ORANGE} strokeWidth="2.5" strokeDasharray="7,5" />
          <RplPill x="325" y="355" color={ORANGE} />

          {/* nodos Norte */}
          <NodeBox x={60}  y={250} {...CORE} title="Internet 1" sub="Nodo core" />
          <NodeBox x={300} y={170} {...RB}   title="RB5" sub="Norte / Ramos" />
          <NodeBox x={560} y={250} {...RB}   title="RB8" sub="Noreste" />
          <NodeBox x={470} y={380} {...RB}   title="RB9" sub="Este" />

          {/* Interconexión por Internet */}
          <line x1="125" y1="306" x2="125" y2="472" stroke={GREY} strokeWidth="2" strokeDasharray="6,5" />
          <text x="138" y="382" fontSize="11" fill="#9ca3af">interconexión</text>
          <text x="138" y="396" fontSize="11" fill="#9ca3af">vía Internet</text>

          {/* ── ANILLO SUR ── */}
          <text x="95" y="452" fontSize="13" fontWeight="600" fill="#6D28D9">ANILLO SUR — Centro Saltillo</text>

          {/* enlaces Sur */}
          <line x1="190" y1="500" x2="405" y2="500" stroke={PURPLE} strokeWidth="3" />
          <line x1="490" y1="528" x2="548" y2="612" stroke={PURPLE} strokeWidth="3" />
          <line x1="525" y1="668" x2="408" y2="700" stroke={PURPLE} strokeWidth="3" />
          <line x1="305" y1="706" x2="232" y2="668" stroke={PURPLE} strokeWidth="3" />

          {/* RPL Sur: Internet 2 → RB6 */}
          <line x1="132" y1="528" x2="172" y2="612" stroke={PURPLE} strokeWidth="2.5" strokeDasharray="7,5" />
          <RplPill x="152" y="570" color={PURPLE} />

          {/* nodos Sur */}
          <NodeBox x={60}  y={472} {...CORE} title="Internet 2" sub="Nodo core" />
          <NodeBox x={405} y={472} {...RB}   title="RB3" sub="Centro" />
          <NodeBox x={495} y={612} {...RB}   title="RB7" sub="Sur-centro" />
          <NodeBox x={295} y={692} {...RB}   title="RB4" sub="Suroeste" />
          <NodeBox x={115} y={612} {...RB}   title="RB6" sub="Cto-Oeste" />

          {/* Leyenda */}
          <line x1="40" y1="812" x2="78" y2="812" stroke={ORANGE} strokeWidth="3" />
          <text x="84" y="816" fontSize="12" fill="#6b7280">Anillo Norte</text>
          <line x1="180" y1="812" x2="218" y2="812" stroke={PURPLE} strokeWidth="3" />
          <text x="224" y="816" fontSize="12" fill="#6b7280">Anillo Sur</text>
          <rect x="310" y="804" width="22" height="15" rx="4" fill={RB.fill} stroke={RB.stroke} strokeWidth="1.2" />
          <text x="338" y="816" fontSize="12" fill="#6b7280">Nodo RB</text>
          <rect x="418" y="804" width="22" height="15" rx="4" fill={CORE.fill} stroke={CORE.stroke} strokeWidth="1.2" />
          <text x="446" y="816" fontSize="12" fill="#6b7280">Nodo core/Internet</text>
          <line x1="620" y1="812" x2="658" y2="812" stroke={GREY} strokeWidth="2" strokeDasharray="6,4" />
          <text x="664" y="816" fontSize="12" fill="#6b7280">RPL bloqueado</text>
        </svg>
      </div>

      {/* Resumen + estado de anillos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        <div style={{ background: '#fff', border: '0.5px solid #e5e7eb', borderRadius: 12, padding: 14 }}>
          <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 10 }}>Resumen de red</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
            {[
              { label: 'Nodos', val: '9', sub: '2 core · 7 RB' },
              { label: 'Anillos', val: '2', sub: 'ERPS G.8032' },
              { label: 'Clientes', val: totalClients, sub: 'activos' },
              { label: 'Uplinks', val: '3', sub: 'IP Transit' },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: 10, color: '#6b7280' }}>{s.label}</div>
                <div style={{ fontSize: 18, fontWeight: 500 }}>{s.val}</div>
                <div style={{ fontSize: 10, color: '#6b7280' }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {[
          { ring: RINGS[0], st: norte, color: '#EF9F27', badgeV: 'warn' },
          { ring: RINGS[1], st: sur,   color: '#1D9E75', badgeV: 'ok' },
        ].map(({ ring, st, color, badgeV }) => (
          <div key={ring.id} style={{ background: '#fff', border: '0.5px solid #e5e7eb', borderRadius: 12, padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontWeight: 500, fontSize: 13 }}>{ring.nombre}</span>
              <Badge variant={badgeV}>{st.estado}</Badge>
            </div>
            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>{ring.zona} · {ring.nodos.length} nodos</div>
            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
              <span>BW usado</span>
              <strong style={{ color: '#111' }}>{st.bw_usado_mbps?.toLocaleString()} / 10,000 Mbps</strong>
            </div>
            <ProgressBar value={st.bw_usado_mbps} max={10000} color={color} />
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>
              {ring.nodos.map(n => (
                <span key={n} style={{
                  fontSize: 10, padding: '2px 7px', borderRadius: 5,
                  background: n === ring.core_nodo ? '#E1F5EE' : '#f3f4f6',
                  color: n === ring.core_nodo ? '#0F6E56' : '#6b7280',
                  border: '0.5px solid #e5e7eb',
                }}>{n}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
