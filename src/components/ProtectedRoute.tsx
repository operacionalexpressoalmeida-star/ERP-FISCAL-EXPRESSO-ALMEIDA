import { Navigate, Outlet } from 'react-router-dom'
import { useErpStore, UserRole } from '@/stores/useErpStore'

interface ProtectedRouteProps {
  allowedRoles?: UserRole[]
  redirectPath?: string
  children?: React.ReactNode
}

export const ProtectedRoute = ({
  allowedRoles,
  redirectPath = '/login',
  children,
}: ProtectedRouteProps) => {
  const { isAuthenticated, userRole } = useErpStore()

  if (!isAuthenticated) {
    return <Navigate to={redirectPath} replace />
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // If user is authenticated but doesn't have the required role,
    // redirect to dashboard or show a forbidden page.
    // For now, redirect to dashboard which should handle role-based view.
    return <Navigate to="/" replace />
  }

  return children ? <>{children}</> : <Outlet />
}
