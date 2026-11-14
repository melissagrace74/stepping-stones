
import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck2,
  CalendarPlus2,
  CheckCircle2,
  Circle,
  Eye,
  EyeOff,
  Footprints,
  LockKeyhole,
  LogOut,
  Mail,
  Plus,
  UserRound,
} from 'lucide-react'
import './App.css'

const planningLabels = {
  plan_together: 'Plan Together',
  share_responsibility: 'Share Responsibility',
  own_it: 'Own It',
}

const emptyForm = {
  title: '',
  description: '',
  assigned_to_id: '',
  due_date: '',
  planning_level: 'plan_together',
}

function planningClass(level) {
  if (level === 'share_responsibility') return 'level-share'
  if (level === 'own_it') return 'level-own'
  return 'level-together'
}

function formatDate(value) {
  if (!value) return 'No due date'

  const [year, month, day] = value.slice(0, 10).split('-').map(Number)

  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatCreatedDate(value) {
  if (!value) return 'Unknown'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown'

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

async function readApi(response) {
  const data = await response.json()

  if (!response.ok) {
    const fieldErrors = data.errors
      ? Object.values(data.errors).join(' ')
      : null

    throw new Error(
      data.error ||
        fieldErrors ||
        'Something went wrong. Please try again.'
    )
  }

  return data
}

function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState(null)
  const [family, setFamily] = useState(null)

  const [responsibilities, setResponsibilities] = useState([])
  const [dashboardLoading, setDashboardLoading] = useState(false)
  const [selectedResponsibility, setSelectedResponsibility] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [savingStepId, setSavingStepId] = useState(null)

  const [showNewForm, setShowNewForm] = useState(false)
  const [familyMembers, setFamilyMembers] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [formLoading, setFormLoading] = useState(false)
  const [formSaving, setFormSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const [showStepForm, setShowStepForm] = useState(false)
  const [stepTitle, setStepTitle] = useState('')
  const [stepDueDate, setStepDueDate] = useState('')
  const [stepSaving, setStepSaving] = useState(false)
  const [stepError, setStepError] = useState('')

  useEffect(() => {
    async function restoreSession() {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        })

        if (!response.ok) return

        const data = await response.json()
        setUser(data.user)
        setFamily(data.family)
      } catch {
        // Show login if the session cannot be restored.
      }
    }

    restoreSession()
  }, [])

  useEffect(() => {
    if (!user) return

    let active = true

    async function loadResponsibilities() {
      setDashboardLoading(true)
      setError('')

      try {
        const response = await fetch('/api/responsibilities', {
          credentials: 'include',
        })
        const data = await readApi(response)

        if (active) {
          setResponsibilities(data.responsibilities || [])
        }
      } catch (err) {
        if (active) setError(err.message)
      } finally {
        if (active) setDashboardLoading(false)
      }
    }

    loadResponsibilities()

    return () => {
      active = false
    }
  }, [user])

  async function handleLogin(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })
      const data = await readApi(response)

      setUser(data.user)
      setFamily(data.family)
      setPassword('')
      setShowPassword(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    setError('')

    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
      await readApi(response)

      setUser(null)
      setFamily(null)
      setResponsibilities([])
      setSelectedResponsibility(null)
      setShowNewForm(false)
      setFamilyMembers([])
      setForm(emptyForm)
      setShowStepForm(false)
      setStepTitle('')
      setStepDueDate('')
      setEmail('')
      setPassword('')
      setShowPassword(false)
    } catch (err) {
      setError(err.message)
    }
  }

  async function openResponsibility(id) {
    setError('')
    setStepError('')
    setShowStepForm(false)
    setStepTitle('')
    setStepDueDate('')
    setDetailLoading(true)

    try {
      const response = await fetch(`/api/responsibilities/${id}`, {
        credentials: 'include',
      })
      const data = await readApi(response)

      setSelectedResponsibility(data.responsibility)
    } catch (err) {
      setError(err.message)
    } finally {
      setDetailLoading(false)
    }
  }

  async function refreshResponsibility(id) {
    const response = await fetch(`/api/responsibilities/${id}`, {
      credentials: 'include',
    })
    const data = await readApi(response)
    const updated = data.responsibility

    setSelectedResponsibility(updated)
    setResponsibilities((current) =>
      current.map((item) => (item.id === updated.id ? updated : item))
    )

    return updated
  }

  async function toggleStep(step) {
    if (!selectedResponsibility || savingStepId !== null) return

    setError('')
    setSavingStepId(step.id)

    try {
      const response = await fetch(`/api/steps/${step.id}/completion`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ is_complete: !step.is_complete }),
      })
      await readApi(response)

      await refreshResponsibility(selectedResponsibility.id)
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingStepId(null)
    }
  }

  function openStepForm() {
    setStepError('')
    setStepTitle('')
    setStepDueDate('')
    setShowStepForm(true)
  }

  function closeStepForm() {
    setStepError('')
    setStepTitle('')
    setStepDueDate('')
    setShowStepForm(false)
  }

  async function handleAddStep(event) {
    event.preventDefault()

    if (!selectedResponsibility || stepSaving) return

    setStepError('')
    setStepSaving(true)

    try {
      const existingSteps = selectedResponsibility.steps || []
      const nextPosition =
        existingSteps.length === 0
          ? 0
          : Math.max(...existingSteps.map((step) => step.position ?? 0)) + 1

      const response = await fetch(
        `/api/responsibilities/${selectedResponsibility.id}/steps`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            title: stepTitle.trim(),
            due_date: stepDueDate || null,
            position: nextPosition,
          }),
        }
      )

      await readApi(response)
      await refreshResponsibility(selectedResponsibility.id)
      closeStepForm()
    } catch (err) {
      setStepError(err.message)
    } finally {
      setStepSaving(false)
    }
  }

  async function openNewForm() {
    setError('')
    setFormError('')
    setForm(emptyForm)
    setFormLoading(true)
    setShowNewForm(true)

    try {
      const response = await fetch('/api/auth/family-members', {
        credentials: 'include',
      })
      const data = await readApi(response)

      setFamilyMembers(data.members || [])
    } catch (err) {
      setFormError(err.message)
    } finally {
      setFormLoading(false)
    }
  }

  function updateForm(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function closeNewForm() {
    setShowNewForm(false)
    setFormError('')
    setForm(emptyForm)
  }

  async function handleCreateResponsibility(event) {
    event.preventDefault()
    if (formSaving) return

    setFormError('')
    setFormSaving(true)

    try {
      const response = await fetch('/api/responsibilities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          assigned_to_id: Number(form.assigned_to_id),
          due_date: form.due_date,
          planning_level: form.planning_level,
        }),
      })

      const data = await readApi(response)

      setResponsibilities((current) =>
        [...current, data.responsibility].sort((a, b) => {
          const dateComparison = a.due_date.localeCompare(b.due_date)
          return dateComparison || a.id - b.id
        })
      )

      closeNewForm()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setFormSaving(false)
    }
  }

  if (user) {
    const completed = responsibilities.filter(
      (item) => item.is_complete
    ).length

    const canEditSteps =
      selectedResponsibility &&
      user.id === selectedResponsibility.created_by_id

    const canToggleSteps =
      selectedResponsibility &&
      (user.id === selectedResponsibility.created_by_id ||
        user.id === selectedResponsibility.assigned_to_id)

    return (
      <main className="dashboard-page">
        <header className="dashboard-header">
          <div className="brand">
            <span className="brand-icon">
              <Footprints size={24} strokeWidth={2.2} />
            </span>
            <span>stepping stones</span>
          </div>

          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
          >
            <LogOut size={18} />
            Log out
          </button>
        </header>

        <div className="dashboard-content">
          {showNewForm ? (
            <section className="detail-view">
              <button
                type="button"
                className="back-button"
                onClick={closeNewForm}
              >
                <ArrowLeft size={18} />
                Back to dashboard
              </button>

              <div className="detail-card">
                <span className="eyebrow">
                  EVERY BIG STEP STARTS SMALL
                </span>
                <h1>New responsibility</h1>
                <p className="detail-description">
                  Give your family a goal to work toward, together.
                </p>

                {formLoading ? (
                  <p>Loading family members...</p>
                ) : (
                  <form
                    className="responsibility-form"
                    onSubmit={handleCreateResponsibility}
                  >
                    <label htmlFor="responsibility-title">
                      Responsibility title
                    </label>
                    <input
                      id="responsibility-title"
                      type="text"
                      maxLength={160}
                      placeholder="e.g., Get ready for the school week"
                      value={form.title}
                      onChange={(event) =>
                        updateForm('title', event.target.value)
                      }
                      required
                    />

                    <label htmlFor="responsibility-description">
                      Description
                      <span className="optional-label"> (optional)</span>
                    </label>
                    <textarea
                      id="responsibility-description"
                      rows={4}
                      placeholder="What does success look like?"
                      value={form.description}
                      onChange={(event) =>
                        updateForm('description', event.target.value)
                      }
                    />

                    <label htmlFor="responsibility-assignee">
                      Assign to
                    </label>
                    <select
                      id="responsibility-assignee"
                      value={form.assigned_to_id}
                      onChange={(event) =>
                        updateForm('assigned_to_id', event.target.value)
                      }
                      required
                    >
                      <option value="">Select a family member</option>
                      {familyMembers.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name} — {member.role}
                        </option>
                      ))}
                    </select>

                    <label htmlFor="responsibility-date">
                      Due date
                    </label>
                    <input
                      id="responsibility-date"
                      type="date"
                      value={form.due_date}
                      onChange={(event) =>
                        updateForm('due_date', event.target.value)
                      }
                      required
                    />

                    <label htmlFor="responsibility-level">
                      Planning level
                    </label>
                    <select
                      id="responsibility-level"
                      value={form.planning_level}
                      onChange={(event) =>
                        updateForm('planning_level', event.target.value)
                      }
                      required
                    >
                      <option value="plan_together">
                        Plan Together
                      </option>
                      <option value="share_responsibility">
                        Share Responsibility
                      </option>
                      <option value="own_it">
                        Own It
                      </option>
                    </select>

                    {formError && (
                      <p className="form-error" role="alert">
                        {formError}
                      </p>
                    )}

                    <div className="form-actions">
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={closeNewForm}
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        className="primary-button"
                        disabled={formSaving || familyMembers.length === 0}
                      >
                        {formSaving
                          ? 'Creating...'
                          : 'Create responsibility'}
                        <ArrowRight size={18} />
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </section>
          ) : selectedResponsibility ? (
            <section className="detail-view">
              <button
                type="button"
                className="back-button"
                onClick={() => {
                  setSelectedResponsibility(null)
                  closeStepForm()
                  setError('')
                }}
              >
                <ArrowLeft size={18} />
                Back to dashboard
              </button>

              <div className="detail-card">
                <span
                  className={`planning-badge ${planningClass(
                    selectedResponsibility.planning_level
                  )}`}
                >
                  {planningLabels[selectedResponsibility.planning_level] ||
                    selectedResponsibility.planning_level}
                </span>

                <h1>{selectedResponsibility.title}</h1>

                <p className="detail-description">
                  {selectedResponsibility.description ||
                    'No description added yet.'}
                </p>

                <div className="detail-meta">
                  <span>
                    <UserRound size={17} />
                    Assigned to{' '}
                    <strong>{selectedResponsibility.assignee_name}</strong>
                  </span>

                  <span className="created-date">
                    <CalendarPlus2 size={17} />
                    Created{' '}
                    {formatCreatedDate(selectedResponsibility.created_at)}
                  </span>

                  <span className="due-date">
                    <CalendarCheck2 size={17} />
                    Due{' '}
                    <strong>
                      {formatDate(selectedResponsibility.due_date)}
                    </strong>
                  </span>
                </div>

                <div className="steps-heading">
                  <div>
                    <span className="eyebrow">
                      LITTLE STEPS, BIG PROGRESS
                    </span>
                    <h2>Preparation steps</h2>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <span className="steps-count">
                      {selectedResponsibility.completed_steps} of{' '}
                      {selectedResponsibility.total_steps} complete
                    </span>

                    {canEditSteps && !showStepForm && (
                      <button
                        type="button"
                        className="primary-button"
                        onClick={openStepForm}
                      >
                        <Plus size={17} />
                        Add step
                      </button>
                    )}
                  </div>
                </div>

                {showStepForm && (
                  <form
                    className="responsibility-form"
                    onSubmit={handleAddStep}
                  >
                    <label htmlFor="step-title">Step title</label>
                    <input
                      id="step-title"
                      type="text"
                      maxLength={160}
                      placeholder="e.g., Check homework folder"
                      value={stepTitle}
                      onChange={(event) =>
                        setStepTitle(event.target.value)
                      }
                      required
                    />

                    <label htmlFor="step-due-date">
                      Due date
                      <span className="optional-label"> (optional)</span>
                    </label>
                    <input
                      id="step-due-date"
                      type="date"
                      value={stepDueDate}
                      onChange={(event) =>
                        setStepDueDate(event.target.value)
                      }
                    />

                    {stepError && (
                      <p className="form-error" role="alert">
                        {stepError}
                      </p>
                    )}

                    <div className="form-actions">
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={closeStepForm}
                        disabled={stepSaving}
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        className="primary-button"
                        disabled={stepSaving || !stepTitle.trim()}
                      >
                        {stepSaving ? 'Saving...' : 'Save step'}
                        <ArrowRight size={18} />
                      </button>
                    </div>
                  </form>
                )}

                {error && (
                  <p className="form-error" role="alert">
                    {error}
                  </p>
                )}

                {selectedResponsibility.steps?.length ? (
                  <div className="steps-list">
                    {selectedResponsibility.steps.map((step) => (
                      <button
                        type="button"
                        className={`step-item ${
                          step.is_complete ? 'step-completed' : ''
                        }`}
                        key={step.id}
                        disabled={!canToggleSteps || savingStepId !== null}
                        onClick={() => toggleStep(step)}
                        aria-label={`${
                          step.is_complete
                            ? 'Mark incomplete'
                            : 'Mark complete'
                        }: ${step.title}`}
                      >
                        {step.is_complete ? (
                          <CheckCircle2 size={23} />
                        ) : (
                          <Circle size={23} />
                        )}

                        <span className="step-title">{step.title}</span>

                        {step.due_date && (
                          <span className="step-date">
                            {formatDate(step.due_date)}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <Footprints size={30} />
                    <h3>No steps yet</h3>
                    <p>Preparation steps will appear here.</p>
                  </div>
                )}
              </div>
            </section>
          ) : (
            <>
              <div className="dashboard-intro">
                <span className="eyebrow">
                  {family?.name || 'YOUR FAMILY'}
                </span>
                <h1>
                  Good to see you, {user.name.split(' ')[0]}!
                </h1>
                <p>
                  Every little step counts. Here's what your family
                  is working on together.
                </p>
              </div>

              <div className="dashboard-stats">
                <div className="stat-card">
                  <span>Responsibilities</span>
                  <strong>{responsibilities.length}</strong>
                </div>
                <div className="stat-card">
                  <span>Completed</span>
                  <strong>{completed}</strong>
                </div>
                <div className="stat-card">
                  <span>In progress</span>
                  <strong>{responsibilities.length - completed}</strong>
                </div>
              </div>

              <section className="responsibilities-section">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">ONE STEP AT A TIME</span>
                    <h2>Family responsibilities</h2>
                  </div>

                  {user.role === 'parent' && (
                    <button
                      type="button"
                      className="primary-button"
                      onClick={openNewForm}
                    >
                      <Plus size={18} />
                      New responsibility
                    </button>
                  )}
                </div>

                {error && (
                  <p className="form-error" role="alert">
                    {error}
                  </p>
                )}

                {dashboardLoading ? (
                  <p>Loading your family's responsibilities...</p>
                ) : responsibilities.length === 0 ? (
                  <div className="empty-state">
                    <Footprints size={34} />
                    <h3>Every journey starts with one step.</h3>
                    <p>Your family's responsibilities will appear here.</p>
                  </div>
                ) : (
                  <div className="responsibility-grid">
                    {responsibilities.map((item) => (
                      <button
                        type="button"
                        className="responsibility-card responsibility-button"
                        key={item.id}
                        onClick={() => openResponsibility(item.id)}
                        disabled={detailLoading}
                      >
                        <div className="card-top">
                          <span
                            className={`planning-badge ${planningClass(
                              item.planning_level
                            )}`}
                          >
                            {planningLabels[item.planning_level] ||
                              item.planning_level}
                          </span>

                          {item.is_complete ? (
                            <CheckCircle2 size={23} />
                          ) : (
                            <Circle size={23} />
                          )}
                        </div>

                        <h3>{item.title}</h3>
                        <p>{item.description}</p>

                        <div className="card-meta">
                          <span>
                            <UserRound size={15} />
                            Assigned to <strong>{item.assignee_name}</strong>
                          </span>

                          <span className="created-date">
                            <CalendarPlus2 size={15} />
                            Created {formatCreatedDate(item.created_at)}
                          </span>

                          <span className="due-date">
                            <CalendarCheck2 size={15} />
                            Due <strong>{formatDate(item.due_date)}</strong>
                          </span>
                        </div>

                        <div className="card-progress">
                          <span>
                            {item.completed_steps || 0} of{' '}
                            {item.total_steps || 0} steps complete
                          </span>
                          <span className="view-steps-label">
                            View steps <ArrowRight size={18} />
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>
    )
  }

  return (
    <main className="auth-layout">
      <section className="auth-story">
        <div className="brand">
          <span className="brand-icon">
            <Footprints size={24} strokeWidth={2.2} />
          </span>
          <span>stepping stones</span>
        </div>

        <div className="story-content">
          <span className="eyebrow">
            GROWING INDEPENDENCE, TOGETHER
          </span>

          <h1>
            Small steps.
            <br />
            <em>Big confidence.</em>
          </h1>

          <p>
            A shared space for families to plan responsibilities,
            celebrate progress, and help kids grow into their
            independence — one step at a time.
          </p>

          <div className="story-tags">
            <span>Plan together</span>
            <span>Share responsibility</span>
            <span>Own it</span>
          </div>
        </div>

        <div className="story-footer">
          A little progress makes a big difference.
        </div>
      </section>

      <section className="auth-form-section">
        <div className="login-card">
          <span className="eyebrow">WELCOME BACK</span>
          <h2>Good to see you again.</h2>

          <p className="form-intro">
            Sign in to see what your family is working toward.
          </p>

          <form onSubmit={handleLogin}>
            <label htmlFor="email">Email address</label>

            <div className="input-wrapper">
              <Mail size={19} />
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <label htmlFor="password">Password</label>

            <div className="input-wrapper">
              <LockKeyhole size={19} />

              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>

            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}

            <button
              className="primary-button"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in'}
              <ArrowRight size={18} />
            </button>
          </form>

          <p className="signup-note">
            New to Stepping Stones? Family registration is coming next.
          </p>
        </div>
      </section>
    </main>
  )
}

export default App
