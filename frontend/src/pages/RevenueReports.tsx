import { useEffect, useState } from 'react'
import api from '../services/api'
import { useNavigate } from 'react-router-dom'

interface RevenueSummary {
  totalRevenue: number
  totalTicketsSold: number
  verifiedTickets: number
  pendingTickets: number
}

interface BusRevenue {
  busId: number
  busNumber: string
  registrationNumber: string
  ticketsSold: number
  revenue: number
}

interface Transaction {
  ticketId: number
  tripId: number
  passengerName: string
  conductorName: string
  busNumber: string
  registrationNumber: string
  routeName: string
  fromStop: string
  toStop: string
  fareAmount: number
  ticketStatus: string
  paymentStatus: string
  verified: boolean
  usedAt: string | null
  createdAt: string
}

interface RevenueReportResponse {
  summary: RevenueSummary
  busBreakdown: BusRevenue[]
  transactions: Transaction[]
}

function RevenueReports() {
  const [report, setReport] = useState<RevenueReportResponse | null>(null)
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING'>('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const fetchRevenueReport = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await api.get('/tickets/owner/revenue')
      setReport(response.data)
    } catch (err: any) {
      console.error('Fetch revenue report error:', err)
      setError(
        err?.response?.data?.message ||
          'Unable to load revenue reports.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRevenueReport()
  }, [])

  const formatDate = (isoString: string | null) => {
    if (!isoString) return '—'
    try {
      return new Date(isoString).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    } catch {
      return isoString
    }
  }

  const filteredTransactions =
    report?.transactions.filter((tx) => {
      const isPaid =
        tx.ticketStatus === 'ISSUED' || tx.paymentStatus === 'SUCCESS'
      if (statusFilter === 'PAID') return isPaid
      if (statusFilter === 'PENDING') return !isPaid
      return true
    }) ?? []

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate('/owner/dashboard')}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
          >
            ← Back to Dashboard
          </button>

          <button
            type="button"
            onClick={fetchRevenueReport}
            disabled={loading}
            className="rounded-xl border border-blue-600 bg-white px-4 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh Report'}
          </button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Revenue Reports
          </h1>
          <p className="mt-2 text-slate-500">
            Track digital ticket sales, bus-wise collections, and boarding verification.
          </p>
        </div>

        {error && (
          <p className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </p>
        )}

        {/* Summary KPI Cards */}
        <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Total Revenue</p>
            <p className="mt-2 text-3xl font-bold text-green-600">
              {loading ? '...' : `₹${report?.summary.totalRevenue ?? 0}`}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Paid Tickets Sold</p>
            <p className="mt-2 text-3xl font-bold text-blue-600">
              {loading ? '...' : report?.summary.totalTicketsSold ?? 0}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Verified Boardings</p>
            <p className="mt-2 text-3xl font-bold text-indigo-600">
              {loading ? '...' : report?.summary.verifiedTickets ?? 0}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Pending Payment</p>
            <p className="mt-2 text-3xl font-bold text-amber-600">
              {loading ? '...' : report?.summary.pendingTickets ?? 0}
            </p>
          </div>
        </div>

        {/* Bus-wise Revenue Breakdown */}
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">
              Bus-Wise Revenue Breakdown
            </h2>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
              {report?.busBreakdown.length ?? 0} Buses
            </span>
          </div>

          {loading ? (
            <p className="py-6 text-center text-slate-500">
              Loading bus breakdown...
            </p>
          ) : !report || report.busBreakdown.length === 0 ? (
            <p className="py-6 text-center text-slate-500">
              No buses found for your account.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b text-sm text-slate-500">
                    <th className="px-3 py-3">Bus Number</th>
                    <th className="px-3 py-3">Registration</th>
                    <th className="px-3 py-3">Paid Tickets</th>
                    <th className="px-3 py-3">Total Collected</th>
                  </tr>
                </thead>
                <tbody>
                  {report.busBreakdown.map((bus) => (
                    <tr key={bus.busId} className="border-b last:border-0">
                      <td className="px-3 py-4 font-semibold text-slate-900">
                        {bus.busNumber}
                      </td>
                      <td className="px-3 py-4 text-slate-600">
                        {bus.registrationNumber}
                      </td>
                      <td className="px-3 py-4 text-slate-700">
                        {bus.ticketsSold}
                      </td>
                      <td className="px-3 py-4 font-bold text-green-600">
                        ₹{bus.revenue}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Passenger Transactions Table */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-slate-900">
              Ticket Transactions
            </h2>

            <div className="flex gap-2">
              {(['ALL', 'PAID', 'PENDING'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStatusFilter(tab)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    statusFilter === tab
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab === 'ALL'
                    ? 'All'
                    : tab === 'PAID'
                      ? 'Paid / Issued'
                      : 'Pending'}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <p className="py-8 text-center text-slate-500">
              Loading transactions...
            </p>
          ) : filteredTransactions.length === 0 ? (
            <p className="py-8 text-center text-slate-500">
              No ticket transactions found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-slate-500">
                    <th className="px-3 py-3">Ticket #</th>
                    <th className="px-3 py-3">Passenger</th>
                    <th className="px-3 py-3">Bus & Route</th>
                    <th className="px-3 py-3">Journey</th>
                    <th className="px-3 py-3">Conductor</th>
                    <th className="px-3 py-3">Fare</th>
                    <th className="px-3 py-3">Payment</th>
                    <th className="px-3 py-3">Boarding</th>
                    <th className="px-3 py-3">Booked At</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((tx) => {
                    const isPaid =
                      tx.ticketStatus === 'ISSUED' ||
                      tx.paymentStatus === 'SUCCESS'

                    return (
                      <tr key={tx.ticketId} className="border-b last:border-0">
                        <td className="px-3 py-4 font-semibold text-slate-900">
                          #{tx.ticketId}
                        </td>
                        <td className="px-3 py-4 text-slate-700">
                          {tx.passengerName}
                        </td>
                        <td className="px-3 py-4">
                          <div className="font-semibold text-slate-900">
                            {tx.busNumber}
                          </div>
                          <div className="text-xs text-slate-500">
                            {tx.routeName}
                          </div>
                        </td>
                        <td className="px-3 py-4 text-slate-700">
                          {tx.fromStop} → {tx.toStop}
                        </td>
                        <td className="px-3 py-4 text-slate-600">
                          {tx.conductorName}
                        </td>
                        <td className="px-3 py-4 font-bold text-slate-900">
                          ₹{tx.fareAmount}
                        </td>
                        <td className="px-3 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              isPaid
                                ? 'bg-green-100 text-green-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {isPaid ? 'PAID' : 'PENDING'}
                          </span>
                        </td>
                        <td className="px-3 py-4">
                          {tx.verified ? (
                            <span className="inline-flex rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                              Verified
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">
                              Not scanned
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-4 text-xs text-slate-500">
                          {formatDate(tx.createdAt)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RevenueReports