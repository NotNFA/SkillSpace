PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('creator','client')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS creator_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'UI/UX Designer',
  experience_years INTEGER NOT NULL DEFAULT 0,
  qualifications TEXT DEFAULT '',
  skills TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  portfolio_url TEXT DEFAULT '',
  social_url TEXT DEFAULT '',
  socials_json TEXT DEFAULT '{}',
  sample_works TEXT DEFAULT '',
  work_mode TEXT DEFAULT 'Part-time',
  expected_salary TEXT DEFAULT '',
  hourly_rate INTEGER DEFAULT 0,
  verified INTEGER NOT NULL DEFAULT 0,
  rating REAL NOT NULL DEFAULT 0,
  rating_count INTEGER NOT NULL DEFAULT 0,
  profile_saved INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS client_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  company TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  social_url TEXT DEFAULT '',
  rating REAL NOT NULL DEFAULT 0,
  rating_count INTEGER NOT NULL DEFAULT 0,
  profile_saved INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS hiring_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_user_id INTEGER NOT NULL,
  creator_user_id INTEGER NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  contact_url TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','accepted','declined','cancelled')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(client_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(creator_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_creator_category ON creator_profiles(category);
CREATE INDEX IF NOT EXISTS idx_hiring_creator ON hiring_requests(creator_user_id, status);
CREATE INDEX IF NOT EXISTS idx_hiring_client ON hiring_requests(client_user_id, status);

CREATE TABLE IF NOT EXISTS community_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  project_type TEXT DEFAULT '',
  description TEXT NOT NULL,
  budget TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(client_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS community_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  client_user_id INTEGER NOT NULL,
  creator_user_id INTEGER NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
  FOREIGN KEY(client_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(creator_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_community_posts_category ON community_posts(category, created_at);
CREATE INDEX IF NOT EXISTS idx_community_messages_client ON community_messages(client_user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_community_messages_creator ON community_messages(creator_user_id, created_at);

CREATE TABLE IF NOT EXISTS meetings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  requester_id INTEGER NOT NULL,
  receiver_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT '',
  meeting_date TEXT NOT NULL,
  duration INTEGER NOT NULL,
  meeting_type TEXT NOT NULL DEFAULT 'video',
  status TEXT NOT NULL DEFAULT 'pending',
  zoom_meeting_id TEXT DEFAULT '',
  join_url TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(requester_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(receiver_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_meetings_requester ON meetings(requester_id,status);
CREATE INDEX IF NOT EXISTS idx_meetings_receiver ON meetings(receiver_id,status);

-- Smart Project Assurance System
CREATE TABLE IF NOT EXISTS assurance_projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  creator_id INTEGER NOT NULL,
  hiring_request_id INTEGER,
  agreed_by INTEGER,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  budget REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  objective TEXT NOT NULL DEFAULT '',
  additional_instructions TEXT NOT NULL DEFAULT '',
  tools_json TEXT NOT NULL DEFAULT '[]',
  deadline TEXT,
  status TEXT NOT NULL DEFAULT 'awaiting_creator_agreement',
  agreed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(client_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(creator_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(hiring_request_id) REFERENCES hiring_requests(id) ON DELETE SET NULL,
  FOREIGN KEY(agreed_by) REFERENCES users(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS project_requirements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  requirement TEXT NOT NULL,
  mandatory INTEGER NOT NULL DEFAULT 1,
  check_type TEXT NOT NULL DEFAULT 'ai',
  category TEXT NOT NULL DEFAULT 'Other',
  requirement_type TEXT NOT NULL DEFAULT 'FUNCTIONAL',
  validation_method TEXT NOT NULL DEFAULT 'ai',
  acceptance_criteria TEXT NOT NULL DEFAULT '',
  expected_paths TEXT NOT NULL DEFAULT '',
  FOREIGN KEY(project_id) REFERENCES assurance_projects(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS project_milestones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  amount REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'NOT_STARTED',
  deadline TEXT,
  deliverables_json TEXT NOT NULL DEFAULT '[]',
  acceptance_criteria TEXT NOT NULL DEFAULT '',
  requirement_ids_json TEXT NOT NULL DEFAULT '[]',
  approved_by INTEGER,
  approved_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(project_id) REFERENCES assurance_projects(id) ON DELETE CASCADE,
  FOREIGN KEY(approved_by) REFERENCES users(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS project_scope_checks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  requested_change TEXT NOT NULL,
  result_json TEXT NOT NULL DEFAULT '{}',
  created_by INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(project_id) REFERENCES assurance_projects(id) ON DELETE CASCADE,
  FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS project_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  milestone_id INTEGER NOT NULL,
  creator_id INTEGER NOT NULL,
  zip_name TEXT NOT NULL,
  zip_path TEXT NOT NULL,
  validation_status TEXT NOT NULL DEFAULT 'needs_review',
  validation_json TEXT NOT NULL DEFAULT '{}',
  ai_attempts INTEGER NOT NULL DEFAULT 0,
  last_ai_attempt_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(project_id) REFERENCES assurance_projects(id) ON DELETE CASCADE,
  FOREIGN KEY(milestone_id) REFERENCES project_milestones(id) ON DELETE CASCADE,
  FOREIGN KEY(creator_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS blueprint_revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  version INTEGER NOT NULL,
  snapshot_json TEXT NOT NULL,
  created_by INTEGER NOT NULL,
  change_note TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(project_id) REFERENCES assurance_projects(id) ON DELETE CASCADE,
  FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(project_id,version)
);
CREATE TABLE IF NOT EXISTS project_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  submission_id INTEGER NOT NULL,
  reviewer_id INTEGER NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('revision')),
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(submission_id) REFERENCES project_submissions(id) ON DELETE CASCADE,
  FOREIGN KEY(reviewer_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS project_feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL UNIQUE,
  client_id INTEGER NOT NULL,
  creator_id INTEGER NOT NULL,
  rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
  quality_rating INTEGER NOT NULL CHECK(quality_rating BETWEEN 1 AND 5),
  comment TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(project_id) REFERENCES assurance_projects(id) ON DELETE CASCADE,
  FOREIGN KEY(client_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(creator_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_assurance_client ON assurance_projects(client_id,status);
CREATE INDEX IF NOT EXISTS idx_assurance_creator ON assurance_projects(creator_id,status);
CREATE INDEX IF NOT EXISTS idx_submissions_milestone ON project_submissions(milestone_id,created_at);
CREATE INDEX IF NOT EXISTS idx_blueprint_revisions_project ON blueprint_revisions(project_id,version);
CREATE TABLE IF NOT EXISTS assurance_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  project_id INTEGER,
  submission_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(project_id) REFERENCES assurance_projects(id) ON DELETE CASCADE,
  FOREIGN KEY(submission_id) REFERENCES project_submissions(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_assurance_notifications_user ON assurance_notifications(user_id,created_at);


-- Durable global chat, private DMs, invitations and user testimonials.
CREATE TABLE IF NOT EXISTS global_chat_messages (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,message TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE);
CREATE INDEX IF NOT EXISTS idx_global_chat_created ON global_chat_messages(id);
CREATE TABLE IF NOT EXISTS dm_invites (id INTEGER PRIMARY KEY AUTOINCREMENT,sender_id INTEGER NOT NULL,receiver_id INTEGER NOT NULL,status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','accepted','rejected','cancelled')),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(sender_id,receiver_id,status),FOREIGN KEY(sender_id) REFERENCES users(id) ON DELETE CASCADE,FOREIGN KEY(receiver_id) REFERENCES users(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS dm_conversations (id INTEGER PRIMARY KEY AUTOINCREMENT,user_one INTEGER NOT NULL,user_two INTEGER NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(user_one,user_two),FOREIGN KEY(user_one) REFERENCES users(id) ON DELETE CASCADE,FOREIGN KEY(user_two) REFERENCES users(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS dm_messages (id INTEGER PRIMARY KEY AUTOINCREMENT,conversation_id INTEGER NOT NULL,sender_id INTEGER NOT NULL,message TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(conversation_id) REFERENCES dm_conversations(id) ON DELETE CASCADE,FOREIGN KEY(sender_id) REFERENCES users(id) ON DELETE CASCADE);
CREATE INDEX IF NOT EXISTS idx_dm_messages_conversation ON dm_messages(conversation_id,id);
CREATE TABLE IF NOT EXISTS testimonials (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),message TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE);
CREATE INDEX IF NOT EXISTS idx_testimonials_created ON testimonials(id DESC);
