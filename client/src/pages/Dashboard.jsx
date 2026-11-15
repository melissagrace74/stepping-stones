import { Footprints, Plus, Repeat2 } from 'lucide-react'
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
            <span className="eyebrow">
              ONE STEP AT A TIME
            </span>
            <h2>Family responsibilities</h2>
          </div>

          {user.role === 'parent' && (
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
          <p>Loading your family's responsibilities...</p>
        ) : responsibilities.length === 0 ? (
          <div className="empty-state">
            <Footprints size={34} />
            <h3>Every journey starts with one step.</h3>
            <p>
              Your family's responsibilities will appear here.
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
