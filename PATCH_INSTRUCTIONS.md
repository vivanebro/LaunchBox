# 🔧 PATCH: Results.jsx and PackageBuilder.jsx

These two files only need their import line changed.
Find the line that imports `base44` and replace it with the supabaseClient import.

---

## Results.jsx — Find this line (near the top of imports):

```js
import { base44 } from '@/api/base44Client';
```

Replace with:

```js
import supabaseClient from '@/lib/supabaseClient';
```

Then, find every usage of `base44.entities.PackageConfig` and replace with `supabaseClient.entities.PackageConfig`.

There are 3 occurrences in Results.jsx:

### Occurrence 1 — in handleSave():
FIND:
```js
await base44.entities.PackageConfig.update(savedPackageId, configToSave);
```
REPLACE:
```js
await supabaseClient.entities.PackageConfig.update(savedPackageId, configToSave);
```

### Occurrence 2 — in handleSave() fallback create:
FIND:
```js
const newPackage = await base44.entities.PackageConfig.create(configToSave);
```
REPLACE:
```js
const newPackage = await supabaseClient.entities.PackageConfig.create(configToSave);
```

### Occurrence 3 — in the publish/preview inline save block:
FIND:
```js
await base44.entities.PackageConfig.update(packageId, configToSave);
```
REPLACE:
```js
await supabaseClient.entities.PackageConfig.update(packageId, configToSave);
```

And the corresponding create in that same block:
FIND:
```js
const newPackage = await base44.entities.PackageConfig.create(configToSave);
```
REPLACE:
```js
const newPackage = await supabaseClient.entities.PackageConfig.create(configToSave);
```

---

## PackageBuilder.jsx — Find this line (near the top of imports):

```js
import { base44 } from '@/api/base44Client';
```

Replace with:

```js
import supabaseClient from '@/lib/supabaseClient';
```

Then replace all usages of `base44.entities.PackageConfig`:

### Occurrence 1 — update existing package:
FIND:
```js
await base44.entities.PackageConfig.update(editingPackageId, cleanConfig);
```
REPLACE:
```js
await supabaseClient.entities.PackageConfig.update(editingPackageId, cleanConfig);
```

### Occurrence 2 — loading existing config (if present):
FIND any remaining:
```js
base44.entities.PackageConfig
```
REPLACE:
```js
supabaseClient.entities.PackageConfig
```

---

## Quick global search tip:
In VS Code, open each file and press Ctrl+H (Find & Replace):
- Search: `base44.entities`
- Replace: `supabaseClient.entities`

Then fix the import at the top.
