import { useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Footprints,
  UsersRound,
  Handshake,
  CheckCircle2,
  House,
  LockKeyhole,
  Mail,
  Ticket,
  UserRound,
} from 'lucide-react'
import FamilyPhotoRotation from '../components/FamilyPhotoRotation'

export default function Register({ onRegistered, onBack }) {
  const [mode, setMode] = useState('create')
  const [familyName, setFamilyName] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [invitationCode, setInvitationCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function changeMode(nextMode) {
    setMode(nextMode)
    setError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (password.length < 8 || password.length > 128) {
      setError('Password must be between 8 and 128 characters.')
      return
    }

    const isCreating = mode === 'create'
    const endpoint = isCreating
      ? '/api/auth/register-parent'
      : '/api/auth/register-invited'
    const payload = {
      name: name.trim(),
      email: email.trim(),
      password,
      ...(isCreating
        ? { family_name: familyName.trim() }
        : { invitation_code: invitationCode.trim() }),
    }

    setLoading(true)
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Unable to create account.')
      }
      onRegistered(data.user, data.family)
    } catch (err) {
      setError(err.message || 'Unable to create account.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-story">
        <div className="brand">
          <span className="brand-icon">
            <Footprints size={24} strokeWidth={2.2} />
          </span>
          <span>stepping stones</span>
        </div>

        <div className="story-content">
          <span className="eyebrow">GROWING INDEPENDENCE, TOGETHER</span>
          <h1>
            Small steps.
            <br />
            <em>Big confidence.</em>
          </h1>
          <p>
            A shared space for families to plan responsibilities,
            celebrate progress, and help kids grow into their
            independence — one step at a time.
          </p>
          <div className="story-tags">
            <span><UsersRound size={15} strokeWidth={1.8} aria-hidden="true" />Plan together</span>
            <span><Handshake size={15} strokeWidth={1.8} aria-hidden="true" />Share responsibility</span>
            <span><CheckCircle2 size={15} strokeWidth={1.8} aria-hidden="true" />Own it</span>
          </div>
        </div>

        <FamilyPhotoRotation />
      </section>

      <section className="auth-form-section">
        <div className="login-card">
          <button
            type="button"
            onClick={onBack}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              border: 'none',
              background: 'transparent',
              color: '#294f46',
              cursor: 'pointer',
              fontWeight: 700,
              padding: '0 0 26px',
            }}
          >
            <ArrowLeft size={17} />
            Back to sign in
          </button>

          <span className="eyebrow">
            {mode === 'create' ? 'START YOUR JOURNEY' : 'WELCOME TO THE FAMILY'}
          </span>
          <h2>{mode === 'create' ? 'Create your family.' : 'Join your family.'}</h2>
          <p className="form-intro">
            {mode === 'create'
              ? 'Set up a private space for your family to grow together.'
              : 'Use the invitation code shared by your family to get started.'}
          </p>

          <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
            {[
              ['create', 'Create a family'],
              ['join', 'Join a family'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => changeMode(value)}
                disabled={loading}
                aria-pressed={mode === value}
                style={{
                  flex: 1,
                  padding: '12px 8px',
                  borderRadius: 10,
                  border: '1px solid #dedfd7',
                  background: mode === value ? '#294f46' : '#fff',
                  color: mode === value ? '#fff' : '#294f46',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {mode === 'create' ? (
              <>
                <label htmlFor="register-family">Family name</label>
                <div className="input-wrapper">
                  <House size={19} />
                  <input
                    id="register-family"
                    type="text"
                    placeholder="The Morgan Family"
                    value={familyName}
                    onChange={(event) => setFamilyName(event.target.value)}
                    maxLength={120}
                    required
                  />
                </div>
              </>
            ) : (
              <>
                <label htmlFor="register-invitation">Invitation code</label>
                <div className="input-wrapper">
                  <Ticket size={19} />
                  <input
                    id="register-invitation"
                    type="text"
                    placeholder="Paste your invitation code"
                    value={invitationCode}
                    onChange={(event) => setInvitationCode(event.target.value)}
                    required
                  />
                </div>
              </>
            )}

            <label htmlFor="register-name">Your name</label>
            <div className="input-wrapper">
              <UserRound size={19} />
              <input
                id="register-name"
                type="text"
                placeholder="Your full name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={100}
                autoComplete="name"
                required
              />
            </div>

            <label htmlFor="register-email">Email address</label>
            <div className="input-wrapper">
              <Mail size={19} />
              <input
                id="register-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                maxLength={255}
                autoComplete="email"
                required
              />
            </div>

            <label htmlFor="register-password">Password</label>
            <div className="input-wrapper">
              <LockKeyhole size={19} />
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 8 characters"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>

            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="primary-button" type="submit" disabled={loading}>
              {loading
                ? 'Creating account...'
                : mode === 'create'
                  ? 'Create family account'
                  : 'Join family'}
              <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}
