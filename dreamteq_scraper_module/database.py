"""
DreamTeQ_360 Firecrawl Scraper Module — Database Layer + ERP Mapping DAO
Product of Dreamteam Consulting Company, Box 3515-00100, Nairobi, Kenya

Provides a SQLAlchemy engine and session factory for the ERP PostgreSQL cluster.
Also contains DreamTeqDatabaseMap — a raw psycopg2 DAO that maps validated Gemini
JSON output directly into the `opportunities` and `opportunity_value_chains` tables
using UPSERT semantics to prevent duplicate records.

Connection string is read exclusively from the DATABASE_URL environment variable.
"""

import psycopg2
from psycopg2.extras import execute_values
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


# ── ERP Mapping DAO ───────────────────────────────────────────────────────────

class DreamTeqDatabaseMap:
    """
    Data Access Object — maps Gemini-structured opportunity JSON directly into
    the core PostgreSQL ERP tables.

    Required tables (create once via migration):
        opportunities              (id SERIAL PK, source_url TEXT UNIQUE, ...)
        opportunity_value_chains   (opportunity_id INT FK, value_chain TEXT,
                                    UNIQUE(opportunity_id, value_chain))
    """

    @staticmethod
    def get_connection():
        """Returns a psycopg2 connection using the DATABASE_URL setting."""
        return psycopg2.connect(settings.DATABASE_URL)

    @classmethod
    def save_discovered_opportunities(cls, opportunities: list) -> int:
        """
        Maps incoming Gemini-processed records directly to PostgreSQL tables.
        Uses UPSERT syntax to prevent duplication on unique source_url.

        Returns:
            Number of opportunity records synced.
        Raises:
            Exception: Re-raises any database error after rollback.
        """
        if not opportunities:
            return 0

        conn = cls.get_connection()
        cursor = conn.cursor()

        insert_op_query = """
            INSERT INTO opportunities (
                title, opportunity_type, economic_bloc, specific_countries,
                financial_value_usd, priority_flag, application_deadline, source_url
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (source_url) DO UPDATE SET
                title                = EXCLUDED.title,
                priority_flag        = EXCLUDED.priority_flag,
                application_deadline = EXCLUDED.application_deadline
            RETURNING id;
        """

        insert_vc_query = """
            INSERT INTO opportunity_value_chains (opportunity_id, value_chain)
            VALUES (%s, %s)
            ON CONFLICT DO NOTHING;
        """

        try:
            for op in opportunities:
                # Stage 1: Upsert core opportunity record
                cursor.execute(insert_op_query, (
                    op.get("title"),
                    op.get("opportunity_type"),
                    op.get("economic_bloc"),
                    op.get("specific_countries", []),
                    op.get("financial_value_usd"),
                    op.get("priority_flag"),
                    op.get("application_deadline"),
                    op.get("source_url"),
                ))
                op_id = cursor.fetchone()[0]

                # Stage 2: Map associated value chain tags
                vc_records = [(op_id, vc) for vc in op.get("value_chains", [])]
                if vc_records:
                    execute_values(cursor, insert_vc_query, vc_records)

            conn.commit()
            print(f"[DB MAP] Successfully synced {len(opportunities)} opportunities into Core ERP.")
            return len(opportunities)

        except Exception as exc:
            conn.rollback()
            print(f"[DB MAP] Core database sync failure: {exc}")
            raise

        finally:
            cursor.close()
            conn.close()

