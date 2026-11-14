
"""Add recurrence schedules and responsibility occurrences

Revision ID: bf1e83a439a5
Revises: a2222c282c00
Create Date: 2026-11-14 11:41:36.613351
"""

from alembic import op
import sqlalchemy as sa


# Revision identifiers used by Alembic.
revision = "bf1e83a439a5"
down_revision = "a2222c282c00"
branch_labels = None
depends_on = None


def upgrade():
    # Create the recurrence schedule table.
    op.create_table(
        "recurrence_schedules",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("family_id", sa.Integer(), nullable=False),
        sa.Column("created_by_id", sa.Integer(), nullable=False),
        sa.Column("assigned_to_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=160), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("planning_level", sa.String(length=30), nullable=False),
        sa.Column("frequency", sa.String(length=20), nullable=False),
        sa.Column("interval", sa.Integer(), nullable=False),
        sa.Column("weekdays", sa.String(length=20), nullable=True),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.CheckConstraint(
            "frequency IN ('daily', 'weekly', 'monthly')",
            name="valid_recurrence_frequency",
        ),
        sa.CheckConstraint(
            "planning_level IN "
            "('plan_together', 'share_responsibility', 'own_it')",
            name="valid_recurrence_planning_level",
        ),
        sa.CheckConstraint(
            "end_date IS NULL OR end_date >= start_date",
            name="valid_recurrence_date_range",
        ),
        sa.CheckConstraint(
            "interval >= 1",
            name="valid_recurrence_interval",
        ),
        sa.ForeignKeyConstraint(
            ["assigned_to_id"],
            ["users.id"],
        ),
        sa.ForeignKeyConstraint(
            ["created_by_id"],
            ["users.id"],
        ),
        sa.ForeignKeyConstraint(
            ["family_id"],
            ["families.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    # Index recurrence schedules by family.
    op.create_index(
        "ix_recurrence_schedules_family_id",
        "recurrence_schedules",
        ["family_id"],
        unique=False,
    )

    # Add an optional schedule reference to existing responsibilities.
    # Existing records will have NULL in this column.
    op.add_column(
        "responsibilities",
        sa.Column(
            "recurrence_schedule_id",
            sa.Integer(),
            nullable=True,
        ),
    )

    op.create_index(
        "ix_responsibilities_recurrence_schedule_id",
        "responsibilities",
        ["recurrence_schedule_id"],
        unique=False,
    )

    # Prevent duplicate occurrences for the same schedule and date.
    op.create_unique_constraint(
        "unique_recurrence_occurrence_date",
        "responsibilities",
        ["recurrence_schedule_id", "due_date"],
    )

    # Give the foreign key an explicit name so it can be removed safely.
    op.create_foreign_key(
        "fk_responsibilities_recurrence_schedule_id",
        "responsibilities",
        "recurrence_schedules",
        ["recurrence_schedule_id"],
        ["id"],
    )


def downgrade():
    # Remove recurrence-specific constraints and indexes first.
    op.drop_constraint(
        "fk_responsibilities_recurrence_schedule_id",
        "responsibilities",
        type_="foreignkey",
    )

    op.drop_constraint(
        "unique_recurrence_occurrence_date",
        "responsibilities",
        type_="unique",
    )

    op.drop_index(
        "ix_responsibilities_recurrence_schedule_id",
        table_name="responsibilities",
    )

    # Remove the optional schedule reference.
    op.drop_column(
        "responsibilities",
        "recurrence_schedule_id",
    )

    # Remove the recurrence schedule table.
    op.drop_index(
        "ix_recurrence_schedules_family_id",
        table_name="recurrence_schedules",
    )

    op.drop_table("recurrence_schedules")
