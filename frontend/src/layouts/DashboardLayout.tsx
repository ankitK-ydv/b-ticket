import { Outlet, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { logout } from '../features/auth/authSlice'

function DashboardLayout() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const user = useAppSelector((state) => state.auth.user)

const handleLogout = () => {
  localStorage.removeItem('accessToken')
  dispatch(logout())
  navigate('/login', { replace: true })
}

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-4">
        <h1 className="text-2xl font-bold text-blue-500">
          B-Ticket
        </h1>

        <div className="flex items-center gap-4">
          <div className="hidden text-right sm:block">
            <p className="font-medium text-white">
              {user?.name}
            </p>
            <p className="text-xs text-slate-400">
              {user?.role}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="p-6">
        <Outlet />
      </main>

    </div>
  )
}

export default DashboardLayout