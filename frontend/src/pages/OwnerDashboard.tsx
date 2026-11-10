
import { useEffect, useState } from 'react'
import api from '../services/api'
import { useNavigate } from 'react-router-dom'

interface OwnerStats {
  buses: number
  routes: number
  trips: number
}

function OwnerDashboard() {
  const [stats, setStats] = useState<OwnerStats>({
    buses: 0,
    routes: 0,
    trips: 0,
  })

  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        setError('')

        const [busResponse, routeResponse, tripResponse] =
          await Promise.all([
            api.get('/bus/my'),
            api.get('/routes/my'),
            api.get('/trips/my'),
          ])

        setStats({
          buses: busResponse.data.length,
          routes: routeResponse.data.length,
          trips: tripResponse.data.length,
        })
      } catch (err) {
        console.error('Dashboard error:', err)
        setError('Unable to load dashboard data.')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const statCards = [
    { title: 'Total Buses', value: stats.buses },
    { title: 'Total Routes', value: stats.routes },
    { title: 'Total Trips', value: stats.trips },
  ]

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl">

        <div className="rounded-3xl bg-gradient-to-r from-blue-700 to-indigo-600 p-8 text-white shadow-lg">
          <p className="text-sm text-blue-100">
            B-Ticket Management
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Owner Dashboard
          </h1>

          <p className="mt-2 text-blue-100">
            Manage your buses, routes and daily operations.
          </p>
        </div>

        {error && (
          <p className="mt-5 text-red-600">{error}</p>
        )}

        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {statCards.map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <p className="text-sm text-slate-500">
                {card.title}
              </p>

              <p className="mt-2 text-3xl font-bold text-blue-600">
                {loading ? '...' : card.value}
              </p>
            </div>
          ))}
        </div>

        
<div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
  {/* Bus Management */}
  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <h2 className="text-lg font-bold text-slate-900">
      Bus Management
    </h2>
    <p className="mt-2 text-sm text-slate-500">
      Add, update and manage your buses.
    </p>

    <div className="mt-5 flex flex-wrap gap-3">
      <button
        onClick={() => navigate('/owner/buses')}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
      >
        Manage Buses
      </button>

      <button
        onClick={() => navigate('/owner/buses?action=add')}
        className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50"
      >
        + Add Bus
      </button>
    </div>
  </div>

  {/* Route Management */}
  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <h2 className="text-lg font-bold text-slate-900">
      Route Management
    </h2>
    <p className="mt-2 text-sm text-slate-500">
      Create and manage your bus routes.
    </p>
   <button
  onClick={() => navigate('/owner/routes')}
  className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
>
  Manage Routes
</button>
  </div>

  {/* Trip Management */}
  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <h2 className="text-lg font-bold text-slate-900">
      Trip Management
    </h2>
    <p className="mt-2 text-sm text-slate-500">
      Schedule and manage daily trips.
    </p>
    <span className="mt-5 inline-block text-sm font-semibold text-blue-600">
      Coming next
    </span>
  </div>

  {/* Conductor Management */}
  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <h2 className="text-lg font-bold text-slate-900">
      Conductor Management
    </h2>
    <p className="mt-2 text-sm text-slate-500">
      Add and manage your conductors.
    </p>
    <span className="mt-5 inline-block text-sm font-semibold text-blue-600">
      Coming next
    </span>
  </div>

  {/* Revenue Reports */}
  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <h2 className="text-lg font-bold text-slate-900">
      Revenue Reports
    </h2>
    <p className="mt-2 text-sm text-slate-500">
      Track bookings and revenue.
    </p>
    <span className="mt-5 inline-block text-sm font-semibold text-blue-600">
      Coming next
    </span>
  </div>
</div>


      </div>
    </div>
  )
}

export default OwnerDashboard
