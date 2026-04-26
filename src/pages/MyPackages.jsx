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
  Plus,
  MoreHorizontal,
  Trophy,
  XCircle,
  Search,
  ArrowUpDown,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

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
    const isSent = (pkg) => {
      const a = analytics[pkg.id] || {};
      return (pkg.marked_sent_count || 0) > 0 || (a.views || 0) > 0 || pkg.manual_status === 'won' || pkg.manual_status === 'lost';
    };
    const nameOf = (pkg) => (pkg.package_set_name || pkg.business_name || 'Untitled Package').toLowerCase();
    const editedMs = (pkg) => {
      const u = pkg.updated_date ? new Date(pkg.updated_date).getTime() : 0;
      const c = pkg.created_date ? new Date(pkg.created_date).getTime() : 0;
      return Math.max(u, c);
    };

    const q = searchQuery.trim().toLowerCase();
    let list = packages.filter((pkg) => {
      if (q && !nameOf(pkg).includes(q)) return false;
      if (statusFilter === 'sent' && !isSent(pkg)) return false;
      if (statusFilter === 'not_sent' && isSent(pkg)) return false;
      return true;
    });

    list = list.sort((pa, pb) => {
      if (sortBy === 'most_viewed') {
        return ((analytics[pb.id]?.views) || 0) - ((analytics[pa.id]?.views) || 0);
      }
      if (sortBy === 'az') {
        return nameOf(pa).localeCompare(nameOf(pb));
      }
      return editedMs(pb) - editedMs(pa);
    });

    return list;
  }, [packages, analytics, searchQuery, statusFilter, sortBy]);

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
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-baseline gap-3">
              <h1 className="text-3xl font-bold text-gray-900">My Packages</h1>
              {packages.length > 0 && (
                <span className="text-sm text-gray-500">{packages.length} total</span>
              )}
            </div>
            <Button
              onClick={() => { window.location.href = createPageUrl('PackageBuilder'); }}
              className="text-white rounded-full font-semibold shadow-md hover:shadow-lg"
              style={{ background: 'linear-gradient(135deg, #ff0044 0%, #ff3366 100%)' }}
            >
              <Plus className="w-4 h-4 mr-1" />
              New package
            </Button>
          </div>

          {packages.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-block bg-white rounded-3xl p-12 border-2 border-gray-200 shadow-lg">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">No packages yet</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Build your first package and send it to a client. Watch what happens.
                </p>
                <Button
                  onClick={() => { window.location.href = createPageUrl('PackageBuilder'); }}
                  className="text-white rounded-full"
                  style={{ background: 'linear-gradient(135deg, #ff0044 0%, #ff3366 100%)' }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Build my first package
                </Button>
              </div>
            </div>
          ) : (
            <>
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search packages"
                  className="pl-9 h-9 rounded-lg border-gray-200 bg-white text-sm"
                />
              </div>

              <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-full p-1">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'sent', label: 'Sent' },
                  { key: 'not_sent', label: 'Not sent' },
                ].map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setStatusFilter(c.key)}
                    className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                      statusFilter === c.key
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              <div className="ml-auto">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-9 rounded-lg border-gray-200 text-sm font-medium gap-2">
                      <ArrowUpDown className="w-3.5 h-3.5 text-gray-500" />
                      {sortBy === 'newest' && 'Newest'}
                      {sortBy === 'most_viewed' && 'Most viewed'}
                      {sortBy === 'az' && 'A–Z'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem onClick={() => setSortBy('newest')}>Newest</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('most_viewed')}>Most viewed</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('az')}>A–Z</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {sortedPackages.length === 0 ? (
              <div className="text-center py-16 text-sm text-gray-500">
                No packages match your filters.
              </div>
            ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
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
                  const brandColor = pkg.brand_color || '#ff0044';
                  const cardClassName = hasAnalyticsOpen
                    ? isAnalyticsSelected
                      ? 'bg-white rounded-2xl shadow-lg transition-all duration-200 overflow-hidden border-2 border-[#ff0044]'
                      : 'bg-white rounded-2xl shadow-sm transition-all duration-200 overflow-hidden border border-gray-200 opacity-60'
                    : 'bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden border border-gray-200';

                  // Activity hero: tells the story
                  let heroText = 'Not sent yet';
                  let heroClass = 'text-gray-400';
                  let subText = `Created ${formatRelativeTimeNatural(pkg.created_date)}`;
                  if (manual === 'won') {
                    heroText = '🏆 Won';
                    heroClass = 'text-emerald-600';
                    subText = pkg.manual_status_updated_at
                      ? `Closed ${formatRelativeTimeNatural(pkg.manual_status_updated_at)}`
                      : '';
                  } else if (manual === 'lost') {
                    heroText = 'Lost';
                    heroClass = 'text-gray-500';
                    subText = pkg.manual_status_updated_at
                      ? `Closed ${formatRelativeTimeNatural(pkg.manual_status_updated_at)}`
                      : '';
                  } else if ((a.views || 0) > 0) {
                    heroText = `Viewed ${formatRelativeTimeNatural(a.lastViewed)}`;
                    heroClass = 'text-gray-900';
                    subText = `${a.views} ${a.views === 1 ? 'view' : 'views'}${(pkg.marked_sent_count || 0) > 0 ? ` · ${pkg.marked_sent_count} sent` : ''}`;
                  } else if ((pkg.marked_sent_count || 0) > 0) {
                    heroText = 'Sent · awaiting view';
                    heroClass = 'text-amber-600';
                    subText = pkg.last_marked_sent_at
                      ? `Sent ${formatRelativeTimeNatural(pkg.last_marked_sent_at)}`
                      : `${pkg.marked_sent_count} sent`;
                  }

                  return (
                    <motion.div
                      key={pkg.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className={cardClassName}
                    >
                      <div className="p-4">
                        {editingName === pkg.id ? (
                          <div className="flex items-center gap-2 mb-3">
                            <Input
                              value={editedName}
                              onChange={(e) => setEditedName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveName(pkg.id);
                                if (e.key === 'Escape') handleCancelEditName();
                              }}
                              className="h-8 text-base font-bold"
                              autoFocus
                            />
                            <Button onClick={() => handleSaveName(pkg.id)} size="icon" className="h-7 w-7">
                              <Check className="w-3.5 h-3.5" />
                            </Button>
                            <Button onClick={handleCancelEditName} size="icon" variant="ghost" className="h-7 w-7">
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              <h3 className="text-base font-bold truncate text-gray-900">{pkg.package_set_name || pkg.business_name || 'Untitled Package'}</h3>
                              <button
                                type="button"
                                onClick={() => handleStartEditName(pkg)}
                                className="p-0.5 rounded text-gray-300 hover:text-gray-700 hover:bg-gray-100 transition-colors flex-shrink-0"
                                title="Rename"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => setPanelOpenId(pkg.id)}
                          className="block text-left w-full mb-3 -mx-1 px-1 py-1 rounded hover:bg-gray-50 transition-colors"
                          title="View analytics"
                        >
                          <div className={`text-sm font-semibold leading-tight ${heroClass}`}>{heroText}</div>
                          {subText && <div className="text-[11px] text-gray-500 mt-0.5 tabular-nums">{subText}</div>}
                        </button>

                        <div className="grid grid-cols-3 gap-1 text-center mb-4 bg-gray-50 rounded-lg p-2">
                          <div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-wide truncate">{getTierLabel(pkg, 'starter')}</div>
                            <div className="text-xs font-semibold text-gray-700 tabular-nums">
                              {currencySymbol}{starterPrice.toLocaleString()}
                            </div>
                          </div>
                          <div className="border-l border-r border-gray-200">
                            <div className="text-[10px] text-gray-500 uppercase tracking-wide truncate">{getTierLabel(pkg, 'growth')}</div>
                            <div className="text-xs font-bold tabular-nums" style={{ color: brandColor }}>
                              {currencySymbol}{growthPrice.toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-wide truncate">{getTierLabel(pkg, 'premium')}</div>
                            <div className="text-xs font-semibold text-gray-700 tabular-nums">
                              {currencySymbol}{premiumPrice.toLocaleString()}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleCopyLink(pkg)}
                              disabled={copying === pkg.id}
                              className="flex-1 h-9 text-white font-bold rounded-lg text-xs shadow-sm hover:shadow-md"
                              style={{ background: brandColor }}
                            >
                              {copying === pkg.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  Send
                                  {(pkg.marked_sent_count || 0) > 0 && (
                                    <span className="ml-1.5 text-[10px] font-semibold tabular-nums opacity-90">· {pkg.marked_sent_count}</span>
                                  )}
                                </>
                              )}
                            </Button>
                            <Button
                              onClick={() => handlePreview(pkg)}
                              variant="outline"
                              className="flex-1 h-9 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-medium"
                            >
                              Preview
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="h-9 px-3 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                                  title="More actions"
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => handleEdit(pkg)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit package
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {manual !== 'won' && (
                                  <DropdownMenuItem onClick={() => setConfirmWonLost({ id: pkg.id, type: 'won' })}>
                                    <Trophy className="w-4 h-4 mr-2 text-emerald-600" />
                                    Mark as Won
                                  </DropdownMenuItem>
                                )}
                                {manual !== 'lost' && (
                                  <DropdownMenuItem onClick={() => setConfirmWonLost({ id: pkg.id, type: 'lost' })}>
                                    <XCircle className="w-4 h-4 mr-2 text-gray-500" />
                                    Mark as Lost
                                  </DropdownMenuItem>
                                )}
                                {manual && (
                                  <DropdownMenuItem onClick={() => clearManualStatus(pkg.id)}>
                                    <X className="w-4 h-4 mr-2 text-gray-500" />
                                    Clear status
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleCopyEmbed(pkg)} disabled={copying === `embed-${pkg.id}`}>
                                  <Code className="w-4 h-4 mr-2" />
                                  {copying === `embed-${pkg.id}` ? 'Copying...' : 'Copy embed code'}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDuplicate(pkg)} disabled={duplicating === pkg.id}>
                                  <Copy className="w-4 h-4 mr-2" />
                                  {duplicating === pkg.id ? 'Duplicating...' : 'Duplicate'}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDelete(pkg.id)}
                                  disabled={deleting === pkg.id}
                                  className="text-red-600 focus:text-red-700 focus:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  {deleting === pkg.id ? 'Deleting...' : 'Delete'}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
            )}
            </>
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
