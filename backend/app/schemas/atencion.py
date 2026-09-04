from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class TiempoAtencionCreate(BaseModel):
    cliente_id: int | None = None
    comentario_id: int | None = None
    tiempo_minutos: float = Field(ge=0)
    fecha: date | None = None
    operador: str | None = None


class TiempoAtencionUpdate(BaseModel):
    cliente_id: int | None = None
    comentario_id: int | None = None
    tiempo_minutos: float | None = Field(default=None, ge=0)
    fecha: date | None = None
    operador: str | None = None


class TiempoAtencionResponse(TiempoAtencionCreate):
    id: int
    fecha: date
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)