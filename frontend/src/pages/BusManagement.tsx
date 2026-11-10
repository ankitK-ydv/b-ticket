
import { useEffect, useState } from 'react'
import api from '../services/api'
import { useNavigate } from 'react-router-dom'

interface Bus {
  id: number
  busNumber: string
  registrationNumber: string
  capacity: number
  ownerId: number
}

interface BusForm {
  busNumber: string
  registrationNumber: string
  capacity: string
}

const initialForm: BusForm = {
  busNumber: '',
  registrationNumber: '',
  capacity: '',
}

function BusManagement() {
  const [buses, setBuses] = useState<Bus[]>([])
  const [form, setForm] = useState<BusForm>(initialForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  const fetchBuses = async () => {
    try {
      setLoading(true)
      const response = await api.get('/bus/my')
      setBuses(response.data)
      setError('')
    } catch (err) {
      console.error('Fetch buses error:', err)
      setError('Unable to load your buses.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBuses()
  }, [])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    })
  }

  const resetForm = () => {
    setForm(initialForm)
    setEditingId(null)
  }

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault()
    setError('')
    setMessage('')

    const capacity = Number(form.capacity)

    if (!Number.isInteger(capacity) || capacity <= 0) {
      setError('Capacity must be a positive whole number.')
      return
    }

    const payload = {
      busNumber: form.busNumber.trim(),
      registrationNumber: form.registrationNumber.trim(),
      capacity,
    }

    if (!payload.busNumber || !payload.registrationNumber) {
      setError('Please fill in all fields.')
      return
    }

    try {
      setSaving(true)

      if (editingId !== null) {
        await api.patch(`/bus/${editingId}`, payload)
        setMessage('Bus updated successfully.')
      } else {
        await api.post('/bus', payload)
        setMessage('Bus added successfully.')
      }

      resetForm()
      await fetchBuses()
    } catch (err) {
      console.error('Save bus error:', err)
      setError('Unable to save bus. Please check the details.')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (bus: Bus) => {
    setEditingId(bus.id)
    setForm({
      busNumber: bus.busNumber,
      registrationNumber: bus.registrationNumber,
      capacity: String(bus.capacity),
    })
    setError('')
    setMessage('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (busId: number) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this bus?',
    )

    if (!confirmed) return

    try {
      setError('')
      setMessage('')
      await api.delete(`/bus/${busId}`)
      setMessage('Bus deleted successfully.')
      if (editingId === busId) resetForm()
      await fetchBuses()
    } catch (err) {
      console.error('Delete bus error:', err)
      setError('Unable to delete this bus.')
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
            Bus Management
          </h1>
          <p className="mt-2 text-slate-500">
            Add, view, update and manage your buses.
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
            {editingId !== null ? 'Update Bus' : 'Add New Bus'}
          </h2>

          <div className="grid gap-5 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Bus Number
              </label>
              <input
                name="busNumber"
                value={form.busNumber}
                onChange={handleChange}
                placeholder="e.g. Bus 101"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Registration Number
              </label>
              <input
                name="registrationNumber"
                value={form.registrationNumber}
                onChange={handleChange}
                placeholder="e.g. PB10AB1234"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Passenger Capacity
              </label>
              <input
                type="number"
                name="capacity"
                value={form.capacity}
                onChange={handleChange}
                placeholder="e.g. 50"
                min="1"
                step="1"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {saving
                ? 'Saving...'
                : editingId !== null
                  ? 'Update Bus'
                  : 'Add Bus'}
            </button>

            {editingId !== null && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">
              My Buses
            </h2>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
              {buses.length} Buses
            </span>
          </div>

          {loading ? (
            <p className="py-8 text-center text-slate-500">
              Loading buses...
            </p>
          ) : buses.length === 0 ? (
            <p className="py-8 text-center text-slate-500">
              No buses added yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b text-sm text-slate-500">
                    <th className="px-3 py-3">Bus Number</th>
                    <th className="px-3 py-3">Registration</th>
                    <th className="px-3 py-3">Capacity</th>
                    <th className="px-3 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {buses.map((bus) => (
                    <tr key={bus.id} className="border-b last:border-0">
                      <td className="px-3 py-4 font-semibold text-slate-900">
                        {bus.busNumber}
                      </td>
                      <td className="px-3 py-4 text-slate-600">
                        {bus.registrationNumber}
                      </td>
                      <td className="px-3 py-4 text-slate-600">
                        {bus.capacity}
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => handleEdit(bus)}
                            className="font-semibold text-blue-600 hover:text-blue-800"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(bus.id)}
                            className="font-semibold text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        </div>
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

export default BusManagement
