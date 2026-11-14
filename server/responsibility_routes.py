
from datetime import date

from flask import Blueprint, jsonify, request
from flask_login import current_user, login_required

from extensions import db
from models import Responsibility, User


responsibility_bp = Blueprint(
    "responsibilities",
    __name__,
    url_prefix="/api/responsibilities",
)

PLANNING_LEVELS = {
    "plan_together",
    "share_responsibility",
    "own_it",
}


def error_response(message, status=400):
    return jsonify({"error": message}), status


def request_data():
    data = request.get_json(silent=True)
    return data if isinstance(data, dict) else {}


def parse_due_date(value):
    if not isinstance(value, str):
        return None

    try:
        return date.fromisoformat(value)
    except ValueError:
        return None


def get_family_responsibility(responsibility_id):
    return Responsibility.query.filter_by(
        id=responsibility_id,
        family_id=current_user.family_id,
    ).first()


def validate_fields(data, existing=None):
    errors = {}

    title = data.get(
        "title",
        existing.title if existing else None,
    )

    description = data.get(
        "description",
        existing.description if existing else "",
    )

    assigned_to_id = data.get(
        "assigned_to_id",
        existing.assigned_to_id if existing else None,
    )

    planning_level = data.get(
        "planning_level",
        existing.planning_level if existing else None,
    )

    due_date_value = data.get(
        "due_date",
        existing.due_date.isoformat() if existing else None,
    )

    if not isinstance(title, str) or not title.strip():
        errors["title"] = "Title is required."
    elif len(title.strip()) > 160:
        errors["title"] = "Title must be 160 characters or fewer."

    if description is not None and not isinstance(description, str):
        errors["description"] = "Description must be text."

    if isinstance(description, str) and len(description) > 5000:
        errors["description"] = "Description is too long."

    if type(assigned_to_id) is not int:
        errors["assigned_to_id"] = "Select a family member."
        assignee = None
    else:
        assignee = User.query.filter_by(
            id=assigned_to_id,
            family_id=current_user.family_id,
        ).first()

        if assignee is None:
            errors["assigned_to_id"] = "Select a valid family member."

    if planning_level not in PLANNING_LEVELS:
        errors["planning_level"] = "Select a valid planning level."

    due_date = parse_due_date(due_date_value)

    if due_date is None:
        errors["due_date"] = "Enter a valid date in YYYY-MM-DD format."

    if errors:
        return None, errors

    return {
        "title": title.strip(),
        "description": description.strip() if description else "",
        "assigned_to_id": assignee.id,
        "planning_level": planning_level,
        "due_date": due_date,
    }, None


@responsibility_bp.get("")
@login_required
def list_responsibilities():
    responsibilities = Responsibility.query.filter_by(
        family_id=current_user.family_id,
    ).order_by(
        Responsibility.due_date.asc(),
        Responsibility.id.asc(),
    ).all()

    return jsonify({
        "responsibilities": [
            responsibility.to_dict()
            for responsibility in responsibilities
        ]
    }), 200


@responsibility_bp.post("")
@login_required
def create_responsibility():
    data = request_data()
    fields, errors = validate_fields(data)

    if errors:
        return jsonify({"errors": errors}), 400

    responsibility = Responsibility(
        family_id=current_user.family_id,
        created_by_id=current_user.id,
        **fields,
    )

    db.session.add(responsibility)
    db.session.commit()

    return jsonify({
        "message": "Responsibility created.",
        "responsibility": responsibility.to_dict(),
    }), 201


@responsibility_bp.get("/<int:responsibility_id>")
@login_required
def get_responsibility(responsibility_id):
    responsibility = get_family_responsibility(responsibility_id)

    if responsibility is None:
        return error_response("Responsibility not found.", 404)

    return jsonify({
        "responsibility": responsibility.to_dict(),
    }), 200


@responsibility_bp.patch("/<int:responsibility_id>")
@login_required
def update_responsibility(responsibility_id):
    responsibility = get_family_responsibility(responsibility_id)

    if responsibility is None:
        return error_response("Responsibility not found.", 404)

    if responsibility.created_by_id != current_user.id:
        return error_response(
            "Only the creator can edit this responsibility.",
            403,
        )

    data = request_data()
    fields, errors = validate_fields(data, existing=responsibility)

    if errors:
        return jsonify({"errors": errors}), 400

    for field, value in fields.items():
        setattr(responsibility, field, value)

    db.session.commit()

    return jsonify({
        "message": "Responsibility updated.",
        "responsibility": responsibility.to_dict(),
    }), 200


@responsibility_bp.delete("/<int:responsibility_id>")
@login_required
def delete_responsibility(responsibility_id):
    responsibility = get_family_responsibility(responsibility_id)

    if responsibility is None:
        return error_response("Responsibility not found.", 404)

    if responsibility.created_by_id != current_user.id:
        return error_response(
            "Only the creator can delete this responsibility.",
            403,
        )

    db.session.delete(responsibility)
    db.session.commit()

    return jsonify({
        "message": "Responsibility deleted.",
    }), 200


@responsibility_bp.patch("/<int:responsibility_id>/completion")
@login_required
def update_completion(responsibility_id):
    responsibility = get_family_responsibility(responsibility_id)

    if responsibility is None:
        return error_response("Responsibility not found.", 404)

    if current_user.id not in (
        responsibility.created_by_id,
        responsibility.assigned_to_id,
    ):
        return error_response(
            "Only the creator or assignee can update completion.",
            403,
        )

    data = request_data()
    is_complete = data.get("is_complete")

    if type(is_complete) is not bool:
        return error_response("is_complete must be true or false.")

    responsibility.is_complete = is_complete
    db.session.commit()

    return jsonify({
        "message": "Completion updated.",
        "responsibility": responsibility.to_dict(),
    }), 200
