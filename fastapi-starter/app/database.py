# app/database.py
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine, async_sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import SQLModel
from app.core.config import settings

url = settings.DATABASE_URL
if "+aiosqlite" not in url and "+asyncpg" not in url and "+asyncmy" not in url:
    raise RuntimeError(
        f"DATABASE_URL must be async (sqlite+aiosqlite / postgresql+asyncpg / mysql+asyncmy). Got: {url}"
    )

engine: AsyncEngine = create_async_engine(url, future=True, echo=False)

SessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        # IMPORTANT: use yield (not return)
        yield session

async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
