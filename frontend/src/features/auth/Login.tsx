import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import api from '../../services/api'
import { useAppDispatch } from '../../app/hooks'
import { loginSuccess, type UserRole } from './authSlice'

interface LoginResponse {
  message: string
  accessToken: string
  user: {
    id: number
    name: string
    email: string
    phone: string
    role: UserRole
  }
}

function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()

  const [emailOrPhone, setEmailOrPhone] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState(
    (location.state as { message?: string } | null)?.message ?? '',
  )
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMessage('')

    try {
      setLoading(true)

      const response = await api.post<LoginResponse>('/auth/login', {
        emailOrPhone,
        password,
      })

      const { user, accessToken } = response.data

   localStorage.setItem('accessToken', accessToken)

dispatch(
  loginSuccess({
    user,
    token: accessToken,
  }),
)

      const dashboardPaths: Record<UserRole, string> = {
        PASSENGER: '/passenger/dashboard',
        OWNER: '/owner/dashboard',
        CONDUCTOR: '/conductor/dashboard',
        ADMIN: '/admin/dashboard',
      }

      navigate(dashboardPaths[user.role], { replace: true })
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const responseMessage = error.response?.data?.message

        setMessage(
          Array.isArray(responseMessage)
            ? responseMessage.join(', ')
            : responseMessage || 'Login failed. Check your credentials.',
        )
      } else {
        setMessage('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">

        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-blue-500">
            B-Ticket
          </h1>
          <p className="mt-2 text-slate-400">
            Your Journey, Your Ticket.
          </p>
        </div>

        <h2 className="text-2xl font-semibold text-white">
          Welcome Back!
        </h2>

        <p className="mb-6 mt-1 text-sm text-slate-400">
          Login to continue your journey.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Email or Phone Number
            </label>

            <input
              type="text"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              placeholder="Enter email or phone number"
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500"
            />
          </div>

          {message && (
            <p className="text-center text-sm text-red-400">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

        </form>

        <p className="mt-8 text-center text-sm text-slate-400">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="font-semibold text-blue-400 hover:text-blue-300"
          >
            Register
          </Link>
        </p>

      </div>
    </div>
  )
}

export default Login