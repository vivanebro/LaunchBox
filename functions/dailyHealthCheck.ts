import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const issues = [];
  const fixes = [];

  // 1. Check all PackageConfig records for known data problems
  const packages = await base44.asServiceRole.entities.PackageConfig.list();

  for (const pkg of packages) {
    const pkgLabel = pkg.package_set_name || pkg.id;

    // Check: popularPackageIndex should be an object, not a number
    if (typeof pkg.popularPackageIndex === 'number') {
      const val = pkg.popularPackageIndex;
      await base44.asServiceRole.entities.PackageConfig.update(pkg.id, {
        popularPackageIndex: { onetime: val, retainer: val }
      });
      fixes.push(`"${pkgLabel}" — Fixed popularPackageIndex (was a number, now an object)`);
    } else if (pkg.popularPackageIndex === null || pkg.popularPackageIndex === undefined) {
      await base44.asServiceRole.entities.PackageConfig.update(pkg.id, {
        popularPackageIndex: { onetime: 2, retainer: 2 }
      });
      fixes.push(`"${pkgLabel}" — Fixed missing popularPackageIndex`);
    }

    // Check: package_descriptions should have onetime/retainer structure
    if (pkg.package_descriptions && !pkg.package_descriptions.onetime) {
      const old = pkg.package_descriptions || {};
      const fixed = {
        onetime: {
          starter: old.starter || '',
          growth: old.growth || '',
          premium: old.premium || '',
          elite: old.elite || ''
        },
        retainer: {
          starter: old.starter || '',
          growth: old.growth || '',
          premium: old.premium || '',
          elite: old.elite || ''
        }
      };
      await base44.asServiceRole.entities.PackageConfig.update(pkg.id, {
        package_descriptions: fixed
      });
      fixes.push(`"${pkgLabel}" — Fixed package_descriptions structure`);
    }

    // Check: button_links should have onetime/retainer structure
    if (pkg.button_links && !pkg.button_links.onetime) {
      const old = pkg.button_links || {};
      const fixed = {
        onetime: {
          starter: old.starter || '',
          growth: old.growth || '',
          premium: old.premium || '',
          elite: old.elite || ''
        },
        retainer: {
          starter: old.starter || '',
          growth: old.growth || '',
          premium: old.premium || '',
          elite: old.elite || ''
        }
      };
      await base44.asServiceRole.entities.PackageConfig.update(pkg.id, {
        button_links: fixed
      });
      fixes.push(`"${pkgLabel}" — Fixed button_links structure`);
    }

    // Check: package_names should have onetime/retainer structure
    if (pkg.package_names && !pkg.package_names.onetime) {
      const old = pkg.package_names || {};
      const fixed = {
        onetime: {
          starter: old.starter || 'Starter',
          growth: old.growth || 'Growth',
          premium: old.premium || 'Premium',
          elite: old.elite || 'Elite'
        },
        retainer: {
          starter: old.starter || 'Starter',
          growth: old.growth || 'Growth',
          premium: old.premium || 'Premium',
          elite: old.elite || 'Elite'
        }
      };
      await base44.asServiceRole.entities.PackageConfig.update(pkg.id, {
        package_names: fixed
      });
      fixes.push(`"${pkgLabel}" — Fixed package_names structure`);
    }

    // Check: missing active_packages
    if (!pkg.active_packages) {
      await base44.asServiceRole.entities.PackageConfig.update(pkg.id, {
        active_packages: {
          onetime: ['starter', 'growth', 'premium'],
          retainer: ['starter', 'growth', 'premium']
        }
      });
      fixes.push(`"${pkgLabel}" — Added missing active_packages`);
    }

    // Check: missing package_data
    if (!pkg.package_data) {
      issues.push(`"${pkgLabel}" — Missing package_data entirely (needs manual review)`);
    }

    // Check: missing prices
    if (!pkg.price_starter && pkg.price_starter !== 0) {
      issues.push(`"${pkgLabel}" — Missing starter price`);
    }
    if (!pkg.price_growth && pkg.price_growth !== 0) {
      issues.push(`"${pkgLabel}" — Missing growth price`);
    }
    if (!pkg.price_premium && pkg.price_premium !== 0) {
      issues.push(`"${pkgLabel}" — Missing premium price`);
    }
  }

  // Build the report
  const totalPackages = packages.length;
  const reportLines = [];
  reportLines.push(`LaunchBox Daily Health Check`);
  reportLines.push(`Date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`);
  reportLines.push(`Total packages in system: ${totalPackages}`);
  reportLines.push('');

  if (fixes.length === 0 && issues.length === 0) {
    reportLines.push('✅ Everything looks good! No issues found.');
  } else {
    if (fixes.length > 0) {
      reportLines.push(`🔧 Auto-fixed (${fixes.length}):`);
      for (const fix of fixes) {
        reportLines.push(`  • ${fix}`);
      }
      reportLines.push('');
    }
    if (issues.length > 0) {
      reportLines.push(`⚠️ Needs your attention (${issues.length}):`);
      for (const issue of issues) {
        reportLines.push(`  • ${issue}`);
      }
    }
  }

  const reportText = reportLines.join('\n');

  // Determine status
  let status = 'all_clear';
  if (fixes.length > 0 && issues.length > 0) status = 'has_both';
  else if (fixes.length > 0) status = 'has_fixes';
  else if (issues.length > 0) status = 'has_issues';

  // Save report to HealthReport entity
  await base44.asServiceRole.entities.HealthReport.create({
    report_date: new Date().toISOString(),
    total_packages: totalPackages,
    auto_fixed: fixes.length,
    needs_attention: issues.length,
    fixes,
    issues,
    report_text: reportText,
    status
  });

  return Response.json({
    total_packages: totalPackages,
    auto_fixed: fixes.length,
    needs_attention: issues.length,
    fixes,
    issues,
    report: reportText
  });
  } catch (error) {
    console.error('Health check error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});