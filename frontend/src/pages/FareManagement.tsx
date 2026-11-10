
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../services/api';

interface RouteStop {
  id: number;
  routeDirectionId: number;
  stopId: number;
  stopName: string;
  sequence: number;
}

interface Fare {
  id: number;
  routeDirectionId: number;
  fromStopId: number;
  toStopId: number;
  amount: number;
  fromStopName: string;
  toStopName: string;
}

interface Segment {
  fromStop: RouteStop;
  toStop: RouteStop;
  fare?: Fare;
}

export default function FareManagement() {
  const { directionId } = useParams<{ directionId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const routeDirectionId = Number(directionId);
  const routeId = searchParams.get('routeId');

  const [stops, setStops] = useState<RouteStop[]>([]);
  const [fares, setFares] = useState<Fare[]>([]);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingSegment, setSavingSegment] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [editingFareId, setEditingFareId] = useState<number | null>(null);
const [editAmount, setEditAmount] = useState('');
const [updatingFare, setUpdatingFare] = useState(false);

  const getErrorMessage = (err: any) =>
    err.response?.data?.message || 'Something went wrong. Please try again.';

  const fetchData = useCallback(async () => {
    if (!Number.isInteger(routeDirectionId) || routeDirectionId <= 0) {
      setError('Invalid route direction ID.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const [stopsResponse, faresResponse] = await Promise.all([
        api.get(`/route-stops/direction/${routeDirectionId}`),
        api.get(`/fares/direction/${routeDirectionId}`),
      ]);

      setStops(
        [...stopsResponse.data].sort(
          (a: RouteStop, b: RouteStop) => a.sequence - b.sequence,
        ),
      );
      setFares(faresResponse.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [routeDirectionId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const segments: Segment[] = stops.slice(0, -1).map((fromStop, index) => {
    const toStop = stops[index + 1];

    const fare = fares.find(
      (item) =>
        item.fromStopId === fromStop.stopId &&
        item.toStopId === toStop.stopId,
    );

    return { fromStop, toStop, fare };
  });

  const handleSaveFare = async (segment: Segment) => {
    const key = `${segment.fromStop.stopId}-${segment.toStop.stopId}`;
    const amount = Number(amounts[key]);

    if (!amounts[key] || !Number.isFinite(amount) || amount <= 0) {
      setError('Please enter a valid fare greater than zero.');
      return;
    }

    try {
      setSavingSegment(key);
      setError('');
      setSuccess('');

      await api.post('/fares', {
        routeDirectionId,
        fromStopId: segment.fromStop.stopId,
        toStopId: segment.toStop.stopId,
        amount,
      });

      setSuccess(
        `Fare saved: ${segment.fromStop.stopName} → ${segment.toStop.stopName}`,
      );

      setAmounts((previous) => ({ ...previous, [key]: '' }));
      await fetchData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSavingSegment(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">
        Loading fare details...
      </div>
    );
  }


  const handleEditFare = (fare: Fare) => {
  setEditingFareId(fare.id);
  setEditAmount(String(fare.amount));
  setError('');
  setSuccess('');
};

const handleUpdateFare = async (fareId: number) => {
  const amount = Number(editAmount);

  if (!Number.isFinite(amount) || amount <= 0) {
    setError('Please enter a valid fare greater than zero.');
    return;
  }

  try {
    setUpdatingFare(true);
    setError('');
    setSuccess('');

    await api.patch(`/fares/${fareId}`, { amount });

    setEditingFareId(null);
    setEditAmount('');

    setSuccess('Fare updated successfully.');
    await fetchData();
  } catch (err) {
    setError(getErrorMessage(err));
  } finally {
    setUpdatingFare(false);
  }
};

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fare Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Configure fares between consecutive stops in this direction.
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Direction ID: {routeDirectionId}
          </p>
        </div>

        <button
          onClick={() =>
            navigate(
              routeId
                ? `/owner/directions/${routeDirectionId}/stops?routeId=${routeId}`
                : '/owner/routes',
            )
          }
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Back
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {stops.length < 2 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <h2 className="font-semibold text-gray-800">
            Not enough stops configured
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Add at least two stops to this direction before configuring fares.
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
            <h2 className="font-semibold text-blue-900">
              How segment fares work
            </h2>
            <p className="mt-1 text-sm text-blue-800">
              Enter the fare for each consecutive stop pair. For example,
              A → B and B → C. A passenger travelling A → C will be charged
              the sum of both segments.
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-5 py-4">
              <h2 className="font-semibold text-gray-900">
                Stop-wise Fare Configuration
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {segments.length} fare segments found
              </p>
            </div>

            <div className="divide-y divide-gray-100">
              {segments.map((segment) => {
                const key = `${segment.fromStop.stopId}-${segment.toStop.stopId}`;

                return (
                  <div
                    key={key}
                    className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                        {segment.fromStop.sequence}
                      </div>

                      <div>
                        <p className="font-semibold text-gray-900">
                          {segment.fromStop.stopName}
                        </p>
                        <p className="text-xs text-gray-500">From stop</p>
                      </div>

                      <span className="px-2 text-gray-400">→</span>

                      <div>
                        <p className="font-semibold text-gray-900">
                          {segment.toStop.stopName}
                        </p>
                        <p className="text-xs text-gray-500">To stop</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                     {segment.fare ? (
  editingFareId === segment.fare.id ? (
    <div className="flex flex-wrap items-end gap-2">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">
          New fare (₹)
        </label>
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={editAmount}
          onChange={(e) => setEditAmount(e.target.value)}
          className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
        />
      </div>

      <button
        onClick={() => handleUpdateFare(segment.fare!.id)}
        disabled={updatingFare}
        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
      >
        {updatingFare ? 'Saving...' : 'Save'}
      </button>

      <button
        onClick={() => {
          setEditingFareId(null);
          setEditAmount('');
        }}
        disabled={updatingFare}
        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Cancel
      </button>
    </div>
  ) : (
    <div className="flex flex-wrap items-center gap-3">
      <div className="rounded-lg bg-green-50 px-4 py-2">
        <p className="text-xs text-green-700">
          Configured fare
        </p>
        <p className="font-bold text-green-800">
          ₹{Number(segment.fare.amount).toFixed(2)}
        </p>
      </div>

      <button
        onClick={() => handleEditFare(segment.fare!)}
        className="rounded-lg border border-blue-200 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
      >
        Edit
      </button>
    </div>
  )
) : (
  <>
    <div>
      <label
        htmlFor={`fare-${key}`}
        className="mb-1 block text-xs font-medium text-gray-600"
      >
        Fare amount (₹)
      </label>
      <input
        id={`fare-${key}`}
        type="number"
        min="0.01"
        step="0.01"
        placeholder="Enter amount"
        value={amounts[key] || ''}
        onChange={(event) =>
          setAmounts((previous) => ({
            ...previous,
            [key]: event.target.value,
          }))
        }
        className="w-36 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </div>

    <button
      onClick={() => handleSaveFare(segment)}
      disabled={savingSegment === key}
      className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {savingSegment === key ? 'Saving...' : 'Save Fare'}
    </button>
  </>
)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
