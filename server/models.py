
from datetime import datetime, timezone

from flask_login import UserMixin
from sqlalchemy import CheckConstraint, UniqueConstraint

from extensions import db


def utc_now():
    return datetime.now(timezone.utc)


class Family(db.Model):
    __tablename__ = "families"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    created_at = db.Column(
        db.DateTime(timezone=True),
        default=utc_now,
        nullable=False
    )

    users = db.relationship(
        "User",
        back_populates="family",
        cascade="all, delete-orphan"
    )

    responsibilities = db.relationship(
        "Responsibility",
        back_populates="family",
        cascade="all, delete-orphan"
    )

    recurrence_schedules = db.relationship(
        "RecurrenceSchedule",
        back_populates="family",
        cascade="all, delete-orphan"
    )

    invitations = db.relationship(
        "FamilyInvitation",
        back_populates="family",
        cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name
        }


class User(UserMixin, db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)

    family_id = db.Column(
        db.Integer,
        db.ForeignKey("families.id"),
        nullable=False,
        index=True
    )

    name = db.Column(db.String(100), nullable=False)

    email = db.Column(
        db.String(255),
        unique=True,
        nullable=True,
        index=True
    )

    username = db.Column(
        db.String(50),
        unique=True,
        nullable=True,
        index=True
    )

    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False)

    created_at = db.Column(
        db.DateTime(timezone=True),
        default=utc_now,
        nullable=False
    )

    __table_args__ = (
        CheckConstraint(
            "role IN ('parent', 'child')",
            name="valid_user_role"
        ),
    )

    family = db.relationship(
        "Family",
        back_populates="users"
    )

    created_responsibilities = db.relationship(
        "Responsibility",
        foreign_keys="Responsibility.created_by_id",
        back_populates="creator"
    )

    assigned_responsibilities = db.relationship(
        "Responsibility",
        foreign_keys="Responsibility.assigned_to_id",
        back_populates="assignee"
    )

    created_recurrence_schedules = db.relationship(
        "RecurrenceSchedule",
        foreign_keys="RecurrenceSchedule.created_by_id",
        back_populates="creator"
    )

    assigned_recurrence_schedules = db.relationship(
        "RecurrenceSchedule",
        foreign_keys="RecurrenceSchedule.assigned_to_id",
        back_populates="assignee"
    )

    created_invitations = db.relationship(
        "FamilyInvitation",
        back_populates="creator"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "family_id": self.family_id,
            "name": self.name,
            "email": self.email,
            "username": self.username,
            "role": self.role
        }


class RecurrenceSchedule(db.Model):
    __tablename__ = "recurrence_schedules"

    id = db.Column(db.Integer, primary_key=True)

    family_id = db.Column(
        db.Integer,
        db.ForeignKey("families.id"),
        nullable=False,
        index=True
    )

    created_by_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    assigned_to_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    title = db.Column(db.String(160), nullable=False)
    description = db.Column(db.Text)
    planning_level = db.Column(db.String(30), nullable=False)

    frequency = db.Column(db.String(20), nullable=False)

    interval = db.Column(
        db.Integer,
        default=1,
        nullable=False
    )

    # Comma-separated weekday numbers, where Monday=0 and Sunday=6.
    # Example: "0,2,4" means Monday, Wednesday, and Friday.
    # Used for weekly schedules; optional for other frequencies.
    weekdays = db.Column(db.String(20))

    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date)

    is_active = db.Column(
        db.Boolean,
        default=True,
        nullable=False
    )

    # Earliest date eligible for new occurrence generation.
    # Set when a paused schedule resumes, so missed dates
    # from the paused period are not recreated.
    # None means use the original start_date.
    generate_from_date = db.Column(
        db.Date,
        nullable=True
    )

    created_at = db.Column(
        db.DateTime(timezone=True),
        default=utc_now,
        nullable=False
    )

    __table_args__ = (
        CheckConstraint(
            "planning_level IN "
            "('plan_together', 'share_responsibility', 'own_it')",
            name="valid_recurrence_planning_level"
        ),
        CheckConstraint(
            "frequency IN ('daily', 'weekly', 'monthly')",
            name="valid_recurrence_frequency"
        ),
        CheckConstraint(
            "interval >= 1",
            name="valid_recurrence_interval"
        ),
        CheckConstraint(
            "end_date IS NULL OR end_date >= start_date",
            name="valid_recurrence_date_range"
        ),
    )

    family = db.relationship(
        "Family",
        back_populates="recurrence_schedules"
    )

    creator = db.relationship(
        "User",
        foreign_keys=[created_by_id],
        back_populates="created_recurrence_schedules"
    )

    assignee = db.relationship(
        "User",
        foreign_keys=[assigned_to_id],
        back_populates="assigned_recurrence_schedules"
    )

    responsibilities = db.relationship(
        "Responsibility",
        back_populates="recurrence_schedule"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "family_id": self.family_id,
            "created_by_id": self.created_by_id,
            "assigned_to_id": self.assigned_to_id,
            "title": self.title,
            "description": self.description,
            "planning_level": self.planning_level,
            "frequency": self.frequency,
            "interval": self.interval,
            "weekdays": self.weekdays,
            "start_date": self.start_date.isoformat(),
            "end_date": (
                self.end_date.isoformat()
                if self.end_date
                else None
            ),
            "is_active": self.is_active,
            "generate_from_date": (
                self.generate_from_date.isoformat()
                if self.generate_from_date
                else None
            ),
            "created_at": self.created_at.isoformat(),
            "creator_name": self.creator.name,
            "assignee_name": self.assignee.name
        }


class Responsibility(db.Model):
    __tablename__ = "responsibilities"

    id = db.Column(db.Integer, primary_key=True)

    family_id = db.Column(
        db.Integer,
        db.ForeignKey("families.id"),
        nullable=False,
        index=True
    )

    created_by_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    assigned_to_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    recurrence_schedule_id = db.Column(
        db.Integer,
        db.ForeignKey("recurrence_schedules.id"),
        nullable=True,
        index=True
    )

    title = db.Column(db.String(160), nullable=False)
    description = db.Column(db.Text)
    due_date = db.Column(db.Date, nullable=False)
    planning_level = db.Column(db.String(30), nullable=False)

    is_complete = db.Column(
        db.Boolean,
        default=False,
        nullable=False
    )

    created_at = db.Column(
        db.DateTime(timezone=True),
        default=utc_now,
        nullable=False
    )

    __table_args__ = (
        CheckConstraint(
            "planning_level IN "
            "('plan_together', 'share_responsibility', 'own_it')",
            name="valid_planning_level"
        ),
        UniqueConstraint(
            "recurrence_schedule_id",
            "due_date",
            name="unique_recurrence_occurrence_date"
        ),
    )

    family = db.relationship(
        "Family",
        back_populates="responsibilities"
    )

    creator = db.relationship(
        "User",
        foreign_keys=[created_by_id],
        back_populates="created_responsibilities"
    )

    assignee = db.relationship(
        "User",
        foreign_keys=[assigned_to_id],
        back_populates="assigned_responsibilities"
    )

    recurrence_schedule = db.relationship(
        "RecurrenceSchedule",
        back_populates="responsibilities"
    )

    steps = db.relationship(
        "Step",
        back_populates="responsibility",
        cascade="all, delete-orphan",
        order_by="Step.position"
    )

    def to_dict(self, include_steps=True):
        data = {
            "id": self.id,
            "family_id": self.family_id,
            "created_by_id": self.created_by_id,
            "assigned_to_id": self.assigned_to_id,
            "recurrence_schedule_id": self.recurrence_schedule_id,
            "title": self.title,
            "description": self.description,
            "due_date": self.due_date.isoformat(),
            "planning_level": self.planning_level,
            "is_complete": self.is_complete,
            "created_at": self.created_at.isoformat(),
            "creator_name": self.creator.name,
            "assignee_name": self.assignee.name
        }

        if include_steps:
            data["steps"] = [
                step.to_dict() for step in self.steps
            ]

            data["total_steps"] = len(self.steps)

            data["completed_steps"] = sum(
                step.is_complete for step in self.steps
            )

        return data


class Step(db.Model):
    __tablename__ = "steps"

    id = db.Column(db.Integer, primary_key=True)

    responsibility_id = db.Column(
        db.Integer,
        db.ForeignKey("responsibilities.id"),
        nullable=False,
        index=True
    )

    title = db.Column(db.String(160), nullable=False)
    due_date = db.Column(db.Date)

    position = db.Column(
        db.Integer,
        default=0,
        nullable=False
    )

    is_complete = db.Column(
        db.Boolean,
        default=False,
        nullable=False
    )

    created_at = db.Column(
        db.DateTime(timezone=True),
        default=utc_now,
        nullable=False
    )

    responsibility = db.relationship(
        "Responsibility",
        back_populates="steps"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "responsibility_id": self.responsibility_id,
            "title": self.title,
            "due_date": (
                self.due_date.isoformat()
                if self.due_date
                else None
            ),
            "position": self.position,
            "is_complete": self.is_complete
        }


class FamilyInvitation(db.Model):
    __tablename__ = "family_invitations"

    id = db.Column(db.Integer, primary_key=True)

    family_id = db.Column(
        db.Integer,
        db.ForeignKey("families.id"),
        nullable=False,
        index=True
    )

    created_by_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    code_hash = db.Column(
        db.String(64),
        unique=True,
        nullable=False
    )

    role = db.Column(db.String(20), nullable=False)

    expires_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False
    )

    used_at = db.Column(
        db.DateTime(timezone=True)
    )

    __table_args__ = (
        CheckConstraint(
            "role IN ('parent', 'child')",
            name="valid_invitation_role"
        ),
    )

    family = db.relationship(
        "Family",
        back_populates="invitations"
    )

    creator = db.relationship(
        "User",
        back_populates="created_invitations"
    )
