
import { Navigate, Route, Routes } from 'react-router-dom'

export default function AppRoutes({
  user,
  sessionLoading,
  loginPage,
  registerPage,
  dashboardPage,
  familyPage,
  seriesPage,
  newResponsibilityPage,
  responsibilityDetailPage,
}) {
  if (sessionLoading) {
    return (
      <main className="auth-layout">
        <div className="login-card" role="status">
          Loading Stepping Stones...
        </div>
      </main>
    )
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={loginPage} />
        <Route path="/register" element={registerPage} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/dashboard" element={dashboardPage} />
      <Route
        path="/family"
        element={
          user.role === 'parent'
            ? familyPage
            : <Navigate to="/dashboard" replace />
        }
      />
      <Route
        path="/series"
        element={
          user.role === 'parent'
            ? seriesPage
            : <Navigate to="/dashboard" replace />
        }
      />
      <Route
        path="/responsibilities/new"
        element={newResponsibilityPage}
      />
      <Route
        path="/responsibilities/:id"
        element={responsibilityDetailPage}
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
