
import { ArrowLeft, ArrowRight, Repeat2 } from 'lucide-react'

const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function ResponsibilityForm({
  user,
  form,
  familyMembers,
  formLoading,
  formSaving,
  formError,
  closeNewForm,
  handleCreateResponsibility,
  updateForm,
  updateFrequency,
  toggleWeekday,
}) {
  const isChild = user?.role === 'child'

  return (
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
          {isChild
            ? 'Make a plan, set your deadline, and take the next step.'
            : 'Give your family a goal to work toward, together.'}
        </p>

        <p style={{ fontSize: '13px', color: '#62746a', marginBottom: '20px' }}>
          * Required fields
        </p>

        {formLoading && !isChild ? (
          <p>Loading family members...</p>
        ) : (
          <form
            className="responsibility-form"
            onSubmit={handleCreateResponsibility}
          >
            <label htmlFor="responsibility-title">
              Responsibility title *
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

            {isChild ? (
              <p className="detail-description">
                <strong>Assigned to:</strong> {user.name} (you)
              </p>
            ) : (
              <>
                <label htmlFor="responsibility-assignee">
                  Assign to *
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
              </>
            )}

            <label htmlFor="responsibility-date">
              {!isChild && form.frequency !== 'none'
                ? 'First due date *'
                : 'Due date *'}
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
              Planning level *
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

            {!isChild && (
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

                <select
                  id="responsibility-frequency"
                  aria-label="Repeat frequency"
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
                      Repeat every *
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
                          updateForm('interval', event.target.value)
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
                          Repeat on *
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
                      End date
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
                        updateForm('end_date', event.target.value)
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
                      Leave blank for an ongoing responsibility.
                      Stepping Stones creates upcoming
                      responsibilities as time moves forward.
                    </p>
                  </>
                )}
              </div>
            )}

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
                  formSaving ||
                  (!isChild && familyMembers.length === 0)
                }
              >
                {formSaving
                  ? 'Creating...'
                  : isChild || form.frequency === 'none'
                    ? 'Create responsibility'
                    : 'Create recurring responsibility'}
                <ArrowRight size={18} />
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}
