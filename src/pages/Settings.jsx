import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Mail, Calendar, Save, Loader2, Link as LinkIcon } from 'lucide-react';
import supabaseClient from '@/lib/supabaseClient';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/lib/AuthContext';
import { slugify, validateCreatorSlug, isCreatorSlugAvailable } from '@/lib/publicPackageUrl';

export default function Settings() {
  const { logout } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [slugError, setSlugError] = useState(null);
  const [slugChecking, setSlugChecking] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    setLoading(true);
    try {
      const currentUser = await supabaseClient.auth.me();
      setUser(currentUser);
    } catch (error) {
      console.error('Error loading user:', error);
    }
    setLoading(false);
  };

  const handleSlugBlur = async () => {
    if (!user?.creator_slug?.trim()) {
      setSlugError(null);
      return;
    }
    setSlugChecking(true);
    setSlugError(null);
    const normalized = slugify(user.creator_slug, '');
    const validation = validateCreatorSlug(normalized);
    if (!validation.valid) {
      setSlugError(validation.error);
      setSlugChecking(false);
      return;
    }
    const available = await isCreatorSlugAvailable(normalized, user.id);
    if (!available) {
      setSlugError('This company name is already taken by another user');
    }
    setSlugChecking(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSlugError(null);
    try {
      const updates = { full_name: user.full_name };
      if (user.creator_slug !== undefined) {
        const normalized = slugify(user.creator_slug, '');
        if (normalized) {
          const validation = validateCreatorSlug(normalized);
          if (!validation.valid) {
            setSlugError(validation.error);
            setSaving(false);
            return;
          }
          const available = await isCreatorSlugAvailable(normalized, user.id);
          if (!available) {
            setSlugError('This company name is already taken by another user');
            setSaving(false);
            return;
          }
          updates.creator_slug = normalized;
        } else {
          updates.creator_slug = null;
        }
      }
      await supabaseClient.entities.User.update(user.id, updates);
      if (updates.creator_slug !== undefined) {
        const packages = await supabaseClient.entities.PackageConfig.filter({ created_by: user.id });
        for (const pkg of packages) {
          await supabaseClient.entities.PackageConfig.update(pkg.id, { creator_slug: updates.creator_slug });
        }
      }
      setUser({ ...user, ...updates });
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    try {
      await supabaseClient.auth.signOut();
    } catch (error) {
      console.error('Error signing out from Supabase:', error);
    }

    // Clear Base44 auth state as well, then return to app welcome.
    logout(false);
    window.location.href = createPageUrl('Welcome');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F7' }}>
        <Loader2 className="w-12 h-12 animate-spin text-[#ff0044]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: '#F5F5F7' }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-6"
        >
          <div className="flex items-center gap-6 mb-8">
            <div 
              className="w-24 h-24 rounded-2xl flex items-center justify-center text-white text-3xl font-bold"
              style={{ background: 'linear-gradient(135deg, #ff0044 0%, #ff3366 100%)' }}
            >
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{user?.full_name}</h2>
              <p className="text-gray-500">{user?.email}</p>
              <p className="text-sm text-gray-400 mt-1">
                Member since {new Date(user?.created_date).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Full Name
              </label>
              <Input
                value={user?.full_name || ''}
                onChange={(e) => setUser({ ...user, full_name: e.target.value })}
                className="h-12 bg-gray-50 border-gray-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <LinkIcon className="w-4 h-4 inline mr-2" />
                Company name
                <span className="relative ml-2 inline-flex items-center group align-middle" aria-label="Company name help">
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 text-[10px] font-bold text-gray-700">
                    i
                  </span>
                  <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-72 -translate-x-1/2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-normal text-gray-600 shadow-lg opacity-0 invisible transition-opacity duration-150 group-hover:opacity-100 group-hover:visible">
                    This is used for all preview Links. You can change it anytime, but it can only be assigned if available.
                  </span>
                </span>
              </label>
              <Input
                value={user?.creator_slug || ''}
                onChange={(e) => {
                  setUser({ ...user, creator_slug: e.target.value });
                  setSlugError(null);
                }}
                onBlur={handleSlugBlur}
                placeholder="Your company name"
                className={`h-12 bg-gray-50 border-gray-200 ${slugError ? 'border-red-400' : ''}`}
              />
              {slugChecking && (
                <p className="text-xs text-gray-500 mt-1">Checking availability...</p>
              )}
              {slugError && (
                <p className="text-xs text-red-600 mt-1">{slugError}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Your package previews will use: https://launch-box.io/<strong>{user?.creator_slug ? slugify(user.creator_slug, '') || 'your-company-name' : 'your-company-name'}</strong>/package-name
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email
              </label>
              <Input
                value={user?.email || ''}
                disabled
                className="h-12 bg-gray-100 border-gray-200 text-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Role
              </label>
              <Input
                value={user?.role || 'user'}
                disabled
                className="h-12 bg-gray-100 border-gray-200 text-gray-500"
              />
            </div>
          </div>

          <div className="flex gap-4 mt-8">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="h-12 px-8 font-semibold rounded-xl text-white"
              style={{ background: 'linear-gradient(135deg, #ff0044 0%, #ff3366 100%)' }}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="h-12 px-8 font-semibold rounded-xl border-2 border-gray-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              Logout
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}