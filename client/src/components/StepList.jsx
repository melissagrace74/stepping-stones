import { CheckCircle2, Circle, Footprints } from 'lucide-react'

function formatDate(value) {
  if (!value) return 'No due date'
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function StepList({
  selectedResponsibility,
  canToggleSteps,
  savingStepId,
  showEditForm,
  deleteConfirm,
  completionConfirm,
  toggleStep,
}) {
  return (
    selectedResponsibility.steps?.length ? (
      <div className="steps-list">
        {selectedResponsibility.steps.map((step) => (
          <button
            type="button"
            className={`step-item ${
              step.is_complete ? 'step-completed' : ''
            }`}
            key={step.id}
            disabled={
              !canToggleSteps ||
              savingStepId !== null ||
              showEditForm ||
              deleteConfirm ||
              completionConfirm
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
        <p>Preparation steps will appear here.</p>
      </div>
    )
  )
}
