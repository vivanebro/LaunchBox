import { COLORS } from '@/lib/packageStatus';

/** @param {{ kind: 'hot' | 'converted' | 'cooling' | 'cold' | 'no_views', className?: string }} props */
export function StatusDot({ kind, className = '' }) {
  if (kind === 'hot') {
    return (
      <span
        className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 hot-status-dot ${className}`}
        style={{ backgroundColor: COLORS.hot }}
      />
    );
  }
  if (kind === 'converted') {
    return (
      <span
        className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 ${className}`}
        style={{ backgroundColor: COLORS.converted }}
      />
    );
  }
  if (kind === 'cooling') {
    return (
      <span
        className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 ${className}`}
        style={{ backgroundColor: COLORS.cooling }}
      />
    );
  }
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 bg-gray-400 ${className}`}
    />
  );
}

export function mapStatusToDotKind(status) {
  if (!status || status.kind === 'won' || status.kind === 'lost') return null;
  if (status.kind === 'converted') return 'converted';
  if (status.kind === 'hot') return 'hot';
  if (status.kind === 'cooling') return 'cooling';
  if (status.kind === 'no_views') return 'cold';
  return 'cold';
}
