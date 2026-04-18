import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import supabaseClient from '@/lib/supabaseClient';
import {
  Trash2,
  Edit,
  Loader2,
  Eye,
  Share2,
  Send,
  Copy,
  Check,
  X,
  Code,
  BarChart3,
} from 'lucide-react';
import AssignFolderMenu from '@/components/folders/AssignFolderMenu';
import CopyLinkFolderPrompt from '@/components/folders/CopyLinkFolderPrompt';
import { createPageUrl } from '@/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { fetchAnalyticsForPackages } from '@/lib/packageAnalytics';
import { getPublicPreviewPath } from '@/lib/publicPackageUrl';
import { toast } from '@/components/ui/use-toast';
import {
  computeEngagementStatus,
  formatRelativeTimeNatural,
  getStatusSortRank,
} from '@/lib/packageStatus';
import { StatusDot, mapStatusToDotKind } from '@/components/packages/StatusDot';
import { PackageAnalyticsPanel } from '@/components/packages/PackageAnalyticsPanel';
import { SendPackageDialog } from '@/components/packages/SendPackageDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const COPY_TOASTS = [
  'Link copied. Go get \'em.',
  'Copied. Time to close.',
  'Link ready. Send it.',
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function latestActivityMs(a) {
  const lv = a?.lastViewed ? new Date(a.lastViewed).getTime() : 0;
  const lc = a?.lastClickAt ? new Date(a.lastClickAt).getTime() : 0;
  return Math.max(lv, lc);
}

const getCurrencySymbol = (currency) => {
  const symbols = { USD: '$', EUR: '€', GBP: '£', AUD: 'A$', ILS: '₪' };
  return symbols[currency] || '$';
};

export default function MyPackages() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [copying, setCopying] = useState(null);
  const [duplicating, setDuplicating] = useState(null);
  const [editingName, setEditingName] = useState(null);
  const [editedName, setEditedName] = useState('');
  const [analytics, setAnalytics] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [panelOpenId, setPanelOpenId] = useState(null);
  const [confirmWonLost, setConfirmWonLost] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [copyPromptPkg, setCopyPromptPkg] = useState(null);
  const [sendDialog, setSendDialog] = useState({ open: false, pkgId: null });

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    setLoading(true);
    try {
      const user = await supabaseClient.auth.me();
      setCurrentUser(user);
      const fetchedPackages = await supabaseClient.entities.PackageConfig.filter(
        { created_by: user.id },
        '-created_date'
      );
      setPackages(fetchedPackages);
      if (fetchedPackages.length > 0) {
        const analyticsData = await fetchAnalyticsForPackages(fetchedPackages.map((p) => p.id));
        setAnalytics(analyticsData);
      } else {
        setAnalytics({});
      }
    } catch (error) {
      console.error('Error loading packages:', error);
    }
    setLoading(false);
  };

  const sortedPackages = useMemo(() => {
    return packages.slice().sort((pa, pb) => {
      const aa = analytics[pa.id] || {};
      const ab = analytics[pb.id] || {};
      const sa = computeEngagementStatus({
        pkg: pa,
        manualStatus: pa.manual_status || null,
        views: aa.views || 0,
        lastViewedAt: aa.lastViewed || null,
        lastClickAt: aa.lastClickAt || null,
        mostRecentClick: aa.mostRecentClick || null,
      });
      const sb = computeEngagementStatus({
        pkg: pb,
        manualStatus: pb.manual_status || null,
        views: ab.views || 0,
        lastViewedAt: ab.lastViewed || null,
        lastClickAt: ab.lastClickAt || null,
        mostRecentClick: ab.mostRecentClick || null,
      });
      const ra = getStatusSortRank(sa);
      const rb = getStatusSortRank(sb);
      if (ra !== rb) return ra - rb;
      return latestActivityMs(ab) - latestActivityMs(aa);
    });
  }, [packages, analytics]);

  const handleEdit = (pkg) => {
    localStorage.setItem('packageConfig', JSON.stringify(pkg));
    window.location.href = `${createPageUrl('Results')}?packageId=${pkg.id}`;
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this package?')) return;
    setDeleting(id);
    try {
      await supabaseClient.entities.PackageConfig.delete(id);
      await loadPackages();
    } catch (error) {
      console.error('Error deleting package:', error);
      alert('Failed to delete package.');
    }
    setDeleting(null);
  };

  const handlePreview = (pkg) => {
    localStorage.setItem('packageConfig', JSON.stringify(pkg));
    getPublicPreviewPath(pkg, currentUser)
      .then((previewPath) => window.open(previewPath, '_blank'))
      .catch((error) => {
        console.error('Error generating preview URL:', error);
        window.open(`${createPageUrl('Results')}?preview=true&packageId=${pkg.id}`, '_blank');
      });
  };

  const handleCopyLink = async (pkg) => {
    setCopying(pkg.id);
    try {
      const baseUrl = window.location.origin;
      const previewPath = await getPublicPreviewPath(pkg, currentUser);
      await navigator.clipboard.writeText(baseUrl + previewPath);
      setSendDialog({ open: true, pkgId: pkg.id });
    } catch (error) {
      console.error('Error copying link:', error);
      alert('Failed to copy link');
    }
    setCopying(null);
  };

  const handleSendMarked = () => {
    setPackages((prev) =>
      prev.map((p) =>
        p.id === sendDialog.pkgId
          ? { ...p, marked_sent_count: (p.marked_sent_count || 0) + 1 }
          : p
      )
    );
  };


  const handleCopyEmbed = async (pkg) => {
    setCopying(`embed-${pkg.id}`);
    try {
      const baseUrl = window.location.origin;
      const previewPath = await getPublicPreviewPath(pkg, currentUser);
      const previewUrl = new URL(baseUrl + previewPath);
      previewUrl.searchParams.set('embed', 'true');
      const iframeId = `launchbox-embed-${pkg.id}`;
      const embedCode = `<iframe id="${iframeId}" src="${previewUrl.toString()}" width="100%" style="border:0;border-radius:12px;min-height:800px;" scrolling="no"></iframe>
<script>
(function() {
  var iframe = document.getElementById('${iframeId}');
  if (!iframe) return;
  function onMessage(event) {
    if (!event.data || event.data.type !== 'launchbox:embedHeight') return;
    if (typeof event.data.height !== 'number') return;
    iframe.style.height = Math.max(800, event.data.height) + 'px';
  }
  window.addEventListener('message', onMessage);
})();
</script>`;
      await navigator.clipboard.writeText(embedCode);
      setTimeout(() => setCopying(null), 2000);
    } catch (error) {
      console.error('Error copying embed code:', error);
      alert('Failed to copy embed code');
      setCopying(null);
    }
  };

  const handleDuplicate = async (pkg) => {
    setDuplicating(pkg.id);
    try {
      const { id, created_date, updated_date, created_by, created_by_id, entity_name, app_id, is_sample, is_deleted, deleted_date, environment, ...packageData } = pkg;
      const duplicatedPackage = {
        ...packageData,
        package_set_name: `${packageData.package_set_name || packageData.business_name || 'Untitled'} (Copy)`,
      };
      await supabaseClient.entities.PackageConfig.create(duplicatedPackage);
      await loadPackages();
    } catch (error) {
      console.error('Error duplicating package:', error);
      alert('Failed to duplicate package');
    }
    setDuplicating(null);
  };

  const handleStartEditName = (pkg) => {
    setEditingName(pkg.id);
    setEditedName(pkg.package_set_name || pkg.business_name || 'Untitled Package');
  };

  const handleSaveName = async (pkgId) => {
    if (!editedName.trim()) {
      alert('Package name cannot be empty');
      return;
    }
    try {
      await supabaseClient.entities.PackageConfig.update(pkgId, {
        package_set_name: editedName.trim(),
      });
      await loadPackages();
      setEditingName(null);
      setEditedName('');
    } catch (error) {
      console.error('Error updating package name:', error);
      alert('Failed to update package name');
    }
  };

  const handleCancelEditName = () => {
    setEditingName(null);
    setEditedName('');
  };

  const setManualStatus = async (pkgId, status) => {
    try {
      await supabaseClient.entities.PackageConfig.update(pkgId, {
        manual_status: status,
        manual_status_updated_at: new Date().toISOString(),
      });
      await loadPackages();
      if (status === 'won') {
        confetti({ particleCount: 120, spread: 70, origin: { y: 0.65 } });
        const t = toast({ title: 'Deal closed! 🎉' });
        setTimeout(() => t.dismiss(), 2000);
      } else if (status === 'lost') {
        const t = toast({ title: 'Noted. On to the next one.' });
        setTimeout(() => t.dismiss(), 2000);
      }
    } catch (e) {
      console.error(e);
      alert('Could not update status');
    }
  };

  const clearManualStatus = async (pkgId) => {
    try {
      await supabaseClient.entities.PackageConfig.update(pkgId, {
        manual_status: null,
        manual_status_updated_at: new Date().toISOString(),
      });
      await loadPackages();
    } catch (e) {
      console.error(e);
      alert('Could not undo');
    }
  };

  const getPackageMode = (pkg) => (pkg.pricingMode === 'retainer' ? 'retainer' : 'one-time');

  const getTierPrice = (pkg, tier) => {
    const mode = getPackageMode(pkg);
    const modeKey = mode === 'retainer' ? `price_${tier}_retainer` : `price_${tier}`;
    const fallbackKey = mode === 'retainer' ? `price_${tier}` : `price_${tier}_retainer`;
    const rawValue = pkg[modeKey] ?? pkg[fallbackKey] ?? 0;
    const parsed = Number(rawValue);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const getTierLabel = (pkg, tier) => {
    const mode = getPackageMode(pkg);
    const modeKey = mode === 'retainer' ? 'retainer' : 'onetime';
    const fallbackKey = mode === 'retainer' ? 'onetime' : 'retainer';
    return pkg.package_names?.[modeKey]?.[tier] || pkg.package_names?.[fallbackKey]?.[tier] || tier.charAt(0).toUpperCase() + tier.slice(1);
  };

  const panelPkg = useMemo(
    () => sortedPackages.find((p) => p.id === panelOpenId) || null,
    [sortedPackages, panelOpenId]
  );
  const panelAnalytics = panelPkg ? analytics[panelPkg.id] : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F7' }}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#ff0044] mx-auto mb-4" />
          <p className="text-gray-600">Loading your packages...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen" style={{ backgroundColor: '#F5F5F7' }}>
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-4 text-gray-900">My Packages</h1>
            <p className="text-gray-600 text-xl">All your saved pricing packages in one place</p>
          </div>

          {packages.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-block bg-white rounded-3xl p-12 border-2 border-gray-200 shadow-lg">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">No packages yet</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Create your first pricing package to get started
                </p>
                <Button
                  onClick={() => { window.location.href = createPageUrl('PackageBuilder'); }}
                  className="text-white rounded-full"
                  style={{ background: 'linear-gradient(135deg, #ff0044 0%, #ff3366 100%)' }}
                >
                  Create Package
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence>
                {sortedPackages.map((pkg) => {
                  const a = analytics[pkg.id] || {};
                  const status = computeEngagementStatus({
                    pkg,
                    manualStatus: pkg.manual_status || null,
                    views: a.views || 0,
                    lastViewedAt: a.lastViewed || null,
                    lastClickAt: a.lastClickAt || null,
                    mostRecentClick: a.mostRecentClick || null,
                  });
                  const dotKind = mapStatusToDotKind(status);
                  const currencySymbol = getCurrencySymbol(pkg.currency || 'USD');
                  const starterPrice = getTierPrice(pkg, 'starter');
                  const growthPrice = getTierPrice(pkg, 'growth');
                  const premiumPrice = getTierPrice(pkg, 'premium');
                  const manual = pkg.manual_status;
                  const hasAnalyticsOpen = !!panelOpenId;
                  const isAnalyticsSelected = panelOpenId === pkg.id;
                  const cardClassName = hasAnalyticsOpen
                    ? isAnalyticsSelected
                      ? 'bg-white rounded-3xl shadow-2xl transition-all duration-300 overflow-hidden border-2 border-[#ff0044]'
                      : 'bg-white rounded-3xl shadow-md transition-all duration-300 overflow-hidden border-2 border-gray-200 opacity-60'
                    : 'bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-gray-100 hover:border-[#ff0044]';

                  return (
                    <motion.div
                      key={pkg.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className={cardClassName}
                    >
                      <div
                        className="p-6 text-white relative overflow-hidden"
                        style={{
                          background: pkg.brand_color
                            ? `linear-gradient(135deg, ${pkg.brand_color} 0%, ${pkg.brand_color}dd 100%)`
                            : 'linear-gradient(135deg, #ff0044 0%, #ff3366 100%)',
                        }}
                      >
                        <div className="absolute inset-0 bg-white opacity-0 hover:opacity-10 transition-opacity" />
                        <div className="relative z-10">
                          {editingName === pkg.id ? (
                            <div className="flex items-center gap-2 mb-2">
                              <Input
                                value={editedName}
                                onChange={(e) => setEditedName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveName(pkg.id);
                                  if (e.key === 'Escape') handleCancelEditName();
                                }}
                                className="bg-white text-gray-900 border-white/30"
                                autoFocus
                              />
                              <Button
                                onClick={() => handleSaveName(pkg.id)}
                                size="icon"
                                className="h-8 w-8 bg-white/20 hover:bg-white/30 text-white"
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                onClick={handleCancelEditName}
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 bg-white/20 hover:bg-white/30 text-white"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 mb-2 group/title">
                              <h3 className="text-xl font-bold">{pkg.package_set_name || pkg.business_name || 'Untitled Package'}</h3>
                              <button
                                type="button"
                                onClick={() => handleStartEditName(pkg)}
                                className="opacity-0 group-hover/title:opacity-100 transition-opacity p-1 hover:bg-white/20 rounded"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                          <div className="flex flex-wrap gap-2">
                            {pkg.niches?.map((niche, idx) => (
                              <Badge key={idx} className="bg-white/20 text-white border-white/30 text-xs">
                                {niche}
                              </Badge>
                            ))}
                            {pkg.from_template && (
                              <Badge className="bg-yellow-400/80 text-yellow-900 border-yellow-500/30 text-xs">
                                From Template
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="text-center">
                            <div className="text-lg font-bold text-gray-900">
                              {currencySymbol}
                              {starterPrice.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">{getTierLabel(pkg, 'starter')}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold" style={{ color: pkg.brand_color || '#ff0044' }}>
                              {currencySymbol}
                              {growthPrice.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">{getTierLabel(pkg, 'growth')}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-gray-900">
                              {currencySymbol}
                              {premiumPrice.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">{getTierLabel(pkg, 'premium')}</div>
                          </div>
                        </div>

                        <p className="text-xs text-gray-500 text-center">
                          Created {new Date(pkg.created_date).toLocaleDateString()}
                        </p>

                        {/* Status + quick stats */}
                        <div className="flex flex-wrap items-center gap-3 px-1 min-h-[28px]">
                          {manual === 'won' && (
                            <span className="inline-flex items-center gap-2 text-xs font-semibold px-2 py-1 rounded-full bg-emerald-50 text-[#0F6E56] border border-emerald-100">
                              Won
                              <button
                                type="button"
                                className="underline font-medium"
                                onClick={() => clearManualStatus(pkg.id)}
                              >
                                Undo
                              </button>
                            </span>
                          )}
                          {manual === 'lost' && (
                            <span className="inline-flex items-center gap-2 text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                              Lost
                              <button
                                type="button"
                                className="underline font-medium"
                                onClick={() => clearManualStatus(pkg.id)}
                              >
                                Undo
                              </button>
                            </span>
                          )}
                          {!manual && (
                            <div className="flex items-center gap-2">
                              {dotKind && <StatusDot kind={dotKind} />}
                              <span className="text-sm text-gray-600">
                                {(a.views || 0) === 0
                                  ? 'No views yet'
                                  : `${a.views} views · ${formatRelativeTimeNatural(a.lastViewed)}`}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {manual !== 'won' && manual !== 'lost' && (
                            <>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="rounded-full text-xs h-8"
                                onClick={() => setConfirmWonLost({ id: pkg.id, type: 'won' })}
                              >
                                Won
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="rounded-full text-xs h-8"
                                onClick={() => setConfirmWonLost({ id: pkg.id, type: 'lost' })}
                              >
                                Lost
                              </Button>
                            </>
                          )}
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="rounded-full text-xs h-8 gap-1"
                            onClick={() => setPanelOpenId(pkg.id)}
                          >
                            <BarChart3 className="w-3.5 h-3.5" />
                            View data
                          </Button>
                        </div>

                        <div className="space-y-2 pt-2">
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              onClick={() => handleEdit(pkg)}
                              className="h-10 text-white font-semibold rounded-full text-sm"
                              style={{ background: 'linear-gradient(135deg, #ff0044 0%, #ff3366 100%)' }}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              onClick={() => handlePreview(pkg)}
                              variant="outline"
                              className="h-10 border-2 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-full text-sm"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Preview
                            </Button>
                          </div>

                          {/* Hidden for launch — folder system parked
                          <div className="w-full flex justify-center py-1">
                            <AssignFolderMenu
                              packageId={pkg.id}
                              userId={currentUser?.id}
                              initialFolderId={pkg.folder_id}
                              onFolderChange={() => loadPackages()}
                              variant="outline"
                              className="w-full justify-between max-w-full"
                            />
                          </div>
                          */}

                          <div className="grid grid-cols-4 gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  onClick={() => handleCopyLink(pkg)}
                                  disabled={copying === pkg.id}
                                  variant="outline"
                                  className="h-10 border-2 border-blue-200 text-blue-600 hover:bg-blue-50 rounded-full text-sm relative"
                                >
                                  {copying === pkg.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-4 h-4" />}
                                  {(pkg.marked_sent_count || 0) > 0 && (
                                    <span className="ml-1 text-[11px] font-semibold tabular-nums">· {pkg.marked_sent_count}</span>
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Copy link and send to your client</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  onClick={() => handleCopyEmbed(pkg)}
                                  disabled={copying === `embed-${pkg.id}`}
                                  variant="outline"
                                  className="h-10 border-2 border-purple-200 text-purple-600 hover:bg-purple-50 rounded-full text-sm"
                                >
                                  {copying === `embed-${pkg.id}` ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Code className="w-4 h-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Embed</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  onClick={() => handleDuplicate(pkg)}
                                  disabled={duplicating === pkg.id}
                                  variant="outline"
                                  className="h-10 border-2 border-green-200 text-green-600 hover:bg-green-50 rounded-full text-sm"
                                >
                                  {duplicating === pkg.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Duplicate</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  onClick={() => handleDelete(pkg.id)}
                                  disabled={deleting === pkg.id}
                                  variant="outline"
                                  className="h-10 border-2 border-red-200 text-red-600 hover:bg-red-50 rounded-full text-sm"
                                >
                                  {deleting === pkg.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Delete</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        <PackageAnalyticsPanel
          isOpen={!!panelOpenId}
          onClose={() => setPanelOpenId(null)}
          pkg={panelPkg}
          analytics={panelAnalytics}
          isMobile={isMobile}
        />

        <SendPackageDialog
          open={sendDialog.open}
          packageId={sendDialog.pkgId}
          onClose={() => setSendDialog({ open: false, pkgId: null })}
          onMarked={handleSendMarked}
        />

        {/* Hidden for launch — folder system parked
        <CopyLinkFolderPrompt
          open={!!copyPromptPkg}
          onOpenChange={(o) => {
            if (!o) {
              setCopyPromptPkg(null);
              supabaseClient.auth.me().then(setCurrentUser).catch(() => {});
            }
          }}
          packageId={copyPromptPkg?.id}
          userId={currentUser?.id}
          onAssigned={() => loadPackages()}
        />
        */}

        <AlertDialog open={!!confirmWonLost} onOpenChange={(o) => !o && setConfirmWonLost(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {confirmWonLost?.type === 'won' ? 'Mark as won?' : 'Mark as lost?'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {confirmWonLost?.type === 'won'
                  ? 'This package will show as Won until you undo.'
                  : 'This package will show as Lost until you undo.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (confirmWonLost) {
                    setManualStatus(confirmWonLost.id, confirmWonLost.type);
                    setConfirmWonLost(null);
                  }
                }}
              >
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
