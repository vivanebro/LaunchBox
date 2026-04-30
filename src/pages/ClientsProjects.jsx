import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Routes, Route, useNavigate, useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Folder,
  Plus,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
  ArrowLeft,
  Check,
  Eye,
  X,
  Package as PackageIcon,
  Wallet,
  FileSignature,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import supabaseClient from '@/lib/supabaseClient';
import { createPageUrl } from '@/utils';
import { getCurrencySymbol } from '@/lib/currency';
import {
  folderIconStyle,
  formatFolderCounts,
  hasSeededExampleFolder,
  markExampleFolderSeeded,
  isClientsProjectsHintDismissed,
  dismissClientsProjectsHint,
  setPendingFolderId,
  setPendingContractFolderId,
} from '@/lib/folderUtils';
import {
  computeEngagementStatus,
  formatRelativeTimeNatural,
} from '@/lib/packageStatus';
import { StatusDot, mapStatusToDotKind } from '@/components/packages/StatusDot';
import { fetchAnalyticsForPackages } from '@/lib/packageAnalytics';

export const CLIENTS_PROJECTS_PATH = '/ClientsProjects';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function useAuthUser() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    supabaseClient.auth.me().then(setUser).catch(() => setUser(null));
  }, []);
  return user;
}

/** Grid of folder cards */
function ClientsProjectsGrid() {
  const navigate = useNavigate();
  const user = useAuthUser();
  const [folders, setFolders] = useState([]);
  const [packagesByFolder, setPackagesByFolder] = useState({});
  const [contractsByFolder, setContractsByFolder] = useState({});
  const [loading, setLoading] = useState(true);
  const [newOpen, setNewOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [renameTarget, setRenameTarget] = useState(null);
  const [renameName, setRenameName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [hintDismissed, setHintDismissed] = useState(isClientsProjectsHintDismissed);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [folderList, pkgs, contracts] = await Promise.all([
        supabaseClient.entities.Folder.filter({ created_by: user.id }, '-updated_date'),
        supabaseClient.entities.PackageConfig.filter({ created_by: user.id }, '-updated_date'),
        supabaseClient.entities.Contract.filter({ created_by: user.id }, '-updated_at'),
      ]);
      setFolders(folderList || []);
      const map = {};
      for (const p of pkgs || []) {
        if (!p.folder_id) continue;
        if (!map[p.folder_id]) map[p.folder_id] = [];
        map[p.folder_id].push(p);
      }
      setPackagesByFolder(map);
      const contractsMap = {};
      for (const c of contracts || []) {
        if (!c.folder_id) continue;
        if (!contractsMap[c.folder_id]) contractsMap[c.folder_id] = [];
        contractsMap[c.folder_id].push(c);
      }
      setContractsByFolder(contractsMap);

      const roots = (folderList || []).filter((f) => !f.parent_id);
      if (roots.length === 0 && !hasSeededExampleFolder()) {
        const ex = await supabaseClient.entities.Folder.create({
          name: 'Sarah M. - Wedding',
          parent_id: null,
          is_example: true,
        });
        await supabaseClient.entities.PackageConfig.create({
          package_set_name: 'Sample Wedding Package',
          business_name: 'Sarah M.',
          folder_id: ex.id,
        });
        markExampleFolderSeeded();
        const folderList2 = await supabaseClient.entities.Folder.filter(
          { created_by: user.id },
          '-updated_date'
        );
        const [pkgs2, contracts2] = await Promise.all([
          supabaseClient.entities.PackageConfig.filter({ created_by: user.id }, '-updated_date'),
          supabaseClient.entities.Contract.filter({ created_by: user.id }, '-updated_at'),
        ]);
        setFolders(folderList2 || []);
        const map2 = {};
        for (const p of pkgs2 || []) {
          if (!p.folder_id) continue;
          if (!map2[p.folder_id]) map2[p.folder_id] = [];
          map2[p.folder_id].push(p);
        }
        setPackagesByFolder(map2);
        const contractsMap2 = {};
        for (const c of contracts2 || []) {
          if (!c.folder_id) continue;
          if (!contractsMap2[c.folder_id]) contractsMap2[c.folder_id] = [];
          contractsMap2[c.folder_id].push(c);
        }
        setContractsByFolder(contractsMap2);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const rootFolders = useMemo(
    () => folders.filter((f) => !f.parent_id),
    [folders]
  );

  const folderStats = useCallback(
    (folderId) => {
      const pkgs = packagesByFolder[folderId] || [];
      const contracts = contractsByFolder[folderId] || [];
      const subs = folders.filter((f) => f.parent_id === folderId);
      let last = null;
      for (const p of pkgs) {
        const t = p.updated_date ? new Date(p.updated_date).getTime() : 0;
        if (!last || t > last) last = t;
      }
      for (const s of subs) {
        const t = s.updated_date ? new Date(s.updated_date).getTime() : 0;
        if (!last || t > last) last = t;
      }
      for (const c of contracts) {
        const t = c.updated_at ? new Date(c.updated_at).getTime() : 0;
        if (!last || t > last) last = t;
      }
      return {
        packages: pkgs.length,
        contracts: contracts.length,
        subfolders: subs.length,
        lastActivity: last,
      };
    },
    [folders, packagesByFolder, contractsByFolder]
  );

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name || !user?.id) return;
    try {
      await supabaseClient.entities.Folder.create({ name, parent_id: null });
      setNewName('');
      setNewOpen(false);
      await load();
    } catch (e) {
      console.error(e);
      alert('Could not create folder');
    }
  };

  const handleRename = async () => {
    if (!renameTarget || !renameName.trim()) return;
    try {
      await supabaseClient.entities.Folder.update(renameTarget.id, {
        name: renameName.trim(),
      });
      setRenameTarget(null);
      await load();
    } catch (e) {
      console.error(e);
      alert('Could not rename');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await supabaseClient.entities.Folder.delete(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (e) {
      console.error(e);
      alert('Could not delete folder');
    }
  };

  const deleteDescription = () => {
    if (!deleteTarget) return '';
    const st = folderStats(deleteTarget.id);
    const subPkgs = folders
      .filter((f) => f.parent_id === deleteTarget.id)
      .reduce((acc, sf) => acc + (packagesByFolder[sf.id]?.length || 0), 0);
    const subContracts = folders
      .filter((f) => f.parent_id === deleteTarget.id)
      .reduce((acc, sf) => acc + (contractsByFolder[sf.id]?.length || 0), 0);
    const totalPkgs = st.packages + subPkgs;
    const totalContracts = (st.contracts || 0) + subContracts;
    const parts = [];
    if (totalPkgs)
      parts.push(
        `This folder contains ${totalPkgs} package(s). They won't be deleted, just unassigned.`
      );
    if (st.subfolders)
      parts.push(
        `${st.subfolders} sub-folder(s) will be removed; their items will be unassigned.`
      );
    if (totalContracts) {
      parts.push(`This folder contains ${totalContracts} contract(s). They will be unassigned.`);
    }
    return parts.join(' ') || 'Delete this folder?';
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <Loader2 className="w-10 h-10 animate-spin text-[#ff0044]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: '#F5F5F7' }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-4xl font-bold text-gray-900">Clients &amp; Projects</h1>
              <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-violet-700">
                Beta
              </span>
            </div>
            <p className="text-gray-600">Organize packages (and more soon) into named folders.</p>
          </div>
          <Button
            onClick={() => setNewOpen(true)}
            className="rounded-full bg-[#ff0044] hover:bg-[#cc0033] shrink-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Folder
          </Button>
        </div>

        {!hintDismissed && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900"
          >
            <p className="flex-1 text-sm">
              Organize your work however you like. Create a folder for each client, project, or
              category. It&apos;s up to you.
            </p>
            <button
              type="button"
              className="text-sm font-medium underline shrink-0"
              onClick={() => {
                dismissClientsProjectsHint();
                setHintDismissed(true);
              }}
            >
              Dismiss
            </button>
          </motion.div>
        )}

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-10 h-10 animate-spin text-[#ff0044]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rootFolders.map((f) => {
              const st = folderStats(f.id);
              const style = folderIconStyle(f.name);
              const lastLabel = st.lastActivity
                ? `Last activity ${formatRelativeTimeNatural(
                    new Date(st.lastActivity).toISOString()
                  )}`
                : 'No activity yet';
              return (
                <motion.div
                  key={f.id}
                  layout
                  className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => navigate(`${CLIENTS_PROJECTS_PATH}/${f.id}`)}
                >
                  {f.is_example && (
                    <Badge
                      variant="secondary"
                      className="absolute top-3 right-12 text-[10px] bg-gray-100"
                    >
                      Example
                    </Badge>
                  )}
                  <div className="flex items-start gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center border-2 shrink-0"
                      style={style}
                    >
                      <Folder className="w-6 h-6" style={{ color: style.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate pr-8">{f.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatFolderCounts({
                          packages: st.packages,
                          budgets: 0,
                          contracts: st.contracts,
                        })}
                        {st.subfolders > 0 && ` · ${st.subfolders} sub-folder(s)`}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">{lastLabel}</p>
                    </div>
                  </div>
                  <div
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenameTarget(f);
                            setRenameName(f.name);
                          }}
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(f);
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </motion.div>
              );
            })}

            <button
              type="button"
              onClick={() => setNewOpen(true)}
              className="min-h-[140px] rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 text-gray-500 hover:border-[#ff0044] hover:text-[#ff0044] transition-colors"
            >
              <Plus className="w-8 h-8" />
              <span className="font-medium">New folder</span>
            </button>
          </div>
        )}
      </div>

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>New folder</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Folder name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-[#ff0044] hover:bg-[#cc0033]" onClick={handleCreate}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!renameTarget} onOpenChange={() => setRenameTarget(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Rename folder</DialogTitle>
          </DialogHeader>
          <Input
            value={renameName}
            onChange={(e) => setRenameName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameTarget(null)}>
              Cancel
            </Button>
            <Button className="bg-[#ff0044] hover:bg-[#cc0033]" onClick={handleRename}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete folder?</AlertDialogTitle>
            <AlertDialogDescription>{deleteDescription()}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** Single folder / subfolder detail */
function FolderDetailRoute() {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const user = useAuthUser();
  const [folder, setFolder] = useState(null);
  const [parentFolder, setParentFolder] = useState(null);
  const [childFolders, setChildFolders] = useState([]);
  const [packages, setPackages] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);
  const [titleEdit, setTitleEdit] = useState('');
  const [connectOpen, setConnectOpen] = useState(false);
  const [unassigned, setUnassigned] = useState([]);
  const [connectContractOpen, setConnectContractOpen] = useState(false);
  const [unassignedContracts, setUnassignedContracts] = useState([]);
  const [selectedContractIds, setSelectedContractIds] = useState([]);
  const [newSubOpen, setNewSubOpen] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [contractPreviewModal, setContractPreviewModal] = useState(null);
  const [removePackageTarget, setRemovePackageTarget] = useState(null);
  const [removeContractTarget, setRemoveContractTarget] = useState(null);

  const validId = folderId && UUID_RE.test(folderId);

  const load = useCallback(async () => {
    if (!user?.id || !validId) return;
    setLoading(true);
    try {
      const f = await supabaseClient.entities.Folder.get(folderId);
      if (f.created_by !== user.id) {
        setFolder(null);
        setLoading(false);
        return;
      }
      setFolder(f);
      setTitleEdit(f.name);
      if (f.parent_id) {
        try {
          const p = await supabaseClient.entities.Folder.get(f.parent_id);
          setParentFolder(p.created_by === user.id ? p : null);
        } catch {
          setParentFolder(null);
        }
      } else {
        setParentFolder(null);
      }

      const allFolders = await supabaseClient.entities.Folder.filter({ created_by: user.id });
      setChildFolders(allFolders.filter((x) => x.parent_id === folderId));

      const [allPkgs, allContracts] = await Promise.all([
        supabaseClient.entities.PackageConfig.filter({ created_by: user.id }, '-updated_date'),
        supabaseClient.entities.Contract.filter({ created_by: user.id }, '-updated_at'),
      ]);
      const inFolder = allPkgs.filter((p) => p.folder_id === folderId);
      const contractsInFolder = allContracts.filter((c) => c.folder_id === folderId);
      setPackages(inFolder);
      setContracts(contractsInFolder);
      setUnassigned(allPkgs.filter((p) => !p.folder_id));
      setUnassignedContracts(allContracts.filter((c) => !c.folder_id));

      if (inFolder.length) {
        const a = await fetchAnalyticsForPackages(inFolder.map((p) => p.id));
        setAnalytics(a || {});
      } else {
        setAnalytics({});
      }
    } catch (e) {
      console.error(e);
      setFolder(null);
    }
    setLoading(false);
  }, [user?.id, folderId, validId]);

  useEffect(() => {
    load();
  }, [load]);

  const isSubFolder = Boolean(folder?.parent_id);

  const handleSaveTitle = async () => {
    if (!folder || !titleEdit.trim()) return;
    try {
      await supabaseClient.entities.Folder.update(folder.id, { name: titleEdit.trim() });
      setFolder({ ...folder, name: titleEdit.trim() });
    } catch (e) {
      console.error(e);
    }
  };

  const handleConnectPackage = async (pkgId) => {
    try {
      if (isSubFolder && packages.length >= 1) {
        alert('Sub-folders can contain only one package.');
        return;
      }
      await supabaseClient.entities.PackageConfig.update(pkgId, { folder_id: folderId });
      const pkg = unassigned.find((p) => p.id === pkgId);
      if (pkg) {
        const updatedPkg = { ...pkg, folder_id: folderId, updated_date: new Date().toISOString() };
        setPackages((prev) => [updatedPkg, ...prev]);
        setUnassigned((prev) => prev.filter((p) => p.id !== pkgId));
      }
      setConnectOpen(false);
    } catch (e) {
      console.error(e);
      alert('Could not connect package');
    }
  };

  const toggleContractSelection = (contractId) => {
    setSelectedContractIds((prev) =>
      prev.includes(contractId) ? prev.filter((id) => id !== contractId) : [...prev, contractId]
    );
  };

  const handleConnectSelectedContracts = async () => {
    if (!selectedContractIds.length) return;
    try {
      await Promise.all(
        selectedContractIds.map((contractId) =>
          supabaseClient.entities.Contract.update(contractId, { folder_id: folderId })
        )
      );
      const selectedSet = new Set(selectedContractIds);
      const selectedContracts = unassignedContracts
        .filter((c) => selectedSet.has(c.id))
        .map((c) => ({ ...c, folder_id: folderId, updated_at: new Date().toISOString() }));
      if (selectedContracts.length) {
        setContracts((prev) => [...selectedContracts, ...prev]);
        setUnassignedContracts((prev) => prev.filter((c) => !selectedSet.has(c.id)));
      }
      setSelectedContractIds([]);
      setConnectContractOpen(false);
    } catch (e) {
      console.error(e);
      alert('Could not connect selected contracts');
    }
  };

  const contractStatusBadgeClass = (status) => {
    if (status === 'signed') return 'bg-green-100 text-green-700';
    if (status === 'shared') return 'bg-blue-100 text-blue-700';
    return 'bg-gray-100 text-gray-600';
  };

  const openPackagePreview = (pkg) => {
    window.open(`${createPageUrl('Results')}?preview=true&packageId=${pkg.id}`, '_blank');
  };

  const openContractPreview = (contract) => {
    if (!contract?.shareable_link) {
      alert('This contract does not have a shareable preview link yet.');
      return;
    }
    const contractUrl = `${window.location.origin}${createPageUrl('ContractSign')}?shareId=${contract.shareable_link}&preview=true`;
    setContractPreviewModal({
      name: contract.name || 'Contract Preview',
      contractUrl,
    });
  };

  const handleCreateSub = async () => {
    const name = newSubName.trim();
    if (!name || !folder || isSubFolder) return;
    try {
      await supabaseClient.entities.Folder.create({
        name,
        parent_id: folder.id,
      });
      setNewSubName('');
      setNewSubOpen(false);
      await load();
    } catch (e) {
      console.error(e);
      alert(e?.message || 'Could not create sub-folder');
    }
  };

  const handleRemovePackage = async (pkg) => {
    if (!pkg) return;
    try {
      await supabaseClient.entities.PackageConfig.update(pkg.id, { folder_id: null });
      setPackages((prev) => prev.filter((p) => p.id !== pkg.id));
      setUnassigned((prev) => [{ ...pkg, folder_id: null, updated_date: new Date().toISOString() }, ...prev]);
    } catch (e) {
      console.error(e);
      alert('Could not remove package from folder');
    }
  };

  const handleRemoveContract = async (contract) => {
    if (!contract) return;
    try {
      await supabaseClient.entities.Contract.update(contract.id, { folder_id: null });
      setContracts((prev) => prev.filter((c) => c.id !== contract.id));
      setUnassignedContracts((prev) => [
        { ...contract, folder_id: null, updated_at: new Date().toISOString() },
        ...prev,
      ]);
    } catch (e) {
      console.error(e);
      alert('Could not remove contract from folder');
    }
  };

  const goBack = () => {
    if (parentFolder) {
      navigate(`${CLIENTS_PROJECTS_PATH}/${parentFolder.id}`);
    } else {
      navigate(CLIENTS_PROJECTS_PATH);
    }
  };

  const startCreatePackage = () => {
    if (isSubFolder && packages.length >= 1) {
      alert('Sub-folders can contain only one package.');
      return;
    }
    setPendingFolderId(folderId);
    window.location.href = createPageUrl('PackageBuilder');
  };

  const startCreateContract = () => {
    setPendingContractFolderId(folderId);
    window.location.href = createPageUrl('ContractEditor');
  };

  if (!validId) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <p className="text-gray-600">Invalid folder</p>
      </div>
    );
  }

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <Loader2 className="w-10 h-10 animate-spin text-[#ff0044]" />
      </div>
    );
  }

  if (!folder) {
    return (
      <div className="min-h-screen p-8 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-600">Folder not found</p>
        <Button asChild variant="outline" className="rounded-full">
          <Link to={CLIENTS_PROJECTS_PATH}>Back to Clients &amp; Projects</Link>
        </Button>
      </div>
    );
  }

  const currencySymbol = getCurrencySymbol;

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: '#F5F5F7' }}>
      <div className="max-w-4xl mx-auto">
        <button
          type="button"
          onClick={goBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          {parentFolder ? `Back to ${parentFolder.name}` : 'Back to Clients & Projects'}
        </button>

        <nav className="text-sm text-gray-500 mb-4">
          <Link to={CLIENTS_PROJECTS_PATH} className="hover:text-[#ff0044]">
            Clients &amp; Projects
          </Link>
          {parentFolder && (
            <>
              <span className="mx-2">/</span>
              <Link
                to={`${CLIENTS_PROJECTS_PATH}/${parentFolder.id}`}
                className="hover:text-[#ff0044]"
              >
                {parentFolder.name}
              </Link>
            </>
          )}
          <span className="mx-2">/</span>
          <span className="text-gray-800 font-medium">{folder.name}</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-10">
          <div className="flex-1">
            <Input
              className="text-3xl font-bold border-0 border-b-2 border-transparent hover:border-gray-200 focus:border-[#ff0044] rounded-none px-0 h-auto py-1 bg-transparent"
              value={titleEdit}
              onChange={(e) => setTitleEdit(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
            />
            <p className="text-gray-500 mt-2">
              {formatFolderCounts({ packages: packages.length, budgets: 0, contracts: contracts.length })}
              {childFolders.length > 0 && ` · ${childFolders.length} sub-folder(s)`}
            </p>
          </div>
          {folder.is_example && (
            <Badge variant="secondary" className="w-fit">
              Example
            </Badge>
          )}
        </div>

        {/* Sub-folders (only for root folder) */}
        {!isSubFolder && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">Sub-folders</h2>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                onClick={() => setNewSubOpen(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add sub-folder
              </Button>
            </div>
            {childFolders.length === 0 ? (
              <p className="text-sm text-gray-500 py-4">No sub-folders yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {childFolders.map((sf) => {
                  const style = folderIconStyle(sf.name);
                  return (
                    <button
                      key={sf.id}
                      type="button"
                      onClick={() => navigate(`${CLIENTS_PROJECTS_PATH}/${sf.id}`)}
                      className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-4 text-left hover:shadow-md transition-shadow"
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center border-2"
                        style={style}
                      >
                        <Folder className="w-5 h-5" />
                      </div>
                      <span className="font-medium text-gray-900 truncate">{sf.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Packages */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <PackageIcon className="w-5 h-5" />
              Packages
            </h2>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  className="rounded-full bg-[#ff0044] hover:bg-[#cc0033]"
                  disabled={isSubFolder && packages.length >= 1}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add package
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setConnectOpen(true)}>
                  Connect existing
                </DropdownMenuItem>
                <DropdownMenuItem onClick={startCreatePackage}>Create new</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {isSubFolder && packages.length >= 1 && (
            <p className="text-xs text-amber-700 mb-2">
              Sub-folders can contain only one package.
            </p>
          )}
          {packages.length === 0 ? (
            <p className="text-sm text-gray-500 py-6 border border-dashed rounded-xl text-center">
              No packages yet
            </p>
          ) : (
            <div className="space-y-2">
              {packages.map((pkg) => {
                const a = analytics[pkg.id] || {};
                const status = computeEngagementStatus({
                  pkg,
                  manualStatus: pkg.manual_status || null,
                  views: a.views || 0,
                  lastViewedAt: a.lastViewed || null,
                  lastClickAt: a.lastClickAt || null,
                  mostRecentClick: a.mostRecentClick || null,
                });
                return (
                  <div
                    key={pkg.id}
                    className="flex items-center justify-between bg-white rounded-xl border border-gray-100 px-4 py-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <StatusDot kind={mapStatusToDotKind(status)} title={status} />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {pkg.package_set_name || pkg.business_name || 'Untitled'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {pkg.updated_date
                            ? new Date(pkg.updated_date).toLocaleDateString()
                            : ''}{' '}
                          ·{' '}
                          {currencySymbol(pkg.currency)}
                          {pkg.price_starter ?? '—'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-blue-600"
                        onClick={() => openPackagePreview(pkg)}
                        title="Preview package"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-gray-700"
                        onClick={() => {
                          localStorage.setItem('packageConfig', JSON.stringify(pkg));
                          window.location.href = `${createPageUrl('Results')}?packageId=${pkg.id}`;
                        }}
                        title="Edit package"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-red-600"
                        onClick={() => setRemovePackageTarget(pkg)}
                        title="Remove from folder"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Budgets placeholder */}
        <section className="mb-10 opacity-70">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Budgets
            </h2>
            <Button size="sm" variant="outline" disabled className="rounded-full">
              <Plus className="w-4 h-4 mr-1" />
              Add budget
            </Button>
          </div>
          <p className="text-sm text-gray-500 py-6 border border-dashed rounded-xl text-center">
            Budget folders are coming soon. No budgets yet.
          </p>
        </section>

        {/* Contracts */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileSignature className="w-5 h-5" />
              Contracts
            </h2>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="rounded-full bg-[#ff0044] hover:bg-[#cc0033]">
                  <Plus className="w-4 h-4 mr-1" />
                  Add contract
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setConnectContractOpen(true)}>
                  Connect existing
                </DropdownMenuItem>
                <DropdownMenuItem onClick={startCreateContract}>Create new</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {contracts.length === 0 ? (
            <p className="text-sm text-gray-500 py-6 border border-dashed rounded-xl text-center">
              No contracts yet
            </p>
          ) : (
            <div className="space-y-2">
              {contracts.map((contract) => (
                <div
                  key={contract.id}
                  className="flex items-center justify-between bg-white rounded-xl border border-gray-100 px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 truncate">{contract.name || 'Untitled contract'}</p>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wide ${contractStatusBadgeClass(contract.status || 'draft')}`}
                      >
                        {contract.status || 'draft'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {contract.updated_at ? new Date(contract.updated_at).toLocaleDateString() : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-blue-600"
                      onClick={() => openContractPreview(contract)}
                      title="Preview contract"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-gray-700"
                      onClick={() =>
                        (window.location.href = `${createPageUrl('ContractEditor')}?contractId=${contract.id}`)
                      }
                      title="Edit contract"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-red-600"
                      onClick={() => setRemoveContractTarget(contract)}
                      title="Remove from folder"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <Dialog open={connectOpen} onOpenChange={setConnectOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>Connect existing package</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-64 pr-2">
            {unassigned.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No unassigned packages</p>
            ) : (
              unassigned.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-sm"
                  onClick={() => handleConnectPackage(p.id)}
                >
                  {p.package_set_name || p.business_name || 'Untitled'}
                </button>
              ))
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={newSubOpen} onOpenChange={setNewSubOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>New sub-folder</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Name"
            value={newSubName}
            onChange={(e) => setNewSubName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateSub()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewSubOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-[#ff0044]" onClick={handleCreateSub}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={connectContractOpen} onOpenChange={setConnectContractOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>Connect existing contract</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-64 pr-2">
            {unassignedContracts.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No unassigned contracts</p>
            ) : (
              unassignedContracts.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm border mb-1 ${
                    selectedContractIds.includes(c.id)
                      ? 'bg-red-50 border-red-200'
                      : 'hover:bg-gray-50 border-transparent'
                  }`}
                  onClick={() => toggleContractSelection(c.id)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate">{c.name || 'Untitled contract'}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {(c.status || 'draft').toUpperCase()}
                      </p>
                    </div>
                    {selectedContractIds.includes(c.id) && (
                      <Check className="w-4 h-4 text-[#ff0044] shrink-0" />
                    )}
                  </div>
                </button>
              ))
            )}
          </ScrollArea>
          {unassignedContracts.length > 0 && (
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedContractIds([]);
                  setConnectContractOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                className="bg-[#ff0044] hover:bg-[#cc0033]"
                disabled={!selectedContractIds.length}
                onClick={handleConnectSelectedContracts}
              >
                Connect selected ({selectedContractIds.length})
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <AnimatePresence>
        {contractPreviewModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm p-4 md:p-8"
            onClick={() => setContractPreviewModal(null)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-5xl mx-auto h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl border border-gray-200 flex flex-col"
            >
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 truncate">{contractPreviewModal.name}</p>
                  <p className="text-sm font-semibold text-gray-900">Contract Preview</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="h-8"
                    onClick={() => window.open(contractPreviewModal.contractUrl, '_blank')}
                  >
                    Open in new tab
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setContractPreviewModal(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex-1 bg-gray-100">
                <iframe title="Contract preview" src={contractPreviewModal.contractUrl} className="w-full h-full border-0" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AlertDialog open={!!removePackageTarget} onOpenChange={(open) => !open && setRemovePackageTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove package from folder?</AlertDialogTitle>
            <AlertDialogDescription>
              {`"${removePackageTarget?.package_set_name || removePackageTarget?.business_name || 'This package'}" will be removed from this folder but stay in your account as unassigned.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (removePackageTarget) handleRemovePackage(removePackageTarget);
                setRemovePackageTarget(null);
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!removeContractTarget} onOpenChange={(open) => !open && setRemoveContractTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove contract from folder?</AlertDialogTitle>
            <AlertDialogDescription>
              {`"${removeContractTarget?.name || 'This contract'}" will be removed from this folder but stay in your account as unassigned.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (removeContractTarget) handleRemoveContract(removeContractTarget);
                setRemoveContractTarget(null);
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function ClientsProjects() {
  return (
    <Routes>
      <Route index element={<ClientsProjectsGrid />} />
      <Route path=":folderId" element={<FolderDetailRoute />} />
    </Routes>
  );
}
