
import calendar
from datetime import date, timedelta

from flask import Blueprint, jsonify, request
from flask_login import current_user, login_required

from extensions import db
from models import RecurrenceSchedule, Responsibility, User


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

RECURRENCE_FREQUENCIES = {
    "daily",
    "weekly",
    "monthly",
}

RECURRENCE_LOOKAHEAD_DAYS = 60


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


def validate_recurrence(data, start_date):
    errors = {}

    if not isinstance(data, dict):
        return None, {
            "recurrence": "Recurrence settings must be an object."
        }

    frequency = data.get("frequency")
    interval = data.get("interval", 1)
    end_date_value = data.get("end_date")
    weekdays_value = data.get("weekdays")

    if frequency not in RECURRENCE_FREQUENCIES:
        errors["frequency"] = (
            "Choose daily, weekly, or monthly recurrence."
        )

    if type(interval) is not int or interval < 1 or interval > 365:
        errors["interval"] = (
            "Repeat interval must be between 1 and 365."
        )

    end_date = None

    if end_date_value not in (None, ""):
        end_date = parse_due_date(end_date_value)

        if end_date is None:
            errors["end_date"] = (
                "Enter a valid recurrence end date."
            )
        elif end_date < start_date:
            errors["end_date"] = (
                "End date cannot be before the start date."
            )

    weekdays = None

    if frequency == "weekly":
        if weekdays_value is None:
            weekdays_value = [start_date.weekday()]

        if (
            not isinstance(weekdays_value, list)
            or not weekdays_value
            or any(
                type(day) is not int or day < 0 or day > 6
                for day in weekdays_value
            )
        ):
            errors["weekdays"] = (
                "Choose at least one weekday from 0 to 6."
            )
        else:
            weekdays = ",".join(
                str(day) for day in sorted(set(weekdays_value))
            )
    elif weekdays_value not in (None, []):
        errors["weekdays"] = (
            "Weekdays are only used for weekly recurrence."
        )

    if errors:
        return None, errors

    return {
        "frequency": frequency,
        "interval": interval,
        "weekdays": weekdays,
        "end_date": end_date,
    }, None


def recurrence_dates(schedule, window_start, window_end):
    """
    Return occurrence dates within the requested window.

    Daily schedules repeat every N days.
    Weekly schedules repeat every N weeks on selected weekdays.
    Monthly schedules repeat every N months on the start day,
    using the last day for shorter months.
    """
    start = schedule.start_date

    if schedule.end_date is not None:
        window_end = min(window_end, schedule.end_date)

    window_start = max(window_start, start)

    if window_start > window_end:
        return []

    dates = []

    if schedule.frequency == "daily":
        elapsed_days = (window_start - start).days
        remainder = elapsed_days % schedule.interval

        if remainder:
            elapsed_days += schedule.interval - remainder

        occurrence = start + timedelta(days=elapsed_days)

        while occurrence <= window_end:
            dates.append(occurrence)
            occurrence += timedelta(days=schedule.interval)

    elif schedule.frequency == "weekly":
        selected_days = {
            int(value)
            for value in (schedule.weekdays or "").split(",")
            if value.strip().isdigit()
        }

        if not selected_days:
            selected_days = {start.weekday()}

        start_monday = start - timedelta(days=start.weekday())
        occurrence = window_start

        while occurrence <= window_end:
            occurrence_monday = occurrence - timedelta(
                days=occurrence.weekday()
            )

            weeks_elapsed = (
                occurrence_monday - start_monday
            ).days // 7

            if (
                weeks_elapsed % schedule.interval == 0
                and occurrence.weekday() in selected_days
            ):
                dates.append(occurrence)

            occurrence += timedelta(days=1)

    elif schedule.frequency == "monthly":
        month_index = start.year * 12 + start.month - 1

        while True:
            year = month_index // 12
            month = month_index % 12 + 1

            if year > 9999:
                break

            last_day = calendar.monthrange(year, month)[1]
            day = min(start.day, last_day)
            occurrence = date(year, month, day)

            if occurrence > window_end:
                break

            if occurrence >= window_start:
                dates.append(occurrence)

            month_index += schedule.interval

    return dates


def generate_occurrences(schedule, window_start, window_end):
    """
    Create missing occurrences without resetting existing ones.

    Existing completion states and preparation steps are preserved.
    """
    dates = recurrence_dates(
        schedule,
        window_start,
        window_end,
    )

    if not dates:
        return []

    existing_dates = {
        responsibility.due_date
        for responsibility in Responsibility.query.filter(
            Responsibility.recurrence_schedule_id == schedule.id,
            Responsibility.due_date.in_(dates),
        ).all()
    }

    created = []

    for occurrence_date in dates:
        if occurrence_date in existing_dates:
            continue

        responsibility = Responsibility(
            family_id=schedule.family_id,
            created_by_id=schedule.created_by_id,
            assigned_to_id=schedule.assigned_to_id,
            recurrence_schedule_id=schedule.id,
            title=schedule.title,
            description=schedule.description,
            due_date=occurrence_date,
            planning_level=schedule.planning_level,
        )

        db.session.add(responsibility)
        created.append(responsibility)

    return created


def refresh_recurring_occurrences():
    today = date.today()
    horizon = today + timedelta(
        days=RECURRENCE_LOOKAHEAD_DAYS
    )

    schedules = RecurrenceSchedule.query.filter_by(
        family_id=current_user.family_id,
        is_active=True,
    ).all()

    for schedule in schedules:
        generate_occurrences(schedule, today, horizon)

    db.session.commit()


@responsibility_bp.get("")
@login_required
def list_responsibilities():
    refresh_recurring_occurrences()

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
    if current_user.role != "parent":
        return error_response(
            "Only parents can create responsibilities.",
            403,
        )

    data = request_data()
    fields, errors = validate_fields(data)

    if errors:
        return jsonify({"errors": errors}), 400

    recurrence_data = data.get("recurrence")

    if recurrence_data is None:
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

    recurrence_fields, recurrence_errors = validate_recurrence(
        recurrence_data,
        fields["due_date"],
    )

    if recurrence_errors:
        return jsonify({
            "errors": recurrence_errors
        }), 400

    schedule = RecurrenceSchedule(
        family_id=current_user.family_id,
        created_by_id=current_user.id,
        assigned_to_id=fields["assigned_to_id"],
        title=fields["title"],
        description=fields["description"],
        planning_level=fields["planning_level"],
        frequency=recurrence_fields["frequency"],
        interval=recurrence_fields["interval"],
        weekdays=recurrence_fields["weekdays"],
        start_date=fields["due_date"],
        end_date=recurrence_fields["end_date"],
        is_active=True,
    )

    db.session.add(schedule)
    db.session.flush()

    today = date.today()
    horizon = today + timedelta(
        days=RECURRENCE_LOOKAHEAD_DAYS
    )

    # Include the schedule's starting occurrence, even when
    # its start date is outside the 60-day lookahead window.
    generate_occurrences(
        schedule,
        schedule.start_date,
        schedule.start_date,
    )

    # Fill the upcoming window without duplicating the start.
    generate_occurrences(
        schedule,
        today,
        horizon,
    )

    db.session.commit()

    first_responsibility = Responsibility.query.filter_by(
        recurrence_schedule_id=schedule.id,
    ).order_by(
        Responsibility.due_date.asc(),
    ).first()

    return jsonify({
        "message": "Recurring responsibility created.",
        "responsibility": first_responsibility.to_dict(),
        "recurrence_schedule": schedule.to_dict(),
    }), 201


@responsibility_bp.get("/<int:responsibility_id>")
@login_required
def get_responsibility(responsibility_id):
    responsibility = get_family_responsibility(
        responsibility_id
    )

    if responsibility is None:
        return error_response(
            "Responsibility not found.",
            404,
        )

    return jsonify({
        "responsibility": responsibility.to_dict(),
    }), 200


@responsibility_bp.patch("/<int:responsibility_id>")
@login_required
def update_responsibility(responsibility_id):
    responsibility = get_family_responsibility(
        responsibility_id
    )

    if responsibility is None:
        return error_response(
            "Responsibility not found.",
            404,
        )

    if responsibility.created_by_id != current_user.id:
        return error_response(
            "Only the creator can edit this responsibility.",
            403,
        )

    data = request_data()
    fields, errors = validate_fields(
        data,
        existing=responsibility,
    )

    if errors:
        return jsonify({"errors": errors}), 400

    # Edits to a recurring occurrence affect only that
    # occurrence, not the underlying recurrence schedule.
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
    responsibility = get_family_responsibility(
        responsibility_id
    )

    if responsibility is None:
        return error_response(
            "Responsibility not found.",
            404,
        )

    if responsibility.created_by_id != current_user.id:
        return error_response(
            "Only the creator can delete this responsibility.",
            403,
        )

    if responsibility.recurrence_schedule_id is not None:
        return error_response(
            "Individual recurring occurrences cannot be deleted "
            "yet. The recurrence schedule must be managed first.",
            409,
        )

    db.session.delete(responsibility)
    db.session.commit()

    return jsonify({
        "message": "Responsibility deleted.",
    }), 200


@responsibility_bp.patch(
    "/<int:responsibility_id>/completion"
)
@login_required
def update_completion(responsibility_id):
    responsibility = get_family_responsibility(
        responsibility_id
    )

    if responsibility is None:
        return error_response(
            "Responsibility not found.",
            404,
        )

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
        return error_response(
            "is_complete must be true or false."
        )

    responsibility.is_complete = is_complete
    db.session.commit()

    return jsonify({
        "message": "Completion updated.",
        "responsibility": responsibility.to_dict(),
    }), 200
