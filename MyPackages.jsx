import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
// ✅ FIX: Import from supabaseClient instead of the old base44Client
import supabaseClient from '@/lib/supabaseClient';
import { Trash2, Edit, Loader2, Package as PackageIcon, AlertCircle, Eye, Share2, Copy, Check, X, Code } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function MyPackages() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [copying, setCopying] = useState(null);
  const [duplicating, setDuplicating] = useState(null);
  const [editingName, setEditingName] = useState(null);
  const [editedName, setEditedName] = useState('');

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    setLoading(true);
    try {
      // ✅ FIX: Use supabaseClient.auth.me() and filter by user ID (UUID), not email
      const currentUser = await supabaseClient.auth.me();
      if (!currentUser) {
        setPackages([]);
        setLoading(false);
        return;
      }

      // ✅ FIX: filter() now correctly uses user ID and supports the orderBy second argument
      const fetchedPackages = await supabaseClient.entities.PackageConfig.filter(
        { created_by: currentUser.id },
        '-created_date'
      );

      // ✅ FIX: Guarantee fetchedPackages is always an array before setting state
      setPackages(Array.isArray(fetchedPackages) ? fetchedPackages : []);
    } catch (error) {
      console.error('Error loading packages:', error);
      // ✅ FIX: On error, set to empty array instead of leaving stale/undefined state
      setPackages([]);
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

  const handleCopyLink = async (pkg) => {
    setCopying(pkg.id);
    try {
      const baseUrl = window.location.origin;
      const previewUrl = baseUrl + createPageUrl('Results') + `?preview=true&packageId=${pkg.id}`;
      await navigator.clipboard.writeText(previewUrl);
      setTimeout(() => {
        setCopying(null);
      }, 2000);
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
                return (
                  <motion.div
                    key={pkg.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-gray-100 hover:border-[#ff0044]"
                  >
                    {/* Package Card Header */}
                    <div
                      className="p-6 text-white relative overflow-hidden"
                      style={{
                        background: pkg.brand_color
                          ? `linear-gradient(135deg, ${pkg.brand_color} 0%, ${pkg.brand_color}cc 100%)`
                          : 'linear-gradient(135deg, #ff0044 0%, #ff3366 100%)'
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        {editingName === pkg.id ? (
                          <div className="flex items-center gap-2 flex-1">
                            <Input
                              value={editedName}
                              onChange={(e) => setEditedName(e.target.value)}
                              className="h-8 text-sm bg-white/20 border-white/40 text-white placeholder:text-white/60"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveName(pkg.id);
                                if (e.key === 'Escape') handleCancelEditName();
                              }}
                              autoFocus
                            />
                            <button onClick={() => handleSaveName(pkg.id)} className="p-1 hover:bg-white/20 rounded">
                              <Check className="w-4 h-4" />
                            </button>
                            <button onClick={handleCancelEditName} className="p-1 hover:bg-white/20 rounded">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 group/title flex-1">
                            <h3 className="text-xl font-bold">{pkg.package_set_name || pkg.business_name || 'Untitled Package'}</h3>
                            <button
                              onClick={() => handleStartEditName(pkg)}
                              className="opacity-0 group-hover/title:opacity-100 transition-opacity p-1 hover:bg-white/20 rounded"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
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

                    {/* Package Card Actions */}
                    <div className="p-6 space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePreview(pkg)}
                          className="rounded-xl border-gray-200 hover:border-[#ff0044] hover:text-[#ff0044]"
                        >
                          <Eye className="w-4 h-4 mr-1" /> Preview
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(pkg)}
                          className="rounded-xl border-gray-200 hover:border-[#ff0044] hover:text-[#ff0044]"
                        >
                          <Edit className="w-4 h-4 mr-1" /> Edit
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyLink(pkg)}
                              className="rounded-xl text-gray-500 hover:text-[#ff0044]"
                            >
                              {copying === pkg.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Copy Link</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyEmbed(pkg)}
                              className="rounded-xl text-gray-500 hover:text-[#ff0044]"
                            >
                              {copying === `embed-${pkg.id}` ? <Check className="w-4 h-4" /> : <Code className="w-4 h-4" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Copy Embed Code</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(pkg.id)}
                              disabled={deleting === pkg.id}
                              className="rounded-xl text-gray-500 hover:text-red-500"
                            >
                              {deleting === pkg.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Delete Package</TooltipContent>
                        </Tooltip>
                      </div>
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
