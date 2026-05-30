import React, { useRef, useState, useEffect } from 'react';

interface SignaturePadProps {
  onSignatureChange: (base64: string | null) => void;
  width?: number;
  height?: number;
}

export default function SignaturePad({ onSignatureChange, width = 600, height = 250 }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  // Set up canvas context
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#0f172a'; // dark slate
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        // Fill white background initially
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [width, height]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      };
    } else {
      return {
        x: ((e as React.MouseEvent).clientX - rect.left) * scaleX,
        y: ((e as React.MouseEvent).clientY - rect.top) * scaleY
      };
    }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    // Prevent scrolling on touch
    if (e.cancelable) e.preventDefault(); 
    
    setIsDrawing(true);
    setIsEmpty(false);
    
    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        // Draw a dot if just clicking
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    if (e.cancelable) e.preventDefault(); 
    
    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      const canvas = canvasRef.current;
      if (canvas) {
        const dataUrl = canvas.toDataURL('image/png');
        onSignatureChange(dataUrl);
      }
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setIsEmpty(true);
        onSignatureChange(null);
      }
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-white shadow-inner relative w-full touch-none" style={{ aspectRatio: `${width}/${height}` }}>
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-gray-300 font-medium select-none text-lg">เซ็นชื่อที่นี่...</span>
          </div>
        )}
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="cursor-crosshair w-full h-full touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
      <button
        type="button"
        onClick={clear}
        className="mt-3 text-sm font-bold text-gray-500 hover:text-red-500 transition-colors px-4 py-2 rounded-full hover:bg-red-50 flex items-center gap-2"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
        ล้างลายเซ็น / ลบเขียนใหม่
      </button>
    </div>
  );
}
