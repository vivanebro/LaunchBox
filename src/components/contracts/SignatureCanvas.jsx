import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';

const SCRIPT_FONT = "'Caveat', 'Snell Roundhand', 'Brush Script MT', cursive";

const SignaturePad = forwardRef(function SignaturePad({ accentColor = '#ff0044', onChange, disabled = false }, ref) {
  const [mode, setMode] = useState('draw');
  const [typed, setTyped] = useState('');
  const drawRef = useRef(null);
  const hiddenCanvasRef = useRef(null);

  const renderTypedToCanvas = (text) => {
    const canvas = hiddenCanvasRef.current || document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 600, 160);
    ctx.fillStyle = '#1a1a1a';
    ctx.font = `italic 64px ${SCRIPT_FONT}`;
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 24, 80);
    hiddenCanvasRef.current = canvas;
    return canvas;
  };

  useImperativeHandle(ref, () => ({
    isEmpty: () => (mode === 'draw' ? (drawRef.current?.isEmpty() ?? true) : !typed.trim()),
    clear: () => {
      if (mode === 'draw') drawRef.current?.clear();
      else setTyped('');
    },
    toDataURL: (type) =>
      mode === 'draw'
        ? drawRef.current?.toDataURL(type)
        : renderTypedToCanvas(typed).toDataURL(type || 'image/png'),
  }), [mode, typed]);

  const switchMode = (next) => {
    if (next === mode) return;
    if (mode === 'draw') drawRef.current?.clear();
    else setTyped('');
    setMode(next);
    onChange?.();
  };

  return (
    <div className="w-full">
      <div className="inline-flex gap-1 mb-2 p-1 bg-gray-100 rounded-lg">
        <button
          type="button"
          onClick={() => switchMode('draw')}
          disabled={disabled}
          className={`px-3 py-1 text-xs font-medium rounded transition-colors ${mode === 'draw' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Draw
        </button>
        <button
          type="button"
          onClick={() => switchMode('type')}
          disabled={disabled}
          className={`px-3 py-1 text-xs font-medium rounded transition-colors ${mode === 'type' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Type
        </button>
      </div>

      {mode === 'draw' ? (
        <div
          className="w-full rounded-xl border-2 border-dashed border-gray-300 bg-white overflow-hidden"
          style={{ minHeight: '160px', opacity: disabled ? 0.6 : 1 }}
        >
          <SignatureCanvas
            ref={drawRef}
            penColor="#1a1a1a"
            canvasProps={{
              className: 'w-full',
              style: { width: '100%', minHeight: '160px', touchAction: 'none', pointerEvents: disabled ? 'none' : 'auto' },
            }}
            onEnd={disabled ? undefined : onChange}
          />
        </div>
      ) : (
        <div
          className="w-full rounded-xl border-2 border-dashed border-gray-300 bg-white overflow-hidden flex items-center px-5"
          style={{ minHeight: '160px', opacity: disabled ? 0.6 : 1 }}
        >
          <input
            type="text"
            value={typed}
            onChange={(e) => { setTyped(e.target.value); onChange?.(); }}
            disabled={disabled}
            placeholder="Type your full name"
            className="w-full bg-transparent border-0 outline-none text-4xl placeholder:text-gray-300 placeholder:text-2xl"
            style={{ fontFamily: SCRIPT_FONT }}
          />
        </div>
      )}

      <p className="text-xs text-gray-400 text-center mt-1.5">
        {disabled ? 'Preview mode: signing is disabled' : (mode === 'draw' ? 'Sign with your mouse or finger' : 'Type your name in cursive')}
      </p>
    </div>
  );
});

export default SignaturePad;
