import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import supabaseClient from '@/lib/supabaseClient';
import { Trash2, Edit, Loader2, Package as PackageIcon, AlertCircle, Eye, Share2, Copy, Check, X, Code, Download } from 'lucide-react';
import { exportPackageAsImages } from '@/lib/exportPackageImage';
import { createPageUrl } from '@/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { fetchAnalyticsForPackages } from '@/lib/packageAnalytics';

export default function MyPackages() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [copying, setCopying] = useState(null);
  const [duplicating, setDuplicating] = useState(null);
  const [editingName, setEditingName] = useState(null);
  const [editedName, setEditedName] = useState('');
  const [analytics, setAnalytics] = useState({});

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    setLoading(true);
    try {
      const currentUser = await supabaseClient.auth.me();
      const fetchedPackages = await supabaseClient.entities.PackageConfig.filter(
        { created_by: currentUser.id },
        '-created_date'
      );
      setPackages(fetchedPackages);
      if (fetchedPackages.length > 0) {
        const ids = fetchedPackages.map(p => p.id);
        const analyticsData = await fetchAnalyticsForPackages(ids);
        setAnalytics(analyticsData);
      }
    } catch (error) {
      console.error('Error loading packages:', error);
    }
    setLoading(false);
  };

  const handleEdit = (pkg) => {
    localStorage.setItem('packageConfig', JSON.stringify(pkg));
    window.location.href = createPageUrl('Results') + `?packageId=${pkg.id}`;
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
    const previewUrl = createPageUrl('Results') + `?preview=true&packageId=${pkg.id}`;
    window.open(previewUrl, '_blank');
  };

  const handleExport = async (pkg) => {
    try {
      const fullConfig = await supabaseClient.entities.PackageConfig.get(pkg.id);
      await exportPackageAsImages(fullConfig, pkg.package_set_name || pkg.business_name || 'package');
    } catch (e) {
      console.error('Export failed', e);
      alert('Export failed. Please try again.');
    }
  };

  const handleCopyLink = async (pkg) => {
    setCopying(pkg.id);
    try {
      const baseUrl = window.location.origin;
      const previewUrl = baseUrl + createPageUrl('Results') + `?preview=true&packageId=${pkg.id}`;
      await navigator.clipboard.writeText(previewUrl);
      
      // Show success feedback
      setTimeout(() => {
        setCopying(null);
      }, 2000); // Display "Copied!" for 2 seconds
    } catch (error) {
      console.error('Error copying link:', error);
      alert('Failed to copy link');
      setCopying(null);
    }
  };

  const handleCopyEmbed = async (pkg) => {
    setCopying(`embed-${pkg.id}`);
    try {
      const baseUrl = window.location.origin;
      const previewUrl = baseUrl + createPageUrl('Results') + `?preview=true&packageId=${pkg.id}`;
      const embedCode = `<iframe src="${previewUrl}" width="100%" height="800px" frameborder="0" style="border-radius: 12px;"></iframe>`;
      await navigator.clipboard.writeText(embedCode);
      
      // Show success feedback
      setTimeout(() => {
        setCopying(null);
      }, 2000);
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
        package_set_name: `${packageData.package_set_name || packageData.business_name || 'Untitled'} (Copy)`
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
        package_set_name: editedName.trim()
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
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 text-gray-900">
            My Packages
          </h1>
          <p className="text-gray-600 text-xl">
            All your saved pricing packages in one place
          </p>
        </div>

        {/* Packages List */}
        {packages.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-block bg-white rounded-3xl p-12 border-2 border-gray-200 shadow-lg">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-[#ff0044]" />
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No packages yet</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Create your first pricing package to get started
              </p>
              <Button
                onClick={() => window.location.href = createPageUrl('PackageBuilder')}
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
              {packages.map((pkg) => {
                const a = analytics[pkg.id] || {};
                const hoursAgo = a.lastViewed ? (Date.now() - new Date(a.lastViewed)) / 3600000 : Infinity;
                const daysAgo = hoursAgo / 24;
                const showNudge1 = a.clicks === 0 && hoursAgo > 24 && hoursAgo < 168;
                const showNudge2 = daysAgo >= 7 && a.views > 0;
                const showNudge3 = a.clicks === 0 && a.avgTime >= 120 && hoursAgo < 168;

                const Nudge = ({ id, text, emoji }) => {
                  const [dismissed, setDismissed] = React.useState(
                    sessionStorage.getItem(id) === 'dismissed'
                  );
                  if (dismissed) return null;
                  return (
                    <div className="mt-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl flex items-start justify-between gap-2">
                      <span className="text-xs text-amber-700 leading-relaxed">
                        {emoji} {text}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          sessionStorage.setItem(id, 'dismissed');
                          setDismissed(true);
                        }}
                        className="text-amber-300 hover:text-amber-500 flex-shrink-0 text-lg leading-none mt-0.5"
                      >
                        ×
                      </button>
                    </div>
                  );
                };

                return (
                  <motion.div
                    key={pkg.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-gray-100 hover:border-[#ff0044]"
                  >
                    {/* Header */}
                    <div 
                      className="p-6 text-white relative overflow-hidden"
                      style={{ 
                        background: pkg.brand_color ? `linear-gradient(135deg, ${pkg.brand_color} 0%, ${pkg.brand_color}dd 100%)` : 'linear-gradient(135deg, #ff0044 0%, #ff3366 100%)'
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

                    {/* Content */}
                    <div className="p-6 space-y-4">
                      {/* Pricing */}
                      <div className="flex items-center justify-between">
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900">
                            ${pkg.price_starter?.toLocaleString() || '0'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {pkg.package_names?.onetime?.starter || 'Starter'}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold" style={{ color: pkg.brand_color || '#ff0044' }}>
                            ${pkg.price_growth?.toLocaleString() || '0'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {pkg.package_names?.onetime?.growth || 'Growth'}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900">
                            ${pkg.price_premium?.toLocaleString() || '0'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {pkg.package_names?.onetime?.premium || 'Premium'}
                          </div>
                        </div>
                      </div>

                      {/* Created Date */}
                      <p className="text-xs text-gray-500 text-center">
                        Created {new Date(pkg.created_date).toLocaleDateString()}
                      </p>

                      {/* Actions - Reorganized for better fit */}
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

                        <div className="grid grid-cols-5 gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                onClick={() => handleExport(pkg)}
                                variant="outline"
                                className="h-10 border-2 border-purple-200 text-purple-600 hover:bg-purple-50 rounded-full text-sm"
                                title="Export as image"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Export image</p>
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                onClick={() => handleCopyLink(pkg)}
                                disabled={copying === pkg.id}
                                variant="outline"
                                className="h-10 border-2 border-blue-200 text-blue-600 hover:bg-blue-50 rounded-full text-sm"
                              >
                                {copying === pkg.id ? (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  </>
                                ) : (
                                  <>
                                    <Share2 className="w-4 h-4" />
                                  </>
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Share</p>
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
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  </>
                                ) : (
                                  <>
                                    <Code className="w-4 h-4" />
                                  </>
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

                      {/* Analytics strip — only show if package has been viewed */}
                      {analytics[pkg.id]?.views > 0 && (
                        <div className="pt-3 mt-3 border-t border-gray-100 flex items-center gap-4">
                          <div className="flex items-center gap-1.5 text-sm text-gray-500">
                            <span>👁</span>
                            <span className="font-semibold text-gray-700">{analytics[pkg.id].views}</span>
                            <span>views</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-gray-500">
                            <span>⏱</span>
                            <span className="font-semibold text-gray-700">
                              {analytics[pkg.id].avgTime < 60
                                ? `${analytics[pkg.id].avgTime}s`
                                : `${Math.floor(analytics[pkg.id].avgTime / 60)}m`}
                            </span>
                          </div>
                          <div className="ml-auto text-base">
                            {(new Date() - new Date(analytics[pkg.id].lastViewed)) < 7 * 24 * 60 * 60 * 1000 ? '🔥' : '😴'}
                          </div>
                        </div>
                      )}

                      {/* Nudges */}
                      {showNudge3 && (
                        <Nudge
                          id={`nudge3_${pkg.id}`}
                          emoji="📞"
                          text="They spent over 2 minutes reading this but didn't click anything. They probably have questions, give them a call!"
                        />
                      )}
                      {showNudge1 && !showNudge3 && (
                        <Nudge
                          id={`nudge1_${pkg.id}`}
                          emoji="👋"
                          text="They viewed this in the last 24 hours but didn't click anything. Now is the best time to reach out!"
                        />
                      )}
                      {showNudge2 && (
                        <Nudge
                          id={`nudge2_${pkg.id}`}
                          emoji="🔁"
                          text="They haven't viewed this in over 7 days. It might be worth sending the link again!"
                        />
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
    </TooltipProvider>
  );
}