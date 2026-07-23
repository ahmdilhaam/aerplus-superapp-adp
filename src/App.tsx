import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { AdminLayout } from './layouts/AdminLayout'
import { Users } from './pages/Users'
import { Visits } from './pages/Visits'
import { Outlets } from './pages/Outlets'
import { Areas } from './pages/Areas'
import { VisitChecklistQuestions } from './pages/VisitChecklistQuestions'
import { Settings } from './pages/Settings'
import { Login } from './pages/Login'
import { NotFound } from './pages/NotFound'
import { InsightRules } from './pages/InsightRules'
import { SyncRuns } from './pages/SyncRuns'
import { Reports } from './pages/Reports'
import { Audit } from './pages/Audit'
import { VisitSchedules } from './pages/VisitSchedules'
import { CompanySettings } from './pages/CompanySettings'
import { ProtectedRoute } from './components/ProtectedRoute'
import './App.css'

// Every role except HOFO. Used to gate pages that HOFO has no menu link for.
const NON_HOFO_ROLES = [
  'SUPER_ADMIN',
  'COMPANY_ADMIN',
  'OPERATION_MANAGER',
  'AREA_SUPERVISOR',
  'SUPERVISOR',
  'OUTLET_ADMIN',
  'STAFF',
] as const

// Root redirect: HOFO lands on /reports (their only menu), everyone else on /outlets.
function RootRedirect() {
  const { user } = useAuth()
  const role = user?.role || user?.companyRoles?.[0]
  const target = role === 'HOFO' ? '/reports' : '/outlets'
  return <Navigate to={target} replace />
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<RootRedirect />} />
          <Route
            path="/users"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN']}>
                <Users />
              </ProtectedRoute>
            }
          />
          <Route
            path="/visits"
            element={
              <ProtectedRoute allowedRoles={[...NON_HOFO_ROLES]}>
                <Visits />
              </ProtectedRoute>
            }
          />
          <Route
            path="/outlets"
            element={
              <ProtectedRoute allowedRoles={[...NON_HOFO_ROLES]}>
                <Outlets />
              </ProtectedRoute>
            }
          />
          <Route
            path="/areas"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN']}>
                <Areas />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checklist-questions"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN']}>
                <VisitChecklistQuestions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/insight-rules"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'OPERATION_MANAGER']}>
                <InsightRules />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sync-runs"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'OPERATION_MANAGER']}>
                <SyncRuns />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'OPERATION_MANAGER', 'HOFO']}>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/audit"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN']}>
                <Audit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/visit-schedule"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'HOFO']}>
                <VisitSchedules />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute allowedRoles={[...NON_HOFO_ROLES]}>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/company-settings"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN']}>
                <CompanySettings />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Catch All & Redirect */}
        <Route path="/notfound" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/notfound" replace />} />
      </Routes>
    </Router>
  )
}

export default App
