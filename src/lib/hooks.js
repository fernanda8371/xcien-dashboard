import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

// Clientes de ejemplo cuando Supabase no está configurado
const MOCK_CLIENTS = [
  { id: 1, nombre: 'Grupo Industrial Saltillo', tipo: 'Corporativo', node_id: 'RB5', caja: 'CAJ-RB5-01', hilo: 2, puerto: 5, vlan: 100, velocidad_mbps: 10000, activo: true },
  { id: 2, nombre: 'Municipio de Saltillo', tipo: 'Corporativo', node_id: 'RB3', caja: 'CAJ-RB3-01', hilo: 1, puerto: 3, vlan: 200, velocidad_mbps: 1000, activo: true },
  { id: 3, nombre: 'Hotel Camino Real', tipo: 'Empresarial', node_id: 'RB6', caja: 'CAJ-RB6-02', hilo: 4, puerto: 12, vlan: 310, velocidad_mbps: 500, activo: true },
  { id: 4, nombre: 'Tec de Monterrey Saltillo', tipo: 'Empresarial', node_id: 'RB8', caja: 'CAJ-RB8-01', hilo: 3, puerto: 8, vlan: 420, velocidad_mbps: 500, activo: true },
  { id: 5, nombre: 'Farmacia Benavides', tipo: 'PyMe', node_id: 'RB9', caja: 'CAJ-RB9-03', hilo: 6, puerto: 18, vlan: 510, velocidad_mbps: 100, activo: true },
  { id: 6, nombre: 'Despacho Contable Ramos', tipo: 'PyMe', node_id: 'RB5', caja: 'CAJ-RB5-02', hilo: 5, puerto: 14, vlan: 520, velocidad_mbps: 50, activo: true },
  { id: 7, nombre: 'Clínica Dental del Norte', tipo: 'Micro', node_id: 'RB9', caja: 'CAJ-RB9-04', hilo: 7, puerto: 21, vlan: 610, velocidad_mbps: 10, activo: true },
  { id: 8, nombre: 'Taquería El Norteño', tipo: 'Micro', node_id: 'RB7', caja: 'CAJ-RB7-01', hilo: 2, puerto: 6, vlan: 620, velocidad_mbps: 10, activo: true },
  { id: 9, nombre: 'AutoPartes Coahuila', tipo: 'PyMe', node_id: 'RB4', caja: 'CAJ-RB4-01', hilo: 3, puerto: 9, vlan: 530, velocidad_mbps: 100, activo: true },
  { id: 10, nombre: 'Gobierno de Coahuila', tipo: 'Corporativo', node_id: 'I2', caja: 'CAJ-I2-01', hilo: 1, puerto: 2, vlan: 110, velocidad_mbps: 1000, activo: true },
  { id: 11, nombre: 'Centro Comercial Galerías', tipo: 'Empresarial', node_id: 'RB3', caja: 'CAJ-RB3-02', hilo: 5, puerto: 15, vlan: 430, velocidad_mbps: 200, activo: true },
  { id: 12, nombre: 'Ferretera Industrial SA', tipo: 'PyMe', node_id: 'RB6', caja: 'CAJ-RB6-01', hilo: 8, puerto: 22, vlan: 540, velocidad_mbps: 50, activo: true },
  { id: 13, nombre: 'Escuela Primaria Juárez', tipo: 'Micro', node_id: 'RB7', caja: 'CAJ-RB7-02', hilo: 4, puerto: 11, vlan: 630, velocidad_mbps: 10, activo: true },
  { id: 14, nombre: 'Laboratorio Clínico Central', tipo: 'Empresarial', node_id: 'RB8', caja: 'CAJ-RB8-02', hilo: 6, puerto: 17, vlan: 440, velocidad_mbps: 200, activo: true },
  { id: 15, nombre: 'Agencia de Viajes Horizonte', tipo: 'Micro', node_id: 'RB5', caja: 'CAJ-RB5-03', hilo: 9, puerto: 24, vlan: 640, velocidad_mbps: 10, activo: true },
]

const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL
  return url && url !== 'https://placeholder.supabase.co' && !url.includes('TU_PROJECT')
}

export function useClients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [usingMock, setUsingMock] = useState(false)
  // Nombre de canal único por instancia: useClients se usa en App y en Clientes
  // a la vez, y Supabase comparte canales con el mismo nombre (rompía al re-suscribir).
  const channelId = useRef(`clients-changes-${Math.random().toString(36).slice(2)}`)

  const fetchClients = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setClients(MOCK_CLIENTS)
      setUsingMock(true)
      setLoading(false)
      return
    }
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setClients(data)
      setUsingMock(false)
    } catch (err) {
      console.error('Error al cargar clientes:', err)
      setError(err.message)
      setClients(MOCK_CLIENTS)
      setUsingMock(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchClients()

    // Suscripción en tiempo real (solo si Supabase está configurado)
    if (!isSupabaseConfigured()) return
    const channel = supabase
      .channel(channelId.current)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, fetchClients)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [fetchClients])

  const addClient = async (newClient) => {
    if (!isSupabaseConfigured()) {
      // Modo mock — solo agrega localmente
      const mockNew = { ...newClient, id: Date.now(), activo: true }
      setClients(prev => [mockNew, ...prev])
      return { data: mockNew, error: null }
    }
    const { data, error } = await supabase.from('clients').insert([newClient]).select().single()
    if (!error) fetchClients()
    return { data, error }
  }

  const updateClient = async (id, changes) => {
    if (!isSupabaseConfigured()) {
      // Modo mock — actualiza solo localmente
      setClients(prev => prev.map(c => (c.id === id ? { ...c, ...changes } : c)))
      return { data: { id, ...changes }, error: null }
    }
    const { data, error } = await supabase.from('clients').update(changes).eq('id', id).select().single()
    if (!error) fetchClients()
    return { data, error }
  }

  return { clients, loading, error, usingMock, refetch: fetchClients, addClient, updateClient }
}

// ── Monitoreo por cliente (alternativa ligera a Prometheus) ──
// Genera una serie temporal simulada alrededor de la meta de cada cliente.
// En producción estos puntos los escribe la Edge Function `client-poller`.
function mockMetricSeries(client, points = 24) {
  const metaBw = client.meta_bw_mbps || client.velocidad_mbps || 100
  const metaLat = client.meta_latencia_ms || 50
  const now = Date.now()
  const series = []
  for (let i = points - 1; i >= 0; i--) {
    // BW fluctúa entre 65% y 105% de la meta; algún cliente puede quedar por debajo
    const factor = 0.65 + Math.random() * 0.4
    const online = Math.random() > 0.03
    series.push({
      medido_en: new Date(now - i * 5 * 60 * 1000).toISOString(),
      bw_actual_mbps: online ? Math.round(metaBw * factor) : 0,
      latencia_ms: online ? Math.round(metaLat * (0.5 + Math.random())) : 0,
      online,
    })
  }
  return series
}

// Compara la última métrica contra las metas → 'ok' | 'warn' | 'danger'
export function evalSla(client, latest) {
  if (!latest) return { variant: 'gray', label: 'Sin datos' }
  if (!latest.online) return { variant: 'danger', label: 'Caído' }
  const metaBw = client.meta_bw_mbps || client.velocidad_mbps || 100
  const metaLat = client.meta_latencia_ms || 50
  const bwOk = latest.bw_actual_mbps >= metaBw * 0.9
  const latOk = latest.latencia_ms <= metaLat
  if (bwOk && latOk) return { variant: 'ok', label: 'Cumple' }
  return { variant: 'warn', label: 'En riesgo' }
}

export function useClientMetrics(clients) {
  const [series, setSeries] = useState({})  // { [client_id]: [{...}] }
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!clients?.length) { setLoading(false); return }

    if (!isSupabaseConfigured()) {
      const map = {}
      clients.forEach(c => { map[c.id] = mockMetricSeries(c) })
      setSeries(map)
      setLoading(false)
      return
    }
    try {
      const { data, error } = await supabase
        .from('client_metrics')
        .select('*')
        .order('medido_en', { ascending: true })
      if (error) throw error
      const map = {}
      data.forEach(row => { (map[row.client_id] ||= []).push(row) })
      setSeries(map)
    } catch (err) {
      console.error('Error al cargar métricas:', err)
      const map = {}
      clients.forEach(c => { map[c.id] = mockMetricSeries(c) })
      setSeries(map)
    } finally {
      setLoading(false)
    }
  }, [clients])

  useEffect(() => { load() }, [load])

  // Mapa client_id → última métrica, útil para badges de SLA
  const latest = {}
  Object.entries(series).forEach(([id, pts]) => { latest[id] = pts[pts.length - 1] })

  return { series, latest, loading }
}

export function useNodeStatus() {
  const [status, setStatus] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      // Importar mock de network.js
      import('../data/network.js').then(m => {
        setStatus(m.MOCK_NODE_STATUS)
        setLoading(false)
      })
      return
    }
    const fetch = async () => {
      const { data } = await supabase.from('node_status').select('*')
      if (data) {
        const map = {}
        data.forEach(row => { map[row.node_id] = row })
        setStatus(map)
      }
      setLoading(false)
    }
    fetch()
  }, [])

  return { status, loading }
}

export function useRingStatus() {
  const [status, setStatus] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      import('../data/network.js').then(m => {
        setStatus(m.MOCK_RING_STATUS)
        setLoading(false)
      })
      return
    }
    const fetch = async () => {
      const { data } = await supabase.from('rings').select('*')
      if (data) {
        const map = {}
        data.forEach(row => { map[row.id] = row })
        setStatus(map)
      }
      setLoading(false)
    }
    fetch()
  }, [])

  return { status, loading }
}
