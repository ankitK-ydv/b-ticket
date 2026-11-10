
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import QRCode from 'qrcode'
import api from '../services/api'

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

  routeDirection: {
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

function TicketDetailsPage() {
  const { ticketId } = useParams()
  const navigate = useNavigate()

  const [ticket, setTicket] = useState<PassengerTicket | null>(null)
  const [qrImage, setQrImage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        setLoading(true)
        setError('')

        const response = await api.get('/tickets/my')

        const foundTicket = response.data.find(
          (item: PassengerTicket) => item.id === Number(ticketId)
        )

        if (!foundTicket) {
          setError('Ticket not found.')
          return
        }

        setTicket(foundTicket)

        if (foundTicket.qrToken) {
          const image = await QRCode.toDataURL(foundTicket.qrToken, {
            width: 260,
            margin: 2,
            errorCorrectionLevel: 'H',
          })

          setQrImage(image)
        }
      } catch (err) {
        console.error('Ticket fetch error:', err)
        setError('Unable to load ticket. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchTicket()
  }, [ticketId])

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }

  const downloadQR = () => {
    if (!qrImage || !ticket) return

    const link = document.createElement('a')
    link.href = qrImage
    link.download = `B-Ticket-${ticket.id}.png`
    link.click()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-600 font-medium">Loading your ticket...</p>
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
        <h2 className="text-xl font-bold text-slate-900">
          {error || 'Ticket not found'}
        </h2>

        <button
          onClick={() => navigate('/passenger/dashboard')}
          className="mt-5 rounded-xl bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700"
        >
          Back to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-3xl">

        <button
          onClick={() => navigate('/passenger/dashboard')}
          className="mb-6 text-blue-600 font-semibold hover:text-blue-800"
        >
          ← Back to Dashboard
        </button>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">

          <div className="bg-blue-600 px-6 py-7 text-white">
            <p className="text-sm text-blue-100">B-Ticket Digital Ticket</p>

            <h1 className="mt-1 text-2xl font-bold">
              Your Journey Ticket
            </h1>

            <p className="mt-2 text-blue-100">
              Ticket #{ticket.id}
            </p>
          </div>

          <div className="p-6 sm:p-8">

            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-slate-900">
                {ticket.route?.name || 'Bus Journey'}
              </h2>

              <span className="rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">
                {ticket.status}
              </span>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-5 rounded-2xl bg-slate-50 p-5 sm:grid-cols-2">

              <div>
                <p className="text-sm text-slate-500">From</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {ticket.fromStop?.name || 'N/A'}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">To</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {ticket.toStop?.name || 'N/A'}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Bus Number</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {ticket.bus?.busNumber || 'N/A'}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Registration Number</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {ticket.bus?.registrationNumber || 'N/A'}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Departure</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {ticket.trip?.departureTime
                    ? formatDate(ticket.trip.departureTime)
                    : 'N/A'}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Payment Status</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {ticket.payment?.status || 'N/A'}
                </p>
              </div>

            </div>

            <div className="mt-6 flex items-center justify-between border-t border-dashed border-slate-300 pt-6">
              <div>
                <p className="text-sm text-slate-500">Ticket Fare</p>
                <p className="mt-1 text-2xl font-bold text-blue-600">
                  ₹{Number(ticket.fareAmount).toFixed(2)}
                </p>
              </div>

              <p className="text-sm text-slate-500">
                {ticket.usedAt ? 'Ticket Used' : 'Digital Ticket'}
              </p>
            </div>

            <div className="mt-8 border-t border-slate-200 pt-8 text-center">

              <h3 className="text-lg font-bold text-slate-900">
                Your QR Code
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Show this QR code to the conductor for verification.
              </p>

              {qrImage ? (
                <img
                  src={qrImage}
                  alt="B-Ticket QR Code"
                  className="mx-auto mt-5 h-64 w-64 rounded-xl border border-slate-200 p-2"
                />
              ) : (
                <p className="mt-6 text-sm text-amber-600">
                  QR code is not available for this ticket.
                </p>
              )}

              {qrImage && (
                <button
                  onClick={downloadQR}
                  className="mt-5 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-md hover:bg-blue-700"
                >
                  Download QR Code
                </button>
              )}

            </div>

          </div>
        </div>

        <p className="mt-5 text-center text-sm text-slate-500">
          Keep your QR code ready when boarding the bus.
        </p>

      </div>
    </div>
  )
}

export default TicketDetailsPage
