
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

interface RouteData {
  id: number
  name: string
  code: string
  ownerId: number
}

function RouteManagement() {
  const navigate = useNavigate()

  const [routes, setRoutes] = useState<RouteData[]>([])
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const fetchRoutes = async () => {
    try {
      setLoading(true)
      const response = await api.get('/routes/my')
      setRoutes(response.data)
      setError('')
    } catch (err) {
      console.error('Fetch routes error:', err)
      setError('Unable to load routes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRoutes()
  }, [])

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault()
    setError('')
    setMessage('')

    const routeName = name.trim()
    const routeCode = code.trim().toUpperCase()

    if (!routeName || !routeCode) {
      setError('Please fill in all fields.')
      return
    }

    try {
      setSaving(true)

      await api.post('/routes', {
        name: routeName,
        code: routeCode,
      })

      setName('')
      setCode('')
      setMessage('Route created successfully.')

      await fetchRoutes()
    } catch (err: any) {
      console.error('Create route error:', err.response?.data || err)

      const serverMessage = err.response?.data?.message

      setError(
        Array.isArray(serverMessage)
          ? serverMessage.join(', ')
          : serverMessage || 'Unable to create route.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl">

        <div className="mb-8">
          <button
            type="button"
            onClick={() => navigate('/owner/dashboard')}
            className="mb-5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-100"
          >
            ← Back to Dashboard
          </button>

          <h1 className="text-3xl font-bold text-slate-900">
            Route Management
          </h1>

          <p className="mt-2 text-slate-500">
            Create and manage your bus routes.
          </p>
        </div>

        {error && (
          <p className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </p>
        )}

        {message && (
          <p className="mb-4 rounded-xl bg-green-50 p-4 text-sm text-green-700">
            {message}
          </p>
        )}

        <form
          onSubmit={handleSubmit}
          className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 className="mb-5 text-xl font-bold text-slate-900">
            Create New Route
          </h2>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Route Name
              </label>

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ludhiana to LPU"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Route Code
              </label>

              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. LDH-LPU"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 uppercase outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? 'Creating...' : 'Create Route'}
          </button>
        </form>

        {/* My Routes */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">
              My Routes
            </h2>

            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
              {routes.length} Routes
            </span>
          </div>

          {loading ? (
            <p className="py-8 text-center text-slate-500">
              Loading routes...
            </p>
          ) : routes.length === 0 ? (
            <p className="py-8 text-center text-slate-500">
              No routes created yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b text-sm text-slate-500">
                    <th className="px-3 py-3">Route Name</th>
                    <th className="px-3 py-3">Route Code</th>
                    <th className="px-3 py-3">Route ID</th>
                    <th className="px-3 py-3">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {routes.map((route) => (
                    <tr
                      key={route.id}
                      className="border-b last:border-0"
                    >
                      <td className="px-3 py-4 font-semibold text-slate-900">
                        {route.name}
                      </td>

                      <td className="px-3 py-4 text-slate-600">
                        {route.code}
                      </td>

                      <td className="px-3 py-4 text-slate-600">
                        #{route.id}
                      </td>

                      <td className="px-3 py-4">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/owner/routes/${route.id}/directions`,
                            )
                          }
                          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                          Manage Directions
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default RouteManagement
