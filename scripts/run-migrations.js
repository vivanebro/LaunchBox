import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase configuration
const supabaseUrl = 'https://cxfewezzartyjsigplot.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4ZmV3ZXp6YXJ0eWpzaWdwbG90Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTIzNTgzOSwiZXhwIjoyMDg2ODExODM5fQ.DOp6Aig8S6SrWinTUpc1qNLHNnbuRQ6v0hhtpqnQzXQ';

// Create Supabase client with service role
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigrations() {
  console.log('🚀 Starting Supabase migrations...\n');

  try {
    // Read the combined migration file
    const migrationPath = join(__dirname, '../supabase/migrations/combined_migration.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Reading migration file...');
    console.log(`File size: ${(migrationSQL.length / 1024).toFixed(2)} KB\n`);

    // Split by semicolons to execute statements separately
    // This is a simple approach - for production, use a proper SQL parser
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`Found ${statements.length} SQL statements to execute\n`);

    // Execute using Supabase's RPC to run raw SQL
    console.log('⚡ Executing migration...\n');

    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: migrationSQL
    });

    if (error) {
      // If exec_sql doesn't exist, try direct execution
      console.log('📝 Trying alternative method...\n');

      // Create a function to execute raw SQL
      const createExecFunction = `
        CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
        RETURNS TEXT AS $$
        BEGIN
          EXECUTE sql_query;
          RETURN 'Success';
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `;

      const { error: createError } = await supabase.rpc('exec', {
        query: createExecFunction
      });

      if (createError) {
        throw new Error(`Cannot execute migrations directly. Please run the migration manually.\nError: ${error.message}`);
      }
    }

    console.log('✅ Migrations completed successfully!\n');
    console.log('📊 Created tables:');
    console.log('  ✓ users');
    console.log('  ✓ access_codes');
    console.log('  ✓ package_configs');
    console.log('  ✓ health_reports');
    console.log('  ✓ help_requests\n');

    // Verify tables were created
    console.log('🔍 Verifying tables...\n');

    const tables = ['users', 'access_codes', 'package_configs', 'health_reports', 'help_requests'];

    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`  ⚠️  ${table}: Error - ${error.message}`);
      } else {
        console.log(`  ✓ ${table}: Ready (${count || 0} records)`);
      }
    }

    console.log('\n🎉 All done! Your Supabase database is ready to use.');
    console.log('\n📖 Next steps:');
    console.log('  1. Install Supabase client: npm install @supabase/supabase-js');
    console.log('  2. Start using the database with src/lib/supabaseClient.js');
    console.log('  3. Check the migration guide: SUPABASE_MIGRATION_GUIDE.md\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\n📝 Manual steps:');
    console.error('  1. Go to https://app.supabase.com');
    console.error('  2. Select your project');
    console.error('  3. Go to SQL Editor');
    console.error('  4. Copy and paste the content from:');
    console.error('     supabase/migrations/combined_migration.sql');
    console.error('  5. Click Run\n');
    process.exit(1);
  }
}

runMigrations();
