import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { jsPDF } from 'npm:jspdf@2.5.2';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { packages, config, designComponent } = await req.json();
        
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        
        const hexToRgb = (hex) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : { r: 37, g: 99, b: 235 };
        };

        const primary = hexToRgb(config.primary_color);
        const secondary = hexToRgb(config.secondary_color);

        // Background
        doc.setFillColor(250, 250, 250);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');

        // Header
        doc.setFontSize(28);
        doc.setTextColor(30, 30, 30);
        doc.setFont(undefined, 'normal');
        doc.text(config.photographer_name, pageWidth / 2, 20, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setTextColor(120, 120, 120);
        doc.text('Photography Packages', pageWidth / 2, 28, { align: 'center' });

        // Divider
        doc.setDrawColor(primary.r, primary.g, primary.b);
        doc.setLineWidth(0.4);
        doc.line(pageWidth / 2 - 25, 32, pageWidth / 2 + 25, 32);

        // Design-specific rendering based on designComponent index
        if (designComponent === 0) {
            renderDesign1(doc, packages, primary, secondary, pageWidth, pageHeight);
        } else if (designComponent === 1) {
            renderDesign2(doc, packages, primary, secondary, pageWidth, pageHeight);
        } else if (designComponent === 2) {
            renderDesign3(doc, packages, primary, secondary, pageWidth, pageHeight);
        } else if (designComponent === 3) {
            renderDesign4(doc, packages, primary, secondary, pageWidth, pageHeight);
        } else {
            renderDesign5(doc, packages, primary, secondary, pageWidth, pageHeight);
        }

        const pdfBytes = doc.output('arraybuffer');

        return new Response(pdfBytes, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${config.photographer_name.replace(/\s+/g, '_')}_Packages.pdf"`
            }
        });
    } catch (error) {
        console.error('Error generating PDF:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

// Design 1: Colored header with gradient
function renderDesign1(doc, packages, primary, secondary, pageWidth, pageHeight) {
    const boxWidth = 82;
    const boxHeight = 145;
    const startY = 45;
    const spacing = 10;
    const totalWidth = (boxWidth * 3) + (spacing * 2);
    const startX = (pageWidth - totalWidth) / 2;

    packages.forEach((pkg, index) => {
        const x = startX + (index * (boxWidth + spacing));
        
        // Shadow
        doc.setFillColor(0, 0, 0);
        doc.setGState(new doc.GState({ opacity: 0.08 }));
        doc.roundedRect(x + 1, startY + 1.5, boxWidth, boxHeight, 4, 4, 'F');
        doc.setGState(new doc.GState({ opacity: 1 }));

        // White card
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(x, startY, boxWidth, boxHeight, 4, 4, 'F');

        // Gradient header (simulated)
        for (let i = 0; i < 40; i++) {
            const ratio = i / 40;
            const r = Math.round(primary.r + (secondary.r - primary.r) * ratio);
            const g = Math.round(primary.g + (secondary.g - primary.g) * ratio);
            const b = Math.round(primary.b + (secondary.b - primary.b) * ratio);
            doc.setFillColor(r, g, b);
            doc.rect(x, startY + i, boxWidth, 1, 'F');
        }

        let currentY = startY + 10;

        // Popular badge
        if (pkg.isPopular) {
            doc.setFontSize(7);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(255, 255, 255);
            doc.text('MOST POPULAR', x + boxWidth / 2, currentY, { align: 'center' });
            currentY += 6;
        } else {
            currentY += 8;
        }

        // Title
        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(pkg.title, x + boxWidth / 2, currentY, { align: 'center' });

        // Price
        currentY += 10;
        doc.setFontSize(32);
        doc.text(`$${pkg.price}`, x + boxWidth / 2, currentY, { align: 'center' });

        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.text('starting price', x + boxWidth / 2, currentY + 5, { align: 'center' });

        currentY = startY + 48;

        // Description
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        const descLines = doc.splitTextToSize(pkg.description, boxWidth - 12);
        doc.text(descLines, x + boxWidth / 2, currentY, { align: 'center', lineHeightFactor: 1.5 });

        currentY += 12;

        // Stats
        const statBoxWidth = 24;
        const statSpacing = 2;
        const statsStartX = x + (boxWidth - (statBoxWidth * 3 + statSpacing * 2)) / 2;
        
        const stats = [
            { value: pkg.photo_count, label: 'Photos' },
            { value: pkg.session_length, label: 'Time' },
            { value: pkg.turnaround, label: 'Delivery' }
        ];

        stats.forEach((stat, idx) => {
            const statX = statsStartX + (idx * (statBoxWidth + statSpacing));
            doc.setFillColor(245, 245, 245);
            doc.roundedRect(statX, currentY, statBoxWidth, 12, 2, 2, 'F');
            
            doc.setFontSize(8);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(30, 30, 30);
            doc.text(stat.value, statX + statBoxWidth / 2, currentY + 5, { align: 'center' });
            
            doc.setFontSize(6);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(150, 150, 150);
            doc.text(stat.label, statX + statBoxWidth / 2, currentY + 9, { align: 'center' });
        });

        currentY += 18;

        // Features title
        doc.setFontSize(7);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(150, 150, 150);
        doc.text('INCLUDED', x + boxWidth / 2, currentY, { align: 'center' });

        currentY += 6;

        // Features
        doc.setFontSize(7);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(60, 60, 60);
        pkg.features.slice(0, 5).forEach((feature) => {
            if (currentY < startY + boxHeight - 8) {
                // Checkmark circle
                doc.setFillColor(primary.r, primary.g, primary.b);
                doc.circle(x + 8, currentY - 0.5, 1.8, 'F');
                
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(6);
                doc.text('✓', x + 8, currentY + 0.5, { align: 'center' });
                
                // Feature text
                doc.setFontSize(7);
                doc.setTextColor(60, 60, 60);
                const lines = doc.splitTextToSize(feature, boxWidth - 16);
                doc.text(lines[0].substring(0, 35), x + 12, currentY);
                currentY += 5;
            }
        });
    });
}

// Design 2: Minimal with borders
function renderDesign2(doc, packages, primary, secondary, pageWidth, pageHeight) {
    const boxWidth = 82;
    const boxHeight = 145;
    const startY = 45;
    const spacing = 10;
    const totalWidth = (boxWidth * 3) + (spacing * 2);
    const startX = (pageWidth - totalWidth) / 2;

    packages.forEach((pkg, index) => {
        const x = startX + (index * (boxWidth + spacing));
        
        // Shadow
        doc.setFillColor(0, 0, 0);
        doc.setGState(new doc.GState({ opacity: 0.08 }));
        doc.roundedRect(x + 1, startY + 1.5, boxWidth, boxHeight, 5, 5, 'F');
        doc.setGState(new doc.GState({ opacity: 1 }));

        // White card
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(x, startY, boxWidth, boxHeight, 5, 5, 'F');

        // Border
        if (pkg.isPopular) {
            doc.setDrawColor(primary.r, primary.g, primary.b);
            doc.setLineWidth(0.8);
        } else {
            doc.setDrawColor(229, 229, 229);
            doc.setLineWidth(0.5);
        }
        doc.roundedRect(x, startY, boxWidth, boxHeight, 5, 5, 'S');

        let currentY = startY + 10;

        // Popular badge
        if (pkg.isPopular) {
            doc.setFillColor(primary.r, primary.g, primary.b);
            doc.roundedRect(x + 10, currentY - 3, boxWidth - 20, 6, 2, 2, 'F');
            doc.setFontSize(6);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(255, 255, 255);
            doc.text('★ BEST VALUE', x + boxWidth / 2, currentY + 1, { align: 'center' });
            currentY += 10;
        } else {
            currentY += 5;
        }

        // Title
        doc.setFontSize(16);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(40, 40, 40);
        doc.text(pkg.title, x + boxWidth / 2, currentY, { align: 'center' });

        // Price
        currentY += 14;
        doc.setFontSize(36);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(primary.r, primary.g, primary.b);
        doc.text(`$${pkg.price}`, x + boxWidth / 2, currentY, { align: 'center' });

        doc.setFontSize(7);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(140, 140, 140);
        doc.text('per session', x + boxWidth / 2, currentY + 5, { align: 'center' });

        currentY += 12;

        // Description
        doc.setFontSize(7);
        doc.setTextColor(100, 100, 100);
        const descLines = doc.splitTextToSize(pkg.description, boxWidth - 16);
        doc.text(descLines, x + boxWidth / 2, currentY, { align: 'center', lineHeightFactor: 1.6 });

        currentY += 12;

        // Stats inline
        doc.setFontSize(7);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(30, 30, 30);
        const statsText = `${pkg.photo_count}  •  ${pkg.session_length}  •  ${pkg.turnaround}`;
        doc.text(statsText, x + boxWidth / 2, currentY, { align: 'center' });

        doc.setFontSize(6);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(140, 140, 140);
        doc.text('Photos     Duration     Delivery', x + boxWidth / 2, currentY + 4, { align: 'center' });

        currentY += 12;

        // Separator
        doc.setDrawColor(240, 240, 240);
        doc.setLineWidth(0.3);
        doc.line(x + 10, currentY, x + boxWidth - 10, currentY);

        currentY += 6;

        // Features
        doc.setFontSize(7);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(60, 60, 60);
        pkg.features.slice(0, 5).forEach((feature) => {
            if (currentY < startY + boxHeight - 10) {
                // Checkmark
                doc.setTextColor(secondary.r, secondary.g, secondary.b);
                doc.text('✓', x + 10, currentY);
                
                doc.setTextColor(60, 60, 60);
                const lines = doc.splitTextToSize(feature, boxWidth - 20);
                doc.text(lines[0].substring(0, 30), x + 15, currentY);
                currentY += 5;
            }
        });
    });
}

// Design 3: Full gradient cards
function renderDesign3(doc, packages, primary, secondary, pageWidth, pageHeight) {
    const boxWidth = 82;
    const boxHeight = 145;
    const startY = 45;
    const spacing = 10;
    const totalWidth = (boxWidth * 3) + (spacing * 2);
    const startX = (pageWidth - totalWidth) / 2;

    packages.forEach((pkg, index) => {
        const x = startX + (index * (boxWidth + spacing));
        
        // Shadow
        doc.setFillColor(0, 0, 0);
        doc.setGState(new doc.GState({ opacity: 0.12 }));
        doc.roundedRect(x + 1, startY + 2, boxWidth, boxHeight, 5, 5, 'F');
        doc.setGState(new doc.GState({ opacity: 1 }));

        // Gradient card
        for (let i = 0; i < boxHeight; i++) {
            const ratio = i / boxHeight;
            const r = Math.round(primary.r + (secondary.r - primary.r) * ratio);
            const g = Math.round(primary.g + (secondary.g - primary.g) * ratio);
            const b = Math.round(primary.b + (secondary.b - primary.b) * ratio);
            doc.setFillColor(r, g, b);
            doc.rect(x, startY + i, boxWidth, 1, 'F');
        }

        // Round the corners by overlaying
        doc.setFillColor(250, 250, 250);
        doc.circle(x, startY, 5, 'F');
        doc.circle(x + boxWidth, startY, 5, 'F');
        doc.circle(x, startY + boxHeight, 5, 'F');
        doc.circle(x + boxWidth, startY + boxHeight, 5, 'F');

        let currentY = startY + 12;

        // Title and badge
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(pkg.title, x + 10, currentY);

        if (pkg.isPopular) {
            doc.setFillColor(255, 255, 255);
            doc.setGState(new doc.GState({ opacity: 0.2 }));
            doc.roundedRect(x + boxWidth - 25, currentY - 6, 20, 6, 2, 2, 'F');
            doc.setGState(new doc.GState({ opacity: 1 }));
            
            doc.setFontSize(6);
            doc.setFont(undefined, 'bold');
            doc.text('Popular', x + boxWidth - 15, currentY - 2, { align: 'center' });
        }

        // Price
        currentY += 14;
        doc.setFontSize(36);
        doc.text(`$${pkg.price}`, x + boxWidth / 2, currentY, { align: 'center' });

        doc.setFontSize(7);
        doc.setFont(undefined, 'normal');
        doc.setGState(new doc.GState({ opacity: 0.9 }));
        doc.text('starting price', x + boxWidth / 2, currentY + 5, { align: 'center' });
        doc.setGState(new doc.GState({ opacity: 1 }));

        currentY += 14;

        // Description
        doc.setFontSize(7);
        doc.setGState(new doc.GState({ opacity: 0.95 }));
        const descLines = doc.splitTextToSize(pkg.description, boxWidth - 12);
        doc.text(descLines, x + boxWidth / 2, currentY, { align: 'center', lineHeightFactor: 1.5 });
        doc.setGState(new doc.GState({ opacity: 1 }));

        currentY += 12;

        // Stats boxes
        const statBoxWidth = 24;
        const statSpacing = 2;
        const statsStartX = x + (boxWidth - (statBoxWidth * 3 + statSpacing * 2)) / 2;
        
        const stats = [
            { value: pkg.photo_count, label: 'Photos' },
            { value: pkg.session_length, label: 'Time' },
            { value: pkg.turnaround, label: 'Delivery' }
        ];

        stats.forEach((stat, idx) => {
            const statX = statsStartX + (idx * (statBoxWidth + statSpacing));
            doc.setFillColor(255, 255, 255);
            doc.setGState(new doc.GState({ opacity: 0.1 }));
            doc.roundedRect(statX, currentY, statBoxWidth, 12, 2, 2, 'F');
            doc.setGState(new doc.GState({ opacity: 1 }));
            
            doc.setFontSize(8);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(255, 255, 255);
            doc.text(stat.value, statX + statBoxWidth / 2, currentY + 5, { align: 'center' });
            
            doc.setFontSize(6);
            doc.setGState(new doc.GState({ opacity: 0.8 }));
            doc.text(stat.label, statX + statBoxWidth / 2, currentY + 9, { align: 'center' });
            doc.setGState(new doc.GState({ opacity: 1 }));
        });

        currentY += 18;

        // Features
        doc.setFontSize(7);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(255, 255, 255);
        pkg.features.slice(0, 5).forEach((feature) => {
            if (currentY < startY + boxHeight - 10) {
                // Checkmark circle
                doc.setFillColor(255, 255, 255);
                doc.setGState(new doc.GState({ opacity: 0.2 }));
                doc.circle(x + 10, currentY - 0.5, 1.8, 'F');
                doc.setGState(new doc.GState({ opacity: 1 }));
                
                doc.setFontSize(6);
                doc.text('✓', x + 10, currentY + 0.5, { align: 'center' });
                
                doc.setFontSize(7);
                const lines = doc.splitTextToSize(feature, boxWidth - 20);
                doc.text(lines[0].substring(0, 30), x + 14, currentY);
                currentY += 5;
            }
        });
    });
}

// Design 4: Dark theme
function renderDesign4(doc, packages, primary, secondary, pageWidth, pageHeight) {
    const boxWidth = 82;
    const boxHeight = 145;
    const startY = 45;
    const spacing = 10;
    const totalWidth = (boxWidth * 3) + (spacing * 2);
    const startX = (pageWidth - totalWidth) / 2;

    packages.forEach((pkg, index) => {
        const x = startX + (index * (boxWidth + spacing));
        
        // Shadow
        doc.setFillColor(0, 0, 0);
        doc.setGState(new doc.GState({ opacity: 0.15 }));
        doc.roundedRect(x + 1, startY + 2, boxWidth, boxHeight, 4, 4, 'F');
        doc.setGState(new doc.GState({ opacity: 1 }));

        // Dark gradient card
        for (let i = 0; i < boxHeight; i++) {
            const ratio = i / boxHeight;
            const darkness = 26 + (10 * ratio);
            doc.setFillColor(darkness, darkness, darkness);
            doc.rect(x, startY + i, boxWidth, 1, 'F');
        }

        let currentY = startY + 12;

        // Popular badge
        if (pkg.isPopular) {
            doc.setFontSize(7);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(secondary.r, secondary.g, secondary.b);
            doc.text('★ RECOMMENDED', x + 10, currentY);
            currentY += 8;
        } else {
            currentY += 5;
        }

        // Title
        doc.setFontSize(18);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(255, 255, 255);
        doc.text(pkg.title, x + 10, currentY);

        // Border accent
        currentY += 2;
        doc.setDrawColor(primary.r, primary.g, primary.b);
        doc.setLineWidth(1);
        doc.line(x + 10, currentY, x + 10, currentY + 16);

        // Price
        currentY += 8;
        doc.setFontSize(32);
        doc.setFont(undefined, 'bold');
        doc.text(`$${pkg.price}`, x + 16, currentY);

        doc.setFontSize(7);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(160, 160, 160);
        doc.text('starting investment', x + 16, currentY + 5);

        currentY += 14;

        // Description
        doc.setFontSize(7);
        doc.setTextColor(200, 200, 200);
        const descLines = doc.splitTextToSize(pkg.description, boxWidth - 16);
        doc.text(descLines, x + 8, currentY, { lineHeightFactor: 1.5 });

        currentY += 12;

        // Stats horizontal
        const statBoxWidth = 24;
        const statSpacing = 2;
        const statsStartX = x + (boxWidth - (statBoxWidth * 3 + statSpacing * 2)) / 2;
        
        const stats = [
            { value: pkg.photo_count, label: 'Images' },
            { value: pkg.session_length, label: 'Coverage' },
            { value: pkg.turnaround, label: 'Ready' }
        ];

        stats.forEach((stat, idx) => {
            const statX = statsStartX + (idx * (statBoxWidth + statSpacing));
            doc.setFillColor(255, 255, 255);
            doc.setGState(new doc.GState({ opacity: 0.05 }));
            doc.roundedRect(statX, currentY, statBoxWidth, 11, 2, 2, 'F');
            doc.setGState(new doc.GState({ opacity: 1 }));
            
            doc.setFontSize(8);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(255, 255, 255);
            doc.text(stat.value, statX + statBoxWidth / 2, currentY + 5, { align: 'center' });
            
            doc.setFontSize(6);
            doc.setTextColor(160, 160, 160);
            doc.text(stat.label, statX + statBoxWidth / 2, currentY + 9, { align: 'center' });
        });

        currentY += 16;

        // Features
        doc.setFontSize(7);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(200, 200, 200);
        pkg.features.slice(0, 5).forEach((feature) => {
            if (currentY < startY + boxHeight - 10) {
                doc.setTextColor(primary.r, primary.g, primary.b);
                doc.text('✓', x + 10, currentY);
                
                doc.setTextColor(200, 200, 200);
                const lines = doc.splitTextToSize(feature, boxWidth - 20);
                doc.text(lines[0].substring(0, 30), x + 15, currentY);
                currentY += 5;
            }
        });
    });
}

// Design 5: Colorful minimal
function renderDesign5(doc, packages, primary, secondary, pageWidth, pageHeight) {
    const boxWidth = 82;
    const boxHeight = 145;
    const startY = 45;
    const spacing = 10;
    const totalWidth = (boxWidth * 3) + (spacing * 2);
    const startX = (pageWidth - totalWidth) / 2;

    packages.forEach((pkg, index) => {
        const x = startX + (index * (boxWidth + spacing));
        
        // Shadow
        doc.setFillColor(0, 0, 0);
        doc.setGState(new doc.GState({ opacity: 0.08 }));
        doc.roundedRect(x + 1, startY + 1.5, boxWidth, boxHeight, 5, 5, 'F');
        doc.setGState(new doc.GState({ opacity: 1 }));

        // White card
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(x, startY, boxWidth, boxHeight, 5, 5, 'F');

        let currentY = startY + 12;

        // Header with border
        doc.setDrawColor(primary.r, primary.g, primary.b);
        doc.setGState(new doc.GState({ opacity: 0.2 }));
        doc.setLineWidth(0.5);
        doc.line(x + 10, currentY + 4, x + boxWidth - 10, currentY + 4);
        doc.setGState(new doc.GState({ opacity: 1 }));

        doc.setFontSize(16);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(40, 40, 40);
        doc.text(pkg.title, x + 10, currentY);

        if (pkg.isPopular) {
            doc.setTextColor(primary.r, primary.g, primary.b);
            doc.text('✦', x + boxWidth - 15, currentY);
        }

        currentY += 12;

        // Price box
        doc.setFillColor(primary.r, primary.g, primary.b);
        doc.setGState(new doc.GState({ opacity: 0.1 }));
        doc.roundedRect(x + 10, currentY, boxWidth - 20, 24, 3, 3, 'F');
        doc.setGState(new doc.GState({ opacity: 1 }));

        doc.setFontSize(32);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(primary.r, primary.g, primary.b);
        doc.text(`$${pkg.price}`, x + boxWidth / 2, currentY + 14, { align: 'center' });

        doc.setFontSize(7);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('starting at', x + boxWidth / 2, currentY + 20, { align: 'center' });

        currentY += 30;

        // Description
        doc.setFontSize(7);
        doc.setTextColor(100, 100, 100);
        const descLines = doc.splitTextToSize(pkg.description, boxWidth - 20);
        doc.text(descLines, x + boxWidth / 2, currentY, { align: 'center', lineHeightFactor: 1.6 });

        currentY += 12;

        // Colored stat boxes
        const statBoxWidth = 24;
        const statSpacing = 2;
        const statsStartX = x + (boxWidth - (statBoxWidth * 3 + statSpacing * 2)) / 2;
        
        const stats = [
            { value: pkg.photo_count, label: 'Photos' },
            { value: pkg.session_length, label: 'Duration' },
            { value: pkg.turnaround, label: 'Delivery' }
        ];

        stats.forEach((stat, idx) => {
            const statX = statsStartX + (idx * (statBoxWidth + statSpacing));
            doc.setFillColor(secondary.r, secondary.g, secondary.b);
            doc.roundedRect(statX, currentY, statBoxWidth, 12, 2, 2, 'F');
            
            doc.setFontSize(7);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(255, 255, 255);
            doc.text(stat.value, statX + statBoxWidth / 2, currentY + 5, { align: 'center' });
            
            doc.setFontSize(5);
            doc.setGState(new doc.GState({ opacity: 0.9 }));
            doc.text(stat.label, statX + statBoxWidth / 2, currentY + 9, { align: 'center' });
            doc.setGState(new doc.GState({ opacity: 1 }));
        });

        currentY += 17;

        // Features with alternating background
        doc.setFontSize(7);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(60, 60, 60);
        pkg.features.slice(0, 5).forEach((feature, idx) => {
            if (currentY < startY + boxHeight - 10) {
                if (idx % 2 === 1) {
                    doc.setFillColor(primary.r, primary.g, primary.b);
                    doc.setGState(new doc.GState({ opacity: 0.05 }));
                    doc.roundedRect(x + 6, currentY - 2.5, boxWidth - 12, 5, 1, 1, 'F');
                    doc.setGState(new doc.GState({ opacity: 1 }));
                }
                
                // Checkmark box
                doc.setFillColor(primary.r, primary.g, primary.b);
                doc.roundedRect(x + 10, currentY - 2, 4, 4, 1, 1, 'F');
                
                doc.setFontSize(5);
                doc.setTextColor(255, 255, 255);
                doc.text('✓', x + 12, currentY + 0.5, { align: 'center' });
                
                doc.setFontSize(7);
                doc.setTextColor(60, 60, 60);
                const lines = doc.splitTextToSize(feature, boxWidth - 24);
                doc.text(lines[0].substring(0, 30), x + 16, currentY);
                currentY += 5.5;
            }
        });
    });
}