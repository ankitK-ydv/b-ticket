
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'

interface RouteDirection {
  id: number
  routeId: number
  name: string
  code: string
}

interface RouteData {
  id: number
  name: string
  code: string
}

function RouteDirectionsManagement() {
  const navigate = useNavigate()
  const { routeId } = useParams()

  const [route, setRoute] = useState<RouteData | null>(null)
  const [directions, setDirections] = useState<RouteDirection[]>([])
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const id = Number(routeId)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError('')

      const [routeResponse, directionResponse] = await Promise.all([
        api.get(`/routes/${id}`),
        api.get(`/route-directions/route/${id}`),
      ])

      setRoute(routeResponse.data)
      setDirections(directionResponse.data)
    } catch (err: any) {
      console.error('Fetch directions error:', err.response?.data || err)

      const serverMessage = err.response?.data?.message
      setError(
        Array.isArray(serverMessage)
          ? serverMessage.join(', ')
          : serverMessage || 'Unable to load route directions.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!Number.isInteger(id) || id <= 0) {
      setError('Invalid route ID.')
      setLoading(false)
      return
    }

    fetchData()
  }, [id])

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault()
    setError('')
    setMessage('')

    const directionName = name.trim()
    const directionCode = code.trim().toUpperCase()

    if (!directionName || !directionCode) {
      setError('Please fill in all fields.')
      return
    }

    try {
      setSaving(true)

      await api.post('/route-directions', {
        routeId: id,
        name: directionName,
        code: directionCode,
      })

      setName('')
      setCode('')
      setMessage('Direction created successfully.')

      await fetchData()
    } catch (err: any) {
      console.error('Create direction error:', err.response?.data || err)

      const serverMessage = err.response?.data?.message
      setError(
        Array.isArray(serverMessage)
          ? serverMessage.join(', ')
          : serverMessage || 'Unable to create direction.',
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
            onClick={() => navigate('/owner/routes')}
            className="mb-5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-100"
          >
            ← Back to Routes
          </button>

          <h1 className="text-3xl font-bold text-slate-900">
            Route Directions
          </h1>

          <p className="mt-2 text-slate-500">
            Create and manage travel directions for your route.
          </p>

          {route && (
            <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-sm text-blue-600">Selected Route</p>
              <h2 className="mt-1 text-lg font-bold text-slate-900">
                {route.name}
              </h2>
              <p className="text-sm text-slate-600">
                Route Code: {route.code} · ID: {route.id}
              </p>
            </div>
          )}
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
            Create New Direction
          </h2>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Direction Name
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
                Direction Code
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
            disabled={saving || loading || !route}
            className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? 'Creating...' : 'Create Direction'}
          </button>
        </form>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">
              Available Directions
            </h2>

            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
              {directions.length} Directions
            </span>
          </div>

          {loading ? (
            <p className="py-8 text-center text-slate-500">
              Loading directions...
            </p>
          ) : directions.length === 0 ? (
            <p className="py-8 text-center text-slate-500">
              No directions created for this route yet.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {directions.map((direction) => (
                <div
                  key={direction.id}
                  className="rounded-xl border border-slate-200 p-5"
                >
                  <p className="text-xs font-semibold uppercase text-slate-400">
                    Direction #{direction.id}
                  </p>

                  <h3 className="mt-2 text-lg font-bold text-slate-900">
                    {direction.name}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Code: {direction.code}
                  </p>

                  <button
                    type="button"
                  onClick={() =>
  navigate(
    `/owner/directions/${direction.id}/stops?routeId=${id}`,
  )
}
                    className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Manage Stops
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default RouteDirectionsManagement
