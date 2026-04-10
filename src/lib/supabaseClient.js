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

// Service role key removed from client bundle for security.
// Server-side operations use Supabase Edge Functions instead.

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
    'creator_slug', 'public_slug',
    'brand_color', 'logo_url', 'logo_height', 'guarantee', 'urgency',
    'package_data', 'package_durations', 'package_names',
    'package_descriptions', 'button_links', 'active_packages',
    'core_deliverables', 'extras_bonuses', 'niches',
    'currentDesign', 'pricingMode', 'popularPackageIndex', 'popularBadgeText',
    'show_excluded_deliverables', 'show_package_buttons_in_edit_mode', 'retainer_discount_text',
    'original_price_starter', 'original_price_growth', 'original_price_premium', 'original_price_elite',
    'original_price_starter_retainer', 'original_price_growth_retainer', 'original_price_premium_retainer', 'original_price_elite_retainer',
    'cost_data',
    'manual_status',
    'manual_status_updated_at',
    'folder_id',
  ]),
  folders: new Set([
    'id', 'name', 'parent_id', 'created_by', 'is_example', 'created_date', 'updated_date',
  ]),
  users: new Set([
    'id', 'email', 'full_name', 'role', 'creator_slug', 'created_date', 'updated_date',
    'hide_copy_link_folder_prompt',
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
  quiz_configs: new Set([
    'id', 'created_by', 'created_date', 'updated_date',
    'quiz_name', 'welcome_title', 'welcome_subtitle', 'welcome_button_text',
    'brand_color', 'logo_url', 'business_name',
    'questions', 'pricing_config', 'tier_config',
    'cta_type', 'cta_link', 'currency', 'is_active',
  ]),
  quiz_submissions: new Set([
    'id', 'quiz_id', 'answers', 'generated_packages',
    'calculated_base_price', 'started_at', 'completed_at', 'created_date',
  ]),
  contracts: new Set([
    'id', 'created_by', 'name', 'body', 'merge_field_definitions',
    'logo_url', 'logo_height', 'accent_color', 'custom_confirmation_message',
    'custom_button_label', 'custom_button_link', 'consent_text', 'status',
    'shareable_link', 'linked_package_id', 'folder_id', 'expires_at',
    'created_at', 'updated_at',
  ]),
  contract_templates: new Set([
    'id', 'created_by', 'name', 'body',
    'logo_url', 'logo_height', 'accent_color', 'custom_confirmation_message',
    'custom_button_label', 'custom_button_link',
    'created_at', 'updated_at',
  ]),
  signed_contracts: new Set([
    'id', 'contract_id', 'client_name', 'client_email', 'signed_body',
    'signature_image', 'signed_at', 'client_ip', 'pdf_url',
    'client_folder_id', 'created_at',
  ]),
  notifications: new Set([
    'id', 'created_by', 'type', 'title', 'message', 'metadata',
    'is_read', 'is_viewed_celebration', 'created_at',
  ]),
  cost_calculator_templates: new Set([
    'id', 'created_by', 'name', 'body', 'linked_package_id', 'currency',
    'created_at', 'updated_at',
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

const createEntityHelper = (tableName) => {
  const client = supabase;

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
  Folder: createEntityHelper('folders'),
  PackageConfig: createEntityHelper('package_configs'),
  AccessCode: createEntityHelper('access_codes'),
  HealthReport: createEntityHelper('health_reports'),
  HelpRequest: createEntityHelper('help_requests'),
  QuizConfig: createEntityHelper('quiz_configs'),
  QuizSubmission: createEntityHelper('quiz_submissions'),
  Contract: createEntityHelper('contracts'),
  ContractTemplate: createEntityHelper('contract_templates'),
  SignedContract: createEntityHelper('signed_contracts'),
  Notification: createEntityHelper('notifications'),
  CostCalculatorTemplate: createEntityHelper('cost_calculator_templates'),
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
};
