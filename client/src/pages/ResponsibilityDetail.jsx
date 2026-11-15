import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck2,
  CalendarPlus2,
  CheckCircle2,
  Circle,
  Pencil,
  PencilLine,
  Plus,
  Repeat2,
  Trash2,
  UserRound,
} from 'lucide-react'
import StepList from '../components/StepList'

export default function ResponsibilityDetail({
  selectedResponsibility,
  closeDetail,
  isRecurring,
  canToggleSteps,
  canEditSteps,
  canManageResponsibility,
  showEditForm,
  openEditForm,
  editForm,
  editLoading,
  editSaving,
  editError,
  familyMembers,
  handleSaveEdit,
  updateEditForm,
  closeEditForm,
  completionSaving,
  completionConfirm,
  setCompletionConfirm,
  handleToggleCompletion,
  saveResponsibilityCompletion,
  unfinishedSteps,
  deleteConfirm,
  setDeleteConfirm,
  deleting,
  handleDeleteResponsibility,
  error,
  showStepForm,
  openStepForm,
  closeStepForm,
  stepTitle,
  setStepTitle,
  stepDueDate,
  setStepDueDate,
  stepSaving,
  stepError,
  handleAddStep,
  savingStepId,
  toggleStep,
  planningClass,
  planningLabels,
  formatDate,
  formatCreatedDate,
}) {
  return (
    <section className="detail-view">
      <button
        type="button"
        className="back-button"
        onClick={closeDetail}
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

        {isRecurring && (
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
            <strong>{selectedResponsibility.assignee_name}</strong>
          </span>

          <span>
            <PencilLine size={17} />
            Created by{' '}
            <strong>
              {selectedResponsibility.creator_name || 'a family member'}
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
              {formatDate(selectedResponsibility.due_date)}
            </strong>
          </span>
        </div>

        {!showEditForm && (
          <div
            style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              alignItems: 'center',
              marginTop: '26px',
              marginBottom: '26px',
            }}
          >
            {canToggleSteps && (
              <button
                type="button"
                className={
                  selectedResponsibility.is_complete
                    ? 'secondary-button'
                    : 'primary-button'
                }
                onClick={handleToggleCompletion}
                disabled={completionSaving}
              >
                {selectedResponsibility.is_complete ? (
                  <Circle size={18} />
                ) : (
                  <CheckCircle2 size={18} />
                )}
                {completionSaving
                  ? 'Saving...'
                  : selectedResponsibility.is_complete
                    ? 'Mark incomplete'
                    : 'Mark complete'}
              </button>
            )}

            {canManageResponsibility && (
              <button
                type="button"
                className="secondary-button"
                onClick={openEditForm}
              >
                <Pencil size={17} />
                Edit
              </button>
            )}

            {canManageResponsibility && !isRecurring && (
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setCompletionConfirm(false)
                  setDeleteConfirm(true)
                }}
                style={{ color: '#a34a45' }}
              >
                <Trash2 size={17} />
                Delete
              </button>
            )}
          </div>
        )}

        {isRecurring && canManageResponsibility && !showEditForm && (
          <p
            style={{
              color: '#62746a',
              fontSize: '13px',
              marginBottom: '20px',
            }}
          >
            You can edit this occurrence here. To pause, resume,
            or delete the full series, return to the dashboard
            and select Manage recurring series.
          </p>
        )}

        {showEditForm && (
          <form
            className="responsibility-form"
            onSubmit={handleSaveEdit}
            style={{
              borderTop: '1px solid #e3e9e1',
              paddingTop: '24px',
              marginBottom: '32px',
            }}
          >
            <span className="eyebrow">MAKE AN ADJUSTMENT</span>
            <h2 style={{ marginTop: '8px' }}>
              Edit responsibility
            </h2>

            {isRecurring && (
              <p
                style={{
                  color: '#62746a',
                  fontSize: '14px',
                  lineHeight: 1.6,
                }}
              >
                Changes here affect only this occurrence,
                not the rest of the recurring schedule.
              </p>
            )}

            {editLoading ? (
              <p>Loading family members...</p>
            ) : (
              <>
                <label htmlFor="edit-title">
                  Responsibility title
                </label>
                <input
                  id="edit-title"
                  type="text"
                  maxLength={160}
                  value={editForm.title}
                  onChange={(event) =>
                    updateEditForm('title', event.target.value)
                  }
                  required
                />

                <label htmlFor="edit-description">
                  Description
                  <span className="optional-label">
                    {' '}(optional)
                  </span>
                </label>
                <textarea
                  id="edit-description"
                  rows={4}
                  value={editForm.description}
                  onChange={(event) =>
                    updateEditForm(
                      'description',
                      event.target.value
                    )
                  }
                />

                <label htmlFor="edit-assignee">
                  Assign to
                </label>
                <select
                  id="edit-assignee"
                  value={editForm.assigned_to_id}
                  onChange={(event) =>
                    updateEditForm(
                      'assigned_to_id',
                      event.target.value
                    )
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

                <label htmlFor="edit-date">
                  Due date
                </label>
                <input
                  id="edit-date"
                  type="date"
                  value={editForm.due_date}
                  onChange={(event) =>
                    updateEditForm('due_date', event.target.value)
                  }
                  required
                />

                <label htmlFor="edit-level">
                  Planning level
                </label>
                <select
                  id="edit-level"
                  value={editForm.planning_level}
                  onChange={(event) =>
                    updateEditForm(
                      'planning_level',
                      event.target.value
                    )
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

                {editError && (
                  <p className="form-error" role="alert">
                    {editError}
                  </p>
                )}

                <div className="form-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={closeEditForm}
                    disabled={editSaving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="primary-button"
                    disabled={
                      editSaving ||
                      !editForm.title.trim() ||
                      !editForm.assigned_to_id
                    }
                  >
                    {editSaving ? 'Saving...' : 'Save changes'}
                    <ArrowRight size={18} />
                  </button>
                </div>
              </>
            )}

            {editLoading && editError && (
              <p className="form-error" role="alert">
                {editError}
              </p>
            )}
          </form>
        )}

        {completionConfirm &&
          !selectedResponsibility.is_complete && (
            <div
              role="group"
              aria-label="Confirm completion with unfinished steps"
              style={{
                border: '1px solid #d8e2d4',
                borderRadius: '16px',
                padding: '20px',
                background: '#f7faf5',
                marginBottom: '28px',
              }}
            >
              <h3 style={{ marginTop: 0 }}>
                You still have{' '}
                {unfinishedSteps.length === 1
                  ? 'a step'
                  : `${unfinishedSteps.length} steps`}{' '}
                to finish
              </h3>

              <p style={{ lineHeight: 1.6 }}>
                You've completed{' '}
                <strong>
                  {selectedResponsibility.completed_steps} of{' '}
                  {selectedResponsibility.total_steps}
                </strong>{' '}
                preparation steps. Would you like to mark
                the overall responsibility complete anyway?
              </p>

              <p
                style={{
                  color: '#62746a',
                  fontSize: '13px',
                  lineHeight: 1.6,
                }}
              >
                Any unfinished preparation steps will remain
                marked incomplete.
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
                  onClick={() => setCompletionConfirm(false)}
                  disabled={completionSaving}
                >
                  Keep working
                </button>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => saveResponsibilityCompletion(true)}
                  disabled={completionSaving}
                >
                  <CheckCircle2 size={17} />
                  {completionSaving
                    ? 'Saving...'
                    : 'Mark complete anyway'}
                </button>
              </div>
            </div>
          )}

        {deleteConfirm && !isRecurring && (
          <div
            role="group"
            aria-label="Confirm responsibility deletion"
            style={{
              border: '1px solid #e7c9c6',
              borderRadius: '16px',
              padding: '20px',
              background: '#fff9f7',
              marginBottom: '28px',
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              Delete this responsibility?
            </h3>
            <p style={{ lineHeight: 1.6 }}>
              This will permanently delete{' '}
              <strong>{selectedResponsibility.title}</strong>
              {' '}and its preparation steps. This cannot be undone.
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
                onClick={() => setDeleteConfirm(false)}
                disabled={deleting}
              >
                Keep responsibility
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={handleDeleteResponsibility}
                disabled={deleting}
                style={{ background: '#a34a45' }}
              >
                <Trash2 size={17} />
                {deleting ? 'Deleting...' : 'Yes, delete'}
              </button>
            </div>
          </div>
        )}

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

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

            {canEditSteps &&
              !showStepForm &&
              !showEditForm &&
              !deleteConfirm &&
              !completionConfirm && (
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
                disabled={stepSaving || !stepTitle.trim()}
              >
                {stepSaving ? 'Saving...' : 'Save step'}
                <ArrowRight size={18} />
              </button>
            </div>
          </form>
        )}

        <StepList
          selectedResponsibility={selectedResponsibility}
          canToggleSteps={canToggleSteps}
          savingStepId={savingStepId}
          showEditForm={showEditForm}
          deleteConfirm={deleteConfirm}
          completionConfirm={completionConfirm}
          toggleStep={toggleStep}
        />
      </div>
    </section>
  )
}
