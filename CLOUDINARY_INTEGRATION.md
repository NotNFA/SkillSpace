# SkillSpace Cloudinary integration

Project ZIP submissions are uploaded from the authenticated Express backend to Cloudinary as **authenticated raw assets**. The browser never receives the Cloudinary API secret or a permanent public ZIP URL.

## Environment variables

Set these on the backend host (and in the local `.env`, which must remain private):

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

The existing `.env.example` already lists all three keys. Do not commit or share `.env`.

## Storage behavior

- New ZIP submissions are validated before upload and stored in the Cloudinary `skillspace/project-submissions` public-ID namespace.
- PostgreSQL's existing `project_submissions.zip_path` text column stores `cloudinary:<asset_id>` for new cloud assets. No schema migration is required.
- AI verification retrieves the asset server-side by immutable Cloudinary asset ID, then runs the existing ZIP inspection and verification pipeline.
- The existing authenticated download route checks the project participants before retrieving and streaming the ZIP.
- Existing rows containing local relative paths remain downloadable and verifiable for backward compatibility until migrated.
- In production (`NODE_ENV=production`, or when running on Render), startup is blocked unless all three Cloudinary credentials are configured. Local-disk ZIP fallback is disabled in production. In local development, the app may still use local disk when Cloudinary is not configured.

## Migrating existing local submissions

1. Back up the PostgreSQL database and keep the existing `uploads/project-submissions/` files available.
2. Configure `DATABASE_URL` and all three `CLOUDINARY_*` variables in the environment where you run the script.
3. Preview eligible records with `npm run cloudinary:migrate-local -- --dry-run`.
4. Run `npm run cloudinary:migrate-local` to upload each local ZIP, download it again to verify its SHA-256 checksum, and then update only that submission's `zip_path` to `cloudinary:<asset_id>`.
5. The script deliberately retains original local ZIP files as rollback copies. Do not delete them until you have confirmed the migrated submissions can be downloaded and AI-verified.

Missing files, invalid ZIP signatures, checksum failures, and database update conflicts are reported and left unchanged; an uploaded asset is cleaned up if its database pointer was not safely updated.

## Security

Uploads use Cloudinary's authenticated delivery type. Upload and asset-download API requests are signed server-side using Node's built-in `crypto`; no extra SDK dependency is required. API credentials must only exist in backend environment variables.
