import { useState } from 'react'
import Topologia from './views/Topologia'
import Anillos   from './views/Anillos'
import Nodos     from './views/Nodos'
import Hilos     from './views/Hilos'
import Clientes  from './views/Clientes'
import { MockBanner } from './components/UI'
import { useClients } from './lib/hooks'

const VIEWS = [
  { id: 'topo',    label: 'Topología' },
  { id: 'anillos', label: 'Anillos'   },
  { id: 'nodos',   label: 'Nodos'     },
  { id: 'hilos',   label: 'Hilos'     },
  { id: 'clientes',label: 'Clientes'  },
]

export default function App() {
  const [view, setView] = useState('topo')
  const { clients, usingMock } = useClients()

  const navBtn = (v) => ({
    padding: '5px 14px', fontSize: 13, cursor: 'pointer',
    border: '0.5px solid transparent', borderRadius: 6,
    background: view === v.id ? '#f3f4f6' : 'transparent',
    borderColor: view === v.id ? '#e5e7eb' : 'transparent',
    color: view === v.id ? '#111827' : '#6b7280',
    fontWeight: view === v.id ? 500 : 400,
  })

  const alertNode = 'RB9'

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', minHeight: '100vh', background: '#f9fafb' }}>

      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 24px', background: '#fff',
        borderBottom: '0.5px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.3px' }}>
            <span style={{ color: '#1D9E75' }}>X</span>CIEN
            <span style={{ fontSize: 11, fontWeight: 400, color: '#9ca3af', marginLeft: 4 }}>NMS</span>
          </div>
          <nav style={{ display: 'flex', gap: 2 }}>
            {VIEWS.map(v => (
              <button key={v.id} style={navBtn(v)} onClick={() => setView(v.id)}>{v.label}</button>
            ))}
          </nav>
        </div>
        <div style={{ display: 'flex', gap: 20, fontSize: 12, color: '#6b7280' }}>
          <span>Nodos <strong style={{ color: '#111' }}>9/9</strong></span>
          <span>Clientes <strong style={{ color: '#111' }}>{clients.length}</strong></span>
          <span>Uso red <strong style={{ color: '#111' }}>52%</strong></span>
          <span>Anillos <strong style={{ color: '#111' }}>2/2</strong></span>
          <span style={{ color: '#9ca3af' }}>● SNMP · 30s</span>
        </div>
      </div>

      {/* Alert bar */}
      <div style={{
        background: '#FAEEDA', borderBottom: '1px solid #FAC775',
        padding: '6px 24px', fontSize: 12, color: '#854F0B',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        ⚠ Alerta: nodo {alertNode} (Este – Arteaga) con saturación crítica de fibra de acceso — revisar capacidad
      </div>

      {/* Mock banner */}
      {usingMock && <MockBanner />}

      {/* Content */}
      <main style={{ padding: '20px 24px', maxWidth: 1280, margin: '0 auto' }}>
        {view === 'topo'     && <Topologia totalClients={clients.length} />}
        {view === 'anillos'  && <Anillos />}
        {view === 'nodos'    && <Nodos />}
        {view === 'hilos'    && <Hilos />}
        {view === 'clientes' && <Clientes />}
      </main>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '16px 24px', fontSize: 11, color: '#9ca3af', borderTop: '0.5px solid #e5e7eb', marginTop: 20 }}>
        XCIEN · Zona Conurbada Saltillo · ITU-T G.8032 ERPS · MPLS-IP · OSPF · CWDM 1270–1610nm · Raisecom RAX750
      </div>
    </div>
  )
}
