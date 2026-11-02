import pytest
from alembic.autogenerate import compare_metadata
from alembic.migration import MigrationContext

from app.db.models import Base

pytestmark = pytest.mark.integration


def test_migrations_match_the_models(engine):
    with engine.connect() as conn:
        diff = compare_metadata(MigrationContext.configure(conn), Base.metadata)
    assert diff == []
