import html2canvas from 'html2canvas';

export const exportPackageAsImages = async (elementRef, packageName, config, currentMode, setExporting) => {
  if (!elementRef?.current) return;

  const safeName = (packageName || 'package').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const availability = config?.pricing_availability || 'both';
  const hasBoth = availability === 'both';

  setExporting(true);

  try {
    // Screenshot current mode
    const canvas1 = await html2canvas(elementRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#f9fafb',
      logging: false,
    });
    downloadCanvas(canvas1, hasBoth ? `${safeName}_${currentMode}.png` : `${safeName}.png`);
  } finally {
    setExporting(false);
  }
};

const downloadCanvas = (canvas, filename) => {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
};
