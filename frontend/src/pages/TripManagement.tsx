
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

interface Bus {
  id: number
  busNumber: string
  registrationNumber: string
  capacity: number
}

interface Route {
  id: number
  name: string
  code: string
}

interface Direction {
  id: number
  name: string
  code: string
}

interface Conductor {
  id: number
  name: string
  email: string
  phone: string
  isActive: boolean
}

interface Trip {
  id: number
  busId: number
  routeDirectionId: number
  departureTime: string
  status: string
  conductorId: number | null

  bus: {
    id: number
    busNumber: string
    registrationNumber: string
  } | null

  route: {
    id: number
    name: string
    code: string
  } | null

  routeDirection: {
    id: number
    name: string
    code: string
  } | null

  conductor: {
    id: number
    name: string
    phone: string
  } | null
}

interface TripForm {
  busId: string
  routeId: string
  routeDirectionId: string
  departureTime: string
}

const initialForm: TripForm = {
  busId: '',
  routeId: '',
  routeDirectionId: '',
  departureTime: '',
}

function TripManagement() {
  const navigate = useNavigate()

  const [buses, setBuses] = useState<Bus[]>([])
  const [routes, setRoutes] = useState<Route[]>([])
  const [directions, setDirections] = useState<Direction[]>([])
  const [conductors, setConductors] = useState<Conductor[]>([])
  const [trips, setTrips] = useState<Trip[]>([])

  const [form, setForm] = useState<TripForm>(initialForm)
  const [selectedConductors, setSelectedConductors] =
    useState<Record<number, string>>({})

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const fetchTrips = async () => {
    const response = await api.get('/trips/my')
    setTrips(response.data)
  }

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      setError('')

      const [
        busResponse,
        routeResponse,
        conductorResponse,
        tripResponse,
      ] = await Promise.all([
        api.get('/bus/my'),
        api.get('/routes/my'),
        api.get('/auth/conductors'),
        api.get('/trips/my'),
      ])

      setBuses(busResponse.data)
      setRoutes(routeResponse.data)
      setConductors(conductorResponse.data)
      setTrips(tripResponse.data)

      const selections: Record<number, string> = {}

      tripResponse.data.forEach((trip: Trip) => {
        selections[trip.id] = trip.conductorId
          ? String(trip.conductorId)
          : ''
      })

      setSelectedConductors(selections)
    } catch (err) {
      console.error('Fetch trip data error:', err)
      setError('Unable to load trip management data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    const fetchDirections = async () => {
      if (!form.routeId) {
        setDirections([])
        return
      }

      try {
        const response = await api.get(
          `/route-directions/route/${form.routeId}`,
        )

        setDirections(response.data)
      } catch (err) {
        console.error('Fetch directions error:', err)
        setDirections([])
        setError('Unable to load route directions.')
      }
    }

    fetchDirections()
  }, [form.routeId])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
      ...(name === 'routeId' ? { routeDirectionId: '' } : {}),
    }))
  }

  const resetForm = () => {
    setForm(initialForm)
    setDirections([])
  }

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault()

    setError('')
    setMessage('')

    if (
      !form.busId ||
      !form.routeId ||
      !form.routeDirectionId ||
      !form.departureTime
    ) {
      setError('Please fill in all fields.')
      return
    }

    const departureDate = new Date(form.departureTime)

    if (Number.isNaN(departureDate.getTime())) {
      setError('Please enter a valid departure date and time.')
      return
    }

    if (departureDate.getTime() <= Date.now()) {
      setError('Departure time must be in the future.')
      return
    }

    const payload = {
      busId: Number(form.busId),
      routeDirectionId: Number(form.routeDirectionId),
      departureTime: departureDate.toISOString(),
    }

    try {
      setSaving(true)

      await api.post('/trips', payload)

      setMessage('Trip created successfully.')
      resetForm()
      await fetchTrips()
    } catch (err) {
      console.error('Create trip error:', err)
      setError('Unable to create trip. Please check the details.')
    } finally {
      setSaving(false)
    }
  }

  const handleAssignConductor = async (tripId: number) => {
    const conductorId = selectedConductors[tripId]

    if (!conductorId) {
      setError('Please select a conductor first.')
      return
    }

    try {
      setError('')
      setMessage('')

      await api.post(`/trips/${tripId}/assign-conductor`, {
        conductorId: Number(conductorId),
      })

      setMessage('Conductor assigned successfully.')
      await fetchTrips()
    } catch (err) {
      console.error('Assign conductor error:', err)
      setError('Unable to assign conductor to this trip.')
    }
  }

  const handleCancelTrip = async (tripId: number) => {
    const confirmed = window.confirm(
      'Are you sure you want to cancel this trip?',
    )

    if (!confirmed) return

    try {
      setError('')
      setMessage('')

      await api.post(`/trips/${tripId}/cancel`)

      setMessage('Trip cancelled successfully.')
      await fetchTrips()
    } catch (err) {
      console.error('Cancel trip error:', err)
      setError('Unable to cancel this trip.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <button
        type="button"
        onClick={() => navigate('/owner/dashboard')}
        className="mb-5 inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
      >
        ← Back to Dashboard
      </button>

      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Trip Management
          </h1>
          <p className="mt-2 text-slate-500">
            Create trips, assign conductors and manage schedules.
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
            Create New Trip
          </h2>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Select Bus
              </label>
              <select
                name="busId"
                value={form.busId}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="">Choose a bus</option>
                {buses.map((bus) => (
                  <option key={bus.id} value={bus.id}>
                    {bus.busNumber} - {bus.registrationNumber}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Select Route
              </label>
              <select
                name="routeId"
                value={form.routeId}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="">Choose a route</option>
                {routes.map((route) => (
                  <option key={route.id} value={route.id}>
                    {route.name} ({route.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Select Direction
              </label>
              <select
                name="routeDirectionId"
                value={form.routeDirectionId}
                onChange={handleChange}
                required
                disabled={!form.routeId || directions.length === 0}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 disabled:bg-slate-100"
              >
                <option value="">Choose a direction</option>
                {directions.map((direction) => (
                  <option key={direction.id} value={direction.id}>
                    {direction.name} ({direction.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Departure Date & Time
              </label>
              <input
                type="datetime-local"
                name="departureTime"
                value={form.departureTime}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || loading}
            className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? 'Creating Trip...' : 'Create Trip'}
          </button>
        </form>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">
              My Trips
            </h2>

            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
              {trips.length} Trips
            </span>
          </div>

          {loading ? (
            <p className="py-8 text-center text-slate-500">
              Loading trips...
            </p>
          ) : trips.length === 0 ? (
            <p className="py-8 text-center text-slate-500">
              No trips created yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
               <thead>
  <tr className="border-b text-sm text-slate-500">
    <th className="px-3 py-3">Trip ID</th>
    <th className="px-3 py-3">Bus</th>
    <th className="px-3 py-3">Route</th>
    <th className="px-3 py-3">Direction</th>
    <th className="px-3 py-3">Departure</th>
    <th className="px-3 py-3">Status</th>
    <th className="px-3 py-3">Conductor</th>
    <th className="px-3 py-3">Actions</th>
  </tr>
</thead>

                <tbody>
                  {trips.map((trip) => (
                    <tr key={trip.id} className="border-b last:border-0">
                      <td className="px-3 py-4 font-semibold text-slate-900">
                        #{trip.id}
                      </td>

                  <td className="px-3 py-4">
  <p className="font-semibold text-slate-900">
    {trip.bus?.busNumber ?? 'N/A'}
  </p>
  <p className="text-xs text-slate-500">
    {trip.bus?.registrationNumber ?? ''}
  </p>
</td>

<td className="px-3 py-4 text-slate-700">
  {trip.route?.name ?? 'N/A'}
</td>

<td className="px-3 py-4 text-slate-700">
  {trip.routeDirection?.name ?? 'N/A'}
</td>

                   <td className="whitespace-nowrap px-3 py-4 text-slate-600">
  {new Date(trip.departureTime).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })}
</td>

                      <td className="px-3 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            trip.status === 'SCHEDULED'
                              ? 'bg-blue-50 text-blue-700'
                              : trip.status === 'CANCELLED'
                                ? 'bg-red-50 text-red-700'
                                : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {trip.status}
                        </span>
                      </td>

                      <td className="px-3 py-4">
                        {trip.status === 'SCHEDULED' ? (
                          <div className="flex min-w-52 gap-2">
                            <select
                              value={selectedConductors[trip.id] ?? ''}
                              onChange={(e) =>
                                setSelectedConductors((previous) => ({
                                  ...previous,
                                  [trip.id]: e.target.value,
                                }))
                              }
                              className="min-w-0 flex-1 rounded-lg border border-slate-300 px-2 py-2 text-sm"
                            >
                              <option value="">Select conductor</option>
                              {conductors.map((conductor) => (
                                <option
                                  key={conductor.id}
                                  value={conductor.id}
                                >
                                  {conductor.name}
                                </option>
                              ))}
                            </select>

                            <button
                              type="button"
                              onClick={() =>
                                handleAssignConductor(trip.id)
                              }
                              className="text-sm font-semibold text-blue-600 hover:text-blue-800"
                            >
                              Assign
                            </button>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-500">
                            {trip.conductor?.name ?? 'Not assigned'}
                          </span>
                        )}
                      </td>

                      <td className="px-3 py-4">
                        {trip.status === 'SCHEDULED' && (
                          <button
                            type="button"
                            onClick={() => handleCancelTrip(trip.id)}
                            className="font-semibold text-red-600 hover:text-red-800"
                          >
                            Cancel
                          </button>
                        )}
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

export default TripManagement
