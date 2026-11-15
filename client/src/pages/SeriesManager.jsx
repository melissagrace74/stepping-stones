
import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  CalendarCheck2,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  Repeat2,
  Plus,
  Trash2,
  UserRound,
} from 'lucide-react'

const weekdays = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

function formatDate(value) {
  if (!value) return 'No end date'

  const [year, month, day] = value
    .slice(0, 10)
    .split('-')
    .map(Number)

  return new Date(year, month - 1, day).toLocaleDateString(
    'en-US',
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }
  )
}

function describeFrequency(schedule) {
  const interval = schedule.interval || 1
  const unit = schedule.frequency

  let description =
    interval === 1
      ? `Every ${unit === 'daily' ? 'day' : unit === 'weekly' ? 'week' : 'month'}`
      : `Every ${interval} ${
          unit === 'daily'
            ? 'days'
            : unit === 'weekly'
              ? 'weeks'
              : 'months'
        }`

  if (unit === 'weekly' && schedule.weekdays) {
    const days = schedule.weekdays
      .split(',')
      .map(Number)
      .filter((day) => day >= 0 && day <= 6)
      .map((day) => weekdays[day])

    if (days.length) {
      description += ` on ${days.join(', ')}`
    }
  }

  return description
}

async function readApi(response) {
  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      data.error ||
        'Something went wrong. Please try again.'
    )
  }

  return data
}

export default function SeriesManager({
  onBack,
  onChanged,
  onNewSeries,
  currentUserId,
}) {
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  useEffect(() => {
    let active = true

    async function loadSchedules() {
      try {
        const response = await fetch(
          '/api/responsibilities/schedules',
          { credentials: 'include' }
        )
        const data = await readApi(response)

        if (active) {
          setSchedules(data.recurrence_schedules || [])
        }
      } catch (err) {
        if (active) setError(err.message)
      } finally {
        if (active) setLoading(false)
      }
    }

    loadSchedules()

    return () => {
      active = false
    }
  }, [])

  async function manageSeries(schedule, action) {
    if (busyId !== null) return

    setBusyId(schedule.id)
    setError('')
    setNotice('')

    try {
      const response = await fetch(
        `/api/responsibilities/schedules/${schedule.id}/${action}`,
        {
          method: 'PATCH',
          credentials: 'include',
        }
      )

      const data = await readApi(response)

      setSchedules((current) =>
        current.map((item) =>
          item.id === schedule.id
            ? data.recurrence_schedule
            : item
        )
      )

      setNotice(
        action === 'pause'
          ? `"${schedule.title}" has been paused.`
          : `"${schedule.title}" has been resumed.`
      )

      if (onChanged) {
        try {
          await onChanged()
        } catch {
          setNotice(
            'The series was updated, but the dashboard could not refresh. Return to the dashboard to try again.'
          )
        }
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  async function deleteSeries(schedule) {
    if (busyId !== null) return

    setBusyId(schedule.id)
    setError('')
    setNotice('')

    try {
      const response = await fetch(
        `/api/responsibilities/schedules/${schedule.id}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      )

      const data = await readApi(response)

      setSchedules((current) =>
        current.filter((item) => item.id !== schedule.id)
      )

      setConfirmDeleteId(null)

      const preserved =
        data.preserved_completed_occurrences || 0

      setNotice(
        `"${schedule.title}" was deleted. ` +
          `${preserved} completed ${
            preserved === 1
              ? 'responsibility was'
              : 'responsibilities were'
          } preserved.`
      )

      if (onChanged) {
        try {
          await onChanged()
        } catch {
          setNotice(
            'The series was deleted, but the dashboard could not refresh. Return to the dashboard to try again.'
          )
        }
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const activeSchedules = schedules.filter(
    (schedule) => schedule.is_active
  )

  const pausedSchedules = schedules.filter(
    (schedule) => !schedule.is_active
  )

  function renderSchedule(schedule) {
    const canManage =
      Number(schedule.created_by_id) ===
      Number(currentUserId)

    const isBusy = busyId === schedule.id
    const confirming = confirmDeleteId === schedule.id

    return (
      <article
        key={schedule.id}
        className="detail-card"
        style={{
          marginBottom: '20px',
          padding: '28px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <span className="eyebrow">
              <Repeat2
                size={15}
                style={{
                  verticalAlign: 'middle',
                  marginRight: '7px',
                }}
              />
              RECURRING RESPONSIBILITY
            </span>

            <h2 style={{ margin: '12px 0' }}>
              {schedule.title}
            </h2>
          </div>

          <span
            style={{
              padding: '7px 12px',
              borderRadius: '999px',
              background: schedule.is_active
                ? '#e2eee4'
                : '#f1eee7',
              color: schedule.is_active
                ? '#426f51'
                : '#746b5d',
              fontSize: '13px',
              fontWeight: 700,
            }}
          >
            {schedule.is_active ? 'Active' : 'Paused'}
          </span>
        </div>

        {schedule.description && (
          <p className="detail-description">
            {schedule.description}
          </p>
        )}

        <div
          className="detail-meta"
          style={{ marginBottom: '22px' }}
        >
          <span>
            <UserRound size={17} />
            Assigned to{' '}
            <strong>{schedule.assignee_name}</strong>
          </span>

          <span>
            <Repeat2 size={17} />
            {describeFrequency(schedule)}
          </span>

          <span>
            <CalendarCheck2 size={17} />
            Starts {formatDate(schedule.start_date)}
          </span>

          {schedule.end_date && (
            <span>
              <CalendarCheck2 size={17} />
              Ends {formatDate(schedule.end_date)}
            </span>
          )}
        </div>

        {!schedule.is_active && (
          <p
            style={{
              color: '#62746a',
              fontSize: '14px',
              lineHeight: 1.6,
            }}
          >
            This routine is paused. Completed work is
            preserved, and new occurrences will not be
            created until the series resumes.
          </p>
        )}

        {canManage && !confirming && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              marginTop: '18px',
            }}
          >
            <button
              type="button"
              className="secondary-button"
              disabled={busyId !== null}
              onClick={() =>
                manageSeries(
                  schedule,
                  schedule.is_active ? 'pause' : 'resume'
                )
              }
            >
              {schedule.is_active ? (
                <PauseCircle size={18} />
              ) : (
                <PlayCircle size={18} />
              )}
              {isBusy
                ? 'Updating...'
                : schedule.is_active
                  ? 'Pause series'
                  : 'Resume series'}
            </button>

            <button
              type="button"
              className="secondary-button"
              style={{ color: '#a34a45' }}
              disabled={busyId !== null}
              onClick={() => {
                setError('')
                setNotice('')
                setConfirmDeleteId(schedule.id)
              }}
            >
              <Trash2 size={17} />
              Delete series
            </button>
          </div>
        )}

        {canManage && confirming && (
          <div
            role="group"
            aria-label="Confirm recurring series deletion"
            style={{
              marginTop: '20px',
              padding: '20px',
              border: '1px solid #e7c9c6',
              borderRadius: '16px',
              background: '#fff9f7',
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              Delete this entire series?
            </h3>

            <p style={{ lineHeight: 1.6 }}>
              This will permanently remove the recurring
              schedule and all unfinished occurrences of{' '}
              <strong>{schedule.title}</strong>.
            </p>

            <p style={{ lineHeight: 1.6 }}>
              Completed responsibilities and their preparation
              steps will remain in your family's history.
              This action cannot be undone.
            </p>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <button
                type="button"
                className="secondary-button"
                disabled={isBusy}
                onClick={() => setConfirmDeleteId(null)}
              >
                Keep series
              </button>

              <button
                type="button"
                className="primary-button"
                style={{ background: '#a34a45' }}
                disabled={isBusy}
                onClick={() => deleteSeries(schedule)}
              >
                <Trash2 size={17} />
                {isBusy ? 'Deleting...' : 'Yes, delete series'}
              </button>
            </div>
          </div>
        )}
      </article>
    )
  }

  return (
    <section className="detail-view">
      <button
        type="button"
        className="back-button"
        onClick={onBack}
        disabled={busyId !== null}
      >
        <ArrowLeft size={18} />
        Back to dashboard
      </button>

      <div style={{ marginBottom: '32px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px',
        }}>
          <div>
            <span className="eyebrow">
          BUILDING ROUTINES, ONE STEP AT A TIME
        </span>

        <h1>Manage recurring series</h1>

        <p className="detail-description">
          Keep your family's routines flexible. Pause a
          series when life gets busy, resume it when you're
          ready, or remove one you no longer need.
        </p>
          </div>
          <button
            type="button"
            className="primary-button"
            onClick={onNewSeries}
            disabled={busyId !== null}
          >
            <Plus size={18} />
            New recurring series
          </button>
        </div>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {notice && (
        <p
          role="status"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#426f51',
            background: '#f0f7ef',
            borderRadius: '12px',
            padding: '14px 18px',
            marginBottom: '24px',
          }}
        >
          <CheckCircle2 size={19} />
          {notice}
        </p>
      )}

      {loading ? (
        <p>Loading recurring series...</p>
      ) : schedules.length === 0 ? (
        <div className="empty-state">
          <Repeat2 size={32} />
          <h3>No recurring series yet</h3>
          <p>
            When you create a repeating responsibility,
            you can manage it here.
          </p>
        </div>
      ) : (
        <>
          <section style={{ marginBottom: '40px' }}>
            <div className="section-heading">
              <div>
                <span className="eyebrow">
                  KEEP THE MOMENTUM
                </span>
                <h2>
                  Active series ({activeSchedules.length})
                </h2>
              </div>
            </div>

            {activeSchedules.length ? (
              activeSchedules.map(renderSchedule)
            ) : (
              <div className="empty-state">
                <p>No active series right now.</p>
              </div>
            )}
          </section>

          <section>
            <div className="section-heading">
              <div>
                <span className="eyebrow">
                  READY WHEN YOU ARE
                </span>
                <h2>
                  Paused series ({pausedSchedules.length})
                </h2>
              </div>
            </div>

            {pausedSchedules.length ? (
              pausedSchedules.map(renderSchedule)
            ) : (
              <div className="empty-state">
                <p>No paused series.</p>
              </div>
            )}
          </section>
        </>
      )}
    </section>
  )
}
