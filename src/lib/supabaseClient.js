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

// Service role client for server-side operations (use with caution!)
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4ZmV3ZXp6YXJ0eWpzaWdwbG90Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTIzNTgzOSwiZXhwIjoyMDg2ODExODM5fQ.DOp6Aig8S6SrWinTUpc1qNLHNnbuRQ6v0hhtpqnQzXQ';

export const supabaseServiceRole = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Helper functions to match Base44 SDK patterns

/**
 * Get current authenticated user
 */
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;

  if (!user) return null;

  // Fetch user profile from users table
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError && profileError.code !== 'PGRST116') throw profileError;

  return profile || { id: user.id, email: user.email };
};

/**
 * Create entity helper (mimics Base44 pattern)
 */
const createEntityHelper = (tableName, isServiceRole = false) => {
  const client = isServiceRole ? supabaseServiceRole : supabase;

  return {
    /**
     * List all records
     * @param {string} orderBy - Column to order by (prefix with '-' for descending)
     */
    list: async (orderBy = '-created_date') => {
      const isDescending = orderBy.startsWith('-');
      const column = isDescending ? orderBy.slice(1) : orderBy;

      const { data, error } = await client
        .from(tableName)
        .select('*')
        .order(column, { ascending: !isDescending });

      if (error) throw error;
      return data ?? [];
    },

    /**
     * Get single record by ID
     */
    get: async (id) => {
      const { data, error } = await client
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },

    /**
     * Filter records
     * @param {object} filters - Key/value pairs to filter by
     * @param {string} [orderBy] - Column to order by (prefix with '-' for descending)
     */
    filter: async (filters, orderBy = null) => {
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
      return data ?? [];
    },

    /**
     * Create new record
     */
    create: async (data) => {
      // Add created_by if authenticated
      const user = await getCurrentUser();
      const recordData = {
        ...data,
        created_by: user?.id
      };

      const { data: newRecord, error } = await client
        .from(tableName)
        .insert([recordData])
        .select()
        .single();

      if (error) throw error;
      return newRecord;
    },

    /**
     * Update record
     */
    update: async (id, data) => {
      const { data: updatedRecord, error } = await client
        .from(tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updatedRecord;
    },

    /**
     * Delete record
     */
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

/**
 * Supabase entities (mimics Base44 SDK structure)
 */
export const entities = {
  User: createEntityHelper('users'),
  PackageConfig: createEntityHelper('package_configs'),
  AccessCode: createEntityHelper('access_codes'),
  HealthReport: createEntityHelper('health_reports'),
  HelpRequest: createEntityHelper('help_requests'),
};

/**
 * Service role entities (for elevated permissions)
 */
export const entitiesAsServiceRole = {
  User: createEntityHelper('users', true),
  PackageConfig: createEntityHelper('package_configs', true),
  AccessCode: createEntityHelper('access_codes', true),
  HealthReport: createEntityHelper('health_reports', true),
  HelpRequest: createEntityHelper('help_requests', true),
};

/**
 * Auth helper (mimics Base44 SDK)
 */
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
      options: {
        data: userData
      }
    });
    if (error) throw error;
    return data.user;
  },
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
};

// Default export mimics Base44 client structure
export default {
  entities,
  auth,
  asServiceRole: {
    entities: entitiesAsServiceRole
  }
};
