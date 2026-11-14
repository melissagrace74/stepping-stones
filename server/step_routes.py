
from datetime import date

from flask import Blueprint, jsonify, request
from flask_login import current_user, login_required

from extensions import db
from models import Responsibility, Step


step_bp = Blueprint("steps", __name__, url_prefix="/api")


def error_response(message, status=400):
    return jsonify({"error": message}), status


def request_data():
    data = request.get_json(silent=True)
    return data if isinstance(data, dict) else {}


def family_responsibility(responsibility_id):
    return Responsibility.query.filter_by(
        id=responsibility_id,
        family_id=current_user.family_id,
    ).first()


def family_step(step_id):
    return (
        Step.query
        .join(Responsibility)
        .filter(
            Step.id == step_id,
            Responsibility.family_id == current_user.family_id,
        )
        .first()
    )


def can_edit_steps(responsibility):
    return responsibility.created_by_id == current_user.id


def can_complete_steps(responsibility):
    return current_user.id in (
        responsibility.created_by_id,
        responsibility.assigned_to_id,
    )


def validate_step(data, existing=None):
    errors = {}

    title = data.get(
        "title",
        existing.title if existing else None,
    )

    due_date_value = data.get(
        "due_date",
        existing.due_date.isoformat()
        if existing and existing.due_date
        else None,
    )

    position = data.get(
        "position",
        existing.position if existing else 0,
    )

    if not isinstance(title, str) or not title.strip():
        errors["title"] = "Step title is required."
    elif len(title.strip()) > 160:
        errors["title"] = "Step title must be 160 characters or fewer."

    due_date = None

    if due_date_value not in (None, ""):
        if not isinstance(due_date_value, str):
            errors["due_date"] = "Enter a valid date."
        else:
            try:
                due_date = date.fromisoformat(due_date_value)
            except ValueError:
                errors["due_date"] = "Use YYYY-MM-DD for the due date."

    if type(position) is not int or position < 0:
        errors["position"] = "Position must be a nonnegative integer."

    if errors:
        return None, errors

    return {
        "title": title.strip(),
        "due_date": due_date,
        "position": position,
    }, None


@step_bp.get("/responsibilities/<int:responsibility_id>/steps")
@login_required
def list_steps(responsibility_id):
    responsibility = family_responsibility(responsibility_id)

    if responsibility is None:
        return error_response("Responsibility not found.", 404)

    return jsonify({
        "steps": [step.to_dict() for step in responsibility.steps]
    }), 200


@step_bp.post("/responsibilities/<int:responsibility_id>/steps")
@login_required
def create_step(responsibility_id):
    responsibility = family_responsibility(responsibility_id)

    if responsibility is None:
        return error_response("Responsibility not found.", 404)

    if not can_edit_steps(responsibility):
        return error_response(
            "Only the responsibility creator can add steps.",
            403,
        )

    data = request_data()
    fields, errors = validate_step(data)

    if errors:
        return jsonify({"errors": errors}), 400

    step = Step(
        responsibility_id=responsibility.id,
        **fields,
    )

    db.session.add(step)
    db.session.commit()

    return jsonify({
        "message": "Step created.",
        "step": step.to_dict(),
    }), 201


@step_bp.get("/steps/<int:step_id>")
@login_required
def get_step(step_id):
    step = family_step(step_id)

    if step is None:
        return error_response("Step not found.", 404)

    return jsonify({"step": step.to_dict()}), 200


@step_bp.patch("/steps/<int:step_id>")
@login_required
def update_step(step_id):
    step = family_step(step_id)

    if step is None:
        return error_response("Step not found.", 404)

    if not can_edit_steps(step.responsibility):
        return error_response(
            "Only the responsibility creator can edit steps.",
            403,
        )

    fields, errors = validate_step(request_data(), existing=step)

    if errors:
        return jsonify({"errors": errors}), 400

    for field, value in fields.items():
        setattr(step, field, value)

    db.session.commit()

    return jsonify({
        "message": "Step updated.",
        "step": step.to_dict(),
    }), 200


@step_bp.delete("/steps/<int:step_id>")
@login_required
def delete_step(step_id):
    step = family_step(step_id)

    if step is None:
        return error_response("Step not found.", 404)

    if not can_edit_steps(step.responsibility):
        return error_response(
            "Only the responsibility creator can delete steps.",
            403,
        )

    db.session.delete(step)
    db.session.commit()

    return jsonify({"message": "Step deleted."}), 200


@step_bp.patch("/steps/<int:step_id>/completion")
@login_required
def update_step_completion(step_id):
    step = family_step(step_id)

    if step is None:
        return error_response("Step not found.", 404)

    if not can_complete_steps(step.responsibility):
        return error_response(
            "Only the creator or assignee can complete steps.",
            403,
        )

    is_complete = request_data().get("is_complete")

    if type(is_complete) is not bool:
        return error_response("is_complete must be true or false.")

    step.is_complete = is_complete
    db.session.commit()

    return jsonify({
        "message": "Step completion updated.",
        "step": step.to_dict(),
    }), 200
