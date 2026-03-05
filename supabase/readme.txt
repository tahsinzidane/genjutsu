================================================================================
 genjutsu — Supabase Database Setup Guide
================================================================================

This folder contains the database migrations and setup files for genjutsu.


FILES
-----

  init.sql        → Single file to set up an entire fresh Supabase project.
                    Use this instead of running migrations one by one.

  migrations/     → Individual migration files (historical record).
                    These were applied incrementally during development.
                    Kept for reference but not needed for fresh setup.


FRESH SETUP (NEW SUPABASE PROJECT)
----------------------------------

  1. Create a new Supabase project at https://supabase.com

  2. Go to SQL Editor and run the entire contents of init.sql

  3. Store your service_role key in Vault (required for auto storage cleanup):

     Go to Settings → API → copy the service_role key, then run:

       SELECT vault.create_secret('supabase_service_role_key', 'YOUR_KEY');

  4. Set up your .env file in the project root:

       VITE_SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
       VITE_SUPABASE_PUBLISHABLE_KEY="YOUR_ANON_KEY"

     (Find both values in Supabase Dashboard → Settings → API)

  5. Run the app: npm run dev


WHAT THE DATABASE DOES
----------------------

  Tables:
    - profiles      Users (auto-created on signup)
    - posts         24-hour ephemeral posts
    - likes         Post likes
    - bookmarks     Post bookmarks
    - comments      Post comments (echoes)
    - follows       User follow relationships
    - messages      Whispers (DMs, also 24-hour)

  Storage Buckets:
    - post-media    Images attached to posts
    - avatars       User profile pictures
    - banners       User profile banners

  Cron Jobs (run every hour):
    - delete_expired_posts      Deletes posts older than 24h + their storage files
    - delete_expired_whispers   Deletes messages older than 24h

  Cascade Deletion:
    When a post is deleted (manually or by cron), these are auto-deleted:
    - All comments on the post
    - All likes on the post
    - All bookmarks on the post


IMPORTANT NOTES
---------------

  - The init.sql contains a hardcoded Supabase project URL in the
    delete_expired_posts() function. If you use a different project,
    update that URL.

  - The service_role key in Vault is ONLY used server-side by the cron job.
    It is never exposed to the client/frontend.

  - Never commit your service_role key to git or use it in frontend code.
