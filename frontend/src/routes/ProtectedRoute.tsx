import { Navigate, Outlet } from 'react-router-dom'
import { useAppSelector } from '../app/hooks'
import type { UserRole } from '../features/auth/authSlice'

interface ProtectedRouteProps {
  allowedRoles: UserRole[]
}

function getDashboardPath(role: UserRole) {
  const dashboardPaths: Record<UserRole, string> = {
    PASSENGER: '/passenger/dashboard',
    OWNER: '/owner/dashboard',
    CONDUCTOR: '/conductor/dashboard',
    ADMIN: '/admin/dashboard',
  }

  return dashboardPaths[role]
}

function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth)

  // User is not logged in
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  // User does not have permission
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={getDashboardPath(user.role)} replace />
  }

  return <Outlet />
}

export default ProtectedRoute