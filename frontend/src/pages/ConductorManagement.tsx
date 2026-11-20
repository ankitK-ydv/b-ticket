import { useEffect, useState } from 'react'
import api from '../services/api'
import { useNavigate } from 'react-router-dom'


interface Conductor {
  id: number
  name: string
  email: string
  phone: string
  isActive: boolean
}

interface ConductorForm {
  name: string
  email: string
  phone: string
  password: string
}

const initialForm: ConductorForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
}

function ConductorManagement() {
  const [conductors, setConductors] = useState<Conductor[]>([])
  const [form, setForm] = useState<ConductorForm>(initialForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  const fetchConductors = async () => {
    try {
      setLoading(true)
      const response = await api.get('/auth/conductors')
      setConductors(response.data)
      setError('')
    } catch (err) {
      console.error('Fetch conductors error:', err)
      setError('Unable to load your conductors.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConductors()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setMessage('')

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      password: form.password,
    }

    if (!payload.name || !payload.email || !payload.phone || !payload.password) {
      setError('Please fill in all fields.')
      return
    }

    try {
      setSaving(true)
      await api.post('/auth/conductor', payload)
      setMessage('Conductor added successfully.')
      setForm(initialForm)
      await fetchConductors()
    } catch (err: any) {
      console.error('Create conductor error:', err)
      setError(
        err?.response?.data?.message ||
          'Unable to add conductor. Email or phone may already exist.',
      )
    } finally {
      setSaving(false)
    }
  }

  const handleToggleStatus = async (conductor: Conductor) => {
    const nextStatus = !conductor.isActive
    const actionLabel = nextStatus ? 'activate' : 'deactivate'

    const confirmed = window.confirm(
      `Are you sure you want to ${actionLabel} ${conductor.name}?`,
    )

    if (!confirmed) return

    try {
      setUpdatingId(conductor.id)
      setError('')
      setMessage('')

      await api.patch(`/auth/conductors/${conductor.id}/status`, {
        isActive: nextStatus,
      })

      setMessage(
        `Conductor ${nextStatus ? 'activated' : 'deactivated'} successfully.`,
      )
      await fetchConductors()
    } catch (err: any) {
      console.error('Update conductor status error:', err)
      setError(
        err?.response?.data?.message ||
          'Unable to update conductor status.',
      )
    } finally {
      setUpdatingId(null)
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
            Conductor Management
          </h1>
          <p className="mt-2 text-slate-500">
            Add new conductors and manage their active status.
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

        {/* Add Conductor Form */}
        <form
          onSubmit={handleSubmit}
          className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 className="mb-5 text-xl font-bold text-slate-900">
            Add New Conductor
          </h2>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Full Name
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Rajesh Kumar"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="e.g. rajesh@example.com"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Phone Number
              </label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="e.g. 9876543210"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Set login password"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="mt-6">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? 'Adding...' : 'Add Conductor'}
            </button>
          </div>
        </form>

        {/* Conductors List Table */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">
              My Conductors
            </h2>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
              {conductors.length} Conductors
            </span>
          </div>

          {loading ? (
            <p className="py-8 text-center text-slate-500">
              Loading conductors...
            </p>
          ) : conductors.length === 0 ? (
            <p className="py-8 text-center text-slate-500">
              No conductors added yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b text-sm text-slate-500">
                    <th className="px-3 py-3">Name</th>
                    <th className="px-3 py-3">Email</th>
                    <th className="px-3 py-3">Phone</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {conductors.map((conductor) => (
                    <tr key={conductor.id} className="border-b last:border-0">
                      <td className="px-3 py-4 font-semibold text-slate-900">
                        {conductor.name}
                      </td>
                      <td className="px-3 py-4 text-slate-600">
                        {conductor.email}
                      </td>
                      <td className="px-3 py-4 text-slate-600">
                        {conductor.phone}
                      </td>
                      <td className="px-3 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            conductor.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {conductor.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-3 py-4">
                        <button
                          type="button"
                          disabled={updatingId === conductor.id}
                          onClick={() => handleToggleStatus(conductor)}
                          className={`font-semibold disabled:opacity-50 ${
                            conductor.isActive
                              ? 'text-red-600 hover:text-red-800'
                              : 'text-green-600 hover:text-green-800'
                          }`}
                        >
                          {updatingId === conductor.id
                            ? 'Updating...'
                            : conductor.isActive
                              ? 'Deactivate'
                              : 'Activate'}
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

export default ConductorManagement