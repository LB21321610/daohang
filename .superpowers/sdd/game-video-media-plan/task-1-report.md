# Task 1 Report: Content model, section validation, and deterministic discovery

Status: DONE_WITH_CONCERNS

## Implemented

- Added `games`, `video`, and `media` category IDs.
- Added ordered category sections with duplicate ID/order validation and site-to-section validation.
- Added `SiteLinkStatus` and a `Site` discriminated union: linked entries require a URL and receive a derived domain; unavailable entries reject URL/domain.
- Restricted review status to `verified | unverified`.
- Added shared deterministic discovery for direct, regular, visible `.yml` files using English ordering; both the build and catalog test use it.
- Preserved YAML document/site ordering, duplicate site ID validation, and normalized URL duplicate validation.
- Added `linkStatus: unchecked` to all 39 existing site entries because no independent link-check evidence exists; their original `reviewStatus` values remain unchanged.

## TDD Evidence

### RED

Command:

```text
npm test -- --run tests/content/content.test.ts tests/content/content-files.test.ts
```

Key output (exit 1):

```text
FAIL  tests/content/content-files.test.ts
FAIL  tests/content/content.test.ts
Error: Failed to resolve import "../../scripts/content-files.mts"
Test Files  2 failed (2)
```

The focused content/discovery suites failed because the new shared discovery capability did not exist.

### GREEN (focused)

Command:

```text
npx vitest run tests/content/content.test.ts tests/content/content-files.test.ts
```

Key output (exit 0):

```text
Test Files  2 passed (2)
Tests       12 passed (12)
```

### GREEN (full test suite)

Command:

```text
npm test
```

Key output (exit 0):

```text
Generated 39 sites across 5 categories.
Test Files  6 passed (6)
Tests       29 passed (29)
```

### Scoped static verification

Commands:

```text
npx eslint src/domain/site.ts scripts/content-lib.mts scripts/content-files.mts scripts/build-content.mts tests/content/content.test.ts tests/content/content-files.test.ts
git diff --check
```

Both exited 0 with no findings.

## Concern / Cross-task dependency

`npm run typecheck` exits 2 until Task 2 adapts consumers to this foundation. Failures are limited to three expected cross-task groups:

1. `src/app/App.tsx`: the category icon record lacks `games`, `video`, and `media`.
2. `src/app/App.tsx` and `src/domain/search.ts`: consumers have not yet narrowed the unavailable `Site` union before reading `url`/`domain`.
3. Existing fixtures in `tests/app/App.test.tsx` and `tests/domain/search.test.ts`: linked sites do not yet include `linkStatus`.

Per the task boundary, Task 1 did not modify those Task 2-owned files.

## Review fix round 1: independent review and link status

The initial migration incorrectly derived `linkStatus` from the existing `reviewStatus`. The fix preserves every existing review status while marking all 39 existing URLs `linkStatus: unchecked` until an independent link check supplies evidence otherwise.

Coverage added in `tests/content/content.test.ts`:

- The published catalog must contain 39 `unchecked` links and both `verified/unchecked` and `unverified/unchecked` status pairs.
- A focused synthetic catalog preserves the cross-pairs `verified/unchecked` and `unverified/verified`, proving the two dimensions are accepted and retained independently.

### Round 1 RED

Command:

```text
npx vitest run tests/content/content.test.ts
```

Key output (exit 1):

```text
tests/content/content.test.ts (12 tests | 1 failed)
AssertionError: expected false to be true
Test Files  1 failed (1)
Tests       1 failed | 11 passed (12)
```

The published-catalog assertion failed because the 10 entries with `reviewStatus: verified` still had `linkStatus: verified` without independent link-check evidence.

### Round 1 GREEN (focused)

Command:

```text
npx vitest run tests/content/content.test.ts tests/content/content-files.test.ts
```

Key output (exit 0):

```text
Test Files  2 passed (2)
Tests       13 passed (13)
```

### Round 1 GREEN (full test suite)

Command:

```text
npm test
```

Key output (exit 0):

```text
Generated 39 sites across 5 categories.
Test Files  6 passed (6)
Tests       30 passed (30)
```
