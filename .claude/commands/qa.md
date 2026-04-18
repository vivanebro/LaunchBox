Run the qa-reviewer agent on the LaunchBox codebase. Focus on the most recent commit unless told otherwise.

Check what changed with `git diff HEAD~1 --name-only`, then run all 3 checks (Design+UX, Feature connections, Code+Security) on the changed files and their connected features.

Report findings as a numbered list grouped by HIGH / MEDIUM / LOW severity.
