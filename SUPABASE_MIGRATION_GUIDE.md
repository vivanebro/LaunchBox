# 🚀 Supabase Migration Guide

## סקירה כללית
מדריך זה יעזור לך לעבור מ-Base44 ל-Supabase. כל ה-migrations והקונפיגורציות מוכנים ומחכים לך!

## 📋 שלבי ההתקנה

### שלב 1: התקנת Supabase JS Client

```bash
npm install @supabase/supabase-js
```

או עם yarn:
```bash
yarn add @supabase/supabase-js
```

### שלב 2: הרצת Migrations ב-Supabase

יש לך שתי אפשרויות להריץ את ה-migrations:

#### אפשרות A: דרך Supabase Dashboard (מומלץ למתחילים)

1. היכנס ל-[Supabase Dashboard](https://app.supabase.com)
2. בחר בפרויקט שלך: `cxfewezzartyjsigplot`
3. לך ל-**SQL Editor** בתפריט הצד
4. העתק והדבק כל קובץ migration מתיקיית `supabase/migrations/` בסדר הבא:
   - `20240216000001_create_users_table.sql`
   - `20240216000002_create_access_codes_table.sql`
   - `20240216000003_create_package_configs_table.sql`
   - `20240216000004_create_health_reports_table.sql`
   - `20240216000005_create_help_requests_table.sql`
5. הרץ כל אחד בנפרד על ידי לחיצה על **Run**

#### אפשרות B: דרך Supabase CLI (למתקדמים)

1. התקן את Supabase CLI:
```bash
npm install -g supabase
```

2. התחבר לפרויקט שלך:
```bash
supabase login
supabase link --project-ref cxfewezzartyjsigplot
```

3. הרץ את כל ה-migrations:
```bash
supabase db push
```

### שלב 3: עדכון הקוד לשימוש ב-Supabase

הקובץ `src/lib/supabaseClient.js` כבר מוכן ומחכה לך! הוא מחקה את ה-API של Base44 כדי להקל על המעבר.

#### דוגמה לשימוש:

```javascript
// במקום:
import { base44 } from '@/api/base44Client';

// השתמש ב:
import supabaseClient from '@/lib/supabaseClient';

// ה-API זהה!
const packages = await supabaseClient.entities.PackageConfig.list();
const user = await supabaseClient.auth.me();
```

## 📊 מבנה הטבלאות

### 1. **users** - טבלת משתמשים
- `id` - UUID (מפתח ראשי)
- `email` - כתובת אימייל (ייחודי)
- `full_name` - שם מלא
- `role` - תפקיד (user/admin)
- `created_date` - תאריך יצירה
- `updated_date` - תאריך עדכון

### 2. **access_codes** - קודי גישה
- `id` - UUID (מפתח ראשי)
- `code` - קוד ייחודי
- `status` - סטטוס (unused/used)
- `generation_source` - מקור היצירה
- `created_by` - מי יצר (UUID)
- `created_date` - תאריך יצירה
- `updated_date` - תאריך עדכון

### 3. **package_configs** - הגדרות חבילות
- `id` - UUID (מפתח ראשי)
- `package_set_name` - שם סט החבילה
- `business_name` - שם העסק
- `price_starter` - מחיר starter
- `price_growth` - מחיר growth
- `price_premium` - מחיר premium
- `price_elite` - מחיר elite
- `popular_package_index` - JSONB - אינדקס חבילה פופולרית
- `package_descriptions` - JSONB - תיאורי חבילות
- `button_links` - JSONB - קישורי כפתורים
- `package_names` - JSONB - שמות חבילות
- `active_packages` - JSONB - חבילות פעילות
- `package_data` - JSONB - מידע נוסף על חבילות
- `brand_color` - צבע המותג
- `logo_url` - URL ללוגו
- `guarantee` - ערבות
- `urgency` - דחיפות
- `created_by` - מי יצר (UUID)
- `created_date` - תאריך יצירה
- `updated_date` - תאריך עדכון

### 4. **health_reports** - דוחות בריאות
- `id` - UUID (מפתח ראשי)
- `report_date` - תאריך הדוח
- `total_packages` - סה"כ חבילות
- `auto_fixed` - מספר תיקונים אוטומטיים
- `needs_attention` - מספר בעיות שדורשות תשומת לב
- `fixes` - JSONB - רשימת תיקונים
- `issues` - JSONB - רשימת בעיות
- `report_text` - טקסט הדוח
- `status` - סטטוס
- `created_date` - תאריך יצירה
- `updated_date` - תאריך עדכון

### 5. **help_requests** - בקשות עזרה
- `id` - UUID (מפתח ראשי)
- `message` - הודעה
- `status` - סטטוס (new/responded)
- `created_by` - מי יצר (UUID)
- `created_date` - תאריך יצירה
- `updated_date` - תאריך עדכון

## 🔐 Row Level Security (RLS)

כל הטבלאות מוגדרות עם RLS policies שמבטיחות:
- משתמשים רואים רק את המידע שלהם
- Admins רואים הכל
- Service role יכול לעשות הכל

## 🔄 עדכון Functions (Deno Edge Functions)

הפונקציות ב-`functions/` צריכות להתעדכן להשתמש ב-Supabase. הנה דוגמה:

### לפני (Base44):
```typescript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const packages = await base44.entities.PackageConfig.list();
});
```

### אחרי (Supabase):
```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data: packages } = await supabase.from('package_configs').select('*');
});
```

## 📝 משימות נוספות

- [ ] התקן `@supabase/supabase-js`
- [ ] הרץ את כל ה-migrations ב-Supabase Dashboard
- [ ] בדוק שהטבלאות נוצרו בהצלחה
- [ ] עדכן את הקוד להשתמש ב-`supabaseClient` במקום `base44`
- [ ] עדכן את ה-Deno Edge Functions
- [ ] בדוק את ה-RLS policies
- [ ] הגר נתונים קיימים מ-Base44 (אם יש)

## 🆘 עזרה

אם נתקלת בבעיות:
1. בדוק את ה-Supabase logs ב-Dashboard
2. ודא שה-API keys נכונים ב-`.mcp.json`
3. ודא שה-RLS policies מוגדרות נכון

## ✅ מה כבר מוכן?

- ✅ כל קבצי ה-migrations
- ✅ Supabase client configuration
- ✅ RLS policies
- ✅ Helper functions שמחקות את Base44 API
- ✅ MCP server configuration

**בהצלחה! 🚀**
