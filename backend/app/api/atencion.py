from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user
from app.database.connection import get_db
from app.database.models import ClienteDB, ComentarioDB, TiempoAtencionDB
from app.schemas.atencion import TiempoAtencionCreate, TiempoAtencionResponse, TiempoAtencionUpdate

router = APIRouter(prefix="/tiempos-atencion", tags=["Atención"])


@router.post("/", response_model=TiempoAtencionResponse)
async def crear_tiempo_atencion(
        tiempo: TiempoAtencionCreate,
        db: AsyncSession = Depends(get_db),
        _: dict = Depends(get_current_user),
):
        if tiempo.tiempo_minutos < 0:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El tiempo de atención no puede ser negativo")
        if tiempo.cliente_id is not None:
                cliente = await db.get(ClienteDB, tiempo.cliente_id)
                if cliente is None:
                        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="El cliente no existe")
        if tiempo.comentario_id is not None:
                comentario = await db.get(ComentarioDB, tiempo.comentario_id)
                if comentario is None:
                        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="El comentario no existe")

        payload = tiempo.model_dump(exclude_none=True)
        payload.setdefault("fecha", date.today())
        nuevo = TiempoAtencionDB(**payload)
        db.add(nuevo)
        await db.commit()
        await db.refresh(nuevo)
        return nuevo


@router.put("/{tiempo_id}", response_model=TiempoAtencionResponse)
async def actualizar_tiempo_atencion(
        tiempo_id: int,
        datos: TiempoAtencionUpdate,
        db: AsyncSession = Depends(get_db),
        _: dict = Depends(get_current_user),
):
        tiempo = await db.get(TiempoAtencionDB, tiempo_id)
        if tiempo is None:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="El tiempo de atención no existe")
        for campo, valor in datos.model_dump(exclude_unset=True).items():
                setattr(tiempo, campo, valor)
        await db.commit()
        await db.refresh(tiempo)
        return tiempo


@router.get("/", response_model=list[TiempoAtencionResponse])
async def listar_tiempos_atencion(
        db: AsyncSession = Depends(get_db),
        _: dict = Depends(get_current_user),
):
        resultado = await db.execute(
                select(TiempoAtencionDB).order_by(TiempoAtencionDB.fecha.desc(), TiempoAtencionDB.id.desc())
        )
        return resultado.scalars().all()