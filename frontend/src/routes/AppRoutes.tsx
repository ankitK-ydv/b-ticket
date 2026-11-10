
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'

import Login from '../features/auth/Login'
import Register from '../features/auth/Register'

import ProtectedRoute from './ProtectedRoute'
import DashboardLayout from '../layouts/DashboardLayout'

import Dashboard from '../pages/Dashboard'
import PassengerDashboard from '../pages/PassengerDashboard'
import OwnerDashboard from '../pages/OwnerDashboard'
import ConductorDashboard from '../pages/ConductorDashboard'

import BusManagement from '../pages/BusManagement'
import RouteManagement from '../pages/RouteManagement'
import RouteDirectionsManagement from '../pages/RouteDirectionsManagement'
import StopManagement from '../pages/StopManagement'
import FareManagement from '../pages/FareManagement'

import PaymentPage from '../pages/PaymentPage'
import TicketDetailsPage from '../pages/TicketDetailsPage'

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Passenger Routes */}
        <Route element={<ProtectedRoute allowedRoles={['PASSENGER']} />}>
          <Route element={<DashboardLayout />}>
            <Route
              path="/passenger/dashboard"
              element={<PassengerDashboard />}
            />
          </Route>

          <Route
            path="/passenger/payment/:ticketId"
            element={<PaymentPage />}
          />

          <Route
            path="/passenger/ticket/:ticketId"
            element={<TicketDetailsPage />}
          />
        </Route>

        {/* Owner Routes */}
        <Route element={<ProtectedRoute allowedRoles={['OWNER']} />}>
          <Route element={<DashboardLayout />}>
            <Route
              path="/owner/dashboard"
              element={<OwnerDashboard />}
            />
          </Route>

          <Route
            path="/owner/routes"
            element={<RouteManagement />}
          />

          <Route
            path="/owner/routes/:routeId/directions"
            element={<RouteDirectionsManagement />}
          />

          <Route
            path="/owner/directions/:directionId/stops"
            element={<StopManagement />}
          />

          <Route
            path="/owner/directions/:directionId/fares"
            element={<FareManagement />}
          />

          <Route
            path="/owner/buses"
            element={<BusManagement />}
          />
        </Route>

        {/* Conductor Routes */}
        <Route element={<ProtectedRoute allowedRoles={['CONDUCTOR']} />}>
          <Route element={<DashboardLayout />}>
            <Route
              path="/conductor/dashboard"
              element={<ConductorDashboard />}
            />
          </Route>
        </Route>

        {/* Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route element={<DashboardLayout />}>
            <Route
              path="/admin/dashboard"
              element={
                <Dashboard
                  title="Admin Dashboard"
                  description="Manage the B-Ticket platform."
                />
              }
            />
          </Route>
        </Route>

        {/* Unknown Routes */}
        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />

      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes
