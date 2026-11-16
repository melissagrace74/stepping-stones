
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Footprints,
  ArrowUpRight,
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
  showCreator = false,
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

          <span className="compact-task-title" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '3px' }}>
            <span>{item.title}</span>
            {showCreator && (
              <span style={{ fontSize: '12px', fontWeight: 400, color: '#62746a', lineHeight: 1.4 }}>
                Created by {item.creator_name || 'a family member'}
              </span>
            )}
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

  // Each responsibility contributes equally to overall progress.
  // Preparation steps show partial progress; a completed responsibility
  // counts as fully complete, even when some steps remain unfinished.
  const progressTotal = memberResponsibilities.reduce((sum, item) => {
    if (item.is_complete) return sum + 1

    const totalSteps = Number(item.total_steps) || 0
    const completedSteps = Number(item.completed_steps) || 0

    if (totalSteps === 0) return sum

    return sum + Math.min(1, Math.max(0, completedSteps / totalSteps))
  }, 0)

  const progress = total > 0
    ? Math.round((progressTotal / total) * 100)
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
        Overall progress · Includes preparation steps
      </p>

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
        showCreator
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
            showCreator
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
            showCreator
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
  const navigate = useNavigate()
  const [familyMembers, setFamilyMembers] = useState([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [membersError, setMembersError] = useState('')
  const [showAllChildActivity, setShowAllChildActivity] = useState(false)

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

  // Child-created responsibilities are visible to parents without approval.
  // Sort by ID so newly created records appear first without assuming a
  // particular timestamp format from the API.
  const childCreators = new Map(
    children.map((member) => [Number(member.id), member.name])
  )

  const recentChildActivity = responsibilities
    .filter((item) => childCreators.has(Number(item.created_by_id)))
    .sort((a, b) => Number(b.id) - Number(a.id))

  const visibleChildActivity = showAllChildActivity
    ? recentChildActivity
    : recentChildActivity.slice(0, 5)

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

  // Show onboarding only after the family-members request succeeds.
  // Existing families, children, and loading/error states keep their usual dashboard.
  if (isParent && !membersLoading && !membersError && children.length === 0) {
    return (
      <>
        <div className="dashboard-intro">
          <span className="eyebrow">{family?.name || 'YOUR FAMILY'}</span>
          <h1>Welcome to Stepping Stones!</h1>
          <p>Every little step counts. Let's get your family started!</p>
        </div>

        <section
          className="family-management-card"
          aria-labelledby="first-child-heading"
          style={{ maxWidth: '720px', margin: '0 auto', textAlign: 'center', padding: '48px 32px' }}
        >
          <Footprints size={42} aria-hidden="true" style={{ color: '#52765f', marginBottom: '16px' }} />
          <h2 id="first-child-heading" style={{ marginBottom: '14px' }}>
            Every journey starts with one step.
          </h2>
          <p style={{ color: '#62746a', maxWidth: '480px', margin: '0 auto 26px', lineHeight: 1.7 }}>
            Add your first child to begin creating responsibilities, building
            independence, and celebrating progress together.
          </p>
          <button
            type="button"
            className="primary-button"
            onClick={() => navigate('/family')}
          >
            <Plus size={18} aria-hidden="true" />
            Add Your First Child
          </button>
        </section>
      </>
    )
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

      {!isParent && (
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
      )}

      {isParent && !dashboardLoading && !membersLoading && !membersError && (
        <section className="responsibilities-section" aria-labelledby="family-activity-heading" style={{ marginBottom: '40px' }}>
          <div className="section-heading">
            <div>
              <span className="eyebrow">INDEPENDENCE IN ACTION</span>
              <h2 id="family-activity-heading">Recently added by children <span style={{ fontSize: '15px', fontWeight: 600, color: '#789781', letterSpacing: 0 }}>({recentChildActivity.length})</span></h2>
              <p style={{ marginTop: '8px', color: '#62746a' }}>
                See what your children are planning and offer support as they take the lead.
              </p>
            </div>
          </div>

          {recentChildActivity.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px' }}>
              <p style={{ margin: 0 }}>
                When a child creates a responsibility, it will appear here for you to review.
              </p>
            </div>
          ) : (
            <div className="compact-task-list" id="child-activity-list">
              {visibleChildActivity.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="compact-task"
                  onClick={() => openResponsibility(item.id)}
                  disabled={detailLoading}
                  style={{ textAlign: 'left', gap: '12px' }}
                >
                  <UserRound size={19} aria-hidden="true" />
                  <span className="compact-task-title" style={{ flex: 1 }}>
                    <strong>{childCreators.get(Number(item.created_by_id))}</strong>
                    {' added: '}{item.title}
                  </span>
                  {item.due_date && (
                    <span className="compact-task-date">
                      Due {new Date(`${item.due_date.slice(0, 10)}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                  <ArrowUpRight size={18} aria-hidden="true" />
                </button>
              ))}
              {recentChildActivity.length > 5 && (
                <button
                  type="button"
                  className="member-expand-button"
                  onClick={() => setShowAllChildActivity((current) => !current)}
                  aria-expanded={showAllChildActivity}
                  aria-controls="child-activity-list"
                  style={{
                    marginTop: '12px',
                    backgroundColor: '#E5EEE5',
                    border: '1px solid #B7CCB9',
                    color: '#294F46',
                    fontWeight: 600,
                  }}
                >
                  {showAllChildActivity ? 'Show less' : `View all activity (${recentChildActivity.length})`}
                  {showAllChildActivity ? (
                    <ChevronUp size={17} />
                  ) : (
                    <ChevronDown size={17} />
                  )}
                </button>
              )}
            </div>
          )}
        </section>
      )}

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

          <div className="dashboard-actions">
            {isParent && (
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
            )}

            <button
              type="button"
              className="primary-button"
              onClick={openNewForm}
            >
              <Plus size={18} />
              New responsibility
            </button>
          </div>
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
                    showCreator
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
