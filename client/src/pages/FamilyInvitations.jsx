
import { useState } from 'react'
import {
  ArrowLeft,
  Check,
  Copy,
  MailPlus,
  Users,
} from 'lucide-react'

export default function FamilyInvitations({ onBack }) {
  const [role, setRole] = useState('child')
  const [invitation, setInvitation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  async function handleCreateInvitation(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setInvitation(null)
    setCopied(false)

    try {
      const response = await fetch('/api/auth/invitations', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error || 'Unable to create invitation.'
        )
      }

      setInvitation(data)
    } catch (err) {
      setError(err.message || 'Unable to create invitation.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    if (!invitation?.code) return

    try {
      await navigator.clipboard.writeText(invitation.code)
      setCopied(true)
      setError('')
    } catch {
      setError(
        'Unable to copy automatically. Select and copy the code instead.'
      )
    }
  }

  return (
    <section style={{ maxWidth: 680, margin: '0 auto' }}>
      <button
        type="button"
        className="secondary-button"
        onClick={onBack}
        style={{ marginBottom: 28 }}
      >
        <ArrowLeft size={18} />
        Back to dashboard
      </button>

      <div className="dashboard-intro">
        <span className="eyebrow">GROW TOGETHER</span>
        <h1>Invite family members.</h1>
        <p>
          Give your family a shared space to plan, track
          responsibilities, and celebrate progress.
        </p>
      </div>

      <div
        style={{
          background: '#fff',
          border: '1px solid #e4e7df',
          borderRadius: 18,
          padding: '30px',
          marginTop: 28,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 22,
            color: '#294f46',
          }}
        >
          <MailPlus size={25} />
          <h2 style={{ margin: 0, fontSize: 23 }}>
            Create an invitation
          </h2>
        </div>

        <p style={{ color: '#6d756f', lineHeight: 1.7 }}>
          Choose whether you're inviting a child or another
          parent. Each invitation is valid for one account
          and expires after seven days.
        </p>

        <form onSubmit={handleCreateInvitation}>
          <label
            htmlFor="invitation-role"
            style={{
              display: 'block',
              fontWeight: 700,
              marginBottom: 10,
              color: '#344940',
            }}
          >
            Family member's role
          </label>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              border: '1px solid #dedfd7',
              borderRadius: 12,
              padding: '12px 16px',
              marginBottom: 24,
            }}
          >
            <Users size={19} color="#83958a" />
            <select
              id="invitation-role"
              value={role}
              onChange={(event) => {
                setRole(event.target.value)
                setInvitation(null)
                setCopied(false)
              }}
              style={{
                flex: 1,
                minWidth: 0,
                border: 'none',
                background: 'transparent',
                color: '#294f46',
                fontSize: 15,
                padding: 5,
              }}
            >
              <option value="child">Child</option>
              <option value="parent">Parent</option>
            </select>
          </div>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="primary-button"
            disabled={loading}
          >
            <MailPlus size={18} />
            {loading
              ? 'Generating invitation...'
              : 'Generate invitation code'}
          </button>
        </form>

        {invitation && (
          <div
            style={{
              marginTop: 30,
              padding: 22,
              background: '#f3f7f1',
              border: '1px solid #d5e3d6',
              borderRadius: 12,
            }}
          >
            <h3
              style={{
                margin: '0 0 10px',
                color: '#294f46',
              }}
            >
              Invitation ready!
            </h3>

            <p style={{ color: '#53675a', lineHeight: 1.6 }}>
              Share this code privately with the{' '}
              {invitation.role === 'child' ? 'child' : 'parent'}
              {' '}you're inviting. They'll select
              <strong> Join a family </strong>
              on the registration screen and enter this code.
            </p>

            <div
              style={{
                background: '#fff',
                border: '1px solid #d5e3d6',
                borderRadius: 10,
                padding: 14,
                margin: '18px 0',
                overflowWrap: 'anywhere',
                fontFamily: 'monospace',
                fontSize: 14,
                color: '#294f46',
                userSelect: 'all',
              }}
            >
              {invitation.code}
            </div>

            <button
              type="button"
              className="secondary-button"
              onClick={handleCopy}
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
              {copied ? 'Copied!' : 'Copy invitation code'}
            </button>

            <p
              style={{
                fontSize: 13,
                color: '#6d756f',
                marginTop: 18,
              }}
            >
              Expires:{' '}
              {new Date(invitation.expires_at).toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
