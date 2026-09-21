# Long Phu: one-time immutable model URL migration

Status on 2026-09-14: preparation and public GET dry-run completed. **No upload,
destination verification, DB connection or DB update has been executed.**
The commands below apply only to Long Phu. Obtain explicit approval for both the
new R2 object and the Project URL update before running `--apply`.

## Reviewed source and destination

Project: `6ce58968-25d2-4910-9ca8-43f5c078ca5b`.

Source URL:
`https://pub-1d5704adea5c46b3920fd8f19e3c3480.r2.dev/projects/6ce58968-25d2-4910-9ca8-43f5c078ca5b/model.glb`

Fresh public GET dry-run verified:

- Size: **34,636,576 bytes** (33.032 MiB).
- SHA-256: `43f104d1df00b13f96c114a06a8cfab0f225a55ef0f1cd9ebd7f6a483536f264`.
- The audited GLB is self-contained (no external buffer/image URIs). The pinned
  hash ensures that relocation cannot silently change its content or transforms.

Dry-run generated version: `545d3b93-5546-4d43-84d7-a3d97298dc36`.
This version has not been uploaded by this migration.

Proposed destination key:
`projects/6ce58968-25d2-4910-9ca8-43f5c078ca5b/versions/545d3b93-5546-4d43-84d7-a3d97298dc36/model.glb`

Proposed destination URL:
`https://pub-1d5704adea5c46b3920fd8f19e3c3480.r2.dev/projects/6ce58968-25d2-4910-9ca8-43f5c078ca5b/versions/545d3b93-5546-4d43-84d7-a3d97298dc36/model.glb`

Required destination metadata:

```text
Content-Type: model/gltf-binary
Cache-Control: public,max-age=31536000,immutable
```

## Commands (PowerShell)

Run from `web-gis-platform/apps/api`. `npx.cmd` avoids the Windows PowerShell
execution-policy restriction on `npx.ps1`; use `npx` on other platforms.

Reproduce the read-only dry-run for this reviewed version:

```powershell
npx.cmd tsx src/scripts/migrateLongPhuModelCache.ts --dry-run --version 545d3b93-5546-4d43-84d7-a3d97298dc36
```

Omitting all flags also performs only a dry-run and generates a fresh UUID.
Dry-run reads the legacy public URL, pins its size/hash, prints the destination,
CAS predicate and exact apply command, and does not connect to R2 S3 or the DB.
`--source-file <path>` is available only for an offline dry-run and is explicitly
reported as a local audit copy, not a fresh source read.

Required approved configuration, supplied through the existing API environment
or `.env` (do not put secrets in commands or reports): `R2_ENDPOINT`,
`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`,
`DATABASE_URL`. Confirm the bucket and database are the intended production
targets. `R2_PUBLIC_URL` must equal the audited public origin above. The script
does not use a fallback database or bucket. R2 credentials need object read/write
access; no delete operation is used. At preparation time all five R2 variables
were absent; only the `DATABASE_URL` name was present in API `.env`.

**Only after approval and credential setup**, run the reviewed command once:

```powershell
npx.cmd tsx src/scripts/migrateLongPhuModelCache.ts --apply --approve-project 6ce58968-25d2-4910-9ca8-43f5c078ca5b --version 545d3b93-5546-4d43-84d7-a3d97298dc36
```

## Execution and failure guarantees

1. Read `Project.modelUrl`; refuse upload unless it still equals the exact legacy
   URL. Read source bytes through the existing `r2Service` client and require the
   pinned size/SHA-256. A changed source requires a new audit, not relaxed checks.
2. Use the existing service's content-type/cache policy and S3 client to PUT the
   unchanged Buffer to the new version key with `If-None-Match: *`. Existing keys
   are rejected. No legacy overwrite, delete, model optimization or layer upload.
3. GET the destination through R2 and compute size/SHA-256 from the actual body.
   Require equality with source, Content-Length, Content-Type and immutable cache
   headers. Then GET the exact public destination URL and repeat these checks.
   Both reads must succeed before publishing its URL. ETag is not used as SHA-256.
4. Execute one atomic Prisma `project.updateMany` with:

   ```typescript
   where: { id: PROJECT_ID, modelUrl: LEGACY_URL },
   data: { modelUrl: destinationUrl }
   ```

   Require `count === 1`. A concurrent URL change gives zero rows and is retained.
   Only `Project.modelUrl` is updated; schema, surveys, calibration and other
   layer URLs are unchanged. Validate the project's base model (no survey
   override); survey model URLs are outside this migration's scope.

No transaction is held open during network transfers. Upload/readback/header/CAS
failures abort without a forced DB retry or object cleanup. If a write succeeded
but the response was lost, the same UUID still cannot overwrite that object.
Inspect the reported destination and current DB URL before choosing a fresh UUID
for a separately reviewed attempt. Existing version objects and legacy bytes are
retained. Never run `syncR2.ts` or the broad project upload endpoint for this task.

## Browser validation after successful migration

Keep DevTools **Disable cache unchecked** for B and C. Use the same browser
profile and application origin. Record exact URL, actual transfer count/bytes,
status, memory/disk cache source, headers, and ModelLoad start/resolved/attached/
render-ready timestamps. The script's Node GET verification does not warm browser
cache and is not a runtime benchmark.

| Case | Procedure | Evidence to capture |
| --- | --- | --- |
| A: first cold open | With an empty browser cache, open Long Phu using the new URL. | One full GLB transfer; network and render-ready time; immutable header. |
| B: normal reopen/navigation | Navigate to dashboard, reopen Long Phu, cache enabled. | Exact same URL; expect no full 33 MiB transfer when browser cache is reusable. Record memory/disk cache or any unexpected network request. |
| C: normal reload | Use a normal reload with cache enabled. | Whether disk/memory cache is reused; distinguish a small validation response from a full body transfer. |
| D: hard reload | Test separately and label it hard reload. | It may intentionally bypass cache. A full transfer here alone is not evidence that caching failed. |

Also verify Model + DOM, model toggle without GLB reload and no startup Point
Cloud request. Viewer and the Quy Nhon fix are untouched by this migration.
If B/C still transfer the full file, inspect headers, request cache directives,
CORS/credentials, cache partitioning and eviction before making another change.
Do not restore prefetch: the previous experiment caused two full transfers.
Only a later task may retry exact-URL prefetch after B/C demonstrate cache reuse.

The first cold transfer still contains 33.032 MiB. A reusable browser cache can
avoid that transfer on repeat opens (previously about 4.688 s of model loading),
but GPU/render work remains. No post-migration speedup has yet been measured.

## Custom-domain / Cloudflare cache follow-up (not implemented)

The same immutable object can be served through an R2 custom domain without
copying or rewriting it. Connect an owned Cloudflare domain to the bucket using
R2's custom-domain flow; `r2.dev` does not provide Cloudflare edge caching.
Create a narrowly scoped cache rule for the versioned model path if needed to
make `.glb` eligible for caching, respecting its immutable origin TTL. Validate
CORS for the actual app origin and verify public body hash/headers plus repeated
`CF-Cache-Status`/`Age` behavior before proposing another DB URL CAS. The changed
host is a new browser cache key and requires a first cold load of its own.
No domain, DNS, cache rule or URL change is part of this task.

References: [R2 public buckets/custom domains](https://developers.cloudflare.com/r2/buckets/public-buckets/),
[R2 S3 conditional PUT and metadata support](https://developers.cloudflare.com/r2/api/s3/api/).

## Local validation

From `apps/api`:

```powershell
npx.cmd tsx --test tests/migrateLongPhuModelCache.test.ts
npx.cmd tsc -b --pretty false
npm.cmd run build
```

From `apps/web`: `npx.cmd tsc -b --pretty false`, then `npm.cmd run build`.
From the repository: `git diff --check`.
