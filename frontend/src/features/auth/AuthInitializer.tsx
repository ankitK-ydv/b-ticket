import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { logout, sessionRestored } from './authSlice'
import api from '../../services/api'

interface ProfileResponse {
  id: number
  name: string
  email: string
  phone: string
  role: 'PASSENGER' | 'CONDUCTOR' | 'OWNER' | 'ADMIN'
}

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch()
  const token = useAppSelector((state) => state.auth.token)
  const isLoading = useAppSelector((state) => state.auth.isLoading)

  useEffect(() => {
    const verifySession = async () => {
      if (!token) {
        dispatch(logout())
        return
      }

      try {
        const response = await api.get<ProfileResponse>('/auth/profile')

        dispatch(sessionRestored(response.data))
      } catch {
        localStorage.removeItem('accessToken')
        dispatch(logout())
      }
    }

    verifySession()
  }, [dispatch, token])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p className="text-lg text-blue-400">Verifying your session...</p>
      </div>
    )
  }

  return <>{children}</>
}

export default AuthInitializer