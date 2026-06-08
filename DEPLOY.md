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

## Probar el multijugador

Abre tu URL de Vercel en **dos** pestañas → crea sala en una (Cooperativo o
Competitivo), copia el código, únete con él en la otra, ambos **Listo**, el
anfitrión **Empezar partida**.

## Redeploys

Cada `git push` a `main` redepliega **ambos** (Vercel y Render) automáticamente.
