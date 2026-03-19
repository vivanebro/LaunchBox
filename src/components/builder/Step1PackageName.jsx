import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Package } from 'lucide-react';
import { slugify } from '@/lib/publicPackageUrl';
import supabaseClient from '@/lib/supabaseClient';

export default function Step1PackageName({ data, onChange, onNext }) {
  const [resolvedCreatorSlug, setResolvedCreatorSlug] = useState('');
  const [resolvedPackageSlug, setResolvedPackageSlug] = useState('');

  useEffect(() => {
    let isMounted = true;

    const resolveSlugs = async () => {
      try {
        // Prefer persisted package slugs when editing an existing package.
        if (data?.id) {
          const pkg = await supabaseClient.entities.PackageConfig.get(data.id);
          if (isMounted && pkg) {
            if (pkg.creator_slug) setResolvedCreatorSlug(pkg.creator_slug);
            if (pkg.public_slug) setResolvedPackageSlug(pkg.public_slug);
          }
        }

        // Fall back to the authenticated user's saved creator slug.
        if (!data?.creator_slug) {
          const currentUser = await supabaseClient.auth.me();
          if (isMounted && currentUser?.creator_slug) {
            setResolvedCreatorSlug(currentUser.creator_slug);
          }
        }
      } catch (error) {
        // Silent fallback to local values below.
      }
    };

    resolveSlugs();
    return () => {
      isMounted = false;
    };
  }, [data?.id, data?.creator_slug]);

  const previewCreatorSlug = slugify(
    resolvedCreatorSlug || data.creator_slug || data.business_name || 'your-name',
    'your-name'
  );
  const previewPackageSlug = slugify(
    resolvedPackageSlug || data.public_slug || data.package_set_name || 'package-name',
    'your-package'
  );
  const previewPath = `/${previewCreatorSlug}/${previewPackageSlug}`;
  const fullPreviewUrl = `https://launch-box.io${previewPath}`;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-4xl font-bold mb-4 text-gray-900">Name your package set</h2>
        <p className="text-gray-600 mb-2">Give this package set a name so you can find it easily later</p>
        <p className="text-sm text-gray-500 italic">
          (Client will preview on this link: <span className="not-italic text-gray-700">{fullPreviewUrl}</span>)
        </p>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            value={data.package_set_name || ''}
            onChange={(e) => onChange({ package_set_name: e.target.value })}
            className="h-14 pl-12 text-lg bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
            placeholder="e.g., Wedding Package 2025, Corporate Video Prices, etc."
            autoFocus />

        </div>
      </div>
    </div>);

}