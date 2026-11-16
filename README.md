# Stepping Stones

**Growing independence, together.**

Stepping Stones is a full-stack family responsibility tracker that helps parents and children plan responsibilities, break larger tasks into manageable steps, and celebrate progress. Families can move through three levels of independence—**Plan Together**, **Share Responsibility**, and **Own It**—as children build confidence and ownership.

Built for Flatiron School's **Project 3: Full-Stack Application with Authentication**.

## Features

- **Family accounts and authentication:** Parents register a family; existing users sign in with an email address or username and password. Flask-Login maintains authenticated sessions.
- **Family management:** Parents can create child accounts and issue one-time invitation codes for new family members. Invitation codes expire after seven days.
- **Responsibilities:** Create, view, edit, delete, assign, and mark responsibilities complete, subject to role and ownership permissions.
- **Preparation steps:** Break responsibilities into ordered steps, optionally with individual due dates, and track completion.
- **Independence levels:** Categorize responsibilities as Plan Together, Share Responsibility, or Own It.
- **Recurring responsibilities:** Parents can create daily, weekly, or monthly series, and pause, resume, or delete series. Completed occurrences are preserved when a series is deleted.
- **Family dashboards:** View responsibilities, progress, and activity in a responsive interface with distinct parent and child workflows.

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React, React Router, Vite, JavaScript, CSS, Lucide icons |
| Backend | Python, Flask, Flask-Login, Flask-SQLAlchemy, Flask-Migrate, Flask-Bcrypt |
| Database | PostgreSQL with SQLAlchemy models and Alembic migrations |
| Authentication | Server-side Flask-Login authentication with session cookies and bcrypt password hashes |

## Project structure

```text
stepping-stones/
├── README.md
├── .gitignore
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   └── App.css
│   ├── package.json
│   └── vite.config.js
└── server/
    ├── app.py
    ├── auth_routes.py
    ├── responsibility_routes.py
    ├── step_routes.py
    ├── models.py
    ├── extensions.py
    └── migrations/
```

## Local setup

### Prerequisites

- Python and `pip`
- Node.js and npm compatible with the project's Vite version
- PostgreSQL running locally

### 1. Clone the repository

```bash
git clone https://github.com/melissagrace74/stepping-stones.git
cd stepping-stones
```

### 2. Configure PostgreSQL and environment variables

Create a local PostgreSQL database for the application (for example, `stepping_stones`). In `server/.env`, provide the two variables required by `server/app.py`:

```dotenv
SECRET_KEY=replace-with-a-long-random-secret
DATABASE_URL=postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/stepping_stones
```

Use your actual local database credentials. Never commit `.env` or real secrets. The repository's `.gitignore` excludes `.env` files.

### 3. Set up and run the Flask API

From the project root:

```bash
cd server
python3 -m venv .venv
source .venv/bin/activate
```

Install the backend dependencies. If a `requirements.txt` has been added to the repository, use `pip install -r requirements.txt`. Otherwise, the packages imported by the backend are:

```bash
pip install Flask Flask-Login Flask-SQLAlchemy Flask-Migrate Flask-Bcrypt python-dotenv psycopg2-binary
```

Apply the included database migrations:

```bash
flask --app app db upgrade
```

Start the backend:

```bash
python app.py
```

The API runs at **http://127.0.0.1:5555**. To verify it is running, visit **http://127.0.0.1:5555/api/health**.

### 4. Set up and run the React frontend

Open a second terminal at the project root:

```bash
cd client
npm install
npm run dev
```

Open **http://localhost:5173** in your browser. The Vite development server proxies `/api` requests to `http://127.0.0.1:5555`, so the frontend and Flask API work together during local development.

To verify the production frontend compiles:

```bash
cd client
npm run build
```

The resulting static frontend assets are written to `client/dist/`. The Vite build does not itself deploy or host the Flask API.

## How to use Stepping Stones

1. **Register a parent account** and create a family.
2. **Add children** from family management or invite another family member with a one-time code.
3. **Create a responsibility**, assign it to a family member, choose a due date, and select an independence level.
4. **Add preparation steps** to make the responsibility easier to complete.
5. **Track progress** as steps and responsibilities are completed.
6. **Create recurring series** for regular responsibilities; pause or resume them as needed.

Children can sign in with their usernames and create standalone responsibilities assigned to themselves. Recurring series creation and management are reserved for parents.

## API reference

All routes are namespaced under `/api`. Except for account registration, login, and the two health/database-check endpoints, the routes below require an authenticated session.

### Authentication and family

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register-parent` | Register a parent and create a family |
| POST | `/api/auth/register-invited` | Join a family using an invitation code |
| POST | `/api/auth/login` | Log in with email or username and password |
| POST | `/api/auth/logout` | Log out |
| GET | `/api/auth/me` | Retrieve the current user and family |
| GET | `/api/auth/family-members` | List members of the signed-in user's family |
| POST | `/api/auth/children` | Create a child account (parent only) |
| POST | `/api/auth/invitations` | Create a one-time family invitation (parent only) |

### Responsibilities

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/responsibilities` | List responsibilities in the user's family |
| POST | `/api/responsibilities` | Create a standalone or recurring responsibility |
| GET | `/api/responsibilities/:id` | Get a responsibility |
| PATCH | `/api/responsibilities/:id` | Edit a responsibility (creator only) |
| DELETE | `/api/responsibilities/:id` | Delete a standalone responsibility (creator only) |
| PATCH | `/api/responsibilities/:id/completion` | Change completion status (creator or assignee) |

### Recurring schedules

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/responsibilities/schedules` | List family recurrence schedules |
| PATCH | `/api/responsibilities/schedules/:id/pause` | Pause a series |
| PATCH | `/api/responsibilities/schedules/:id/resume` | Resume a series |
| DELETE | `/api/responsibilities/schedules/:id` | Delete a series |

Only the parent who created a recurring series can manage it.

### Steps

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/responsibilities/:id/steps` | List steps for a responsibility |
| POST | `/api/responsibilities/:id/steps` | Add a step (responsibility creator only) |
| GET | `/api/steps/:id` | Get a step |
| PATCH | `/api/steps/:id` | Edit a step (responsibility creator only) |
| DELETE | `/api/steps/:id` | Delete a step (responsibility creator only) |
| PATCH | `/api/steps/:id/completion` | Change step completion (creator or assignee) |

### Diagnostics

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/health` | API health check |
| GET | `/api/db-check` | Database connection check; intended for local diagnostics |

API responses are JSON. Invalid requests return error messages and appropriate HTTP status codes.

## Database models

- **Family:** Groups related users, responsibilities, invitations, and recurring schedules.
- **User:** A parent or child with an associated family, credentials, and role.
- **Responsibility:** A dated task with a creator, assignee, independence level, completion state, and optional recurring schedule.
- **Step:** An ordered subtask belonging to a responsibility.
- **RecurrenceSchedule:** Stores the frequency, interval, dates, creator, assignee, and active status of a recurring series.
- **FamilyInvitation:** Stores a hashed, expiring, one-time invitation code and its intended role.

## Authentication and authorization

- Passwords are stored as **bcrypt hashes**, not plaintext.
- Authentication uses **Flask-Login sessions**. Session cookies are configured as `HttpOnly` with `SameSite=Lax`.
- Protected API routes use `@login_required` and return HTTP 401 when the user is not authenticated.
- Responsibility and step lookups are scoped to the current user's **family**, preventing access to another family's records through an ID.
- Editing and deleting responsibilities or steps requires being their **creator**; completion can be changed by the creator or assignee.
- Children can create standalone responsibilities only for themselves. Parents control child account creation, invitations, and recurring series creation; series management is limited to its parent creator.
- Family invitation codes are randomly generated, stored as SHA-256 hashes, expire after seven days, and can be redeemed once.

These checks are enforced in Flask routes rather than relying only on hidden frontend controls.

## Future improvements

Potential enhancements after the Project 3 submission include additional dashboard insights, richer progress visualizations, expanded reminders or notifications, and further usability and accessibility testing. These are future ideas, not required features for the current submission.

## Project status

The frontend production build has passed locally. The application is intended to run with the React development server and Flask API as described above. Public deployment is not required for this course submission.

## Author

Created as a Flatiron School Project 3 full-stack application.
