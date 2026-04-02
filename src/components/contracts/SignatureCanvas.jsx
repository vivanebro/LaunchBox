import React, { forwardRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';

const SignaturePad = forwardRef(function SignaturePad({ accentColor = '#ff0044', onChange, disabled = false }, ref) {
  return (
    <div className="w-full">
      <div
        className="w-full rounded-xl border-2 border-dashed border-gray-300 bg-white overflow-hidden"
        style={{ minHeight: '160px', opacity: disabled ? 0.6 : 1 }}
      >
        <SignatureCanvas
          ref={ref}
          penColor="#1a1a1a"
          canvasProps={{
            className: 'w-full',
            style: { width: '100%', minHeight: '160px', touchAction: 'none', pointerEvents: disabled ? 'none' : 'auto' },
          }}
          onEnd={disabled ? undefined : onChange}
        />
      </div>
      <p className="text-xs text-gray-400 text-center mt-1.5">
        {disabled ? 'Preview mode: signing is disabled' : 'Sign with your mouse or finger'}
      </p>
    </div>
  );
});

export default SignaturePad;
