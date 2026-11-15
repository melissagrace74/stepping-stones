
import {
  ArrowRight,
  CalendarCheck2,
  CalendarPlus2,
  CheckCircle2,
  Repeat2,
  UserRound,
  PencilLine,
} from 'lucide-react'

const planningLabels = {
  plan_together: 'Plan Together',
  share_responsibility: 'Share Responsibility',
  own_it: 'Own It',
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

export default function ResponsibilityCard({ item, onOpen, disabled }) {
  return (
    <button
      type="button"
      className="responsibility-card responsibility-button"
      onClick={() => onOpen(item.id)}
      disabled={disabled}
    >
      <div className="card-top">
        <span
          className={`planning-badge ${planningClass(item.planning_level)}`}
        >
          {planningLabels[item.planning_level] || item.planning_level}
        </span>

        {item.is_complete && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#426f51',
              fontSize: '13px',
              fontWeight: 700,
            }}
          >
            <CheckCircle2 size={17} />
            Completed
          </span>
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

        <span>
          <PencilLine size={15} />
          Created by <strong>{item.creator_name || 'a family member'}</strong>
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
          {item.completed_steps || 0} of {item.total_steps || 0} steps complete
        </span>
        <span className="view-steps-label">
          View details <ArrowRight size={18} />
        </span>
      </div>
    </button>
  )
}
