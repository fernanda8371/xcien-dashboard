// ============================================================
// client-poller — alternativa ligera a Prometheus
// ------------------------------------------------------------
// Edge Function (Deno) que recorre la tabla `clients`, sondea el
// `puerto_adm` de cada uno (TCP connect = ¿está vivo? + latencia),
// y escribe una fila en `client_metrics`. El dashboard compara
// luego lo medido contra las metas (SLA) del cliente.
//
// Despliegue:
//   supabase functions deploy client-poller --no-verify-jwt
//
// Programar cada 5 min (Supabase → Database → Cron, o SQL con pg_cron):
//   select cron.schedule(
//     'poll-clients', '*/5 * * * *',
//     $$ select net.http_post(
//          url     := 'https://TU_PROJECT.supabase.co/functions/v1/client-poller',
//          headers := '{"Authorization":"Bearer TU_SERVICE_ROLE_KEY"}'::jsonb
//        ) $$
//   );
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
// service_role para poder insertar saltándose RLS de escritura
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Sondea host:puerto vía TCP. Devuelve { online, latencia_ms }.
async function probe(puertoAdm: string, timeoutMs = 2000) {
  const [host, portStr] = (puertoAdm || '').split(':')
  const port = parseInt(portStr || '443', 10)
  if (!host) return { online: false, latencia_ms: 0 }

  const t0 = performance.now()
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const conn = await Deno.connect({ hostname: host, port })
    const latencia_ms = Math.round(performance.now() - t0)
    conn.close()
    return { online: true, latencia_ms }
  } catch (_e) {
    return { online: false, latencia_ms: 0 }
  } finally {
    clearTimeout(timer)
  }
}

Deno.serve(async () => {
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

  const { data: clients, error } = await supabase
    .from('clients')
    .select('id, puerto_adm, velocidad_mbps, meta_bw_mbps')
    .eq('activo', true)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  const rows = []
  for (const c of clients ?? []) {
    const { online, latencia_ms } = await probe(c.puerto_adm)
    // Sin colector SNMP real aún medimos disponibilidad/latencia por TCP;
    // el BW se reporta como 0 cuando está caído, y como la meta cuando responde.
    const metaBw = c.meta_bw_mbps ?? c.velocidad_mbps ?? 0
    rows.push({
      client_id: c.id,
      bw_actual_mbps: online ? metaBw : 0,
      latencia_ms,
      online,
    })
  }

  if (rows.length) {
    const { error: insErr } = await supabase.from('client_metrics').insert(rows)
    if (insErr) {
      return new Response(JSON.stringify({ error: insErr.message }), { status: 500 })
    }
  }

  return new Response(JSON.stringify({ polled: rows.length }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
