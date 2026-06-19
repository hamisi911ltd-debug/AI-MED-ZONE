-- ============================================================
--  AMZ MedAI Zone — Cloudflare D1 Database Schema
--  Run with: wrangler d1 execute AMZ_DB --file=schema.sql
-- ============================================================

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ============================================================
-- 1. USERS — accounts from login.html sign-up form
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name      TEXT    NOT NULL,
  last_name       TEXT    NOT NULL,
  email           TEXT    NOT NULL UNIQUE,
  password_hash   TEXT    NOT NULL,               -- bcrypt hash, never plain text
  role            TEXT    NOT NULL CHECK (role IN (
                    'physician','nurse','radiologist','surgeon',
                    'pharmacist','student','admin','researcher','institution'
                  )),
  is_verified     INTEGER NOT NULL DEFAULT 0,     -- 0=pending, 1=verified
  is_active       INTEGER NOT NULL DEFAULT 1,
  avatar_url      TEXT,
  phone           TEXT,
  institution     TEXT,
  country         TEXT    NOT NULL DEFAULT 'Kenya',
  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  last_login_at   TEXT,
  reset_token     TEXT,
  reset_token_exp TEXT
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================================
-- 2. SESSIONS — auth tokens
-- ============================================================
CREATE TABLE IF NOT EXISTS sessions (
  id          TEXT    PRIMARY KEY,               -- UUID token
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ip_address  TEXT,
  user_agent  TEXT,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  expires_at  TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

-- ============================================================
-- 3. LEARNING TRACKS — the 6 programme tracks shown in #paths
-- ============================================================
CREATE TABLE IF NOT EXISTS tracks (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  slug          TEXT    NOT NULL UNIQUE,         -- e.g. 'foundations', 'clinical-ai'
  title         TEXT    NOT NULL,
  subtitle      TEXT,
  description   TEXT,
  week_start    INTEGER NOT NULL,               -- e.g. 1
  week_end      INTEGER NOT NULL,               -- e.g. 3
  total_hours   INTEGER NOT NULL,
  level         TEXT    NOT NULL CHECK (level IN ('beginner','intermediate','advanced','all')),
  is_flagship   INTEGER NOT NULL DEFAULT 0,     -- 1 = the full 10-week programme
  icon_class    TEXT,                            -- font-awesome class
  color_hex     TEXT,
  sort_order    INTEGER NOT NULL DEFAULT 0
);

-- ============================================================
-- 4. COURSES (modules) — weekly modules shown in #courses
-- ============================================================
CREATE TABLE IF NOT EXISTS courses (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  track_id        INTEGER REFERENCES tracks(id) ON DELETE SET NULL,
  week_number     INTEGER NOT NULL,              -- 1-10
  slug            TEXT    NOT NULL UNIQUE,
  title           TEXT    NOT NULL,
  description     TEXT,
  category        TEXT    NOT NULL CHECK (category IN (
                    'foundations','ethics','clinical','tools','public-health'
                  )),
  level           TEXT    NOT NULL CHECK (level IN ('beginner','intermediate','advanced')),
  duration_mins   INTEGER NOT NULL,
  topic_count     INTEGER NOT NULL DEFAULT 3,
  rating          REAL    NOT NULL DEFAULT 5.0,
  thumbnail_img   TEXT,                          -- e.g. '1.png'
  is_published    INTEGER NOT NULL DEFAULT 0,
  published_at    TEXT,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_courses_week ON courses(week_number);
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);

-- ============================================================
-- 5. ENROLMENTS — user enrolled in a track or course
-- ============================================================
CREATE TABLE IF NOT EXISTS enrolments (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  track_id      INTEGER REFERENCES tracks(id) ON DELETE SET NULL,
  course_id     INTEGER REFERENCES courses(id) ON DELETE SET NULL,
  status        TEXT    NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active','paused','completed','cancelled')),
  enrolled_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  completed_at  TEXT,
  progress_pct  INTEGER NOT NULL DEFAULT 0       -- 0-100
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_enrolments_user_course
  ON enrolments(user_id, course_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_enrolments_user_track
  ON enrolments(user_id, track_id);

-- ============================================================
-- 6. REGISTRATIONS — from the home.html enrol form (pre-auth)
-- ============================================================
CREATE TABLE IF NOT EXISTS registrations (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name    TEXT    NOT NULL,
  last_name     TEXT    NOT NULL,
  email         TEXT    NOT NULL,
  role          TEXT    NOT NULL,
  message       TEXT,                            -- "what do you hope to learn"
  source_page   TEXT    NOT NULL DEFAULT 'home', -- 'home' | 'landing' | 'login'
  converted     INTEGER NOT NULL DEFAULT 0,      -- 1 when user account created
  user_id       INTEGER REFERENCES users(id) ON DELETE SET NULL,
  ip_address    TEXT,
  submitted_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_reg_email ON registrations(email);

-- ============================================================
-- 7. NEWSLETTER SUBSCRIBERS
-- ============================================================
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT    NOT NULL UNIQUE,
  is_active     INTEGER NOT NULL DEFAULT 1,
  source        TEXT    NOT NULL DEFAULT 'footer',
  subscribed_at TEXT    NOT NULL DEFAULT (datetime('now')),
  unsubscribed_at TEXT
);

-- ============================================================
-- 8. RESEARCH TEAMS
-- ============================================================
CREATE TABLE IF NOT EXISTS research_teams (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,
  description   TEXT,
  topic         TEXT,
  status        TEXT    NOT NULL DEFAULT 'forming'
                        CHECK (status IN ('forming','active','submitted','published')),
  max_members   INTEGER NOT NULL DEFAULT 6,
  created_by    INTEGER NOT NULL REFERENCES users(id),
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- 9. RESEARCH TEAM MEMBERS
-- ============================================================
CREATE TABLE IF NOT EXISTS research_team_members (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id       INTEGER NOT NULL REFERENCES research_teams(id) ON DELETE CASCADE,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_in_team  TEXT    NOT NULL DEFAULT 'member'
                        CHECK (role_in_team IN ('lead','member','mentor')),
  joined_at     TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_rtm_team_user
  ON research_team_members(team_id, user_id);

-- ============================================================
-- 10. RESEARCH PROJECTS
-- ============================================================
CREATE TABLE IF NOT EXISTS research_projects (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id         INTEGER NOT NULL REFERENCES research_teams(id) ON DELETE CASCADE,
  title           TEXT    NOT NULL,
  abstract        TEXT,
  status          TEXT    NOT NULL DEFAULT 'draft'
                          CHECK (status IN (
                            'draft','peer_review','revision','accepted','published'
                          )),
  journal_name    TEXT,
  doi             TEXT,
  submitted_at    TEXT,
  published_at    TEXT,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- 11. CERTIFICATES — issued on track/course completion
-- ============================================================
CREATE TABLE IF NOT EXISTS certificates (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  enrolment_id    INTEGER NOT NULL REFERENCES enrolments(id) ON DELETE CASCADE,
  certificate_uid TEXT    NOT NULL UNIQUE,       -- public verification code
  type            TEXT    NOT NULL CHECK (type IN ('course','track','capstone','distinction')),
  accreditor      TEXT    NOT NULL CHECK (accreditor IN ('KMPDC','AMA','GMC','WHO','AMZ')),
  cpd_hours       INTEGER NOT NULL DEFAULT 0,
  issued_at       TEXT    NOT NULL DEFAULT (datetime('now')),
  expires_at      TEXT,
  pdf_url         TEXT
);

CREATE INDEX IF NOT EXISTS idx_certs_user ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certs_uid  ON certificates(certificate_uid);

-- ============================================================
-- 12. TESTIMONIALS — shown in home.html #testimonials
-- ============================================================
CREATE TABLE IF NOT EXISTS testimonials (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER REFERENCES users(id) ON DELETE SET NULL,
  display_name  TEXT    NOT NULL,                -- e.g. "Dr. Amara K."
  role_label    TEXT    NOT NULL,                -- e.g. "Radiologist, National Referral Hospital"
  avatar_initials TEXT  NOT NULL,
  avatar_gradient TEXT  NOT NULL DEFAULT 'linear-gradient(135deg,#4F7EFF,#00C9A7)',
  quote         TEXT    NOT NULL,
  rating        INTEGER NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  is_featured   INTEGER NOT NULL DEFAULT 0,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- 13. FAQ — accordion items in home.html #faq
-- ============================================================
CREATE TABLE IF NOT EXISTS faq (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  question      TEXT    NOT NULL,
  answer        TEXT    NOT NULL,
  category      TEXT    NOT NULL DEFAULT 'general'
                        CHECK (category IN ('general','curriculum','certificates','research','pricing')),
  sort_order    INTEGER NOT NULL DEFAULT 0,
  is_published  INTEGER NOT NULL DEFAULT 1
);

-- ============================================================
-- 14. CONTACT / SUPPORT MESSAGES — general enquiries
-- ============================================================
CREATE TABLE IF NOT EXISTS contact_messages (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,
  email         TEXT    NOT NULL,
  subject       TEXT,
  message       TEXT    NOT NULL,
  user_id       INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status        TEXT    NOT NULL DEFAULT 'new'
                        CHECK (status IN ('new','read','replied','archived')),
  ip_address    TEXT,
  submitted_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- 15. AUDIT LOG — security & compliance trail
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action        TEXT    NOT NULL,                -- 'login','signup','enrol','reset_password'…
  entity_type   TEXT,                            -- 'user','enrolment','certificate'…
  entity_id     INTEGER,
  ip_address    TEXT,
  user_agent    TEXT,
  details       TEXT,                            -- JSON blob for extra context
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);

-- ============================================================
-- SEED DATA — tracks & courses from the site content
-- ============================================================

INSERT OR IGNORE INTO tracks (slug,title,subtitle,week_start,week_end,total_hours,level,is_flagship,icon_class,color_hex,sort_order) VALUES
  ('full-programme',     'Complete 10-Week AI in Healthcare Programme','Flagship — KMPDC · AMA · GMC accredited',1,10,80,'all',        1,'fas fa-graduation-cap','#4F7EFF',1),
  ('foundations',        'AI Foundations Track',                        'Weeks 1–3 · Beginner',                  1,3, 24,'beginner',   0,'fas fa-seedling',      '#00C9A7',2),
  ('ethics-governance',  'Ethics & Data Governance',                    'Weeks 4–5 · All Levels',                4,5, 16,'all',        0,'fas fa-balance-scale', '#FFB347',3),
  ('clinical-ai',        'Clinical AI Applications',                    'Weeks 6–7 · Intermediate',              6,7, 16,'intermediate',0,'fas fa-stethoscope',   '#FF6B6B',4),
  ('public-health-ai',   'Public Health & Surveillance AI',             'Week 8 · Intermediate',                 8,8,  8,'intermediate',0,'fas fa-globe-africa',  '#A78BFA',5),
  ('nlp-capstone',       'AI Tools, NLP & Capstone',                    'Weeks 9–10 · Advanced',                 9,10,16,'advanced',   0,'fas fa-robot',         '#34D399',6);

INSERT OR IGNORE INTO courses (track_id,week_number,slug,title,description,category,level,duration_mins,topic_count,rating,thumbnail_img,is_published) VALUES
  (2, 1,'week-01-intro',      'Introduction to AI in Healthcare & African Contexts', 'Define AI, ML & deep learning. African healthcare landscape, challenges, and AI success stories.',                                       'foundations','beginner',    360,3,4.9,'1.png',1),
  (2, 2,'week-02-data-sci',   'Fundamentals of Data Science & Statistics',           'Healthcare data types, sensitivity, specificity, AUC-ROC, African data gaps.',                                                           'foundations','beginner',    300,3,4.8,'2.png',1),
  (2, 3,'week-03-ml-basics',  'Machine Learning Basics',                             'ML paradigms, supervised & unsupervised learning, the ML workflow.',                                                                     'foundations','beginner',    300,3,4.8,'3.png',1),
  (3, 4,'week-04-ethics',     'AI Ethics — Decolonised & African Perspectives',      'WHO, EU AI Act & OECD frameworks critiqued. Ubuntu philosophy, the CARE framework.',                                                    'ethics',      'beginner',    480,3,5.0,'2.png',1),
  (3, 5,'week-05-data-gov',   'Data Handling, Privacy & Governance',                 'Kenya Data Protection Act 2019, federated learning, community data governance.',                                                        'ethics',      'intermediate',420,3,4.8,'3.png',1),
  (4, 6,'week-06-cdss',       'Diagnostic Algorithms & Clinical Decision Support',   'Pattern recognition, explainability, CDSS types, malaria diagnostic AI case study.',                                                    'clinical',    'intermediate',450,3,4.9,'4.png',1),
  (4, 7,'week-07-imaging',    'Medical Imaging & AI',                                'CNNs, transfer learning, radiology, pathology, ophthalmology, obstetric ultrasound AI.',                                               'clinical',    'intermediate',540,3,5.0,'1.png',1),
  (5, 8,'week-08-pub-health', 'Public Health AI & Surveillance',                     'AI for outbreak prediction, maternal & child health, NCD risk, cholera simulation.',                                                    'public-health','intermediate',360,3,4.7,'2.png',1),
  (6, 9,'week-09-nlp',        'Practical AI Tools, NLP & Large Language Models',     'AI platforms for clinical use, NLP for ICD coding, Kiswahili & African-language NLP.',                                                 'tools',       'advanced',    510,3,4.8,'2.png',1),
  (6,10,'week-10-capstone',   'AI Regulation, Future of AI & Capstone',              'Kenya National AI Strategy, KMPDC & WHO Ethics frameworks, capstone project presentations.','tools','advanced',480,3,5.0,'4.png',1);

INSERT OR IGNORE INTO faq (question,answer,category,sort_order) VALUES
  ('What does the 10-week curriculum cover?',
   'Week 1: AI & ML fundamentals. Week 2: Data science & statistics. Week 3: ML basics. Week 4: AI ethics (Ubuntu/CARE). Week 5: Kenya Data Protection Act. Week 6: Diagnostic algorithms & CDSS. Week 7: Medical imaging AI. Week 8: Public health AI. Week 9: NLP & LLMs. Week 10: AI regulation & capstone.',
   'curriculum',1),
  ('Do I need a technical background?',
   'No. The curriculum is built for clinicians. AI concepts are explained using clinical analogies. Zero programming or maths background required.',
   'general',2),
  ('Which international bodies recognise the certificates?',
   'KMPDC (CPD points), AMA (CME credits), GMC UK (listed CPD), and aligned with WHO health workforce learning standards.',
   'certificates',3),
  ('How does the Week 10 capstone work?',
   'Learners complete an applied capstone project and present to an expert panel. They can then form research teams, access anonymised datasets, and publish peer-reviewed research.',
   'curriculum',4),
  ('Can my hospital enrol the entire team?',
   'Yes. We offer institutional packages with group enrolment, CPD compliance tracking, and custom learning paths. Contact +254 756 535 289 or info@amzmedzone.co.ke.',
   'pricing',5);

INSERT OR IGNORE INTO testimonials (display_name,role_label,avatar_initials,avatar_gradient,quote,rating,is_featured,sort_order) VALUES
  ('Dr. Amara K.','Radiologist, National Referral Hospital, Nairobi','AK','linear-gradient(135deg,#4F7EFF,#00C9A7)','The Radiology AI course changed how I work. I now use AI tools to double-check my reads and have caught lesions I would previously have missed.',5,1,1),
  ('Sr. Beatrice N.','ICU Nurse, University Teaching Hospital, Nairobi','BN','linear-gradient(135deg,#00C9A7,#34D399)','I joined a research team and we co-authored a paper on AI malaria screening submitted to a WHO-linked journal.',5,1,2),
  ('Dr. James M.','Medical Officer, Private Hospital, Nairobi','JM','linear-gradient(135deg,#A78BFA,#4F7EFF)','The AI Ethics course is mandatory reading for any Kenyan clinician. The section on patient consent under Kenyan law is particularly valuable.',5,1,3),
  ('Dr. Robert O.','MMed Student, Medical School, Kenya','RO','linear-gradient(135deg,#34D399,#00C9A7)','The research datasets and faculty mentorship programme are world-class — and my AMA certificate was worth every minute.',5,1,4);
