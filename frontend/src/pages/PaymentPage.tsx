
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import QRCode from 'qrcode'

interface Payment {
  id: number
  ticketId: number
  amount: number
  status: string
  provider: string
}

interface PaymentResponse {
  message?: string
  payment: Payment
  ticket: {
    id: number
    status: string
    qrToken: string | null
  }
}

function PaymentPage() {
  const { ticketId } = useParams()
  const navigate = useNavigate()
const [qrImage, setQrImage] = useState('')
  const [payment, setPayment] = useState<Payment | null>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<PaymentResponse | null>(null)

  useEffect(() => {
    const createPayment = async () => {
      try {
        const response = await api.post<Payment>('/payments', {
          ticketId: Number(ticketId),
        })

        setPayment(response.data)
      } catch (err: any) {
        setError(
          err.response?.data?.message ||
          'Unable to initialize payment.'
        )
      } finally {
        setLoading(false)
      }
    }

    if (!ticketId || !Number.isInteger(Number(ticketId)) || Number(ticketId) <= 0) {
      setError('Invalid ticket ID.')
      setLoading(false)
      return
    }

    createPayment()
  }, [ticketId])

  const handlePayment = async () => {
    if (!payment) return

    setPaying(true)
    setError('')

    try {
      const response = await api.post<PaymentResponse>(
        `/payments/${payment.id}/confirm-test`
      )

      setResult(response.data)
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        'Payment failed. Please try again.'
      )
    } finally {
      setPaying(false)
    }
  }

  useEffect(() => {
  const generateQR = async () => {
    if (!result?.ticket.qrToken) return

    try {
      const image = await QRCode.toDataURL(
        result.ticket.qrToken,
        {
          width: 240,
          margin: 2,
          errorCorrectionLevel: 'H',
        }
      )

      setQrImage(image)
    } catch {
      setError('Unable to generate QR code.')
    }
  }

  generateQR()
}, [result])

  if (loading) {
    return (
      <div className="p-10 text-center text-slate-600">
        Initializing payment...
      </div>
    )
  }

  

  if (result) {
    return (
      <div className="mx-auto max-w-xl p-6">
        <div className="rounded-3xl bg-white p-8 text-center shadow-lg">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-600">
            ✓
          </div>

          <h2 className="mt-5 text-2xl font-bold text-slate-900">
            Payment Successful!
          </h2>

          <p className="mt-2 text-slate-500">
            Your ticket has been issued successfully.
          </p>

          <div className="mt-6 rounded-xl bg-slate-50 p-4 text-left">
            <p className="text-sm text-slate-500">Ticket ID</p>
            <p className="font-bold text-slate-900">
              #{result.ticket.id}
            </p>

            <p className="mt-3 text-sm text-slate-500">Payment Amount</p>
            <p className="text-xl font-bold text-blue-700">
              ₹{result.payment.amount.toFixed(2)}
            </p>

            <p className="mt-3 text-sm text-slate-500">QR Token</p>
            <p className="break-all font-mono text-sm text-slate-800">
              {result.ticket.qrToken}
            </p>

            
          </div>

          {qrImage && (
  <div className="mt-5 flex flex-col items-center">
    <img
      src={qrImage}
      alt="Ticket QR Code"
      className="h-60 w-60 rounded-xl border border-slate-200 p-2"
    />

    <p className="mt-2 text-sm text-slate-500">
      Show this QR code to the conductor.
    </p>
  </div>
)}

<button
  onClick={() => {
    if (!qrImage || !result) return

    const link = document.createElement('a')
    link.href = qrImage
    link.download = `B-Ticket-${result.ticket.id}.png`
    link.click()
  }}
  className="mt-4 w-full rounded-xl border border-blue-600 px-5 py-3 font-semibold text-blue-700 hover:bg-blue-50"
>
  Download QR Ticket
</button>

          <button
            onClick={() => navigate('/passenger/dashboard')}
            className="mt-6 w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl p-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">
            Payment Details
          </h2>

          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
            TEST MODE
          </span>
        </div>

        {error && (
          <p className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </p>
        )}

        {payment && (
          <>
            <div className="mt-7 space-y-4 rounded-xl bg-slate-50 p-5">
              <div className="flex justify-between">
                <span className="text-slate-500">Ticket ID</span>
                <strong>#{payment.ticketId}</strong>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Payment ID</span>
                <strong>#{payment.id}</strong>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Provider</span>
                <strong>{payment.provider}</strong>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Status</span>
                <strong className="text-amber-600">
                  {payment.status}
                </strong>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total Amount</span>
                  <span className="text-3xl font-bold text-blue-700">
                    ₹{payment.amount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <p className="mt-5 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              This is a test payment. No real money will be deducted.
            </p>

            <button
              onClick={handlePayment}
              disabled={paying || payment.status !== 'PENDING'}
              className="mt-6 w-full rounded-xl bg-blue-600 px-5 py-3.5 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {paying ? 'Processing...' : `Pay ₹${payment.amount.toFixed(2)}`}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default PaymentPage
