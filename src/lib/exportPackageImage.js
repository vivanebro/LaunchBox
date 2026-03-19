import { toPng } from 'html-to-image';

const wait = (ms) => new Promise(res => setTimeout(res, ms));

const getScrollContainer = () => document.querySelector('main') || document.documentElement;

export const exportPackageAsImages = async ({
  exportRef,
  packageName,
  config,
  pricingMode,
  setExporting,
  setIsPreviewMode,
  isPreviewMode = false,
  setPricingMode,
}) => {
  if (!exportRef?.current) return;

  const safeName = (packageName || 'package').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const hasBoth = config?.pricing_availability === 'both';
  const originalMode = pricingMode;
  const originalPreviewMode = Boolean(isPreviewMode);

  // Save scroll position before mode switch (image export switches to preview mode)
  const scrollEl = getScrollContainer();
  const savedScrollTop = scrollEl.scrollTop;
  const savedScrollLeft = scrollEl.scrollLeft;

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
    setIsPreviewMode(originalPreviewMode);
    setExporting(false);
    // Restore scroll position after React re-renders back to edit mode
    setTimeout(() => {
      const el = getScrollContainer();
      if (el) {
        el.scrollTop = savedScrollTop;
        el.scrollLeft = savedScrollLeft;
      }
    }, 50);
  }
};

const download = (dataUrl, filename) => {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
};
