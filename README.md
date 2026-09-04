# DASH

Dashboard empresarial con React, FastAPI, SciPy, NLTK y Supabase.

## Configuración local

1. Crea `backend/app/.env` con las variables de entorno de Supabase.
2. Completa `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_KEY` y
	`SUPABASE_JWT_SECRET` con los valores del proyecto Supabase.
3. Ejecuta `database/001_schema.sql` y después `database/002_seed.sql` en el
	SQL Editor de Supabase.
4. Instala las dependencias: `pip install -r backend/requirements.txt`.
5. Inicia la API: `uvicorn app.main:app --app-dir backend --reload --port 8000`.
6. Inicia el frontend desde `frontend`: `npm install && npm run dev`.

En Vercel configura la variable `VITE_API_URL` con la URL pública de la API,
incluyendo `/api` (por ejemplo, `https://mi-api.example.com/api`), y vuelve a
desplegar. La API no puede ser `localhost` porque ese nombre apunta al equipo
del visitante de Vercel.

La API usa directamente PostgreSQL de Supabase mediante SQLAlchemy y `asyncpg`.
`GET /health` comprueba la conexión ejecutando `SELECT 1`.
También informa las tablas requeridas y `schema_ready`; el arranque no ejecuta
`CREATE TABLE` ni modifica el esquema existente de Supabase.

## Producción con Docker

Completa `backend/app/.env` con las credenciales reales de Supabase y ejecuta:

```bash
docker compose up --build
```

La API quedará disponible en `http://localhost:8000` y el frontend en
`http://localhost:5173`. La documentación interactiva de FastAPI está en
`http://localhost:8000/docs`.
