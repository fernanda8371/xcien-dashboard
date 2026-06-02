# XCIEN NMS Dashboard — Saltillo

Dashboard de gestión de red metropolitana para XCIEN.  
Stack: React + Vite · Supabase · Recharts

---

## Requisitos
- Node.js 18+
- Cuenta en [supabase.com](https://supabase.com) (gratuita)

---

## Setup en 5 pasos

### 1. Instalar dependencias
```bash
cd xcien-dashboard
npm install
```

### 2. Configurar Supabase
1. Crea un proyecto nuevo en [supabase.com](https://supabase.com)
2. Ve a **SQL Editor → New query**
3. Pega el contenido de `supabase_schema.sql` y ejecuta
4. Ve a **Project Settings → API** y copia:
   - `Project URL`
   - `anon public key`

### 3. Crear archivo .env
```bash
cp .env.example .env
```
Edita `.env` y pega tus credenciales:
```
VITE_SUPABASE_URL=https://TU_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=TU_ANON_KEY
```

### 4. Correr en desarrollo
```bash
npm run dev
```
Abre [http://localhost:5173](http://localhost:5173)

### 5. Build para producción / Vercel
```bash
npm run build
```
O conecta el repo a [vercel.com](https://vercel.com) y agrega las variables de entorno ahí.

---

## Sin Supabase (modo demo)
Si no configuras `.env`, el dashboard corre con datos simulados locales.  
Verás un banner amarillo indicando el modo demo.

---

## Estructura del proyecto
```
src/
  data/network.js      ← Datos estáticos de nodos y anillos (nunca cambian)
  lib/
    supabase.js        ← Cliente Supabase
    hooks.js           ← useClients, useNodeStatus, useRingStatus
  components/
    UI.jsx             ← Badge, ProgressBar, StatCard, TypeBadge
  views/
    Topologia.jsx      ← Diagrama SVG de la red
    Anillos.jsx        ← Utilización de anillos Norte/Sur
    Nodos.jsx          ← Estado por nodo (hilos, puertos, BW)
    Clientes.jsx       ← Tabla de clientes + alta de cliente
  App.jsx              ← Navegación y layout principal
  main.jsx             ← Entry point
supabase_schema.sql    ← Schema + datos seed para Supabase
```

---

## Tablas en Supabase

| Tabla | Descripción |
|---|---|
| `node_status` | Estado dinámico de cada nodo (hilos usados, puertos, BW) |
| `rings` | Utilización y estado de Anillo Norte y Sur |
| `clients` | Clientes registrados con nodo, hilo, puerto, VLAN, **puerto adm y metas (SLA)** |
| `client_metrics` | Métricas medidas por cliente (BW, latencia, online) — alternativa ligera a Prometheus |

---

## Monitoreo por cliente (en vez de Prometheus)

En lugar de un servidor Prometheus + exporters, cada cliente se da de alta con su
**puerto adm** (IP:puerto de gestión) y sus **metas/SLA** (BW garantizado, latencia
máxima, uptime). La Edge Function `supabase/functions/client-poller` corre en cron,
sondea cada cliente y escribe en `client_metrics`. El dashboard compara *medido vs meta*
y muestra una mini-gráfica + badge de SLA por cliente.

```bash
supabase functions deploy client-poller --no-verify-jwt
```

En **modo demo** (sin `.env`) las métricas se simulan localmente, así que la columna
de monitoreo y los badges de SLA funcionan sin red real.
