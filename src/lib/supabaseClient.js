import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cxfewezzartyjsigplot.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4ZmV3ZXp6YXJ0eWpzaWdwbG90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyMzU4MzksImV4cCI6MjA4NjgxMTgzOX0.atBF4OJKHLtNc892v_3369nIAXGJrRfsbvDqcgrsVYk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4ZmV3ZXp6YXJ0eWpzaWdwbG90Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTIzNTgzOSwiZXhwIjoyMDg2ODExODM5fQ.DOp6Aig8S6SrWinTUpc1qNLHNnbuRQ6v0hhtpqnQzXQ';

export const supabaseServiceRole = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// ─────────────────────────────────────────────────────────────
// COLUMN WHITELISTS
// Only fields in these sets will be sent to Supabase on create/update.
// Any unknown/legacy field is silently dropped — no more schema errors.
// To add a new column: add it here AND run the matching ALTER TABLE SQL.
// ─────────────────────────────────────────────────────────────
const TABLE_COLUMNS = {
  package_configs: new Set([
    'id', 'created_by', 'created_date', 'updated_date',
    'package_set_name', 'business_name', 'headline', 'sub_headline',
    'price_range', 'project_duration', 'from_template',
    'duration_min', 'duration_max', 'duration_unit',
    'starter_duration', 'growth_duration', 'premium_duration',
    'price_starter', 'price_growth', 'price_premium', 'price_elite',
    'price_starter_retainer', 'price_growth_retainer',
    'price_premium_retainer', 'price_elite_retainer',
    'pricing_availability', 'currency',
    'pricing_label_onetime', 'pricing_label_retainer',
    'pricing_button_label_onetime', 'pricing_button_label_retainer',
    'brand_color', 'logo_url', 'logo_height', 'guarantee', 'urgency',
    'package_data', 'package_durations', 'package_names',
    'package_descriptions', 'button_links', 'active_packages',
    'core_deliverables', 'extras_bonuses', 'niches',
    'currentDesign', 'pricingMode', 'popularPackageIndex', 'popularBadgeText',
    'original_price_starter', 'original_price_growth', 'original_price_premium', 'original_price_elite',
    'original_price_starter_retainer', 'original_price_growth_retainer', 'original_price_premium_retainer', 'original_price_elite_retainer',
  ]),
  users: new Set([
    'id', 'email', 'full_name', 'role', 'created_date', 'updated_date',
  ]),
  help_requests: new Set([
    'id', 'message', 'status', 'created_by', 'created_date', 'updated_date',
  ]),
  access_codes: new Set([
    'id', 'code', 'status', 'generation_source',
    'created_by', 'created_date', 'updated_date',
  ]),
  health_reports: new Set([
    'id', 'report_date', 'total_packages', 'auto_fixed', 'needs_attention',
    'fixes', 'issues', 'report_text', 'status', 'created_date', 'updated_date',
  ]),
};

const stripUnknownFields = (tableName, data) => {
  const allowed = TABLE_COLUMNS[tableName];
  if (!allowed) return data;
  const clean = {};
  for (const key of Object.keys(data)) {
    if (allowed.has(key)) {
      clean[key] = data[key];
    }
  }
  return clean;
};

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user) return null;

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError && profileError.code !== 'PGRST116') throw profileError;
  return profile || { id: user.id, email: user.email };
};

const createEntityHelper = (tableName, isServiceRole = false) => {
  const client = isServiceRole ? supabaseServiceRole : supabase;

  return {
    list: async (orderBy = '-created_date') => {
      const isDescending = orderBy.startsWith('-');
      const column = isDescending ? orderBy.slice(1) : orderBy;
      const { data, error } = await client
        .from(tableName)
        .select('*')
        .order(column, { ascending: !isDescending });
      if (error) throw error;
      return data || [];
    },

    get: async (id) => {
      const { data, error } = await client
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },

    filter: async (filters, orderBy = '-created_date') => {
      let query = client.from(tableName).select('*');
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
      if (orderBy) {
        const isDescending = orderBy.startsWith('-');
        const column = isDescending ? orderBy.slice(1) : orderBy;
        query = query.order(column, { ascending: !isDescending });
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },

    create: async (data) => {
      const user = await getCurrentUser();
      const raw = { ...data, created_by: user?.id };
      const recordData = stripUnknownFields(tableName, raw);
      const { data: newRecord, error } = await client
        .from(tableName)
        .insert([recordData])
        .select()
        .single();
      if (error) throw error;
      return newRecord;
    },

    update: async (id, data) => {
      const recordData = stripUnknownFields(tableName, data);
      const { data: updatedRecord, error } = await client
        .from(tableName)
        .update(recordData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return updatedRecord;
    },

    delete: async (id) => {
      const { error } = await client
        .from(tableName)
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    }
  };
};

export const entities = {
  User: createEntityHelper('users'),
  PackageConfig: createEntityHelper('package_configs'),
  AccessCode: createEntityHelper('access_codes'),
  HealthReport: createEntityHelper('health_reports'),
  HelpRequest: createEntityHelper('help_requests'),
};

export const entitiesAsServiceRole = {
  User: createEntityHelper('users', true),
  PackageConfig: createEntityHelper('package_configs', true),
  AccessCode: createEntityHelper('access_codes', true),
  HealthReport: createEntityHelper('health_reports', true),
  HelpRequest: createEntityHelper('help_requests', true),
};

export const auth = {
  me: getCurrentUser,
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.user;
  },
  signUp: async (email, password, userData = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: userData }
    });
    if (error) throw error;
    return data.user;
  },
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
};

export default {
  entities,
  auth,
  asServiceRole: {
    entities: entitiesAsServiceRole
  }
};
