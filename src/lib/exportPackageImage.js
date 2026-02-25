import { toPng } from 'html-to-image';

const wait = (ms) => new Promise(res => setTimeout(res, ms));

export const exportPackageAsImages = async ({
  exportRef,
  packageName,
  config,
  pricingMode,
  setExporting,
  setIsPreviewMode,
  setPricingMode,
}) => {
  if (!exportRef?.current) return;

  const safeName = (packageName || 'package').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const hasBoth = config?.pricing_availability === 'both';
  const originalMode = pricingMode;

  setExporting(true);

  try {
    // Switch to preview mode — no visible flash, happens before paint
    setIsPreviewMode(true);
    await wait(300);

    // Screenshot mode 1
    const dataUrl1 = await toPng(exportRef.current, { pixelRatio: 2 });
    download(dataUrl1, hasBoth ? `${safeName}_${pricingMode}.png` : `${safeName}.png`);

    if (hasBoth) {
      const otherMode = pricingMode === 'one-time' ? 'retainer' : 'one-time';
      setPricingMode(otherMode);
      await wait(300);
      const dataUrl2 = await toPng(exportRef.current, { pixelRatio: 2 });
      download(dataUrl2, `${safeName}_${otherMode}.png`);
      setPricingMode(originalMode);
      await wait(100);
    }
  } finally {
    setIsPreviewMode(false);
    setExporting(false);
  }
};

const download = (dataUrl, filename) => {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
};
