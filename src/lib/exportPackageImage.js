import html2canvas from 'html2canvas';

export const exportPackageAsImages = async (config, packageName) => {
  const modes = [];

  const availability = config.pricing_availability || 'both';
  if (availability === 'onetime' || availability === 'both') modes.push('onetime');
  if (availability === 'retainer' || availability === 'both') modes.push('retainer');

  for (const mode of modes) {
    await exportSingleMode(config, mode, packageName, modes.length);
  }
};

const exportSingleMode = async (config, mode, packageName, modesCount) => {
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    left: -9999px;
    top: 0;
    width: 1920px;
    height: 1080px;
    background: #f9fafb;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px;
    box-sizing: border-box;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  `;

  const brandColor = config.brand_color || '#ff0044';
  const activePackages = config.active_packages?.[mode] || ['starter', 'growth', 'premium'];
  const modeLabel = config[`pricing_label_${mode}`] || (mode === 'onetime' ? 'one-time' : 'monthly');
  const currencySymbol = config.currency_symbol || '$';

  const packageNames = config.package_names?.[mode] || {};
  const packageDescriptions = config.package_descriptions?.[mode] || {};

  const packages = activePackages.map(tier => {
    const price = mode === 'onetime' ? config[`price_${tier}`] : config[`price_${tier}_retainer`];
    const originalPrice = config[`original_price_${tier}${mode === 'retainer' ? '_retainer' : ''}`];
    const deliverables = config[`${tier}_deliverables`] || [];
    const bonuses = config[`${tier}_bonuses`] || [];
    return { tier, price, originalPrice, name: packageNames[tier] || tier, description: packageDescriptions[tier] || '', deliverables, bonuses };
  });

  const cols = packages.length === 1 ? 1 : packages.length === 2 ? 2 : packages.length === 4 ? 4 : 3;

  container.innerHTML = `
    <div style="text-align:center; margin-bottom: 40px;">
      <h1 style="font-size: 48px; font-weight: 800; color: #111; margin: 0 0 8px 0;">Simple, transparent pricing</h1>
      <p style="font-size: 22px; color: #666; margin: 0;">No surprise fees.</p>
    </div>
    <div style="display: grid; grid-template-columns: repeat(${cols}, 1fr); gap: 24px; width: 100%; max-width: ${cols === 1 ? '480px' : cols === 2 ? '900px' : '100%'}; margin: 0 auto;">
      ${packages.map((pkg, i) => `
        <div style="background: ${i === 1 && packages.length >= 3 ? brandColor : '#1a1a2e'}; border-radius: 24px; padding: 36px; color: white; display: flex; flex-direction: column; position: relative;">
          <div style="text-align: center; margin-bottom: 16px;">
            <div style="font-size: 28px; font-weight: 800;">${pkg.name}</div>
          </div>
          ${pkg.originalPrice > 0 ? `<div style="text-align:center; font-size: 20px; text-decoration: line-through; opacity: 0.5; margin-bottom: 4px;">${currencySymbol}${pkg.originalPrice.toLocaleString()}</div>` : ''}
          <div style="text-align: center; margin-bottom: 8px;">
            <span style="font-size: 52px; font-weight: 900;">${currencySymbol}${(pkg.price || 0).toLocaleString()}</span>
            <span style="font-size: 18px; opacity: 0.7;"> / ${modeLabel}</span>
          </div>
          ${pkg.description ? `<div style="background: rgba(255,255,255,0.1); border-radius: 12px; padding: 12px; font-size: 14px; text-align: center; margin-bottom: 16px; opacity: 0.9;">${pkg.description}</div>` : ''}
          ${pkg.deliverables.length > 0 ? `
            <div style="margin-bottom: 12px;">
              <div style="font-size: 11px; font-weight: 700; letter-spacing: 1px; opacity: 0.6; margin-bottom: 8px;">DELIVERABLES</div>
              ${pkg.deliverables.map(d => `<div style="font-size: 14px; margin-bottom: 6px;">✓ ${d}</div>`).join('')}
            </div>
          ` : ''}
          ${pkg.bonuses.length > 0 ? `
            <div>
              <div style="font-size: 11px; font-weight: 700; letter-spacing: 1px; opacity: 0.6; margin-bottom: 8px;">BONUSES</div>
              ${pkg.bonuses.map(b => `<div style="font-size: 14px; margin-bottom: 6px;">+ ${b}</div>`).join('')}
            </div>
          ` : ''}
        </div>
      `).join('')}
    </div>
    ${config.guarantee_text ? `<div style="margin-top: 32px; font-size: 16px; color: #666; text-align: center;">🛡️ ${config.guarantee_text}</div>` : ''}
    ${config.scarcity_text ? `<div style="margin-top: 8px; font-size: 16px; color: #666; text-align: center;">⏰ ${config.scarcity_text}</div>` : ''}
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      width: 1920,
      height: 1080,
      scale: 1,
      useCORS: true,
      backgroundColor: '#f9fafb',
      logging: false,
    });

    const link = document.createElement('a');
    const safeName = (packageName || 'package').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const modeSuffix = modesCount > 1 ? `_${mode}` : '';
    link.download = `${safeName}${modeSuffix}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } finally {
    document.body.removeChild(container);
  }
};
