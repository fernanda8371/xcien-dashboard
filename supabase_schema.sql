-- ============================================================
-- XCIEN NMS — Esquema de base de datos para Supabase
-- Pega esto en: Supabase → SQL Editor → New query → Run
-- ============================================================

-- 1. Estado dinámico de nodos (actualizable via SNMP o manualmente)
create table if not exists node_status (
  node_id          text primary key,          -- 'I1', 'RB5', etc.
  hilos_usados     int  not null default 0,   -- de 24 disponibles
  puertos_activos  int  not null default 0,   -- de 48 disponibles
  bw_usado_mbps    int  not null default 0,   -- Mbps actuales
  updated_at       timestamptz default now()
);

-- 2. Estado dinámico de anillos
create table if not exists rings (
  id              text primary key,            -- 'Norte' | 'Sur'
  nombre          text not null,
  capacidad_mbps  int  not null default 10000,
  bw_usado_mbps   int  not null default 0,
  rpl_bloqueado   boolean default true,
  estado          text default 'NORMAL',       -- 'NORMAL' | 'ALTO' | 'CRITICO'
  updated_at      timestamptz default now()
);

-- 3. Clientes registrados
create table if not exists clients (
  id              bigint generated always as identity primary key,
  nombre          text    not null,
  tipo            text    not null check (tipo in ('Micro','PyMe','Empresarial','Corporativo')),
  node_id         text    not null,            -- FK lógico a NODES (data estática)
  caja            text,                        -- e.g. 'CAJ-RB5-01'
  hilo            int     not null,            -- 1–24
  puerto          int     not null,            -- 1–48
  vlan            int     not null unique,     -- VLAN de servicio
  velocidad_mbps  int     not null default 100,
  activo          boolean not null default true,
  created_at      timestamptz default now()
);

-- ============================================================
-- DATOS SEED — estado inicial de nodos y anillos
-- ============================================================

insert into node_status (node_id, hilos_usados, puertos_activos, bw_usado_mbps) values
  ('I1',  18, 38, 3100),
  ('RB5', 14, 28, 1200),
  ('RB8', 16, 31, 1100),
  ('RB9', 23, 44, 800),   -- ← saturación crítica
  ('I2',  17, 36, 2800),
  ('RB3', 12, 22, 900),
  ('RB6', 15, 27, 700),
  ('RB7', 13, 25, 600),
  ('RB4', 11, 20, 500)
on conflict (node_id) do nothing;

insert into rings (id, nombre, capacidad_mbps, bw_usado_mbps, rpl_bloqueado, estado) values
  ('Norte', 'Anillo Norte', 10000, 6200, true, 'ALTO'),
  ('Sur',   'Anillo Sur',   10000, 5500, true, 'NORMAL')
on conflict (id) do nothing;

insert into clients (nombre, tipo, node_id, caja, hilo, puerto, vlan, velocidad_mbps) values
  ('Grupo Industrial Saltillo',   'Corporativo', 'RB5', 'CAJ-RB5-01', 2, 5,  100,  10000),
  ('Municipio de Saltillo',       'Corporativo', 'RB3', 'CAJ-RB3-01', 1, 3,  200,  1000),
  ('Hotel Camino Real',           'Empresarial', 'RB6', 'CAJ-RB6-02', 4, 12, 310,  500),
  ('Tec de Monterrey Saltillo',   'Empresarial', 'RB8', 'CAJ-RB8-01', 3, 8,  420,  500),
  ('Farmacia Benavides',          'PyMe',        'RB9', 'CAJ-RB9-03', 6, 18, 510,  100),
  ('Despacho Contable Ramos',     'PyMe',        'RB5', 'CAJ-RB5-02', 5, 14, 520,  50),
  ('Clínica Dental del Norte',    'Micro',       'RB9', 'CAJ-RB9-04', 7, 21, 610,  10),
  ('Taquería El Norteño',         'Micro',       'RB7', 'CAJ-RB7-01', 2, 6,  620,  10),
  ('AutoPartes Coahuila',         'PyMe',        'RB4', 'CAJ-RB4-01', 3, 9,  530,  100),
  ('Gobierno de Coahuila',        'Corporativo', 'I2',  'CAJ-I2-01',  1, 2,  110,  1000),
  ('Centro Comercial Galerías',   'Empresarial', 'RB3', 'CAJ-RB3-02', 5, 15, 430,  200),
  ('Ferretera Industrial SA',     'PyMe',        'RB6', 'CAJ-RB6-01', 8, 22, 540,  50),
  ('Escuela Primaria Juárez',     'Micro',       'RB7', 'CAJ-RB7-02', 4, 11, 630,  10),
  ('Laboratorio Clínico Central', 'Empresarial', 'RB8', 'CAJ-RB8-02', 6, 17, 440,  200),
  ('Agencia de Viajes Horizonte', 'Micro',       'RB5', 'CAJ-RB5-03', 9, 24, 640,  10)
on conflict do nothing;

-- ============================================================
-- Row Level Security (recomendado en producción)
-- Por ahora habilitamos acceso anónimo para el proyecto escolar
-- ============================================================
alter table node_status enable row level security;
alter table rings        enable row level security;
alter table clients      enable row level security;

create policy "anon read node_status"  on node_status for select using (true);
create policy "anon read rings"        on rings        for select using (true);
create policy "anon read clients"      on clients      for select using (true);
create policy "anon insert clients"    on clients      for insert with check (true);

-- ============================================================
-- MONITOREO POR CLIENTE — alternativa ligera a Prometheus
-- En vez de un servidor Prometheus + exporters, cada cliente se
-- da de alta con su puerto de administración y sus metas (SLA),
-- y una Edge Function en cron escribe métricas en client_metrics.
-- El dashboard compara medido vs meta. Cero infraestructura extra.
-- ============================================================

-- 4. Metas (SLA) y puerto de administración por cliente
alter table clients
  add column if not exists puerto_adm       text,                      -- IP:puerto de gestión, e.g. '10.10.5.1:8728'
  add column if not exists meta_bw_mbps      int,                      -- ancho de banda garantizado
  add column if not exists meta_latencia_ms  int    default 50,        -- latencia máxima prometida (ms)
  add column if not exists meta_uptime_pct   numeric(5,2) default 99.5; -- disponibilidad SLA (%)

-- 5. Métricas medidas por cliente (series temporales ligeras)
create table if not exists client_metrics (
  id              bigint generated always as identity primary key,
  client_id       bigint references clients(id) on delete cascade,
  bw_actual_mbps  int,
  latencia_ms     int,
  online          boolean default true,
  medido_en       timestamptz default now()
);

create index if not exists idx_client_metrics_client on client_metrics (client_id, medido_en desc);

alter table client_metrics enable row level security;
create policy "anon read client_metrics"   on client_metrics for select using (true);
create policy "anon insert client_metrics" on client_metrics for insert with check (true);
