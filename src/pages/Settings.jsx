import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Mail, Save, Loader2, Link as LinkIcon, DollarSign, Lock, Eye, EyeOff, Trash2 } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/use-toast';
import supabaseClient from '@/lib/supabaseClient';
import { supabase } from '@/lib/supabaseClient';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/lib/AuthContext';
import { slugify, validateCreatorSlug, isCreatorSlugAvailable } from '@/lib/publicPackageUrl';

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'ILS', symbol: '₪', name: 'Israeli Shekel' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
];

export default function Settings() {
  const { logout } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [slugError, setSlugError] = useState(null);
  const [slugChecking, setSlugChecking] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);

  // Password change
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Delete account
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

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
      const updates = {
        full_name: user.full_name,
        default_currency: user.default_currency || 'USD',
        hide_copy_link_folder_prompt: Boolean(user.hide_copy_link_folder_prompt),
      };
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
      toast({ title: 'Settings saved.' });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({ title: 'Failed to save settings.', variant: 'destructive' });
    }
    setSaving(false);
  };

  const handlePasswordChange = async () => {
    if (!newPassword.trim()) {
      toast({ title: 'Please enter a new password.', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: 'Password must be at least 6 characters.', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Passwords do not match.', variant: 'destructive' });
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: 'Password updated successfully.' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Password change failed:', error);
      toast({ title: error.message || 'Failed to update password.', variant: 'destructive' });
    }
    setChangingPassword(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setDeleting(true);
    try {
      // Delete all user data from public tables
      const userId = user.id;
      const tables = ['package_configs', 'contracts', 'contract_templates', 'cost_calculator_templates', 'quiz_configs', 'notifications', 'folders'];
      for (const table of tables) {
        await supabase.from(table).delete().eq('created_by', userId);
      }
      await supabase.from('users').delete().eq('id', userId);

      // Sign out and redirect
      await supabase.auth.signOut();
      logout(false);
      window.location.href = createPageUrl('Welcome');
    } catch (error) {
      console.error('Account deletion failed:', error);
      toast({ title: 'Failed to delete account. Please contact support.', variant: 'destructive' });
      setDeleting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabaseClient.auth.signOut();
    } catch (error) {
      console.error('Error signing out from Supabase:', error);
    }
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
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1.5 mt-2">
                Heads up: changing this will break any share links you've already sent to clients. They'll need the new link.
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
                <DollarSign className="w-4 h-4 inline mr-2" />
                Default Currency
              </label>
              <select
                value={user?.default_currency || 'USD'}
                onChange={(e) => setUser({ ...user, default_currency: e.target.value })}
                className="w-full h-12 bg-gray-50 border border-gray-200 rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff0044]/20 focus:border-[#ff0044]"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.symbol} {c.code} - {c.name}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Used as the default when creating new packages</p>
            </div>

            {/* Hidden for launch -folder system parked
            <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-4">
              <div>
                <p className="text-sm font-medium text-gray-900">Folder prompt after copy link</p>
                <p className="text-xs text-gray-500 mt-1">
                  When enabled, after you copy a package link we&apos;ll ask if you want to assign it to a client or project folder.
                </p>
              </div>
              <Switch
                checked={!user?.hide_copy_link_folder_prompt}
                onCheckedChange={(checked) =>
                  setUser({
                    ...user,
                    hide_copy_link_folder_prompt: !checked,
                  })
                }
                aria-label="Toggle folder assignment prompt after copying link"
              />
            </div>
            */}
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

        {/* Password Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-1">Change Password</h3>
          <p className="text-sm text-gray-500 mb-6">Update your account password</p>

          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Lock className="w-4 h-4 inline mr-2" />
                New Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="h-12 bg-gray-50 border-gray-200 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Lock className="w-4 h-4 inline mr-2" />
                Confirm Password
              </label>
              <Input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className={`h-12 bg-gray-50 border-gray-200 ${confirmPassword && confirmPassword !== newPassword ? 'border-red-400' : ''}`}
              />
              {confirmPassword && confirmPassword !== newPassword && (
                <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
              )}
            </div>

            <Button
              onClick={handlePasswordChange}
              disabled={changingPassword || !newPassword || !confirmPassword}
              variant="outline"
              className="h-12 px-6 font-semibold rounded-xl border-2 border-gray-200"
            >
              {changingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Password'
              )}
            </Button>
          </div>
        </motion.div>

        {/* Billing */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mt-6"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-1">Billing</h3>
          <p className="text-sm text-gray-500 mb-4">Update payment method, view invoices, or cancel your plan.</p>
          <Button
            onClick={async () => {
              setOpeningPortal(true);
              try {
                const { data, error } = await supabase.functions.invoke('create-portal-session', {
                  body: { return_url: window.location.href },
                });
                if (error) throw error;
                if (!data?.url) throw new Error('No portal URL');
                window.location.href = data.url;
              } catch (err) {
                toast({ title: err.message || 'Could not open billing portal', variant: 'destructive' });
                setOpeningPortal(false);
              }
            }}
            disabled={openingPortal}
            variant="outline"
            className="h-10 px-6 font-semibold rounded-xl border-2"
          >
            {openingPortal ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Opening...</>
            ) : (
              'Manage subscription'
            )}
          </Button>
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl p-8 shadow-sm border border-red-100 mt-6"
        >
          <h3 className="text-lg font-bold text-red-600 mb-1">Danger Zone</h3>
          <p className="text-sm text-gray-500 mb-4">Permanently delete your account and all data</p>
          <Button
            onClick={() => setShowDeleteDialog(true)}
            variant="outline"
            className="h-10 px-6 font-semibold rounded-xl border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Account
          </Button>
        </motion.div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={(open) => { if (!open) { setShowDeleteDialog(false); setDeleteConfirmText(''); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <span className="block">This will permanently delete your account, all your packages, contracts, templates, and data. This cannot be undone.</span>
              <span className="block font-medium text-gray-700">Type <strong>DELETE</strong> to confirm:</span>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE"
                className="mt-2"
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== 'DELETE' || deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...</>
              ) : (
                'Delete my account'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
