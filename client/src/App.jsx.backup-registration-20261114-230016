
import { useEffect, useState } from 'react'
import {
  Footprints,
  LogOut,
} from 'lucide-react'
import ResponsibilityForm from './components/ResponsibilityForm'
import Login from './pages/Login'
import SeriesManager from './pages/SeriesManager'
import ResponsibilityDetail from './pages/ResponsibilityDetail'
import Dashboard from './pages/Dashboard'
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
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  const sunday = new Date(monday)
  sunday.setDate(sunday.getDate() + 6)
  return {
    start: localDateKey(monday),
    end: localDateKey(sunday),
  }
}

function groupResponsibilities(responsibilities) {
  const week = getWeekDates()
  const groups = { thisWeek: [], upcoming: [], completed: [] }

  const sorted = [...responsibilities].sort((a, b) => {
    const firstDate = a.due_date || '9999-12-31'
    const secondDate = b.due_date || '9999-12-31'
    return firstDate.localeCompare(secondDate) || a.id - b.id
  })

  const upcomingRecurringSchedules = new Set()

  sorted.forEach((item) => {
    if (item.is_complete) {
      groups.completed.push(item)
      return
    }

    if (!item.due_date || item.due_date <= week.end) {
      groups.thisWeek.push(item)
      return
    }

    if (!item.recurrence_schedule_id) {
      groups.upcoming.push(item)
      return
    }

    if (!upcomingRecurringSchedules.has(item.recurrence_schedule_id)) {
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
  const [showSeriesManager, setShowSeriesManager] = useState(false)
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

  const [showEditForm, setShowEditForm] = useState(false)
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    assigned_to_id: '',
    due_date: '',
    planning_level: 'plan_together',
  })
  const [editLoading, setEditLoading] = useState(false)
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [completionSaving, setCompletionSaving] = useState(false)
  const [completionConfirm, setCompletionConfirm] = useState(false)

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
      setShowSeriesManager(false)
      setFamilyMembers([])
      setForm({ ...emptyForm })
      setShowStepForm(false)
      setShowEditForm(false)
      setDeleteConfirm(false)
      setCompletionConfirm(false)
      setStepTitle('')
      setStepDueDate('')
      setEmail('')
      setPassword('')
      setShowPassword(false)
    } catch (err) {
      setError(err.message)
    }
  }

  function closeDetail() {
    setSelectedResponsibility(null)
    setShowStepForm(false)
    setShowEditForm(false)
    setDeleteConfirm(false)
    setCompletionConfirm(false)
    setStepError('')
    setEditError('')
    setError('')
  }

  async function openResponsibility(id) {
    setError('')
    setStepError('')
    setEditError('')
    setShowStepForm(false)
    setShowEditForm(false)
    setDeleteConfirm(false)
    setCompletionConfirm(false)
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

  function handleToggleCompletion() {
    if (!selectedResponsibility || completionSaving) return

    const steps = selectedResponsibility.steps || []
    const hasUnfinishedSteps = steps.some((step) => !step.is_complete)

    if (!selectedResponsibility.is_complete && hasUnfinishedSteps) {
      setCompletionConfirm(true)
      setDeleteConfirm(false)
      setError('')
      return
    }

    saveResponsibilityCompletion(!selectedResponsibility.is_complete)
  }

  async function saveResponsibilityCompletion(isComplete) {
    if (!selectedResponsibility || completionSaving) return
    setError('')
    setCompletionSaving(true)

    try {
      const response = await fetch(
        `/api/responsibilities/${selectedResponsibility.id}/completion`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ is_complete: isComplete }),
        }
      )
      await readApi(response)
      await refreshResponsibility(selectedResponsibility.id)
      setCompletionConfirm(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setCompletionSaving(false)
    }
  }

  async function openEditForm() {
    if (!selectedResponsibility) return

    setError('')
    setEditError('')
    setDeleteConfirm(false)
    setCompletionConfirm(false)
    setShowStepForm(false)
    setEditForm({
      title: selectedResponsibility.title || '',
      description: selectedResponsibility.description || '',
      assigned_to_id: String(selectedResponsibility.assigned_to_id),
      due_date: selectedResponsibility.due_date || '',
      planning_level: selectedResponsibility.planning_level,
    })
    setEditLoading(true)
    setShowEditForm(true)

    try {
      const response = await fetch('/api/auth/family-members', {
        credentials: 'include',
      })
      const data = await readApi(response)
      setFamilyMembers(data.members || [])
    } catch (err) {
      setEditError(err.message)
    } finally {
      setEditLoading(false)
    }
  }

  function updateEditForm(field, value) {
    setEditForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function closeEditForm() {
    if (editSaving) return
    setShowEditForm(false)
    setEditError('')
  }

  async function handleSaveEdit(event) {
    event.preventDefault()
    if (!selectedResponsibility || editSaving) return

    setEditError('')
    setEditSaving(true)

    try {
      const response = await fetch(
        `/api/responsibilities/${selectedResponsibility.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            title: editForm.title.trim(),
            description: editForm.description.trim(),
            assigned_to_id: Number(editForm.assigned_to_id),
            due_date: editForm.due_date,
            planning_level: editForm.planning_level,
          }),
        }
      )

      await readApi(response)
      await refreshResponsibility(selectedResponsibility.id)
      setShowEditForm(false)
    } catch (err) {
      setEditError(err.message)
    } finally {
      setEditSaving(false)
    }
  }

  async function handleDeleteResponsibility() {
    if (
      !selectedResponsibility ||
      selectedResponsibility.recurrence_schedule_id ||
      deleting
    ) {
      return
    }

    setError('')
    setDeleting(true)

    try {
      const response = await fetch(
        `/api/responsibilities/${selectedResponsibility.id}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      )

      await readApi(response)

      const deletedId = selectedResponsibility.id
      setResponsibilities((current) =>
        current.filter((item) => item.id !== deletedId)
      )
      closeDetail()
    } catch (err) {
      setError(err.message)
      setDeleteConfirm(false)
    } finally {
      setDeleting(false)
    }
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

    if (form.frequency === 'weekly' && form.weekdays.length === 0) {
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

    const canManageResponsibility = canEditSteps

    const isRecurring =
      selectedResponsibility?.recurrence_schedule_id != null

    const unfinishedSteps = selectedResponsibility?.steps?.filter(
      (step) => !step.is_complete
    ) || []

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
          {showSeriesManager ? (
            <SeriesManager
              currentUserId={user.id}
              onChanged={reloadResponsibilities}
              onBack={() => setShowSeriesManager(false)}
            />
          ) : showNewForm ? (
            <ResponsibilityForm
              form={form}
              familyMembers={familyMembers}
              formLoading={formLoading}
              formSaving={formSaving}
              formError={formError}
              closeNewForm={closeNewForm}
              handleCreateResponsibility={handleCreateResponsibility}
              updateForm={updateForm}
              updateFrequency={updateFrequency}
              toggleWeekday={toggleWeekday}
            />
          ) : selectedResponsibility ? (
            <ResponsibilityDetail
              selectedResponsibility={selectedResponsibility}
              closeDetail={closeDetail}
              isRecurring={isRecurring}
              canToggleSteps={canToggleSteps}
              canEditSteps={canEditSteps}
              canManageResponsibility={canManageResponsibility}
              showEditForm={showEditForm}
              openEditForm={openEditForm}
              editForm={editForm}
              editLoading={editLoading}
              editSaving={editSaving}
              editError={editError}
              familyMembers={familyMembers}
              handleSaveEdit={handleSaveEdit}
              updateEditForm={updateEditForm}
              closeEditForm={closeEditForm}
              completionSaving={completionSaving}
              completionConfirm={completionConfirm}
              setCompletionConfirm={setCompletionConfirm}
              handleToggleCompletion={handleToggleCompletion}
              saveResponsibilityCompletion={saveResponsibilityCompletion}
              unfinishedSteps={unfinishedSteps}
              deleteConfirm={deleteConfirm}
              setDeleteConfirm={setDeleteConfirm}
              deleting={deleting}
              handleDeleteResponsibility={handleDeleteResponsibility}
              error={error}
              showStepForm={showStepForm}
              openStepForm={openStepForm}
              closeStepForm={closeStepForm}
              stepTitle={stepTitle}
              setStepTitle={setStepTitle}
              stepDueDate={stepDueDate}
              setStepDueDate={setStepDueDate}
              stepSaving={stepSaving}
              stepError={stepError}
              handleAddStep={handleAddStep}
              savingStepId={savingStepId}
              toggleStep={toggleStep}
              planningClass={planningClass}
              planningLabels={planningLabels}
              formatDate={formatDate}
              formatCreatedDate={formatCreatedDate}
            />
          ) : (
            <Dashboard
              family={family}
              user={user}
              responsibilities={responsibilities}
              completed={completed}
              grouped={grouped}
              error={error}
              dashboardLoading={dashboardLoading}
              detailLoading={detailLoading}
              openResponsibility={openResponsibility}
              openNewForm={openNewForm}
              setError={setError}
              setShowSeriesManager={setShowSeriesManager}
            />
          )}
        </div>
      </main>
    )
  }

  return (
    <Login
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      showPassword={showPassword}
      setShowPassword={setShowPassword}
      loading={loading}
      error={error}
      onLogin={handleLogin}
    />
  )
}

export default App
