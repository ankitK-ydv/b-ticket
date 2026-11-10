
import { useCallback, useEffect, useState } from 'react'
import api from '../services/api'
import QRScanner from '../components/QRScanner'

interface AssignedTrip {
  id: number
  departureTime: string
  status: string
  conductorId: number

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
}


interface VerificationRecord {
  ticketId: number
  tripId: number
  fareAmount: number
  ticketStatus: string
  usedAt: string
  bus: {
    busNumber: string
    registrationNumber: string
  } | null
  route: {
    name: string
    code: string
  } | null
  fromStop: string | null
  toStop: string | null
}

interface VerificationHistory {
  totalVerifiedTickets: number
  history: VerificationRecord[]
}

interface VerificationResult {
  message: string
  ticketId: number
  tripId: number
  status: string
  usedAt: string
}

function ConductorDashboard() {
  const [trips, setTrips] = useState<AssignedTrip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedTrip, setSelectedTrip] = useState<number | null>(null)

  const [verifying, setVerifying] = useState(false)
  const [verification, setVerification] =
    useState<VerificationResult | null>(null)
  const [verificationError, setVerificationError] = useState('')


  const [history, setHistory] = useState<VerificationRecord[]>([])
const [totalVerified, setTotalVerified] = useState(0)
const [loadingHistory, setLoadingHistory] = useState(false)
const [historyError, setHistoryError] = useState('')

  const fetchTrips = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const response = await api.get('/trips/assigned')
      setTrips(response.data)
    } catch (err: any) {
      console.error('Assigned trips error:', err)
      setError(
        err.response?.data?.message || 'Unable to load assigned trips.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTrips()
  }, [fetchTrips])




  const fetchVerificationHistory = useCallback(async () => {
  try {
    setLoadingHistory(true)
    setHistoryError('')

    const response = await api.get<VerificationHistory>(
      '/tickets/conductor/history'
    )

    setHistory(response.data.history)
    setTotalVerified(response.data.totalVerifiedTickets)
  } catch (err: any) {
    console.error('Verification history error:', err)

    setHistoryError(
      err.response?.data?.message ||
      'Unable to load verification history.'
    )
  } finally {
    setLoadingHistory(false)
  }
}, [])

  useEffect(() => {
  fetchVerificationHistory()
}, [fetchVerificationHistory])

  const handleScanSuccess = async (qrToken: string) => {
    setVerifying(true)
    setVerification(null)
    setVerificationError('')

    try {
      const response = await api.post('/tickets/verify', {
        qrToken,
      })

      setVerification(response.data)
    } catch (err: any) {
      console.error('Ticket verification error:', err)

      const message = err.response?.data?.message

      setVerificationError(
        Array.isArray(message)
          ? message.join(', ')
          : message || 'Ticket verification failed.'
      )
    } finally {
      setVerifying(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">

        <div className="rounded-3xl bg-gradient-to-r from-blue-700 to-indigo-600 p-8 text-white shadow-lg">
          <p className="text-sm font-medium text-blue-100">
            B-Ticket Conductor Panel
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Conductor Dashboard
          </h1>

          <p className="mt-2 text-blue-100">
            Manage your assigned trips and verify passenger tickets.
          </p>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Assigned Trips</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {trips.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Selected Trip</p>
            <p className="mt-2 text-3xl font-bold text-blue-600">
              {selectedTrip ? `#${selectedTrip}` : 'None'}
            </p>
          </div>

<div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
  <p className="text-sm text-slate-500">
    Total Verified Tickets
  </p>

  <p className="mt-2 text-3xl font-bold text-green-600">
    {totalVerified}
  </p>
</div>


        </div>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-slate-900">
              My Assigned Trips
            </h2>

            <button
              onClick={fetchTrips}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Refresh Trips
            </button>
          </div>

          {loading && (
            <p className="mt-5 text-slate-500">Loading trips...</p>
          )}

          {error && (
            <p className="mt-5 text-red-600">{error}</p>
          )}

          {!loading && !error && trips.length === 0 && (
            <p className="mt-5 text-slate-500">
              No trips assigned to you yet.
            </p>
          )}

          {!loading && trips.length > 0 && (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {trips.map((trip) => (
                <div
                  key={trip.id}
                  className="rounded-xl border border-slate-200 p-5"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900">
                      Trip #{trip.id}
                    </h3>

                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                      {trip.status}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2">
  <p className="text-sm text-slate-600">
    <span className="font-semibold">Bus:</span>{' '}
    {trip.bus?.busNumber || 'Not available'}
  </p>

  <p className="text-sm text-slate-600">
    <span className="font-semibold">Registration:</span>{' '}
    {trip.bus?.registrationNumber || 'Not available'}
  </p>

  <p className="text-sm text-slate-600">
    <span className="font-semibold">Route:</span>{' '}
    {trip.route?.name || 'Not available'}
  </p>

  <p className="text-sm text-slate-600">
    <span className="font-semibold">Direction:</span>{' '}
    {trip.routeDirection?.name || 'Not available'}
  </p>
</div>

                  <p className="mt-1 text-sm text-slate-500">
                    Departure: {formatDate(trip.departureTime)}
                  </p>

                  <button
                    onClick={() => {
                      setSelectedTrip(trip.id)
                      setVerification(null)
                      setVerificationError('')
                    }}
                    className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
                  >
                    Select This Trip
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>



<section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
  <div className="flex flex-wrap items-center justify-between gap-3">
    <div>
      <h2 className="text-xl font-bold text-slate-900">
        Verification History
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        Recently verified passenger tickets
      </p>
    </div>

    <button
      onClick={fetchVerificationHistory}
      disabled={loadingHistory}
      className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
    >
      {loadingHistory ? 'Refreshing...' : 'Refresh History'}
    </button>
  </div>

  {historyError && (
    <p className="mt-5 text-sm text-red-600">
      {historyError}
    </p>
  )}

  {loadingHistory && (
    <p className="mt-5 text-slate-500">
      Loading verification history...
    </p>
  )}

  {!loadingHistory && !historyError && history.length === 0 && (
    <p className="mt-5 text-slate-500">
      No verified tickets yet.
    </p>
  )}

  {!loadingHistory && history.length > 0 && (
    <div className="mt-5 space-y-4">
      {history.map((item) => (
        <div
          key={item.ticketId}
          className="rounded-xl border border-slate-200 p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-bold text-slate-900">
              Ticket #{item.ticketId}
            </h3>

            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
              VERIFIED
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs text-slate-500">Journey</p>
              <p className="mt-1 font-medium text-slate-900">
                {item.fromStop || 'N/A'} → {item.toStop || 'N/A'}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Route</p>
              <p className="mt-1 font-medium text-slate-900">
                {item.route?.name || 'N/A'}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Bus</p>
              <p className="mt-1 font-medium text-slate-900">
                {item.bus?.busNumber || 'N/A'}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Trip ID</p>
              <p className="mt-1 font-medium text-slate-900">
                #{item.tripId}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Ticket Fare</p>
              <p className="mt-1 font-bold text-blue-600">
                ₹{Number(item.fareAmount).toFixed(2)}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Verified At</p>
              <p className="mt-1 font-medium text-slate-900">
                {new Date(item.usedAt).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )}
</section>



        {selectedTrip !== null && (
          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              Verify Passenger Ticket
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Selected Trip: #{selectedTrip}
            </p>

            <div className="mx-auto mt-6 max-w-md">
              <QRScanner onScanSuccess={handleScanSuccess} />
            </div>

            {verifying && (
              <p className="mt-5 text-center font-medium text-blue-600">
                Verifying ticket...
              </p>
            )}

            {verification && (
              <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-5">
                <h3 className="font-bold text-green-700">
                  Ticket Verified Successfully!
                </h3>

                <p className="mt-2 text-sm text-green-800">
                  Ticket ID: #{verification.ticketId}
                </p>

                <p className="text-sm text-green-800">
                  Trip ID: #{verification.tripId}
                </p>

                <p className="text-sm text-green-800">
                  Status: {verification.status}
                </p>

                <p className="text-sm text-green-800">
                  Verified At: {formatDate(verification.usedAt)}
                </p>
              </div>
            )}

            {verificationError && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5">
                <h3 className="font-bold text-red-700">
                  Verification Failed
                </h3>

                <p className="mt-2 text-sm text-red-700">
                  {verificationError}
                </p>
              </div>
            )}
          </section>
        )}

      </div>
    </div>
  )
}

export default ConductorDashboard
