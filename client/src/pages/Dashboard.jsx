
import { useEffect, useState } from 'react'
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Footprints,
  Plus,
  Repeat2,
  UserRound,
} from 'lucide-react'
import ResponsibilityCard from '../components/ResponsibilityCard'

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

function CompactTaskList({
  items,
  onOpen,
  disabled,
  emptyMessage,
}) {
  if (items.length === 0) {
    return (
      <p className="compact-task-empty">
        {emptyMessage}
      </p>
    )
  }

  return (
    <div className="compact-task-list">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className="compact-task"
          onClick={() => onOpen(item.id)}
          disabled={disabled}
        >
          {item.is_complete ? (
            <CheckCircle2
              size={19}
              className="compact-task-done"
            />
          ) : (
            <Circle size={19} />
          )}

          <span className="compact-task-title">
            {item.title}
          </span>

          {item.due_date && (
            <span className="compact-task-date">
              {new Date(
                `${item.due_date.slice(0, 10)}T12:00:00`
              ).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

function MemberPanel({
  member,
  responsibilities,
  grouped,
  openResponsibility,
  detailLoading,
  parentPanel = false,
}) {
  const [expanded, setExpanded] = useState(false)

  const memberResponsibilities = responsibilities.filter(
    (item) =>
      Number(item.assigned_to_id) === Number(member.id)
  )

  const memberIds = new Set(
    memberResponsibilities.map((item) => item.id)
  )

  const thisWeek = grouped.thisWeek.filter((item) =>
    memberIds.has(item.id)
  )

  const upcoming = grouped.upcoming.filter((item) =>
    memberIds.has(item.id)
  )

  const completedItems = grouped.completed.filter((item) =>
    memberIds.has(item.id)
  )

  const completedCount = memberResponsibilities.filter(
    (item) => item.is_complete
  ).length

  const total = memberResponsibilities.length

  const progress = total > 0
    ? Math.round((completedCount / total) * 100)
    : 0

  return (
    <section
      className={
        parentPanel
          ? 'member-panel parent-panel'
          : 'member-panel child-panel'
      }
    >
      <div className="member-panel-header">
        <div className="member-panel-identity">
          <span className="member-avatar">
            <UserRound size={20} />
          </span>

          <div>
            <span className="eyebrow">
              {parentPanel
                ? 'MY RESPONSIBILITIES'
                : 'FAMILY MEMBER'}
            </span>
            <h3>{member.name}</h3>
          </div>
        </div>

        <strong className="member-progress-percent">
          {progress}%
        </strong>
      </div>

      <div
        className="member-progress-track"
        role="progressbar"
        aria-label={`${member.name} completion progress`}
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="member-progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="member-progress-label">
        {completedCount} of {total} responsibilities completed
      </p>

      <div className="member-task-heading">
        <h4>This Week</h4>
        <span>{thisWeek.length}</span>
      </div>

      <CompactTaskList
        items={thisWeek}
        onOpen={openResponsibility}
        disabled={detailLoading}
        emptyMessage="Nothing needs attention this week."
      />

      {expanded && (
        <div className="member-expanded">
          <div className="member-task-heading">
            <h4>Upcoming</h4>
            <span>{upcoming.length}</span>
          </div>

          <CompactTaskList
            items={upcoming}
            onOpen={openResponsibility}
            disabled={detailLoading}
            emptyMessage="No upcoming responsibilities."
          />

          <div className="member-task-heading">
            <h4>Completed</h4>
            <span>{completedItems.length}</span>
          </div>

          <CompactTaskList
            items={completedItems}
            onOpen={openResponsibility}
            disabled={detailLoading}
            emptyMessage="No completed responsibilities yet."
          />
        </div>
      )}

      <button
        type="button"
        className="member-expand-button"
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
      >
        {expanded
          ? 'Show less'
          : 'View all responsibilities'}

        {expanded ? (
          <ChevronUp size={17} />
        ) : (
          <ChevronDown size={17} />
        )}
      </button>
    </section>
  )
}

export default function Dashboard({
  family,
  user,
  responsibilities,
  completed,
  grouped,
  error,
  dashboardLoading,
  detailLoading,
  openResponsibility,
  openNewForm,
  setError,
  setShowSeriesManager,
}) {
  const [familyMembers, setFamilyMembers] = useState([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [membersError, setMembersError] = useState('')

  const isParent = user.role === 'parent'

  useEffect(() => {
    if (!isParent) return

    let active = true

    async function loadFamilyMembers() {
      setMembersLoading(true)
      setMembersError('')

      try {
        const response = await fetch(
          '/api/auth/family-members',
          { credentials: 'include' }
        )

        if (!response.ok) {
          throw new Error('Unable to load family members.')
        }

        const data = await response.json()

        if (active) {
          setFamilyMembers(data.members || [])
        }
      } catch (err) {
        if (active) {
          setMembersError(err.message)
        }
      } finally {
        if (active) {
          setMembersLoading(false)
        }
      }
    }

    loadFamilyMembers()

    return () => {
      active = false
    }
  }, [isParent, user.id])

  const currentMember = familyMembers.find(
    (member) => Number(member.id) === Number(user.id)
  ) || {
    id: user.id,
    name: user.name,
    role: user.role,
  }

  const children = familyMembers.filter(
    (member) => member.role === 'child'
  )

  const otherAdults = familyMembers.filter(
    (member) =>
      member.role !== 'child' &&
      Number(member.id) !== Number(user.id)
  )

  const knownIds = new Set(
    familyMembers.map((member) => Number(member.id))
  )

  const unmatched = responsibilities.filter(
    (item) => !knownIds.has(Number(item.assigned_to_id))
  )

  const unmatchedIds = new Set(
    unmatched.map((item) => item.id)
  )

  const unmatchedGrouped = {
    thisWeek: grouped.thisWeek.filter((item) =>
      unmatchedIds.has(item.id)
    ),
    upcoming: grouped.upcoming.filter((item) =>
      unmatchedIds.has(item.id)
    ),
    completed: grouped.completed.filter((item) =>
      unmatchedIds.has(item.id)
    ),
  }

  return (
    <>
      <div className="dashboard-intro">
        <span className="eyebrow">
          {family?.name || 'YOUR FAMILY'}
        </span>

        <h1>
          Good to see you, {user.name.split(' ')[0]}!
        </h1>

        <p>
          {isParent
            ? "Here's how your family is progressing, one step at a time."
            : "Every little step counts. Here's what you're working toward."}
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

            <h2>
              {isParent
                ? 'Family responsibilities'
                : 'My responsibilities'}
            </h2>
          </div>

          {isParent && (
            <div className="dashboard-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setError('')
                  setShowSeriesManager(true)
                }}
              >
                <Repeat2 size={18} />
                Manage recurring series
              </button>

              <button
                type="button"
                className="primary-button"
                onClick={openNewForm}
              >
                <Plus size={18} />
                New responsibility
              </button>
            </div>
          )}
        </div>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        {dashboardLoading ? (
          <p>Loading responsibilities...</p>
        ) : isParent ? (
          membersLoading ? (
            <p>Loading family members...</p>
          ) : membersError ? (
            <>
              <p className="form-error" role="alert">
                {membersError}
              </p>

              <ResponsibilitySection
                title="All responsibilities"
                eyebrow="FAMILY OVERVIEW"
                items={responsibilities}
                emptyMessage="No responsibilities yet."
                onOpen={openResponsibility}
                disabled={detailLoading}
              />
            </>
          ) : (
            <div className="parent-dashboard-layout">
              <MemberPanel
                member={currentMember}
                responsibilities={responsibilities}
                grouped={grouped}
                openResponsibility={openResponsibility}
                detailLoading={detailLoading}
                parentPanel
              />

              {children.length > 0 && (
                <div className="children-section-heading">
                  <span className="eyebrow">
                    GROWING INDEPENDENCE
                  </span>
                  <h2>Children's responsibilities</h2>
                  <p>
                    Everyone has their own steps and progress.
                  </p>
                </div>
              )}

              <div className="children-dashboard-grid">
                {children.map((member) => (
                  <MemberPanel
                    key={member.id}
                    member={member}
                    responsibilities={responsibilities}
                    grouped={grouped}
                    openResponsibility={openResponsibility}
                    detailLoading={detailLoading}
                  />
                ))}
              </div>

              {otherAdults.length > 0 && (
                <>
                  <div className="children-section-heading">
                    <span className="eyebrow">
                      WORKING TOGETHER
                    </span>
                    <h2>Other adults</h2>
                  </div>

                  <div className="children-dashboard-grid">
                    {otherAdults.map((member) => (
                      <MemberPanel
                        key={member.id}
                        member={member}
                        responsibilities={responsibilities}
                        grouped={grouped}
                        openResponsibility={openResponsibility}
                        detailLoading={detailLoading}
                      />
                    ))}
                  </div>
                </>
              )}

              {unmatched.length > 0 && (
                <section className="member-panel">
                  <h3>Other responsibilities</h3>

                  <CompactTaskList
                    items={[
                      ...unmatchedGrouped.thisWeek,
                      ...unmatchedGrouped.upcoming,
                      ...unmatchedGrouped.completed,
                    ]}
                    onOpen={openResponsibility}
                    disabled={detailLoading}
                    emptyMessage="No other responsibilities."
                  />
                </section>
              )}
            </div>
          )
        ) : responsibilities.length === 0 ? (
          <div className="empty-state">
            <Footprints size={34} />
            <h3>Every journey starts with one step.</h3>
            <p>
              Your responsibilities will appear here.
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
  )
}
