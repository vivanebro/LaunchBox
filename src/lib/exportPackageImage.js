import html2canvas from 'html2canvas';

const wait = (ms) => new Promise(res => setTimeout(res, ms));

export const exportFromResultsPage = async (
  exportRef, packageName, config, pricingMode,
  setExporting, setIsPreviewMode, setPricingMode
) => {
  const safeName = (packageName || 'package').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const hasBoth = config?.pricing_availability === 'both';

  setExporting(true);
  const originalMode = pricingMode;

  try {
    // Switch to preview mode
    setIsPreviewMode(true);
    await wait(400);

    // Screenshot mode 1
    const canvas1 = await html2canvas(exportRef.current, {
      scale: 2, useCORS: true, backgroundColor: null, logging: false,
    });
    downloadCanvas(canvas1, hasBoth ? `${safeName}_${pricingMode}.png` : `${safeName}.png`);

    // If both modes, switch and screenshot again
    if (hasBoth) {
      const otherMode = pricingMode === 'one-time' ? 'retainer' : 'one-time';
      setPricingMode(otherMode);
      await wait(400);
      const canvas2 = await html2canvas(exportRef.current, {
        scale: 2, useCORS: true, backgroundColor: null, logging: false,
      });
      downloadCanvas(canvas2, `${safeName}_${otherMode}.png`);
      setPricingMode(originalMode);
      await wait(200);
    }
  } finally {
    setIsPreviewMode(false);
    setExporting(false);
  }
};

export const exportFromConfig = async (config, packageName) => {
  // Dynamic import to avoid loading html2canvas until needed
  const safeName = (packageName || 'package').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const availability = config?.pricing_availability || 'both';
  const modes = availability === 'both' ? ['one-time', 'retainer'] :
                availability === 'onetime' ? ['one-time'] : ['retainer'];

  for (const mode of modes) {
    const container = buildExportContainer(config, mode);
    document.body.appendChild(container);
    await wait(100);
    try {
      const canvas = await html2canvas(container, {
        scale: 2, useCORS: true, backgroundColor: '#0f0f1a', logging: false,
      });
      downloadCanvas(canvas, modes.length > 1 ? `${safeName}_${mode}.png` : `${safeName}.png`);
    } finally {
      document.body.removeChild(container);
    }
  }
};

const downloadCanvas = (canvas, filename) => {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
};

const buildExportContainer = (config, mode) => {
  const isRetainer = mode === 'retainer';
  const brandColor = config.brand_color || '#22c55e';
  const currency = config.currency_symbol || '$';
  const tiers = ['starter', 'growth', 'premium', 'elite'];
  const activeTiers = tiers.filter(t => config[`${t}_active`] !== false && (config[`price_${t}${isRetainer ? '_retainer' : ''}`] > 0));
  const modeLabel = isRetainer ? (config.pricing_label_retainer || 'monthly') : (config.pricing_label_onetime || 'one-time');

  const container = document.createElement('div');
  container.style.cssText = `position:fixed;left:-9999px;top:0;width:1400px;background:#0f0f1a;padding:60px;box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;`;

  const cards = activeTiers.map((tier, i) => {
    const price = config[`price_${tier}${isRetainer ? '_retainer' : ''}`] || 0;
    const originalPrice = config[`original_price_${tier}${isRetainer ? '_retainer' : ''}`];
    const deliverables = config[`${tier}_deliverables`] || [];
    const bonuses = config[`${tier}_bonuses`] || [];
    const name = config.package_names?.[isRetainer ? 'retainer' : 'onetime']?.[tier] || tier;
    const desc = config.package_descriptions?.[isRetainer ? 'retainer' : 'onetime']?.[tier] || '';
    const bg = i === 1 && activeTiers.length >= 3 ? brandColor : '#1a1a2e';

    return `
      <div style="background:${bg};border-radius:20px;padding:32px;color:white;flex:1;">
        <div style="text-align:center;font-size:24px;font-weight:800;margin-bottom:16px;">${name}</div>
        ${originalPrice > 0 ? `<div style="text-align:center;font-size:18px;text-decoration:line-through;opacity:0.5;margin-bottom:4px;">${currency}${originalPrice.toLocaleString()}</div>` : ''}
        <div style="text-align:center;margin-bottom:16px;">
          <span style="font-size:48px;font-weight:900;">${currency}${price.toLocaleString()}</span>
          <span style="font-size:16px;opacity:0.6;"> / ${modeLabel}</span>
        </div>
        ${desc ? `<div style="background:rgba(255,255,255,0.08);border-radius:10px;padding:10px;font-size:13px;text-align:center;margin-bottom:14px;">${desc}</div>` : ''}
        ${deliverables.length > 0 ? `<div style="margin-bottom:10px;"><div style="font-size:10px;letter-spacing:1px;opacity:0.5;margin-bottom:6px;">DELIVERABLES</div>${deliverables.map(d => `<div style="font-size:13px;margin-bottom:4px;">✓ ${d}</div>`).join('')}</div>` : ''}
        ${bonuses.length > 0 ? `<div><div style="font-size:10px;letter-spacing:1px;opacity:0.5;margin-bottom:6px;">BONUSES</div>${bonuses.map(b => `<div style="font-size:13px;margin-bottom:4px;">+ ${b}</div>`).join('')}</div>` : ''}
      </div>`;
  }).join('');

  container.innerHTML = `<div style="display:flex;gap:20px;align-items:stretch;">${cards}</div>`;
  return container;
};
