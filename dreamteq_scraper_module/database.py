"""
DreamTeQ_360 Firecrawl Scraper Module — Database Layer
Product of Dreamteam Consulting Company, Box 3515-00100, Nairobi, Kenya

Provides a SQLAlchemy engine and session factory for the ERP PostgreSQL cluster.
Connection string is read exclusively from the DATABASE_URL environment variable.
"""

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from config import settings

# ── Engine setup ──────────────────────────────────────────────────────────────
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,       # discard stale connections automatically
    pool_size=5,
    max_overflow=10,
    echo=False                # set True for SQL debug output during development
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Base class for all ORM models in the scraper module."""
    pass


# ── FastAPI dependency ─────────────────────────────────────────────────────────
def get_db():
    """Yield a database session and ensure it is closed after each request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ping_database() -> bool:
    """Health-check: returns True if the database is reachable."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False
