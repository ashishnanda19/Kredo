"""outcomes with decision-time features

Revision ID: 0004
Revises: 0003
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = '0004'
down_revision: str | None = '0003'
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    # outcomes was never written before this revision, so the new NOT NULL columns need no backfill
    op.add_column('outcomes', sa.Column('user_id', sa.UUID(), nullable=False))
    op.add_column('outcomes', sa.Column('decision_at', sa.DateTime(timezone=True), nullable=False))
    op.add_column('outcomes', sa.Column('due_date', sa.Date(), nullable=False))
    op.add_column('outcomes', sa.Column('principal', sa.BigInteger(), nullable=False))
    op.add_column('outcomes', sa.Column('worst_dpd', sa.Integer(), nullable=False))
    op.add_column('outcomes', sa.Column('closure_type', sa.Text(), nullable=True))
    op.add_column('outcomes', sa.Column('reason', sa.Text(), nullable=False))
    op.add_column('outcomes', sa.Column('krs', sa.SmallInteger(), nullable=False))
    op.add_column('outcomes', sa.Column('pd', sa.Float(), nullable=False))
    op.add_column('outcomes', sa.Column('band', sa.Text(), nullable=False))
    op.add_column('outcomes', sa.Column('aura', sa.SmallInteger(), nullable=False))
    op.add_column('outcomes', sa.Column('level', sa.Text(), nullable=True))
    op.add_column('outcomes', sa.Column('features', postgresql.JSONB(astext_type=sa.Text()), nullable=False))
    op.add_column('outcomes', sa.Column('config_hash', sa.Text(), nullable=False))
    op.add_column('outcomes', sa.Column('synthetic', sa.Boolean(), server_default=sa.text('false'), nullable=False))
    op.create_index(op.f('ix_outcomes_user_id'), 'outcomes', ['user_id'], unique=False)

    # labels never change; a new label definition is a new label_version row (forbid_mutation() comes from 0001)
    op.execute("CREATE TRIGGER outcomes_append_only BEFORE UPDATE OR DELETE ON outcomes "
               "FOR EACH ROW EXECUTE FUNCTION forbid_mutation()")
    op.execute("CREATE TRIGGER outcomes_no_truncate BEFORE TRUNCATE ON outcomes "
               "FOR EACH STATEMENT EXECUTE FUNCTION forbid_mutation()")


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS outcomes_no_truncate ON outcomes")
    op.execute("DROP TRIGGER IF EXISTS outcomes_append_only ON outcomes")
    op.drop_index(op.f('ix_outcomes_user_id'), table_name='outcomes')
    op.drop_column('outcomes', 'synthetic')
    op.drop_column('outcomes', 'config_hash')
    op.drop_column('outcomes', 'features')
    op.drop_column('outcomes', 'level')
    op.drop_column('outcomes', 'aura')
    op.drop_column('outcomes', 'band')
    op.drop_column('outcomes', 'pd')
    op.drop_column('outcomes', 'krs')
    op.drop_column('outcomes', 'reason')
    op.drop_column('outcomes', 'closure_type')
    op.drop_column('outcomes', 'worst_dpd')
    op.drop_column('outcomes', 'principal')
    op.drop_column('outcomes', 'due_date')
    op.drop_column('outcomes', 'decision_at')
    op.drop_column('outcomes', 'user_id')
