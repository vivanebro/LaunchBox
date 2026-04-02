/**
 * Deterministic folder icon color from name (HSL).
 */
export function folderIconStyle(name = '') {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h + name.charCodeAt(i) * (i + 1)) % 360;
  }
  return {
    background: `hsl(${h} 65% 92%)`,
    color: `hsl(${h} 55% 28%)`,
    borderColor: `hsl(${h} 45% 80%)`,
  };
}

export function formatFolderCounts({ packages = 0, budgets = 0, contracts = 0 }) {
  const parts = [];
  if (packages) parts.push(`${packages} package${packages === 1 ? '' : 's'}`);
  if (budgets) parts.push(`${budgets} budget${budgets === 1 ? '' : 's'}`);
  if (contracts) parts.push(`${contracts} contract${contracts === 1 ? '' : 's'}`);
  return parts.length ? parts.join(', ') : 'Empty';
}

const SEED_KEY = 'launchbox_clients_projects_example_seeded';

export function hasSeededExampleFolder() {
  try {
    return localStorage.getItem(SEED_KEY) === '1';
  } catch {
    return true;
  }
}

export function markExampleFolderSeeded() {
  try {
    localStorage.setItem(SEED_KEY, '1');
  } catch {
    /* ignore */
  }
}

const HINT_KEY = 'launchbox_clients_projects_hint_dismissed';

export function isClientsProjectsHintDismissed() {
  try {
    return localStorage.getItem(HINT_KEY) === '1';
  } catch {
    return true;
  }
}

export function dismissClientsProjectsHint() {
  try {
    localStorage.setItem(HINT_KEY, '1');
  } catch {
    /* ignore */
  }
}

export const PENDING_FOLDER_ID_KEY = 'launchbox_pending_folder_id';
export const PENDING_CONTRACT_FOLDER_ID_KEY = 'launchbox_pending_contract_folder_id';

export function setPendingFolderId(id) {
  if (id) {
    try {
      sessionStorage.setItem(PENDING_FOLDER_ID_KEY, id);
    } catch {
      /* ignore */
    }
  }
}

export function takePendingFolderId() {
  try {
    const v = sessionStorage.getItem(PENDING_FOLDER_ID_KEY);
    sessionStorage.removeItem(PENDING_FOLDER_ID_KEY);
    return v || null;
  } catch {
    return null;
  }
}

export function setPendingContractFolderId(id) {
  if (id) {
    try {
      sessionStorage.setItem(PENDING_CONTRACT_FOLDER_ID_KEY, id);
    } catch {
      /* ignore */
    }
  }
}

export function takePendingContractFolderId() {
  try {
    const v = sessionStorage.getItem(PENDING_CONTRACT_FOLDER_ID_KEY);
    sessionStorage.removeItem(PENDING_CONTRACT_FOLDER_ID_KEY);
    return v || null;
  } catch {
    return null;
  }
}
