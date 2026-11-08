# First Scheduler as Zoom Host

- The original `requester_id` remains the permanent SkillSpace host. Accepting or rescheduling does not change it.
- Zoom meetings are created under the original scheduler's email. The Zoom account must contain that email as an authorized/licensed host user; an arbitrary SkillSpace email cannot be granted Zoom host rights by SkillSpace alone.
- Both participants receive the same `join_url`.
- The private Zoom `start_url` is stored in `meetings.host_start_url` and returned only by the authenticated `/api/meetings/:id/host-start` endpoint to the original scheduler. It is excluded from meeting list/accept/reschedule responses and Socket.IO events.
- Apply `db/migrations/20261108_meeting_host_start_link.sql` in Supabase SQL Editor before starting the updated server. This migration only adds a nullable column and does not delete or rewrite existing data.
- Zoom host start URLs are credential-like and time-limited by Zoom. Do not copy/share them; share only the normal participant join link.

## Meeting card buttons
- Original scheduler sees **Join as Host** (private host start endpoint), **Meeting Link** (normal participant URL), and a separate **Share Link** button that copies only the normal participant URL.
- The other participant sees **Join Meeting** (the same normal participant URL) and **Share Link** (copies that same participant URL).
- The host start URL is never placed in the page markup or copied by Share Link; it is fetched only when the original scheduler clicks Join as Host.
