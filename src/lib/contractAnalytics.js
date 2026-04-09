import { supabase } from '@/lib/supabaseClient';

function getDeviceType() {
  const ua = navigator.userAgent || '';
  if (/mobile/i.test(ua)) return 'mobile';
  if (/tablet|ipad/i.test(ua)) return 'tablet';
  return 'desktop';
}

export async function logContractView(contractId) {
  try {
    const { data, error } = await supabase
      .from('contract_views')
      .insert([{
        contract_id: contractId,
        device_type: getDeviceType(),
        time_spent_seconds: 0,
      }])
      .select('id')
      .single();
    if (error) throw error;
    return data?.id || null;
  } catch (e) {
    console.warn('Contract analytics: log view failed', e);
    return null;
  }
}

export async function updateContractTimeSpent(viewId, seconds) {
  if (!viewId) return;
  try {
    await supabase
      .from('contract_views')
      .update({ time_spent_seconds: Math.max(0, Math.round(seconds || 0)) })
      .eq('id', viewId);
  } catch (e) {
    console.warn('Contract analytics: time update failed', e);
  }
}

export async function fetchContractAnalytics(contractIds) {
  if (!Array.isArray(contractIds) || contractIds.length === 0) return {};
  try {
    const { data, error } = await supabase
      .from('contract_views')
      .select('contract_id,time_spent_seconds,viewed_at')
      .in('contract_id', contractIds);
    if (error) throw error;

    const byContract = {};
    (data || []).forEach((row) => {
      const id = row.contract_id;
      if (!byContract[id]) {
        byContract[id] = { views: 0, avgTimeSeconds: 0, totalTimeSeconds: 0 };
      }
      byContract[id].views += 1;
      byContract[id].totalTimeSeconds += row.time_spent_seconds || 0;
    });

    Object.keys(byContract).forEach((id) => {
      const x = byContract[id];
      x.avgTimeSeconds = x.views > 0 ? Math.round(x.totalTimeSeconds / x.views) : 0;
    });

    return byContract;
  } catch (e) {
    console.warn('Contract analytics: fetch failed', e);
    return {};
  }
}

