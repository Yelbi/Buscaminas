# Desplegar Buscaminas (Vercel + Render)

El juego tiene dos partes:

| Parte | Qué es | Dónde se hospeda |
| --- | --- | --- |
| **Frontend** | La app React (Vite) — incluye el **Solitario** completo | **Vercel** (estático) |
| **Servidor WS** | Salas de **Cooperativo / Competitivo** en tiempo real | **Render** (free web service) |

> Vercel es serverless y **no** mantiene WebSockets persistentes, por eso el
> servidor de multijugador va en Render. El Solitario funciona en Vercel sin
> servidor.

El repositorio ya trae todo configurado: `app/vercel.json` (Vercel) y
`render.yaml` (Render).

---

## 1) Subir el repo a GitHub

Desde la carpeta `buscaminas-design-system/` (la raíz del repo, ya inicializado):

```bash
# Crea un repo vacío en https://github.com/new  (p. ej. "buscaminas"), SIN README.
git remote add origin https://github.com/<tu-usuario>/buscaminas.git
git branch -M main
git push -u origin main
```

---

## 2) Servidor de multijugador en Render

1. Entra en https://dashboard.render.com → **New** → **Blueprint**.
2. Conecta tu cuenta de GitHub y elige el repo `buscaminas`.
3. Render detecta `render.yaml` y propone el servicio **buscaminas-ws** (plan Free).
   Pulsa **Apply**.
4. Espera al primer deploy. Tu URL será algo como
   `https://buscaminas-ws.onrender.com`.
5. Verifícalo abriendo `https://buscaminas-ws.onrender.com/health` →
   debe responder `{"ok":true,...}`.

> El WebSocket vive en esa misma URL pero con `wss://`, p. ej.
> `wss://buscaminas-ws.onrender.com`.
>
> El plan Free de Render **se duerme** tras ~15 min de inactividad; la primera
> conexión tras dormir tarda ~30–50 s en despertar.

---

## 3) Frontend en Vercel

1. Entra en https://vercel.com/new y **importa** el mismo repo de GitHub.
2. Configuración del proyecto:
   - **Root Directory** → déjalo en la **raíz** del repo. El `vercel.json` de la raíz
     ya compila `app/` y publica `app/dist` automáticamente (no hace falta cambiarlo).
   - *(Alternativa)* Si prefieres, pon Root Directory = `app`; entonces se usa
     `app/vercel.json`. Cualquiera de las dos funciona, pero no las mezcles.
3. En **Environment Variables**, añade:
   - `VITE_WS_URL` = `wss://buscaminas-ws.onrender.com`  ← tu URL de Render del paso 2.
4. Pulsa **Deploy**. Al terminar tendrás algo como
   `https://buscaminas-xxxx.vercel.app`.

> Sin `VITE_WS_URL`, el sitio se despliega igual y el **Solitario** funciona; los
> modos co-op/versus aparecen como "Requiere servidor" hasta que la añadas.

---

## 4) (Recomendado) Asegurar el servidor a tu dominio de Vercel

Cuando ya conozcas la URL de Vercel:

1. En Render → servicio **buscaminas-ws** → **Environment** → edita
   `ALLOWED_ORIGINS` = `https://buscaminas-xxxx.vercel.app`
   (tu URL real de Vercel, sin barra final).
2. Guarda → Render redepliega. A partir de ahí el servidor solo acepta conexiones
   desde tu frontend.

---

## 5) Tabla de clasificación global (Upstash Redis)

El leaderboard del menú necesita una base de datos persistente (Render free no
guarda datos). Usamos **Upstash Redis** (free, sin tarjeta):

1. Crea cuenta en https://upstash.com → **Create Database** (Redis). Elige una
   región cercana; el plan **Free** sirve.
2. En la página de la base de datos, sección **REST API**, copia:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
3. En Render → servicio **buscaminas-ws** → **Environment** → añade esas **dos**
   variables con esos nombres y valores → **Save** (Render redepliega).
4. Listo: la **Clasificación global** aparece en el menú y guarda el mejor tiempo
   de cada jugador por dificultad (Fácil/Medio/Difícil).

> Sin esas variables, el servidor responde `enabled:false` y el menú muestra
> "La clasificación global aún no está configurada". El resto del juego funciona igual.
>
> El leaderboard se sirve por HTTP desde el mismo servidor de Render, así que también
> necesita que `VITE_WS_URL` esté puesta en Vercel (paso 3). Es un ranking por honor
> (sin login): se queda el **mejor tiempo por nombre** en cada dificultad.

Para probarlo en local: arranca el server con las variables, p. ej.
`UPSTASH_REDIS_REST_URL=... UPSTASH_REDIS_REST_TOKEN=... npm run dev:server`.

---

## Probar el multijugador

Abre tu URL de Vercel en **dos** pestañas → crea sala en una (Cooperativo o
Competitivo), copia el código, únete con él en la otra, ambos **Listo**, el
anfitrión **Empezar partida**.

## Redeploys

Cada `git push` a `main` redepliega **ambos** (Vercel y Render) automáticamente.
