import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import supabaseClient from '@/lib/supabaseClient';
import { supabaseServiceRole } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import {
  FileSignature, Plus, LayoutTemplate, Copy, Pencil, Trash2,
  CheckCircle2, Clock, Share2, FileText, Eye, Filter
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import AssignContractFolderMenu from '@/components/folders/AssignContractFolderMenu';
import { fetchContractAnalytics } from '@/lib/contractAnalytics';

const STATUS_CONFIG = {
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-600' },
  shared: { label: 'Shared', className: 'bg-blue-100 text-blue-700' },
  signed: { label: 'Signed', className: 'bg-green-100 text-green-700' },
};

export default function Contracts() {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteWarning, setDeleteWarning] = useState('');
  const [userPackages, setUserPackages] = useState([]);
  const [copiedId, setCopiedId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [contractAnalytics, setContractAnalytics] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const user = await supabaseClient.auth.me();
        setCurrentUser(user);
        const [contractList, packageList] = await Promise.all([
          supabaseClient.entities.Contract.filter({ created_by: user.id }, '-created_at'),
          supabaseClient.entities.PackageConfig.filter({ created_by: user.id }, '-created_date'),
        ]);
        const ids = (contractList || []).map((c) => c.id);

        let signedIds = [];
        if (ids.length > 0) {
          const { data: signedRows, error: signedErr } = await supabaseServiceRole
            .from('signed_contracts')
            .select('contract_id')
            .in('contract_id', ids);
          if (!signedErr && signedRows) {
            signedIds = signedRows.map((row) => row.contract_id);
          }
        }

        const signedSet = new Set(signedIds);
        const normalizedContracts = (contractList || []).map((contract) => {
          if (signedSet.has(contract.id) && contract.status !== 'signed') {
            supabaseClient.entities.Contract.update(contract.id, { status: 'signed' }).catch(() => {});
            return { ...contract, status: 'signed' };
          }
          return contract;
        });

        setContracts(normalizedContracts);
        setUserPackages(packageList);
        setContractAnalytics(await fetchContractAnalytics(ids));
      } catch (e) {
        console.error('Failed to load contracts:', e);
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleDelete = (contract) => {
    const linkedCount = userPackages.filter((pkg) => {
      const str = JSON.stringify(pkg.button_links || {});
      return contract.shareable_link && str.includes(contract.shareable_link);
    }).length;

    let warning = 'This action cannot be undone.';
    if (linkedCount > 0) {
      warning = `This contract is linked to ${linkedCount} package${linkedCount > 1 ? 's' : ''}. If you delete it, those packages will no longer have a contract attached.`;
    }
    setDeleteWarning(warning);
    setDeleteTarget(contract);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const contractUrl = `${window.location.origin}${createPageUrl('ContractSign')}?shareId=${deleteTarget.shareable_link}`;
      const linkedPackages = userPackages.filter((pkg) => {
        const str = JSON.stringify(pkg.button_links || {});
        return deleteTarget.shareable_link && str.includes(deleteTarget.shareable_link);
      });

      for (const pkg of linkedPackages) {
        const updatedLinks = { ...pkg.button_links };
        for (const mode of ['onetime', 'retainer']) {
          if (!updatedLinks[mode]) continue;
          const modeLinks = { ...updatedLinks[mode] };
          for (const tier of ['starter', 'growth', 'premium', 'elite']) {
            const link = modeLinks[tier];
            if (link && (link.includes(`shareId=${deleteTarget.shareable_link}`) || link === contractUrl)) {
              modeLinks[tier] = '';
              modeLinks[tier + '_type'] = '';
              modeLinks[tier + '_removed'] = true;
            }
          }
          updatedLinks[mode] = modeLinks;
        }
        await supabaseClient.entities.PackageConfig.update(pkg.id, { button_links: updatedLinks });
      }

      await supabaseClient.entities.Contract.delete(deleteTarget.id);
      setContracts(prev => prev.filter(c => c.id !== deleteTarget.id));
    } catch (e) {
      console.error('Failed to delete contract:', e);
    }
    setDeleteTarget(null);
  };

  const copyLink = async (contract) => {
    if (!contract.shareable_link) return;
    const url = `${window.location.origin}${createPageUrl('ContractSign')}?shareId=${contract.shareable_link}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(contract.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatAvgTime = (seconds) => {
    const s = Math.max(0, Math.round(seconds || 0));
    if (s < 60) return `${s}s avg`;
    const mins = Math.round(s / 60);
    return `${mins}m avg`;
  };

  const filteredContracts = statusFilter === 'all'
    ? contracts
    : contracts.filter((contract) => contract.status === statusFilter);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F7' }}>
        <div className="w-8 h-8 border-4 border-[#ff0044] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-8" style={{ backgroundColor: '#F5F5F7' }}>
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Contracts</h1>
            <p className="text-gray-500 text-sm mt-1">Create, send, and manage e-signature contracts</p>
          </div>
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="w-4 h-4" />
                  {statusFilter === 'all' ? 'All' : (STATUS_CONFIG[statusFilter]?.label || 'All')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 p-1.5 rounded-xl border-0 shadow-xl">
                <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">Filter by status</div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setStatusFilter('all')} className="flex items-center justify-between rounded-lg">
                  <span>All</span>
                  {statusFilter === 'all' && <CheckCircle2 className="w-4 h-4 text-[#ff0044]" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('draft')} className="flex items-center justify-between rounded-lg">
                  <span>Draft</span>
                  {statusFilter === 'draft' && <CheckCircle2 className="w-4 h-4 text-[#ff0044]" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('shared')} className="flex items-center justify-between rounded-lg">
                  <span>Shared</span>
                  {statusFilter === 'shared' && <CheckCircle2 className="w-4 h-4 text-[#ff0044]" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('signed')} className="flex items-center justify-between rounded-lg">
                  <span>Signed</span>
                  {statusFilter === 'signed' && <CheckCircle2 className="w-4 h-4 text-[#ff0044]" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Link to={createPageUrl('ContractTemplates')}>
              <Button variant="outline" className="gap-2">
                <LayoutTemplate className="w-4 h-4" />
                New from Template
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="gap-2 bg-[#ff0044] hover:bg-[#cc0033] text-white">
                  <Plus className="w-4 h-4" />
                  New Contract
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 p-1.5">
                <DropdownMenuItem onClick={() => navigate(createPageUrl('ContractEditor'))} className="items-start gap-3 py-3">
                  <FileText className="w-4 h-4 mt-0.5 text-[#ff0044]" />
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900">Write my own</div>
                    <div className="text-xs text-gray-500">Start from scratch in the editor</div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled className="items-start gap-3 py-3 opacity-60">
                  <div className="w-4 h-4 mt-0.5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] text-gray-500">
                    ✨
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">Create with Launchy</span>
                      <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">Coming soon</span>
                    </div>
                    <div className="text-xs text-gray-500">AI-assisted contract drafting</div>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {filteredContracts.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center shadow-sm">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileSignature className="w-8 h-8 text-[#ff0044]" />
            </div>
            {contracts.length === 0 ? (
              <>
                <h2 className="text-xl font-bold text-gray-900 mb-2">You don&apos;t have any contracts yet</h2>
                <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                  Create your first contract, add your branding, and send it for signature in minutes.
                </p>
                <Button
                  onClick={() => navigate(createPageUrl('ContractEditor'))}
                  className="bg-[#ff0044] hover:bg-[#cc0033] text-white gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create your first contract
                </Button>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-gray-900 mb-2">No matching contracts</h2>
                <p className="text-gray-500 max-w-sm mx-auto">
                  There are no contracts in the selected status. Try another filter.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredContracts.map((contract) => {
              const status = STATUS_CONFIG[contract.status] || STATUS_CONFIG.draft;
              const analytics = contractAnalytics[contract.id] || { views: 0, avgTimeSeconds: 0 };
              return (
                <div
                  key={contract.id}
                  className="bg-white rounded-2xl px-5 py-4 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow"
                >
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                    {contract.status === 'signed' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : contract.status === 'shared' ? (
                      <Share2 className="w-5 h-5 text-blue-600" />
                    ) : (
                      <FileText className="w-5 h-5 text-[#ff0044]" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="font-semibold text-gray-900 truncate">{contract.name}</h3>
                      {contract.status === 'shared' ? (
                        <div className="inline-flex items-center gap-1.5 rounded-full border border-sky-100 bg-gradient-to-r from-sky-50 to-indigo-50 px-2.5 py-1">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700">
                            <Eye className="w-3 h-3" />
                            {analytics.views || 0} views
                          </span>
                          <span className="h-3.5 w-px bg-sky-200" />
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700">
                            <Clock className="w-3 h-3" />
                            {formatAvgTime(analytics.avgTimeSeconds)}
                          </span>
                        </div>
                      ) : (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.className}`}>
                          {status.label}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mt-0.5 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDate(contract.created_at)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <AssignContractFolderMenu
                      contractId={contract.id}
                      userId={currentUser?.id}
                      initialFolderId={contract.folder_id}
                      onFolderChange={(folderId) => {
                        setContracts((prev) =>
                          prev.map((c) => (c.id === contract.id ? { ...c, folder_id: folderId } : c))
                        );
                      }}
                      variant="outline"
                      className={
                        contract.folder_id
                          ? 'border-transparent bg-emerald-50/70 text-emerald-700 hover:bg-emerald-100'
                          : 'border-transparent bg-white text-gray-500 hover:bg-gray-50'
                      }
                    />
                    {contract.shareable_link && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-gray-500 hover:text-blue-600"
                        onClick={() => copyLink(contract)}
                      >
                        {copiedId === contract.id ? (
                          <><CheckCircle2 className="w-4 h-4 text-green-600" /> Copied!</>
                        ) : (
                          <><Copy className="w-4 h-4" /> Copy Link</>
                        )}
                      </Button>
                    )}
                    {contract.status === 'signed' ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(`${window.location.origin}${createPageUrl('ContractSign')}?shareId=${contract.shareable_link}`, '_blank')}
                        title="View signed contract"
                      >
                        <Eye className="w-4 h-4 text-gray-400 hover:text-gray-700" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`${createPageUrl('ContractEditor')}?contractId=${contract.id}`)}
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4 text-gray-400 hover:text-gray-700" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(contract)}
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-600" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{deleteTarget?.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>{deleteWarning}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
