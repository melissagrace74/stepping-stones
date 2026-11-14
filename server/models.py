
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
    created_at = db.Column(db.DateTime(timezone=True), default=utc_now, nullable=False)

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
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=utc_now, nullable=False)

    __table_args__ = (
        CheckConstraint("role IN ('parent', 'child')", name="valid_user_role"),
    )

    family = db.relationship("Family", back_populates="users")

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

    def to_dict(self):
        return {
            "id": self.id,
            "family_id": self.family_id,
            "name": self.name,
            "email": self.email,
            "role": self.role
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

    title = db.Column(db.String(160), nullable=False)
    description = db.Column(db.Text)
    due_date = db.Column(db.Date, nullable=False)
    planning_level = db.Column(db.String(30), nullable=False)
    is_complete = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=utc_now, nullable=False)

    __table_args__ = (
        CheckConstraint(
            "planning_level IN ('plan_together', 'share_responsibility', 'own_it')",
            name="valid_planning_level"
        ),
    )

    family = db.relationship("Family", back_populates="responsibilities")

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
            data["steps"] = [step.to_dict() for step in self.steps]
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
    position = db.Column(db.Integer, default=0, nullable=False)
    is_complete = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=utc_now, nullable=False)

    responsibility = db.relationship(
        "Responsibility",
        back_populates="steps"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "responsibility_id": self.responsibility_id,
            "title": self.title,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "position": self.position,
            "is_complete": self.is_complete
        }
