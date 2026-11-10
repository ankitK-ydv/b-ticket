import AppRoutes from './routes/AppRoutes'
import AuthInitializer from './features/auth/AuthInitializer'

function App() {
  return (
    <AuthInitializer>
      <AppRoutes />
    </AuthInitializer>
  )
}

export default App