
import {
  ArrowRight,
  Eye,
  EyeOff,
  Footprints,
  LockKeyhole,
  Mail,
} from 'lucide-react'

export default function Login({
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  loading,
  error,
  onLogin,
  onRegister,
}) {
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
          <span className="eyebrow">
            GROWING INDEPENDENCE, TOGETHER
          </span>

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
            <span>Plan together</span>
            <span>Share responsibility</span>
            <span>Own it</span>
          </div>
        </div>

        <div className="story-footer">
          A little progress makes a big difference.
        </div>
      </section>

      <section className="auth-form-section">
        <div className="login-card">
          <span className="eyebrow">WELCOME BACK</span>

          <h2>Good to see you again.</h2>

          <p className="form-intro">
            Sign in to see what your family is working toward.
          </p>

          <form onSubmit={onLogin}>
            <label htmlFor="email">Email address</label>

            <div className="input-wrapper">
              <Mail size={19} />

              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <label htmlFor="password">Password</label>

            <div className="input-wrapper">
              <LockKeyhole size={19} />

              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowPassword((current) => !current)
                }
                aria-label={
                  showPassword ? 'Hide password' : 'Show password'
                }
                aria-pressed={showPassword}
              >
                {showPassword ? (
                  <EyeOff size={19} />
                ) : (
                  <Eye size={19} />
                )}
              </button>
            </div>

            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}

            <button
              className="primary-button"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in'}
              <ArrowRight size={18} />
            </button>
          </form>

          <p className="signup-note">
            New to Stepping Stones?{' '}
            <button
              type="button"
              onClick={onRegister}
              style={{
                border: 'none',
                background: 'transparent',
                color: '#294f46',
                fontWeight: 700,
                textDecoration: 'underline',
                cursor: 'pointer',
                padding: 0,
                fontSize: 'inherit',
              }}
            >
              Create or join a family
            </button>
          </p>
        </div>
      </section>
    </main>
  )
}
