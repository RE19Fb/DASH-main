from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.auditoria import router as router_auditoria
from app.api.atencion import router as router_atencion
from app.api.categorias import router as router_categorias
from app.api.clientes import router as router_clientes
from app.api.comentarios import router as router_comentarios
from app.api.metricas import router as router_metricas, router_atencion as router_metricas_atencion
from app.api.nltk import router as router_nltk
from app.api.optimizaciones import router as router_optimizaciones
from app.api.scipy import router as router_scipy
from app.api.usuarios import router as router_usuarios
from app.core.config import settings
from app.database.connection import engine


@asynccontextmanager
async def lifespan(_: FastAPI):
    async with engine.connect() as connection:
        await connection.execute(text("SELECT 1"))
    yield
    await engine.dispose()


app = FastAPI(title=settings.PROJECT_NAME, openapi_url="/api/openapi.json", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"https://([a-z0-9-]+\.)?(vercel\.app|app\.github\.dev)$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router_clientes, prefix=settings.API_V1_STR)
app.include_router(router_comentarios, prefix=settings.API_V1_STR)
app.include_router(router_atencion, prefix=settings.API_V1_STR)
app.include_router(router_metricas, prefix=settings.API_V1_STR)
app.include_router(router_metricas_atencion, prefix=settings.API_V1_STR)
app.include_router(router_nltk, prefix=settings.API_V1_STR)
app.include_router(router_scipy, prefix=settings.API_V1_STR)
app.include_router(router_usuarios, prefix=settings.API_V1_STR)
app.include_router(router_categorias, prefix=settings.API_V1_STR)
app.include_router(router_optimizaciones, prefix=settings.API_V1_STR)
app.include_router(router_auditoria, prefix=settings.API_V1_STR)


@app.get("/")
async def root():
    return {"status": "ok", "backend": "FastAPI + SQLAlchemy + SciPy + NLTK"}


@app.get("/health")
async def health():
    async with engine.connect() as connection:
        await connection.execute(text("SELECT 1"))
        result = await connection.execute(text(
            "SELECT table_name FROM information_schema.tables "
            "WHERE table_schema = 'public' AND table_name IN "
            "('clientes', 'comentarios', 'categorias', 'analisis_nlp', "
            "'tiempos_atencion', 'metricas_estadisticas', 'optimizaciones', "
            "'auditoria', 'usuarios')"
        ))
        tables = sorted(row[0] for row in result)
    return {
        "status": "ok",
        "database": "supabase",
        "tables": tables,
        "schema_ready": len(tables) == 9,
    }