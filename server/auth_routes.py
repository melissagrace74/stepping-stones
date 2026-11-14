
import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from flask import Blueprint, jsonify, request
from flask_login import (
    current_user,
    login_required,
    login_user,
    logout_user,
)
from sqlalchemy.exc import IntegrityError

from extensions import bcrypt, db
from models import Family, FamilyInvitation, User


auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def error_response(message, status=400):
    return jsonify({"error": message}), status


def request_data():
    data = request.get_json(silent=True)
    return data if isinstance(data, dict) else {}


def normalize_email(email):
    return email.strip().lower() if isinstance(email, str) else ""


def validate_account_data(data):
    name = data.get("name")
    email = normalize_email(data.get("email"))
    password = data.get("password")

    if not isinstance(name, str) or not name.strip():
        return None, error_response("Name is required.")

    if len(name.strip()) > 100:
        return None, error_response("Name must be 100 characters or fewer.")

    if not email or "@" not in email or len(email) > 255:
        return None, error_response("A valid email address is required.")

    if not isinstance(password, str) or len(password) < 8:
        return None, error_response("Password must be at least 8 characters.")

    if len(password) > 128:
        return None, error_response("Password must be 128 characters or fewer.")

    return {
        "name": name.strip(),
        "email": email,
        "password": password,
    }, None


def hash_invitation_code(code):
    return hashlib.sha256(code.encode("utf-8")).hexdigest()


@auth_bp.post("/register-parent")
def register_parent():
    if current_user.is_authenticated:
        return error_response("Log out before creating another account.", 409)

    data = request_data()
    account, error = validate_account_data(data)

    if error:
        return error

    family_name = data.get("family_name")

    if not isinstance(family_name, str) or not family_name.strip():
        return error_response("Family name is required.")

    if len(family_name.strip()) > 120:
        return error_response("Family name must be 120 characters or fewer.")

    if User.query.filter_by(email=account["email"]).first():
        return error_response("An account with this email already exists.", 409)

    family = Family(name=family_name.strip())

    user = User(
        family=family,
        name=account["name"],
        email=account["email"],
        password_hash=bcrypt.generate_password_hash(
            account["password"]
        ).decode("utf-8"),
        role="parent",
    )

    db.session.add(family)
    db.session.add(user)

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return error_response("Unable to create account. Check your email.", 409)

    login_user(user)

    return jsonify({
        "message": "Your family account has been created.",
        "user": user.to_dict(),
        "family": family.to_dict(),
    }), 201


@auth_bp.post("/invitations")
@login_required
def create_invitation():
    if current_user.role != "parent":
        return error_response("Only parents can create invitations.", 403)

    data = request_data()
    role = data.get("role")

    if role not in ("parent", "child"):
        return error_response("Invitation role must be parent or child.")

    code = secrets.token_urlsafe(32)

    invitation = FamilyInvitation(
        family_id=current_user.family_id,
        created_by_id=current_user.id,
        code_hash=hash_invitation_code(code),
        role=role,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    )

    db.session.add(invitation)
    db.session.commit()

    return jsonify({
        "message": "Invitation created. Share this code privately.",
        "code": code,
        "role": role,
        "expires_at": invitation.expires_at.isoformat(),
    }), 201


@auth_bp.post("/register-invited")
def register_invited():
    if current_user.is_authenticated:
        return error_response("Log out before creating another account.", 409)

    data = request_data()
    account, error = validate_account_data(data)

    if error:
        return error

    code = data.get("invitation_code")

    if not isinstance(code, str) or not code.strip():
        return error_response("Invitation code is required.")

    if User.query.filter_by(email=account["email"]).first():
        return error_response("An account with this email already exists.", 409)

    invitation = FamilyInvitation.query.filter_by(
        code_hash=hash_invitation_code(code.strip())
    ).with_for_update().first()

    now = datetime.now(timezone.utc)

    if invitation is None:
        return error_response("Invalid invitation code.", 400)

    if invitation.used_at is not None:
        db.session.rollback()
        return error_response("This invitation has already been used.", 400)

    expires_at = invitation.expires_at

    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at <= now:
        db.session.rollback()
        return error_response("This invitation has expired.", 400)

    user = User(
        family_id=invitation.family_id,
        name=account["name"],
        email=account["email"],
        password_hash=bcrypt.generate_password_hash(
            account["password"]
        ).decode("utf-8"),
        role=invitation.role,
    )

    invitation.used_at = now
    db.session.add(user)

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return error_response("Unable to create account. Check your email.", 409)

    login_user(user)

    return jsonify({
        "message": "You've joined your family.",
        "user": user.to_dict(),
        "family": user.family.to_dict(),
    }), 201


@auth_bp.post("/login")
def login():
    if current_user.is_authenticated:
        return error_response("You're already logged in.", 409)

    data = request_data()
    email = normalize_email(data.get("email"))
    password = data.get("password")

    if not email or not isinstance(password, str):
        return error_response("Email and password are required.")

    user = User.query.filter_by(email=email).first()

    if user is None or not bcrypt.check_password_hash(
        user.password_hash, password
    ):
        return error_response("Incorrect email or password.", 401)

    login_user(user)

    return jsonify({
        "message": "Welcome back!",
        "user": user.to_dict(),
        "family": user.family.to_dict(),
    }), 200


@auth_bp.post("/logout")
@login_required
def logout():
    logout_user()
    return jsonify({"message": "You've been logged out."}), 200


@auth_bp.get("/me")
@login_required
def me():
    return jsonify({
        "user": current_user.to_dict(),
        "family": current_user.family.to_dict(),
    }), 200
