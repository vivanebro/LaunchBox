import supabaseClient from '@/lib/supabaseClient';

/**
 * Find first folder with same name (case-insensitive) or create a new one (root).
 */
export async function findOrCreateFolderByName(name, userId) {
  const trimmed = (name || '').trim();
  if (!trimmed) return null;
  const all = await supabaseClient.entities.Folder.filter({ created_by: userId });
  const roots = all.filter((f) => !f.parent_id);
  const match = roots.find((f) => f.name.toLowerCase() === trimmed.toLowerCase());
  if (match) return match;
  return supabaseClient.entities.Folder.create({ name: trimmed, parent_id: null });
}

/**
 * Assign package to folder (or null). Returns { folder, previousFolder }.
 */
export async function assignPackageToFolder(packageId, folderId, userId) {
  const pkg = await supabaseClient.entities.PackageConfig.get(packageId);
  if (pkg.created_by !== userId) throw new Error('Not allowed');

  let previousFolder = null;
  if (pkg.folder_id) {
    try {
      previousFolder = await supabaseClient.entities.Folder.get(pkg.folder_id);
    } catch {
      previousFolder = null;
    }
  }

  await supabaseClient.entities.PackageConfig.update(packageId, {
    folder_id: folderId || null,
  });

  let folder = null;
  if (folderId) {
    folder = await supabaseClient.entities.Folder.get(folderId);
  }
  return { folder, previousFolder };
}

export async function loadFoldersForUser(userId) {
  return supabaseClient.entities.Folder.filter({ created_by: userId }, '-updated_date');
}

/**
 * Assign contract to folder (or null). Returns { folder, previousFolder }.
 */
export async function assignContractToFolder(contractId, folderId, userId) {
  const contract = await supabaseClient.entities.Contract.get(contractId);
  if (contract.created_by !== userId) throw new Error('Not allowed');

  let previousFolder = null;
  if (contract.folder_id) {
    try {
      previousFolder = await supabaseClient.entities.Folder.get(contract.folder_id);
    } catch {
      previousFolder = null;
    }
  }

  await supabaseClient.entities.Contract.update(contractId, {
    folder_id: folderId || null,
  });

  let folder = null;
  if (folderId) {
    folder = await supabaseClient.entities.Folder.get(folderId);
  }
  return { folder, previousFolder };
}
