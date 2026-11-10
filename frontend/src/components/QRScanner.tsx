
import { useCallback, useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void
}

function QRScanner({ onScanSuccess }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const callbackRef = useRef(onScanSuccess)
  const processingRef = useRef(false)

  const [scanning, setScanning] = useState(false)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')

  // Keep the latest callback without restarting the camera.
  useEffect(() => {
    callbackRef.current = onScanSuccess
  }, [onScanSuccess])

  const startScanner = useCallback(async () => {
    const scanner = scannerRef.current
    if (!scanner || starting || scanning) return

    try {
      setError('')
      setStarting(true)
      processingRef.current = false

      const cameras = await Html5Qrcode.getCameras()

      if (cameras.length === 0) {
        setError('No camera found on this device.')
        return
      }

      const camera =
        cameras.find((item) =>
          item.label.toLowerCase().includes('back')
        ) || cameras[0]

      await scanner.start(
        camera.id,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        async (decodedText) => {
          if (processingRef.current) return

          processingRef.current = true
          setScanning(false)

          try {
            await scanner.stop()
          } catch (err) {
            console.error('Scanner stop error:', err)
          }

          callbackRef.current(decodedText)
        },
        () => {
          // Normal frame scanning errors are ignored.
        }
      )

      setScanning(true)
    } catch (err) {
      console.error('QR scanner error:', err)
      setError('Unable to start camera. Please allow camera permission.')
    } finally {
      setStarting(false)
    }
  }, [starting, scanning])

  useEffect(() => {
    const scanner = new Html5Qrcode('bticket-qr-reader')
    scannerRef.current = scanner

    void startScanner()

    return () => {
      scannerRef.current = null

      if (scanner.isScanning) {
        void scanner.stop()
          .then(() => scanner.clear())
          .catch(console.error)
      } else {
        scanner.clear()
      }
    }
  }, [])

  const handleScanNext = async () => {
    if (scannerRef.current?.isScanning) return
    await startScanner()
  }

  return (
    <div className="w-full">
      <div
        id="bticket-qr-reader"
        className="overflow-hidden rounded-2xl border border-slate-200"
      />

      {starting && (
        <p className="mt-3 text-center text-sm text-blue-600">
          Starting camera...
        </p>
      )}

      {scanning && (
        <p className="mt-3 text-center text-sm font-medium text-green-600">
          Camera active. Scan the passenger's QR code.
        </p>
      )}

      {error && (
        <p className="mt-3 text-center text-sm text-red-600">
          {error}
        </p>
      )}

      {!scanning && !starting && (
        <button
          type="button"
          onClick={handleScanNext}
          className="mt-4 w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
        >
          Scan Next Ticket
        </button>
      )}
    </div>
  )
}

export default QRScanner
