
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
  Repeat2,
  UserRound,
} from 'lucide-react'
import './App.css'

const planningLabels = {
  plan_together: 'Plan Together',
  share_responsibility: 'Share Responsibility',
  own_it: 'Own It',
}

const weekdayLabels = [
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
  'Sun',
]

const emptyForm = {
  title: '',
  description: '',
  assigned_to_id: '',
  due_date: '',
  planning_level: 'plan_together',
  frequency: 'none',
  interval: 1,
  weekdays: [],
  end_date: '',
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

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'Unknown'

  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function localDateKey(value) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getWeekDates() {
  const today = new Date()
  const monday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  )

  const daysSinceMonday = (monday.getDay() + 6) % 7
  monday.setDate(monday.getDate() - daysSinceMonday)

  const sunday = new Date(monday)
  sunday.setDate(sunday.getDate() + 6)

  return {
    start: localDateKey(monday),
    end: localDateKey(sunday),
  }
}

function groupResponsibilities(responsibilities) {
  const week = getWeekDates()

  const groups = {
    thisWeek: [],
    upcoming: [],
    completed: [],
  }

  const sorted = [...responsibilities].sort((a, b) => {
    const firstDate = a.due_date || '9999-12-31'
    const secondDate = b.due_date || '9999-12-31'

    return firstDate.localeCompare(secondDate) || a.id - b.id
  })

  // Track which recurring schedules already have an Upcoming card.
  // This does not change or delete any responsibility in the database.
  const upcomingRecurringSchedules = new Set()

  sorted.forEach((item) => {
    if (item.is_complete) {
      groups.completed.push(item)
      return
    }

    // Show every incomplete occurrence due this week or overdue.
    if (!item.due_date || item.due_date <= week.end) {
      groups.thisWeek.push(item)
      return
    }

    // One-time responsibilities always appear individually.
    if (!item.recurrence_schedule_id) {
      groups.upcoming.push(item)
      return
    }

    // The list is sorted by date, so the first future occurrence
    // encountered is the next upcoming one for this schedule.
    if (
      !upcomingRecurringSchedules.has(item.recurrence_schedule_id)
    ) {
      upcomingRecurringSchedules.add(item.recurrence_schedule_id)
      groups.upcoming.push(item)
    }
  })

  return groups
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

function ResponsibilityCard({ item, onOpen, disabled }) {
  return (
    <button
      type="button"
      className="responsibility-card responsibility-button"
      onClick={() => onOpen(item.id)}
      disabled={disabled}
    >
      <div className="card-top">
        <span
          className={`planning-badge ${planningClass(
            item.planning_level
          )}`}
        >
          {planningLabels[item.planning_level] || item.planning_level}
        </span>

        {item.is_complete ? (
          <CheckCircle2 size={23} />
        ) : (
          <Circle size={23} />
        )}
      </div>

      <h3>{item.title}</h3>
      <p>{item.description}</p>

      {item.recurrence_schedule_id && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            fontWeight: 600,
            color: '#537b61',
            marginBottom: '12px',
          }}
        >
          <Repeat2 size={15} />
          Recurring responsibility
        </span>
      )}

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
  )
}

function ResponsibilitySection({
  title,
  eyebrow,
  items,
  emptyMessage,
  onOpen,
  disabled,
}) {
  return (
    <section
      className="responsibilities-section"
      style={{ marginBottom: '48px' }}
    >
      <div className="section-heading">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h2>
            {title}{' '}
            <span
              style={{
                fontSize: '15px',
                fontWeight: 600,
                color: '#789781',
                letterSpacing: 0,
              }}
            >
              ({items.length})
            </span>
          </h2>
        </div>
      </div>

      {items.length > 0 ? (
        <div className="responsibility-grid">
          {items.map((item) => (
            <ResponsibilityCard
              key={item.id}
              item={item}
              onOpen={onOpen}
              disabled={disabled}
            />
          ))}
        </div>
      ) : (
        <div
          className="empty-state"
          style={{ padding: '32px 24px' }}
        >
          <p style={{ margin: 0 }}>{emptyMessage}</p>
        </div>
      )}
    </section>
  )
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

  async function reloadResponsibilities() {
    const response = await fetch('/api/responsibilities', {
      credentials: 'include',
    })

    const data = await readApi(response)
    setResponsibilities(data.responsibilities || [])
  }

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
          : Math.max(
              ...existingSteps.map((step) => step.position ?? 0)
            ) + 1

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
    setForm({ ...emptyForm })
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

  function updateFrequency(value) {
    setForm((current) => ({
      ...current,
      frequency: value,
      interval: 1,
      weekdays: [],
      end_date: '',
    }))
  }

  function toggleWeekday(day) {
    setForm((current) => ({
      ...current,
      weekdays: current.weekdays.includes(day)
        ? current.weekdays.filter((value) => value !== day)
        : [...current.weekdays, day].sort((a, b) => a - b),
    }))
  }

  function closeNewForm() {
    setShowNewForm(false)
    setFormError('')
    setForm({ ...emptyForm })
  }

  async function handleCreateResponsibility(event) {
    event.preventDefault()
    if (formSaving) return

    setFormError('')

    if (form.frequency !== 'none' && !form.due_date) {
      setFormError('Choose a start date for the recurring responsibility.')
      return
    }

    if (
      form.frequency === 'weekly' &&
      form.weekdays.length === 0
    ) {
      setFormError('Select at least one day for weekly recurrence.')
      return
    }

    if (
      form.frequency !== 'none' &&
      form.end_date &&
      form.end_date < form.due_date
    ) {
      setFormError('The end date cannot be before the start date.')
      return
    }

    setFormSaving(true)

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      assigned_to_id: Number(form.assigned_to_id),
      due_date: form.due_date,
      planning_level: form.planning_level,
    }

    if (form.frequency !== 'none') {
      payload.recurrence = {
        frequency: form.frequency,
        interval: Number(form.interval),
        end_date: form.end_date || null,
      }

      if (form.frequency === 'weekly') {
        payload.recurrence.weekdays = form.weekdays
      }
    }

    try {
      const response = await fetch('/api/responsibilities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      await readApi(response)

      closeNewForm()

      try {
        await reloadResponsibilities()
      } catch (refreshError) {
        setError(
          `Responsibility created, but the dashboard could not refresh: ${refreshError.message}`
        )
      }
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

    const grouped = groupResponsibilities(responsibilities)

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
                      <span className="optional-label">
                        {' '}(optional)
                      </span>
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
                      <option value="">
                        Select a family member
                      </option>
                      {familyMembers.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name} — {member.role}
                        </option>
                      ))}
                    </select>

                    <label htmlFor="responsibility-date">
                      {form.frequency === 'none'
                        ? 'Due date'
                        : 'First due date'}
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

                    <div
                      style={{
                        marginTop: '12px',
                        paddingTop: '24px',
                        borderTop: '1px solid #e3e9e1',
                      }}
                    >
                      <span
                        className="eyebrow"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '16px',
                        }}
                      >
                        <Repeat2 size={17} />
                        MAKE IT A ROUTINE
                      </span>

                      <label htmlFor="responsibility-frequency">
                        Repeat
                      </label>
                      <select
                        id="responsibility-frequency"
                        value={form.frequency}
                        onChange={(event) =>
                          updateFrequency(event.target.value)
                        }
                      >
                        <option value="none">
                          Does not repeat
                        </option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>

                      {form.frequency !== 'none' && (
                        <>
                          <label htmlFor="responsibility-interval">
                            Repeat every
                          </label>

                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                            }}
                          >
                            <input
                              id="responsibility-interval"
                              type="number"
                              min="1"
                              max="365"
                              step="1"
                              value={form.interval}
                              onChange={(event) =>
                                updateForm(
                                  'interval',
                                  event.target.value
                                )
                              }
                              required
                              style={{
                                width: '110px',
                                flex: '0 0 110px',
                              }}
                            />
                            <span>
                              {form.frequency === 'daily'
                                ? 'day(s)'
                                : form.frequency === 'weekly'
                                  ? 'week(s)'
                                  : 'month(s)'}
                            </span>
                          </div>

                          {form.frequency === 'weekly' && (
                            <fieldset
                              style={{
                                border: 0,
                                padding: 0,
                                margin: '20px 0',
                                minWidth: 0,
                              }}
                            >
                              <legend
                                style={{
                                  fontWeight: 600,
                                  marginBottom: '12px',
                                }}
                              >
                                Repeat on
                              </legend>

                              <div
                                style={{
                                  display: 'flex',
                                  flexWrap: 'wrap',
                                  gap: '8px',
                                }}
                              >
                                {weekdayLabels.map((label, day) => {
                                  const selected =
                                    form.weekdays.includes(day)

                                  return (
                                    <button
                                      key={label}
                                      type="button"
                                      aria-pressed={selected}
                                      onClick={() => toggleWeekday(day)}
                                      style={{
                                        minWidth: '48px',
                                        padding: '10px 12px',
                                        borderRadius: '12px',
                                        border: selected
                                          ? '2px solid #426f51'
                                          : '1px solid #cddbd0',
                                        background: selected
                                          ? '#e2eee4'
                                          : '#ffffff',
                                        color: '#254a32',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                      }}
                                    >
                                      {label}
                                    </button>
                                  )
                                })}
                              </div>

                              <p
                                style={{
                                  fontSize: '13px',
                                  marginTop: '10px',
                                  color: '#62746a',
                                }}
                              >
                                Select one or more days of the week.
                              </p>
                            </fieldset>
                          )}

                          <label htmlFor="responsibility-end-date">
                            Repeat until
                            <span className="optional-label">
                              {' '}(optional)
                            </span>
                          </label>
                          <input
                            id="responsibility-end-date"
                            type="date"
                            min={form.due_date || undefined}
                            value={form.end_date}
                            onChange={(event) =>
                              updateForm(
                                'end_date',
                                event.target.value
                              )
                            }
                          />

                          <p
                            style={{
                              fontSize: '13px',
                              color: '#62746a',
                              lineHeight: 1.6,
                              marginTop: '10px',
                            }}
                          >
                            Leave this blank to keep repeating.
                            Stepping Stones creates upcoming
                            responsibilities as time moves forward.
                          </p>
                        </>
                      )}
                    </div>

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
                        disabled={formSaving}
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        className="primary-button"
                        disabled={
                          formSaving || familyMembers.length === 0
                        }
                      >
                        {formSaving
                          ? 'Creating...'
                          : form.frequency === 'none'
                            ? 'Create responsibility'
                            : 'Create recurring responsibility'}
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
                  {planningLabels[
                    selectedResponsibility.planning_level
                  ] || selectedResponsibility.planning_level}
                </span>

                <h1>{selectedResponsibility.title}</h1>

                {selectedResponsibility.recurrence_schedule_id && (
                  <p
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#537b61',
                      fontWeight: 600,
                      marginBottom: '12px',
                    }}
                  >
                    <Repeat2 size={17} />
                    Part of a recurring schedule
                  </p>
                )}

                <p className="detail-description">
                  {selectedResponsibility.description ||
                    'No description added yet.'}
                </p>

                <div className="detail-meta">
                  <span>
                    <UserRound size={17} />
                    Assigned to{' '}
                    <strong>
                      {selectedResponsibility.assignee_name}
                    </strong>
                  </span>

                  <span className="created-date">
                    <CalendarPlus2 size={17} />
                    Created{' '}
                    {formatCreatedDate(
                      selectedResponsibility.created_at
                    )}
                  </span>

                  <span className="due-date">
                    <CalendarCheck2 size={17} />
                    Due{' '}
                    <strong>
                      {formatDate(
                        selectedResponsibility.due_date
                      )}
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
                    <label htmlFor="step-title">
                      Step title
                    </label>
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
                      <span className="optional-label">
                        {' '}(optional)
                      </span>
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
                        disabled={
                          stepSaving || !stepTitle.trim()
                        }
                      >
                        {stepSaving
                          ? 'Saving...'
                          : 'Save step'}
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
                          step.is_complete
                            ? 'step-completed'
                            : ''
                        }`}
                        key={step.id}
                        disabled={
                          !canToggleSteps ||
                          savingStepId !== null
                        }
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

                        <span className="step-title">
                          {step.title}
                        </span>

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
                    <p>
                      Preparation steps will appear here.
                    </p>
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
                  <strong>
                    {responsibilities.length - completed}
                  </strong>
                </div>
              </div>

              <section className="responsibilities-section">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">
                      ONE STEP AT A TIME
                    </span>
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
                  <p>
                    Loading your family's responsibilities...
                  </p>
                ) : responsibilities.length === 0 ? (
                  <div className="empty-state">
                    <Footprints size={34} />
                    <h3>
                      Every journey starts with one step.
                    </h3>
                    <p>
                      Your family's responsibilities will
                      appear here.
                    </p>
                  </div>
                ) : (
                  <div style={{ marginTop: '36px' }}>
                    <ResponsibilitySection
                      title="This Week"
                      eyebrow="WHAT NEEDS ATTENTION"
                      items={grouped.thisWeek}
                      emptyMessage="Nothing due this week. You're all caught up!"
                      onOpen={openResponsibility}
                      disabled={detailLoading}
                    />

                    <ResponsibilitySection
                      title="Upcoming"
                      eyebrow="LOOKING AHEAD"
                      items={grouped.upcoming}
                      emptyMessage="No upcoming responsibilities yet."
                      onOpen={openResponsibility}
                      disabled={detailLoading}
                    />

                    <ResponsibilitySection
                      title="Completed"
                      eyebrow="STEPS WORTH CELEBRATING"
                      items={grouped.completed}
                      emptyMessage="Completed responsibilities will appear here."
                      onOpen={openResponsibility}
                      disabled={detailLoading}
                    />
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
            <label htmlFor="email">
              Email address
            </label>

            <div className="input-wrapper">
              <Mail size={19} />
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                required
              />
            </div>

            <label htmlFor="password">
              Password
            </label>

            <div className="input-wrapper">
              <LockKeyhole size={19} />

              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowPassword((current) => !current)
                }
                aria-label={
                  showPassword
                    ? 'Hide password'
                    : 'Show password'
                }
                aria-pressed={showPassword}
              >
                {showPassword ? (
                  <EyeOff size={19} />
                ) : (
                  <Eye size={19} />
                )}
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
              {loading
                ? 'Signing in...'
                : 'Sign in'}
              <ArrowRight size={18} />
            </button>
          </form>

          <p className="signup-note">
            New to Stepping Stones? Family registration
            is coming next.
          </p>
        </div>
      </section>
    </main>
  )
}

export default App
