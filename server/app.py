import os

from dotenv import load_dotenv
from flask import Flask, jsonify

from extensions import db, migrate, login_manager, bcrypt
from models import Family, User, Responsibility, Step


load_dotenv()


def create_app():
    app = Flask(__name__)

    app.config["SECRET_KEY"] = os.environ["SECRET_KEY"]
    app.config["SQLALCHEMY_DATABASE_URI"] = os.environ["DATABASE_URL"]
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # Secure session defaults for local development.
    app.config["SESSION_COOKIE_HTTPONLY"] = True
    app.config["SESSION_COOKIE_SAMESITE"] = "Lax"

    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)
    bcrypt.init_app(app)

    @app.get("/api/health")
    def health_check():
        return jsonify({
            "status": "ok",
            "message": "Stepping Stones API is running!"
        }), 200

    @app.get("/api/db-check")
    def database_check():
        from sqlalchemy import text

        with db.engine.connect() as connection:
            result = connection.execute(
                text("SELECT current_database()")
            ).scalar()

        return jsonify({
            "status": "connected",
            "database": result
        }), 200

    return app


app = create_app()


if __name__ == "__main__":
    app.run(debug=True, port=5555)