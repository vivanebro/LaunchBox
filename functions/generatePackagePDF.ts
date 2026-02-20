import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { jsPDF } from 'npm:jspdf@2.5.2';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { packages, config, pricingMode, popularBadgeText, currentDesign } = await req.json();
        
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        
        const hexToRgb = (hex) => {
            if (!hex || !hex.startsWith('#')) return { r: 255, g: 0, b: 68 };
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : { r: 255, g: 0, b: 68 };
        };

        const brandColor = hexToRgb(config.brand_color || '#ff0044');

        // Background
        doc.setFillColor(245, 245, 247);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');

        // Header with logo
        let headerY = 15;
        if (config.logo_url) {
            try {
                headerY = 20;
            } catch (e) {
                headerY = 15;
            }
        }

        // Title
        doc.setFontSize(32);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(30, 30, 30);
        doc.text('Simple, transparent pricing', pageWidth / 2, headerY, { align: 'center' });
        
        doc.setFontSize(14);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('No surprise fees.', pageWidth / 2, headerY + 8, { align: 'center' });

        // Pricing mode indicator
        doc.setFontSize(10);
        doc.setTextColor(120, 120, 120);
        const modeText = pricingMode === 'one-time' ? 'One-time Project Pricing' : 'Monthly Retainer Pricing';
        doc.text(modeText, pageWidth / 2, headerY + 15, { align: 'center' });

        // Package boxes
        const boxWidth = 85;
        const boxHeight = 140;
        const startY = headerY + 25;
        const spacing = 8;
        const totalWidth = (boxWidth * 3) + (spacing * 2);
        const startX = (pageWidth - totalWidth) / 2;

        packages.forEach((pkg, index) => {
            const x = startX + (index * (boxWidth + spacing));
            
            // Shadow
            doc.setFillColor(0, 0, 0);
            doc.setGState(new doc.GState({ opacity: 0.1 }));
            doc.roundedRect(x + 1, startY + 1.5, boxWidth, boxHeight, 4, 4, 'F');
            doc.setGState(new doc.GState({ opacity: 1 }));

            // White card
            doc.setFillColor(255, 255, 255);
            doc.roundedRect(x, startY, boxWidth, boxHeight, 4, 4, 'F');

            // Border
            if (pkg.popular) {
                doc.setDrawColor(brandColor.r, brandColor.g, brandColor.b);
                doc.setLineWidth(1);
            } else {
                doc.setDrawColor(229, 229, 229);
                doc.setLineWidth(0.5);
            }
            doc.roundedRect(x, startY, boxWidth, boxHeight, 4, 4, 'S');

            let currentY = startY + 8;

            // Popular badge
            if (pkg.popular) {
                doc.setFillColor(brandColor.r, brandColor.g, brandColor.b);
                doc.roundedRect(x + boxWidth / 2 - 20, currentY, 40, 7, 3, 3, 'F');
                doc.setFontSize(8);
                doc.setFont(undefined, 'bold');
                doc.setTextColor(255, 255, 255);
                doc.text(popularBadgeText, x + boxWidth / 2, currentY + 5, { align: 'center' });
                currentY += 12;
            } else {
                currentY += 8;
            }

            // Package name
            doc.setFontSize(18);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(40, 40, 40);
            doc.text(pkg.name, x + boxWidth / 2, currentY, { align: 'center' });

            // Price
            currentY += 12;
            doc.setFontSize(32);
            doc.setTextColor(brandColor.r, brandColor.g, brandColor.b);
            doc.text(`$${pkg.price.toLocaleString()}`, x + boxWidth / 2, currentY, { align: 'center' });

            doc.setFontSize(8);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(120, 120, 120);
            doc.text(pricingMode === 'one-time' ? 'one-time' : 'per month', x + boxWidth / 2, currentY + 6, { align: 'center' });

            currentY += 12;

            // Timeline (tier-specific duration)
            if (pkg.duration) {
                doc.setFontSize(8);
                doc.setTextColor(100, 100, 100);
                doc.text(`Timeline: ${pkg.duration}`, x + boxWidth / 2, currentY, { align: 'center' });
                currentY += 6;
            }

            // Description box
            doc.setFillColor(brandColor.r, brandColor.g, brandColor.b);
            doc.setGState(new doc.GState({ opacity: 0.08 }));
            doc.roundedRect(x + 6, currentY, boxWidth - 12, 14, 2, 2, 'F');
            doc.setGState(new doc.GState({ opacity: 1 }));

            doc.setFontSize(7);
            doc.setTextColor(100, 100, 100);
            doc.text('Best for:', x + boxWidth / 2, currentY + 4, { align: 'center' });
            
            doc.setFontSize(8);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(40, 40, 40);
            const descLines = doc.splitTextToSize(pkg.description, boxWidth - 16);
            doc.text(descLines[0].substring(0, 45), x + boxWidth / 2, currentY + 9, { align: 'center' });

            currentY += 20;

            // Deliverables title
            doc.setFontSize(7);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(120, 120, 120);
            doc.text('INCLUDED', x + 8, currentY);

            currentY += 5;

            // Features
            doc.setFontSize(8);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(60, 60, 60);
            
            const allFeatures = [
                ...pkg.deliverables.map(d => `${d.quantity}x ${d.type}${d.length ? ` (${d.length})` : ''}`),
                ...pkg.assets
            ];

            allFeatures.slice(0, 6).forEach((feature) => {
                if (currentY < startY + boxHeight - 12) {
                    // Checkmark
                    doc.setFillColor(brandColor.r, brandColor.g, brandColor.b);
                    doc.circle(x + 10, currentY - 0.5, 1.8, 'F');
                    
                    doc.setTextColor(255, 255, 255);
                    doc.setFontSize(7);
                    doc.setFont(undefined, 'bold');
                    doc.text('✓', x + 10, currentY + 1, { align: 'center' });
                    
                    doc.setFontSize(8);
                    doc.setFont(undefined, 'normal');
                    doc.setTextColor(60, 60, 60);
                    const lines = doc.splitTextToSize(feature, boxWidth - 20);
                    doc.text(lines[0].substring(0, 35), x + 14, currentY);
                    currentY += 5;
                }
            });

            // Bonuses if any
            if (pkg.bonuses && pkg.bonuses.length > 0 && currentY < startY + boxHeight - 15) {
                currentY += 2;
                doc.setFontSize(7);
                doc.setFont(undefined, 'bold');
                doc.setTextColor(120, 120, 120);
                doc.text('BONUSES', x + 8, currentY);
                currentY += 4;

                pkg.bonuses.slice(0, 2).forEach((bonus) => {
                    if (currentY < startY + boxHeight - 8) {
                        doc.setTextColor(34, 197, 94);
                        doc.setFontSize(7);
                        doc.text('✓', x + 10, currentY + 1, { align: 'center' });
                        
                        doc.setFontSize(8);
                        doc.setFont(undefined, 'normal');
                        doc.setTextColor(60, 60, 60);
                        const lines = doc.splitTextToSize(bonus, boxWidth - 20);
                        doc.text(lines[0].substring(0, 30), x + 14, currentY);
                        currentY += 5;
                    }
                });
            }
        });

        // Footer with guarantee
        if (config.guarantee || config.urgency) {
            const footerY = startY + boxHeight + 10;
            
            if (config.guarantee) {
                doc.setFillColor(255, 255, 255);
                doc.roundedRect(pageWidth / 2 - 60, footerY, 120, 12, 2, 2, 'F');
                
                doc.setFontSize(9);
                doc.setFont(undefined, 'bold');
                doc.setTextColor(brandColor.r, brandColor.g, brandColor.b);
                doc.text('Guarantee: ', pageWidth / 2 - 55, footerY + 7);
                
                doc.setFont(undefined, 'normal');
                doc.setTextColor(60, 60, 60);
                const guaranteeText = doc.splitTextToSize(config.guarantee, 90);
                doc.text(guaranteeText[0], pageWidth / 2 - 30, footerY + 7);
            }
            
            if (config.urgency) {
                doc.setFontSize(8);
                doc.setFont(undefined, 'italic');
                doc.setTextColor(100, 100, 100);
                doc.text(config.urgency, pageWidth / 2, footerY + 18, { align: 'center' });
            }
        }

        const pdfBytes = doc.output('arraybuffer');

        return new Response(pdfBytes, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${(config.business_name || 'Packages').replace(/\s+/g, '_')}_Pricing.pdf"`
            }
        });
    } catch (error) {
        console.error('Error generating PDF:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});