
import { useEffect, useState } from 'react'
import api from '../services/api'

import { useNavigate } from 'react-router-dom'

interface Stop {
  id: number
  name: string
  code: string
}

interface AvailableTrip {
  tripId: number
  departureTime: string
  bus: {
    id: number
    busNumber: string
    registrationNumber: string
  }
  route: {
    id: number
    name: string
    code: string
  }
  routeDirection: {
    id: number
    name: string
    code: string
  }
  fromStop: Stop
  toStop: Stop
  fare: number
}


interface PassengerTicket {
  id: number
  tripId: number
  fareAmount: number
  status: string
  qrToken: string | null
  usedAt: string | null
  trip: {
    id: number
    departureTime: string
    status: string
  } | null
  bus: {
    busNumber: string
    registrationNumber: string
  } | null
  route: {
    name: string
    code: string
  } | null
  fromStop: {
    id: number
    name: string
  } | null
  toStop: {
    id: number
    name: string
  } | null
  payment: {
    id: number
    amount: number
    status: string
  } | null
}

type TicketTab = 'CURRENT' | 'HISTORY'


function PassengerDashboard() {
  const [stops, setStops] = useState<Stop[]>([])
  const [fromStop, setFromStop] = useState('')
  const [toStop, setToStop] = useState('')
  const [journeyDate, setJourneyDate] = useState('')

  const navigate = useNavigate()

  const [loadingStops, setLoadingStops] = useState(true)
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)

  const [trips, setTrips] = useState<AvailableTrip[]>([])
  const [error, setError] = useState('')
  const [searchError, setSearchError] = useState('')

  const [selectedTrip, setSelectedTrip] = useState<AvailableTrip | null>(null)
const [booking, setBooking] = useState(false)
const [bookingError, setBookingError] = useState('')
const [bookingSuccess, setBookingSuccess] = useState('')


const [myTickets, setMyTickets] = useState<PassengerTicket[]>([])
const [loadingTickets, setLoadingTickets] = useState(true)
const [ticketError, setTicketError] = useState('')
const [ticketTab, setTicketTab] = useState<TicketTab>('CURRENT')


  useEffect(() => {
    const fetchStops = async () => {
      try {
        const response = await api.get<Stop[]>('/stops')
        setStops(response.data)
      } catch {
        setError('Unable to load stops. Please try again.')
      } finally {
        setLoadingStops(false)
      }
    }

    fetchStops()
  }, [])


  
useEffect(() => {
  const fetchMyTickets = async () => {
    try {
      const response = await api.get<PassengerTicket[]>('/tickets/my')
      setMyTickets(response.data)
    } catch (err: any) {
      setTicketError(
        err.response?.data?.message || 'Unable to load your tickets.'
      )
    } finally {
      setLoadingTickets(false)
    }
  }

  fetchMyTickets()
}, [])


  const handleSearch = async () => {
    if (!fromStop || !toStop || !journeyDate) {
      setSearchError('Please select all journey details.')
      return
    }

    if (fromStop === toStop) {
      setSearchError('Boarding and destination stops must be different.')
      return
    }

    setSearching(true)
    setSearched(false)
    setSearchError('')
    setTrips([])

    try {
      const response = await api.get<AvailableTrip[]>('/trips/available', {
        params: {
          fromStopId: Number(fromStop),
          toStopId: Number(toStop),
          date: journeyDate,
        },
      })

      setTrips(response.data)
      setSearched(true)
    } catch (err: any) {
      setSearchError(
        err.response?.data?.message ||
        'Unable to search buses. Please try again.'
      )
    } finally {
      setSearching(false)
    }
  }


  const handleBooking = async () => {
  if (!selectedTrip) return

  setBooking(true)
  setBookingError('')
  setBookingSuccess('')

  try {
    const response = await api.post('/tickets', {
      tripId: selectedTrip.tripId,
      fromStopId: selectedTrip.fromStop.id,
      toStopId: selectedTrip.toStop.id,
    })

   navigate(`/passenger/payment/${response.data.id}`)
  } catch (err: any) {
    setBookingError(
      err.response?.data?.message ||
      'Unable to book ticket. Please try again.'
    )
  } finally {
    setBooking(false)
  }
}

  const formatTime = (date: string) => {
    return new Intl.DateTimeFormat('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    }).format(new Date(date))
  }

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Kolkata',
    }).format(new Date(date))
  }

  
const now = Date.now()

const currentTickets = myTickets.filter((ticket) => {
  return (
    ticket.status === 'PENDING_PAYMENT' ||
    (
      ticket.status === 'ISSUED' &&
      ticket.payment?.status === 'SUCCESS' &&
      ticket.usedAt === null &&
      ticket.trip?.status === 'SCHEDULED' &&
      ticket.trip.departureTime &&
      new Date(ticket.trip.departureTime).getTime() > now
    )
  )
})

const historyTickets = myTickets.filter(
  (ticket) => !currentTickets.some((current) => current.id === ticket.id)
)

const displayedTickets =
  ticketTab === 'CURRENT' ? currentTickets : historyTickets


  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">

        {/* Hero Section */}
        <section className="relative mb-9 overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 px-6 py-10 text-white shadow-xl shadow-blue-900/10 sm:px-10 sm:py-12">
          <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border-[36px] border-white/10" />

          <div className="pointer-events-none absolute -bottom-36 right-36 h-64 w-64 rounded-full bg-cyan-300/10 blur-2xl" />

          <div className="relative max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-blue-50">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
              Your next journey starts here
            </span>

            <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
              Where do you want to go?
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100 sm:text-base">
              Find your route, choose a travel date, and get ready to go.
            </p>
          </div>
        </section>

        {/* Search Form */}
        <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-200/60 sm:p-8">

          <div className="mb-7 flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 17.5V6.8A2.8 2.8 0 0 1 6.8 4h10.4A2.8 2.8 0 0 1 20 6.8v10.7M4 14h16M7.5 18.5h.01M16.5 18.5h.01M7 8h10M7 11h10M7 20h10" />
              </svg>
            </div>

            <div>
              <h3 className="text-xl font-semibold tracking-tight text-slate-900">
                Search your bus
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Choose your stops and travel date
              </p>
            </div>
          </div>

          {error && (
            <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </p>
          )}

          {searchError && (
            <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {searchError}
            </p>
          )}

          <div className="grid gap-5 md:grid-cols-3">

            {/* From */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                From
              </label>

              <select
                value={fromStop}
                onChange={(e) => setFromStop(e.target.value)}
                disabled={loadingStops}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-100"
              >
                <option value="">
                  {loadingStops ? 'Loading stops...' : 'Select boarding stop'}
                </option>

                {stops.map((stop) => (
                  <option key={stop.id} value={stop.id}>
                    {stop.name}
                  </option>
                ))}
              </select>
            </div>

            {/* To */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                To
              </label>

              <select
                value={toStop}
                onChange={(e) => setToStop(e.target.value)}
                disabled={loadingStops}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-100"
              >
                <option value="">
                  {loadingStops ? 'Loading stops...' : 'Select destination'}
                </option>

                {stops.map((stop) => (
                  <option key={stop.id} value={stop.id}>
                    {stop.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Journey Date
              </label>

              <input
                type="date"
                value={journeyDate}
                min={new Date().toLocaleDateString('en-CA')}
                onChange={(e) => setJourneyDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
          </div>

          <button
            onClick={handleSearch}
            disabled={loadingStops || searching || stops.length === 0}
            className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 font-semibold text-white shadow-md shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none md:w-auto"
          >
            {searching ? 'Searching Buses...' : 'Search Buses'}

            {!searching && (
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6 6 6-6 6" />
              </svg>
            )}
          </button>
        </section>

        
{/* My Tickets Section */}
<section className="mb-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/40 sm:p-8">

  <div className="flex flex-wrap items-center justify-between gap-4">
    <div>
      <h2 className="text-2xl font-bold text-slate-900">
        My Tickets
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Manage your bookings and travel history.
      </p>
    </div>

    <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
      {myTickets.length} Total Tickets
    </span>
  </div>

  <div className="mt-6 flex gap-3">
    <button
      onClick={() => setTicketTab('CURRENT')}
      className={`rounded-xl px-5 py-3 text-sm font-semibold ${
        ticketTab === 'CURRENT'
          ? 'bg-blue-600 text-white'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      }`}
    >
      Current Tickets ({currentTickets.length})
    </button>

    <button
      onClick={() => setTicketTab('HISTORY')}
      className={`rounded-xl px-5 py-3 text-sm font-semibold ${
        ticketTab === 'HISTORY'
          ? 'bg-blue-600 text-white'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      }`}
    >
      Ticket History ({historyTickets.length})
    </button>
  </div>

  {loadingTickets && (
    <p className="py-10 text-center text-slate-500">
      Loading your tickets...
    </p>
  )}

  {ticketError && (
    <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-600">
      {ticketError}
    </p>
  )}

  {!loadingTickets && !ticketError && displayedTickets.length === 0 && (
    <div className="py-12 text-center">
      <h3 className="text-lg font-semibold text-slate-800">
        {ticketTab === 'CURRENT'
          ? 'No current tickets'
          : 'No ticket history'}
      </h3>
      <p className="mt-2 text-sm text-slate-500">
        {ticketTab === 'CURRENT'
          ? 'Your upcoming journeys will appear here.'
          : 'Your completed and cancelled bookings will appear here.'}
      </p>
    </div>
  )}

  <div className="mt-6 grid gap-4">
    {displayedTickets.map((ticket) => (
      <article
        key={ticket.id}
        className="rounded-2xl border border-slate-200 p-5 transition hover:shadow-md"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-sm text-slate-500">
              Ticket #{ticket.id}
            </span>
            <h3 className="mt-1 text-lg font-bold text-slate-900">
              {ticket.route?.name ?? 'Route unavailable'}
            </h3>
          </div>

          <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
            ticket.trip?.status === 'CANCELLED'
              ? 'bg-red-50 text-red-700'
              : ticket.usedAt
                ? 'bg-slate-100 text-slate-700'
                : ticket.status === 'PENDING_PAYMENT'
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-green-50 text-green-700'
          }`}>
            {ticket.trip?.status === 'CANCELLED'
              ? 'TRIP CANCELLED'
              : ticket.usedAt
                ? 'USED'
                : ticket.status}
          </span>
        </div>

        <div className="my-5 grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4">
          <div>
            <p className="text-xs text-slate-500">From</p>
            <p className="mt-1 font-semibold text-slate-800">
              {ticket.fromStop?.name ?? 'N/A'}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500">To</p>
            <p className="mt-1 font-semibold text-slate-800">
              {ticket.toStop?.name ?? 'N/A'}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500">Bus</p>
            <p className="mt-1 font-semibold text-slate-800">
              {ticket.bus?.busNumber ?? 'N/A'}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500">Departure</p>
            <p className="mt-1 font-semibold text-slate-800">
              {ticket.trip?.departureTime
                ? formatDate(ticket.trip.departureTime) + ' · ' +
                  formatTime(ticket.trip.departureTime)
                : 'N/A'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500">Ticket Fare</p>
            <p className="text-xl font-bold text-blue-700">
              ₹{ticket.fareAmount.toFixed(2)}
            </p>
          </div>

          {ticket.status === 'PENDING_PAYMENT' &&
            ticket.trip?.status === 'SCHEDULED' && (
              <button
                onClick={() => navigate(`/passenger/payment/${ticket.id}`)}
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Complete Payment
              </button>
            )}

          {ticket.status === 'ISSUED' && ticket.qrToken && (
            <button
              onClick={() =>
                navigate(`/passenger/ticket/${ticket.id}`)
              }
              className="rounded-xl border border-blue-600 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50"
            >
              View Ticket / QR
            </button>
          )}
        </div>
      </article>
    ))}
  </div>
</section>


        {/* Search Results */}
        <section className="mt-10">

          {bookingSuccess && (
  <div className="mb-5 rounded-xl bg-green-50 p-4 text-green-700">
    {bookingSuccess}
  </div>
)}

{bookingError && (
  <div className="mb-5 rounded-xl bg-red-50 p-4 text-red-700">
    {bookingError}
  </div>
)}

          {searching && (
            <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
              <p className="font-medium text-blue-600">
                Searching available buses...
              </p>
            </div>
          )}

          {searched && trips.length === 0 && (
            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <h3 className="text-xl font-semibold text-slate-800">
                No buses available
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                No matching buses found for your selected journey.
                Try another date or route.
              </p>
            </div>
          )}

          {searched && trips.length > 0 && (
            <>
              <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">
                    Available Buses
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {trips.length} bus{trips.length !== 1 ? 'es' : ''} found
                  </p>
                </div>

                <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
                  {formatDate(journeyDate)}
                </span>
              </div>

              <div className="grid gap-5">
                {trips.map((trip) => (
                  <article
                    key={trip.tripId}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">

                      <div>
                        <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700">
                          {trip.bus.busNumber}
                        </span>

                        <h4 className="mt-4 text-lg font-bold text-slate-900">
                          {trip.route.name}
                        </h4>

                        <p className="mt-1 text-sm text-slate-500">
                          {trip.routeDirection.name}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-slate-500">
                          Ticket fare
                        </p>

                        <p className="mt-1 text-3xl font-bold text-blue-700">
                          ₹{trip.fare.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="my-5 grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4">

                      <div>
                        <p className="text-xs font-medium uppercase text-slate-500">
                          Boarding
                        </p>

                        <p className="mt-1 font-semibold text-slate-800">
                          {trip.fromStop.name}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-medium uppercase text-slate-500">
                          Destination
                        </p>

                        <p className="mt-1 font-semibold text-slate-800">
                          {trip.toStop.name}
                        </p>
                      </div>

                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs text-slate-500">
                          Departure time (IST)
                        </p>

                        <p className="mt-1 text-lg font-bold text-slate-900">
                          {formatTime(trip.departureTime)}
                        </p>
                      </div>

                      <span className="rounded-full bg-green-50 px-4 py-2 text-sm font-medium text-green-700">
                        Scheduled
                      </span>
                      <button
  onClick={() => {
    setBookingError('')
    setBookingSuccess('')
    setSelectedTrip(trip)
  }}
  className="mt-5 w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
>
  Book Ticket
</button>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}

          {!searched && !searching && (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center sm:p-10">
              <h3 className="text-lg font-semibold text-slate-800">
                Available Buses
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Select your journey details and search for available buses.
              </p>
            </div>
          )}

          {selectedTrip && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
      <h3 className="text-xl font-bold text-slate-900">
        Confirm Your Booking
      </h3>

      <div className="mt-5 space-y-3 rounded-xl bg-slate-50 p-4">
        <p>
          <span className="text-slate-500">Bus: </span>
          <strong>{selectedTrip.bus.busNumber}</strong>
        </p>

        <p>
          <span className="text-slate-500">From: </span>
          <strong>{selectedTrip.fromStop.name}</strong>
        </p>

        <p>
          <span className="text-slate-500">To: </span>
          <strong>{selectedTrip.toStop.name}</strong>
        </p>

        <p>
          <span className="text-slate-500">Fare: </span>
          <strong className="text-blue-700">
            ₹{selectedTrip.fare.toFixed(2)}
          </strong>
        </p>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          disabled={booking}
          onClick={() => setSelectedTrip(null)}
          className="flex-1 rounded-lg border border-slate-300 px-4 py-3 font-medium text-slate-700"
        >
          Cancel
        </button>

        <button
          disabled={booking}
          onClick={handleBooking}
          className="flex-1 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white disabled:bg-slate-400"
        >
          {booking ? 'Booking...' : 'Confirm Booking'}
        </button>
      </div>
    </div>
  </div>
)}

        </section>
      </main>
    </div>
  )
}

export default PassengerDashboard
