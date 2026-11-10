
import { useEffect, useState } from 'react';
import {
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import api from '../services/api';

interface Stop {
  id: number;
  name: string;
  code: string;
}

interface Direction {
  id: number;
  routeId: number;
  name: string;
  code: string;
}

interface OrderedStop {
  id: number;
  routeDirectionId: number;
  stopId: number;
  stopName: string | null;
  stopCode: string | null;
  originalStopName: string | null;
  originalStopCode: string | null;
  customName: string | null;
  customCode: string | null;
  sequence: number;
}

function StopManagement() {
  const navigate = useNavigate();
  const { directionId } = useParams();
  const [searchParams] = useSearchParams();

  const routeId = Number(searchParams.get('routeId'));
  const routeDirectionId = Number(directionId);

  const [direction, setDirection] = useState<Direction | null>(null);
  const [availableStops, setAvailableStops] = useState<Stop[]>([]);
  const [orderedStops, setOrderedStops] = useState<OrderedStop[]>([]);

  const [stopName, setStopName] = useState('');
  const [stopCode, setStopCode] = useState('');
  const [selectedStopId, setSelectedStopId] = useState('');
  const [sequence, setSequence] = useState('1');

  const [editingStop, setEditingStop] = useState<OrderedStop | null>(null);
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');

  const [loading, setLoading] = useState(true);
  const [savingStop, setSavingStop] = useState(false);
  const [addingStop, setAddingStop] = useState(false);
  const [updatingStop, setUpdatingStop] = useState(false);
  const [deletingStopId, setDeletingStopId] = useState<number | null>(null);

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const getErrorMessage = (err: any) => {
    const serverMessage = err.response?.data?.message;

    return Array.isArray(serverMessage)
      ? serverMessage.join(', ')
      : serverMessage || err.message || 'Something went wrong.';
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const [directionsResponse, stopsResponse, orderedResponse] =
        await Promise.all([
          api.get(`/route-directions/route/${routeId}`),
          api.get('/stops'),
          api.get(`/route-stops/direction/${routeDirectionId}`),
        ]);

      const foundDirection: Direction | undefined =
        directionsResponse.data.find(
          (item: Direction) => item.id === routeDirectionId,
        );

      if (!foundDirection) {
        throw new Error('Direction not found for this route.');
      }

      setDirection(foundDirection);
      setAvailableStops(stopsResponse.data);
      setOrderedStops(orderedResponse.data);

      const nextSequence =
        orderedResponse.data.length > 0
          ? Math.max(
              ...orderedResponse.data.map(
                (item: OrderedStop) => item.sequence,
              ),
            ) + 1
          : 1;

      setSequence(String(nextSequence));
    } catch (err: any) {
      console.error('Fetch stops error:', err.response?.data || err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (
      !Number.isInteger(routeId) ||
      routeId <= 0 ||
      !Number.isInteger(routeDirectionId) ||
      routeDirectionId <= 0
    ) {
      setError('Invalid route or direction ID.');
      setLoading(false);
      return;
    }

    fetchData();
  }, [routeId, routeDirectionId]);

  const handleCreateStop = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const name = stopName.trim();
    const code = stopCode.trim().toUpperCase();

    if (!name || !code) {
      setError('Please enter stop name and code.');
      return;
    }

    try {
      setSavingStop(true);

      const response = await api.post('/stops', { name, code });

      setStopName('');
      setStopCode('');

      await fetchData();

      if (response.data?.id) {
        setSelectedStopId(String(response.data.id));
      }

      setMessage(
        'Stop created successfully. You can now add it to this direction.',
      );
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setSavingStop(false);
    }
  };

  const handleAddStop = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const stopId = Number(selectedStopId);
    const stopSequence = Number(sequence);

    if (!Number.isInteger(stopId) || stopId <= 0) {
      setError('Please select a valid stop.');
      return;
    }

    if (!Number.isInteger(stopSequence) || stopSequence <= 0) {
      setError('Sequence must be a positive whole number.');
      return;
    }

    try {
      setAddingStop(true);

      await api.post('/route-stops', {
        routeId,
        routeDirectionId,
        stopId,
        sequence: stopSequence,
      });

      setSelectedStopId('');
      await fetchData();
      setMessage('Stop added to direction successfully.');
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setAddingStop(false);
    }
  };

  const handleStartEdit = (stop: OrderedStop) => {
  setEditingStop(stop);

  setEditName(
    stop.customName ?? stop.originalStopName ?? stop.stopName ?? '',
  );

  setEditCode(
    stop.customCode ?? stop.originalStopCode ?? stop.stopCode ?? '',
  );

  setError('');
  setMessage('');
};
  const handleUpdateStop = async (
  e: React.FormEvent<HTMLFormElement>,
) => {
  e.preventDefault();

  if (!editingStop) return;

  const name = editName.trim();
  const code = editCode.trim().toUpperCase();

  if (!name || !code) {
    setError('Stop name and code are required.');
    return;
  }

  try {
    setUpdatingStop(true);
    setError('');
    setMessage('');

    await api.patch(`/route-stops/${editingStop.id}`, {
      customName: name,
      customCode: code,
    });

    setEditingStop(null);
    setEditName('');
    setEditCode('');

    await fetchData();

    setMessage(
      'Stop updated successfully for this direction only.',
    );
  } catch (err: any) {
    setError(getErrorMessage(err));
  } finally {
    setUpdatingStop(false);
  }
};


const handleResetStop = async () => {
  if (!editingStop) return;

  try {
    setUpdatingStop(true);
    setError('');
    setMessage('');

    await api.patch(`/route-stops/${editingStop.id}`, {
      customName: null,
      customCode: null,
    });

    setEditingStop(null);
    setEditName('');
    setEditCode('');

    await fetchData();

    setMessage('Original stop name and code restored.');
  } catch (err: any) {
    setError(getErrorMessage(err));
  } finally {
    setUpdatingStop(false);
  }
};

  const handleDeleteStop = async (stop: OrderedStop) => {
    const confirmed = window.confirm(
      `Remove "${stop.stopName}" from this direction?\n\nIts fares involving this stop will also be deleted. The shared stop itself will remain in the catalogue.`,
    );

    if (!confirmed) return;

    try {
      setDeletingStopId(stop.id);
      setError('');
      setMessage('');

      if (editingStop?.id === stop.id) {
        setEditingStop(null);
      }

      await api.delete(`/route-stops/${stop.id}`);

      await fetchData();
      setMessage(
        'Stop removed from this direction successfully. Related fares were removed.',
      );
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setDeletingStopId(null);
    }
  };

  const assignedStopIds = new Set(
    orderedStops.map((item) => item.stopId),
  );

  const unassignedStops = availableStops.filter(
    (stop) => !assignedStopIds.has(stop.id),
  );

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <button
            type="button"
            onClick={() =>
              navigate(`/owner/routes/${routeId}/directions`)
            }
            className="mb-5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-100"
          >
            ← Back to Directions
          </button>

          <h1 className="text-3xl font-bold text-slate-900">
            Stops Management
          </h1>

          <p className="mt-2 text-slate-500">
            Create stops and arrange them in your selected direction.
          </p>

          {direction && (
            <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-sm text-blue-600">
                Selected Direction
              </p>
              <h2 className="mt-1 text-lg font-bold text-slate-900">
                {direction.name}
              </h2>
              <p className="text-sm text-slate-600">
                Code: {direction.code} · Direction ID: {direction.id}
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

        {loading ? (
          <p className="py-10 text-center text-slate-500">
            Loading stop management...
          </p>
        ) : (
          <>
            {/* Create Stop */}
            <form
              onSubmit={handleCreateStop}
              className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h2 className="mb-2 text-xl font-bold text-slate-900">
                Create New Stop
              </h2>
              <p className="mb-5 text-sm text-slate-500">
                Add a stop to the shared stops catalogue.
              </p>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Stop Name
                  </label>
                  <input
                    value={stopName}
                    onChange={(e) => setStopName(e.target.value)}
                    placeholder="e.g. Samrala Chowk"
                    required
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Stop Code
                  </label>
                  <input
                    value={stopCode}
                    onChange={(e) => setStopCode(e.target.value)}
                    placeholder="e.g. SAMRALA"
                    required
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 uppercase outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingStop}
                className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {savingStop ? 'Creating...' : 'Create Stop'}
              </button>
            </form>

            {/* Add Stop to Direction */}
            <form
              onSubmit={handleAddStop}
              className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h2 className="mb-2 text-xl font-bold text-slate-900">
                Add Stop to Direction
              </h2>
              <p className="mb-5 text-sm text-slate-500">
                Select an existing stop and assign its position in this direction.
              </p>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Select Stop
                  </label>
                  <select
                    value={selectedStopId}
                    onChange={(e) => setSelectedStopId(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
                  >
                    <option value="">Choose a stop</option>
                    {unassignedStops.map((stop) => (
                      <option key={stop.id} value={stop.id}>
                        {stop.name} ({stop.code})
                      </option>
                    ))}
                  </select>

                  {unassignedStops.length === 0 && (
                    <p className="mt-2 text-xs text-slate-500">
                      No unassigned stops available. Create a new stop above.
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Sequence Number
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={sequence}
                    onChange={(e) => setSequence(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={addingStop || unassignedStops.length === 0}
                className="mt-6 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {addingStop ? 'Adding...' : 'Add Stop to Direction'}
              </button>
            </form>

            {/* Edit Stop Form */}
            {editingStop && (
              <form
                onSubmit={handleUpdateStop}
                className="mb-8 rounded-2xl border border-blue-200 bg-blue-50 p-6"
              >
                <div className="mb-5 flex items-center justify-between gap-3">
                  <h2 className="text-xl font-bold text-slate-900">
                    Edit Stop
                  </h2>
                  <button
                    type="button"
                    onClick={() => setEditingStop(null)}
                    className="text-sm font-medium text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Stop Name
                    </label>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Stop Code
                    </label>
                    <input
                      value={editCode}
                      onChange={(e) => setEditCode(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 uppercase outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={updatingStop}
                  className="mt-5 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {updatingStop ? 'Updating...' : 'Save Changes'}
                </button>

                <button
  type="button"
  onClick={handleResetStop}
  disabled={updatingStop}
  className="mt-5 ml-3 rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
>
  Reset to Original
</button>
              </form>
            )}

            {/* Ordered Stops */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Stops in This Direction
                  </h2>
                  <span className="mt-2 inline-block rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                    {orderedStops.length} Stops
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/owner/directions/${routeDirectionId}/fares?routeId=${routeId}`,
                    )
                  }
                  disabled={orderedStops.length < 2}
                  className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Manage Fares →
                </button>
              </div>

              {orderedStops.length === 0 ? (
                <p className="py-8 text-center text-slate-500">
                  No stops added to this direction yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b text-sm text-slate-500">
                        <th className="px-3 py-3">Sequence</th>
                        <th className="px-3 py-3">Stop Name</th>
                        <th className="px-3 py-3">Stop ID</th>
                        <th className="px-3 py-3 text-right">Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {orderedStops.map((stop) => (
                        <tr
                          key={stop.id}
                          className="border-b last:border-0"
                        >
                          <td className="px-3 py-4 font-semibold text-blue-600">
                            {stop.sequence}
                          </td>

                        <td className="px-3 py-4">
  <p className="font-semibold text-slate-900">
    {stop.stopName || 'Unknown Stop'}
  </p>

  <p className="mt-1 text-xs text-slate-500">
    Code: {stop.stopCode || 'N/A'}
  </p>
</td>

                          <td className="px-3 py-4 text-slate-600">
                            #{stop.stopId}
                          </td>

                          <td className="px-3 py-4">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleStartEdit(stop)}
                                disabled={deletingStopId === stop.id}
                                className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteStop(stop)}
                                disabled={deletingStopId === stop.id}
                                className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                              >
                                {deletingStopId === stop.id
                                  ? 'Removing...'
                                  : 'Delete'}
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
          </>
        )}
      </div>
    </div>
  );
}

export default StopManagement;
