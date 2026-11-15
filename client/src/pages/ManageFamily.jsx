
import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  MailPlus,
  Plus,
  ShieldCheck,
  UserRound,
  Users,
} from 'lucide-react'

const emptyChildForm = {
  name: '',
  username: '',
  password: '',
}

export default function ManageFamily({ family, user, onBack }) {
  const [members, setMembers] = useState([])
  const [membersLoading, setMembersLoading] = useState(true)
  const [membersError, setMembersError] = useState('')

  const [showChildForm, setShowChildForm] = useState(false)
  const [childForm, setChildForm] = useState(emptyChildForm)
  const [showPassword, setShowPassword] = useState(false)
  const [childSaving, setChildSaving] = useState(false)
  const [childError, setChildError] = useState('')
  const [childSuccess, setChildSuccess] = useState('')

  const [invitation, setInvitation] = useState(null)
  const [invitationLoading, setInvitationLoading] = useState(false)
  const [invitationError, setInvitationError] = useState('')
  const [copied, setCopied] = useState(false)

  async function loadMembers() {
    setMembersLoading(true)
    setMembersError('')

    try {
      const response = await fetch('/api/auth/family-members', {
        credentials: 'include',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error || 'Unable to load family members.'
        )
      }

      setMembers(data.members || [])
    } catch (err) {
      setMembersError(err.message)
    } finally {
      setMembersLoading(false)
    }
  }

  useEffect(() => {
    loadMembers()
  }, [])

  function updateChildForm(field, value) {
    setChildForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function closeChildForm() {
    if (childSaving) return

    setShowChildForm(false)
    setChildForm({ ...emptyChildForm })
    setChildError('')
    setShowPassword(false)
  }

  async function handleCreateChild(event) {
    event.preventDefault()

    if (childSaving) return

    setChildError('')
    setChildSuccess('')

    const name = childForm.name.trim()
    const username = childForm.username.trim().toLowerCase()
    const password = childForm.password

    if (!name) {
      setChildError("Enter your child's name.")
      return
    }

    if (name.length > 100) {
      setChildError('Name must be 100 characters or fewer.')
      return
    }

    if (
      username.length < 3 ||
      username.length > 50 ||
      !/^[a-z0-9._-]+$/.test(username)
    ) {
      setChildError(
        'Username must be 3–50 characters and may contain letters, numbers, dots, underscores, and hyphens.'
      )
      return
    }

    if (password.length < 8 || password.length > 128) {
      setChildError('Password must be 8–128 characters.')
      return
    }

    setChildSaving(true)

    try {
      const response = await fetch('/api/auth/children', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          username,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error || 'Unable to create child account.'
        )
      }

      setChildSuccess(
        `${name}'s account was created successfully. Their username is ${username}.`
      )

      setChildForm({ ...emptyChildForm })
      setShowChildForm(false)
      setShowPassword(false)

      await loadMembers()
    } catch (err) {
      setChildError(err.message)
    } finally {
      setChildSaving(false)
    }
  }

  async function handleInviteAdult() {
    if (invitationLoading) return

    setInvitationLoading(true)
    setInvitationError('')
    setInvitation(null)
    setCopied(false)

    try {
      const response = await fetch('/api/auth/invitations', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'parent',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error || 'Unable to create invitation.'
        )
      }

      setInvitation(data)
    } catch (err) {
      setInvitationError(err.message)
    } finally {
      setInvitationLoading(false)
    }
  }

  async function handleCopyInvitation() {
    if (!invitation?.code) return

    try {
      await navigator.clipboard.writeText(invitation.code)
      setCopied(true)
      setInvitationError('')
    } catch {
      setInvitationError(
        'Unable to copy automatically. Select and copy the code instead.'
      )
    }
  }

  const parents = members.filter(
    (member) => member.role === 'parent'
  )

  const children = members.filter(
    (member) => member.role === 'child'
  )

  return (
    <div className="manage-family-page">
      <button
        type="button"
        className="back-button"
        onClick={onBack}
      >
        <ArrowLeft size={18} />
        Back to dashboard
      </button>

      <div className="dashboard-intro">
        <span className="eyebrow">
          GROWING INDEPENDENCE, TOGETHER
        </span>

        <h1>Manage your family.</h1>

        <p>
          Bring everyone together, create accounts for your
          children, and invite another adult to help guide
          their progress.
        </p>
      </div>

      <div className="manage-family-content">
        <section className="family-management-card">
          <div className="family-management-heading">
            <div className="family-management-heading-icon">
              <Users size={23} />
            </div>

            <div>
              <span className="eyebrow">
                YOUR FAMILY SPACE
              </span>

              <h2>{family?.name || 'Your Family'}</h2>

              <p>
                {members.length} family{' '}
                {members.length === 1 ? 'member' : 'members'}
              </p>
            </div>
          </div>

          {membersError && (
            <p className="form-error" role="alert">
              {membersError}
            </p>
          )}

          {membersLoading ? (
            <p className="family-management-muted">
              Loading family members...
            </p>
          ) : (
            <>
              <div className="family-member-section">
                <div className="family-member-section-title">
                  <h3>Parents &amp; guardians</h3>
                  <span>{parents.length}</span>
                </div>

                <div className="family-member-list">
                  {parents.map((member) => (
                    <div
                      className="family-member-row"
                      key={member.id}
                    >
                      <span className="family-member-avatar">
                        <ShieldCheck size={20} />
                      </span>

                      <div className="family-member-details">
                        <strong>{member.name}</strong>
                        <span>
                          {Number(member.id) === Number(user.id)
                            ? 'You · Parent'
                            : 'Parent'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="family-member-section">
                <div className="family-member-section-title">
                  <h3>Children</h3>
                  <span>{children.length}</span>
                </div>

                {children.length > 0 ? (
                  <div className="family-member-list">
                    {children.map((member) => (
                      <div
                        className="family-member-row"
                        key={member.id}
                      >
                        <span className="family-member-avatar child">
                          <UserRound size={20} />
                        </span>

                        <div className="family-member-details">
                          <strong>{member.name}</strong>
                          <span>Child account</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="family-management-muted">
                    No child accounts yet.
                  </p>
                )}
              </div>
            </>
          )}
        </section>

        <section className="family-management-card">
          <div className="family-management-heading">
            <div className="family-management-heading-icon">
              <Plus size={23} />
            </div>

            <div>
              <span className="eyebrow">
                BUILD INDEPENDENCE
              </span>

              <h2>Add a child</h2>

              <p>
                Create a child account without requiring
                an email address.
              </p>
            </div>
          </div>

          {childSuccess && (
            <div
              className="family-success-message"
              role="status"
            >
              <CheckCircle2 size={20} />
              <span>{childSuccess}</span>
            </div>
          )}

          {!showChildForm ? (
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                setChildSuccess('')
                setChildError('')
                setShowChildForm(true)
              }}
            >
              <Plus size={18} />
              Create child account
            </button>
          ) : (
            <form
              className="family-child-form"
              onSubmit={handleCreateChild}
            >
              <label htmlFor="child-name">
                Child's name
              </label>

              <input
                id="child-name"
                type="text"
                value={childForm.name}
                onChange={(event) =>
                  updateChildForm('name', event.target.value)
                }
                placeholder="e.g., Jordan Morgan"
                maxLength={100}
                autoComplete="off"
                required
              />

              <label htmlFor="child-username">
                Username
              </label>

              <input
                id="child-username"
                type="text"
                value={childForm.username}
                onChange={(event) =>
                  updateChildForm('username', event.target.value)
                }
                placeholder="e.g., jordan.morgan"
                maxLength={50}
                autoComplete="off"
                required
              />

              <p className="family-field-help">
                3–50 characters. Letters, numbers, dots,
                underscores, and hyphens only.
              </p>

              <label htmlFor="child-password">
                Temporary password
              </label>

              <div className="family-password-field">
                <input
                  id="child-password"
                  type={showPassword ? 'text' : 'password'}
                  value={childForm.password}
                  onChange={(event) =>
                    updateChildForm(
                      'password',
                      event.target.value
                    )
                  }
                  placeholder="At least 8 characters"
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((current) => !current)
                  }
                  aria-label={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>

              <p className="family-field-help">
                Share the username and password privately
                with your child so they can log in.
              </p>

              {childError && (
                <p className="form-error" role="alert">
                  {childError}
                </p>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeChildForm}
                  disabled={childSaving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={childSaving}
                >
                  <Plus size={18} />
                  {childSaving
                    ? 'Creating account...'
                    : 'Create account'}
                </button>
              </div>
            </form>
          )}
        </section>

        <section className="family-management-card">
          <div className="family-management-heading">
            <div className="family-management-heading-icon">
              <MailPlus size={23} />
            </div>

            <div>
              <span className="eyebrow">
                GROW TOGETHER
              </span>

              <h2>Invite an adult</h2>

              <p>
                Invite another parent or guardian to join
                your family's shared space.
              </p>
            </div>
          </div>

          <p className="family-management-muted">
            Generate a private invitation code. The adult
            can select <strong>Join a family</strong> during
            registration and enter the code. Each code
            works once and expires after seven days.
          </p>

          {invitationError && (
            <p className="form-error" role="alert">
              {invitationError}
            </p>
          )}

          <button
            type="button"
            className="primary-button"
            onClick={handleInviteAdult}
            disabled={invitationLoading}
          >
            <MailPlus size={18} />
            {invitationLoading
              ? 'Generating invitation...'
              : 'Generate adult invitation'}
          </button>

          {invitation && (
            <div className="family-invitation-result">
              <div className="family-success-message">
                <CheckCircle2 size={20} />
                <span>Invitation ready!</span>
              </div>

              <p>
                Share this code privately with the adult
                you're inviting.
              </p>

              <div className="family-invitation-code">
                {invitation.code}
              </div>

              <button
                type="button"
                className="secondary-button"
                onClick={handleCopyInvitation}
              >
                {copied ? (
                  <Check size={18} />
                ) : (
                  <Copy size={18} />
                )}

                {copied
                  ? 'Copied!'
                  : 'Copy invitation code'}
              </button>

              <p className="family-field-help">
                Expires:{' '}
                {new Date(
                  invitation.expires_at
                ).toLocaleString()}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
