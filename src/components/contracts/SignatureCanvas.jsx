import React, { forwardRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';

const SignaturePad = forwardRef(function SignaturePad({ accentColor = '#ff0044', onChange }, ref) {
  return (
    <div className="w-full">
      <div
        className="w-full rounded-xl border-2 border-dashed border-gray-300 bg-white overflow-hidden"
        style={{ minHeight: '160px' }}
      >
        <SignatureCanvas
          ref={ref}
          penColor="#1a1a1a"
          canvasProps={{
            className: 'w-full',
            style: { width: '100%', minHeight: '160px', touchAction: 'none' },
          }}
          onEnd={onChange}
        />
      </div>
      <p className="text-xs text-gray-400 text-center mt-1.5">Sign with your mouse or finger</p>
    </div>
  );
});

export default SignaturePad;
