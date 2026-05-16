import React, { useEffect, useState } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { submitQRScan } from '../services/studentScanService'
import { CheckCircle, AlertTriangle, ScanLine } from 'lucide-react'

export default function StudentScan() {
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;

    if (scanStatus === 'scanning') {
      scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      )

      scanner.render(
        async (decodedText) => {
          if (scanner) {
            scanner.pause(true)
          }
          try {
            await submitQRScan(decodedText)
            setScanStatus('success')
            setMessage('เช็คชื่อเข้าเรียนสำเร็จ!')
            if (scanner) scanner.clear()
          } catch (error: any) {
            setScanStatus('error')
            setMessage(error.message || 'เกิดข้อผิดพลาดในการสแกน')
            setTimeout(() => {
              setScanStatus('scanning')
              if (scanner) scanner.resume()
            }, 3000)
          }
        },
        (error) => {
          // ignore background scan errors
        }
      )
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(e => console.error('Failed to clear scanner', e))
      }
    }
  }, [scanStatus])

  return (
    <div className="p-8 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[80vh]">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-3">
        <ScanLine size={32} className="text-indigo-600"/> สแกน QR Code เช็คชื่อ
      </h1>

      {scanStatus === 'idle' && (
        <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 text-center w-full max-w-md">
          <div className="w-48 h-48 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <ScanLine size={80} className="text-indigo-300" />
          </div>
          <p className="text-gray-500 mb-8 text-lg">เตรียมกล้องของคุณให้พร้อม สำหรับสแกน QR Code ที่ครูเปิดไว้บนหน้าจอ</p>
          <button 
            onClick={() => setScanStatus('scanning')}
            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition shadow-lg"
          >
            เปิดกล้องสแกน
          </button>
        </div>
      )}

      {scanStatus === 'scanning' && (
        <div className="w-full max-w-md bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
          <div id="reader" className="w-full overflow-hidden rounded-2xl"></div>
          {message && (
            <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 font-medium">
              <AlertTriangle size={20} /> {message}
            </div>
          )}
          <button 
            onClick={() => setScanStatus('idle')}
            className="mt-6 w-full py-3 text-gray-500 hover:bg-gray-50 rounded-xl font-medium transition"
          >
            ยกเลิกการสแกน
          </button>
        </div>
      )}

      {scanStatus === 'success' && (
        <div className="bg-white p-10 rounded-3xl shadow-sm border border-green-100 text-center w-full max-w-md">
          <div className="w-32 h-32 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={80} className="text-green-500" />
          </div>
          <h2 className="text-3xl font-extrabold text-green-600 mb-3">สำเร็จ!</h2>
          <p className="text-gray-600 mb-10 font-medium text-lg">{message}</p>
          <button 
            onClick={() => setScanStatus('idle')}
            className="w-full bg-gray-100 text-gray-700 py-4 rounded-xl font-bold hover:bg-gray-200 transition"
          >
            สแกนวิชาต่อไป
          </button>
        </div>
      )}
    </div>
  )
}
