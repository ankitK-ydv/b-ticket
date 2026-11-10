import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export type UserRole = 'PASSENGER' | 'CONDUCTOR' | 'OWNER' | 'ADMIN'

interface User {
  id: number
  name: string
  email: string
  role: UserRole
  phone?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('accessToken'),
  isAuthenticated: false,
  isLoading: true,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (
      state,
      action: PayloadAction<{ user: User; token: string }>,
    ) => {
      state.user = action.payload.user
      state.token = action.payload.token
      state.isAuthenticated = true
      state.isLoading = false
    },

    sessionRestored: (state, action: PayloadAction<User>) => {
      state.user = action.payload
      state.isAuthenticated = true
      state.isLoading = false
    },

    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      state.isLoading = false
    },
  },
})

export const { loginSuccess, sessionRestored, logout } = authSlice.actions

export default authSlice.reducer