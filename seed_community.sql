-- Seed data for doctors, enrollments, Research Lab projects and Community
-- study groups. Deliberately does NOT touch the courses table — it only
-- references the 10 existing modules by week_number so everything stays
-- linked to the real curriculum. password_hash is left NULL: these are
-- demo profiles to populate the UI, not accounts meant to be logged into.

INSERT OR IGNORE INTO users (first_name, last_name, email, password_hash, role, is_admin) VALUES
('Amina',  'Yusuf',   'amina.yusuf@seed.amzmedzone.co.ke',   NULL, 'general_practitioner', 0),
('Brian',  'Otieno',  'brian.otieno@seed.amzmedzone.co.ke',  NULL, 'surgeon',               0),
('Carol',  'Njeri',   'carol.njeri@seed.amzmedzone.co.ke',   NULL, 'radiologist',           0),
('David',  'Kiprop',  'david.kiprop@seed.amzmedzone.co.ke',  NULL, 'resident_intern',       0),
('Faith',  'Wambui',  'faith.wambui@seed.amzmedzone.co.ke',  NULL, 'specialist_consultant', 0),
('George', 'Mutua',   'george.mutua@seed.amzmedzone.co.ke',  NULL, 'physician_researcher',  0);

-- ── Enrollments / progress, spread unevenly across the 10 real modules
-- so the leaderboard and dashboards show a realistic, non-uniform spread.
INSERT OR IGNORE INTO enrollments (user_id, course_id, status, completed_at)
SELECT u.id, c.id, 'completed', datetime('now', '-' || (c.week_number * 3) || ' days')
FROM users u, courses c
WHERE u.email = 'amina.yusuf@seed.amzmedzone.co.ke' AND c.week_number <= 7;

INSERT OR IGNORE INTO enrollments (user_id, course_id, status, completed_at)
SELECT u.id, c.id, 'in_progress', NULL
FROM users u, courses c
WHERE u.email = 'amina.yusuf@seed.amzmedzone.co.ke' AND c.week_number = 8;

INSERT OR IGNORE INTO enrollments (user_id, course_id, status, completed_at)
SELECT u.id, c.id, 'completed', datetime('now', '-' || (c.week_number * 4) || ' days')
FROM users u, courses c
WHERE u.email = 'brian.otieno@seed.amzmedzone.co.ke' AND c.week_number <= 10;

INSERT OR IGNORE INTO enrollments (user_id, course_id, status, completed_at)
SELECT u.id, c.id, 'completed', datetime('now', '-' || (c.week_number * 5) || ' days')
FROM users u, courses c
WHERE u.email = 'carol.njeri@seed.amzmedzone.co.ke' AND c.week_number <= 4;

INSERT OR IGNORE INTO enrollments (user_id, course_id, status, completed_at)
SELECT u.id, c.id, 'in_progress', NULL
FROM users u, courses c
WHERE u.email = 'carol.njeri@seed.amzmedzone.co.ke' AND c.week_number = 5;

INSERT OR IGNORE INTO enrollments (user_id, course_id, status, completed_at)
SELECT u.id, c.id, 'completed', datetime('now', '-' || (c.week_number * 6) || ' days')
FROM users u, courses c
WHERE u.email = 'david.kiprop@seed.amzmedzone.co.ke' AND c.week_number <= 2;

INSERT OR IGNORE INTO enrollments (user_id, course_id, status, completed_at)
SELECT u.id, c.id, 'completed', datetime('now', '-' || (c.week_number * 2) || ' days')
FROM users u, courses c
WHERE u.email = 'faith.wambui@seed.amzmedzone.co.ke' AND c.week_number <= 9;

INSERT OR IGNORE INTO enrollments (user_id, course_id, status, completed_at)
SELECT u.id, c.id, 'completed', datetime('now', '-' || (c.week_number * 3) || ' days')
FROM users u, courses c
WHERE u.email = 'george.mutua@seed.amzmedzone.co.ke' AND c.week_number <= 5;

INSERT OR IGNORE INTO enrollments (user_id, course_id, status, completed_at)
SELECT u.id, c.id, 'in_progress', NULL
FROM users u, courses c
WHERE u.email = 'george.mutua@seed.amzmedzone.co.ke' AND c.week_number = 6;

-- ── Research Lab projects, each themed after one of the 10 modules.
INSERT INTO research_projects (title, description, area, created_by, created_at)
SELECT 'Decolonising AI Ethics Frameworks for African Hospitals',
       'Re-examining WHO/EU AI Act guidance against Ubuntu philosophy and the CARE framework, drawn from Week 04''s ethics module.',
       'AI Ethics', u.id, datetime('now', '-21 days')
FROM users u WHERE u.email = 'carol.njeri@seed.amzmedzone.co.ke';

INSERT INTO research_projects (title, description, area, created_by, created_at)
SELECT 'Federated Learning for Privacy-Preserving Diagnosis',
       'Piloting privacy-preserving model training across two clinics without centralising patient records, following Week 05''s data governance module.',
       'Data Privacy', u.id, datetime('now', '-18 days')
FROM users u WHERE u.email = 'george.mutua@seed.amzmedzone.co.ke';

INSERT INTO research_projects (title, description, area, created_by, created_at)
SELECT 'Evaluating a Malaria Diagnostic AI at KNH',
       'Following up on the Week 06 case study with a small prospective comparison against routine microscopy.',
       'Diagnostics', u.id, datetime('now', '-15 days')
FROM users u WHERE u.email = 'amina.yusuf@seed.amzmedzone.co.ke';

INSERT INTO research_projects (title, description, area, created_by, created_at)
SELECT 'AI vs Expert Radiologist: A Local Validation Study',
       'Extending Week 07''s imaging lab into a structured agreement study across chest X-rays from three facilities.',
       'Medical Imaging', u.id, datetime('now', '-12 days')
FROM users u WHERE u.email = 'brian.otieno@seed.amzmedzone.co.ke';

INSERT INTO research_projects (title, description, area, created_by, created_at)
SELECT 'AI-Assisted Outbreak Prediction for Cholera Surveillance',
       'Adapting the Week 08 simulation into a real early-warning dashboard for county-level outbreak data.',
       'Public Health', u.id, datetime('now', '-9 days')
FROM users u WHERE u.email = 'faith.wambui@seed.amzmedzone.co.ke';

INSERT INTO research_projects (title, description, area, created_by, created_at)
SELECT 'Kiswahili Clinical NLP for EHR Summarization',
       'Building on Week 09''s multilingual NLP challenges to draft a Kiswahili clinical-note summarizer.',
       'Clinical NLP', u.id, datetime('now', '-6 days')
FROM users u WHERE u.email = 'david.kiprop@seed.amzmedzone.co.ke';

INSERT OR IGNORE INTO research_members (project_id, user_id)
SELECT rp.id, u.id FROM research_projects rp, users u
WHERE rp.title = 'Decolonising AI Ethics Frameworks for African Hospitals'
  AND u.email IN ('carol.njeri@seed.amzmedzone.co.ke', 'faith.wambui@seed.amzmedzone.co.ke', 'david.kiprop@seed.amzmedzone.co.ke');

INSERT OR IGNORE INTO research_members (project_id, user_id)
SELECT rp.id, u.id FROM research_projects rp, users u
WHERE rp.title = 'Federated Learning for Privacy-Preserving Diagnosis'
  AND u.email IN ('george.mutua@seed.amzmedzone.co.ke', 'amina.yusuf@seed.amzmedzone.co.ke');

INSERT OR IGNORE INTO research_members (project_id, user_id)
SELECT rp.id, u.id FROM research_projects rp, users u
WHERE rp.title = 'Evaluating a Malaria Diagnostic AI at KNH'
  AND u.email IN ('amina.yusuf@seed.amzmedzone.co.ke', 'brian.otieno@seed.amzmedzone.co.ke', 'george.mutua@seed.amzmedzone.co.ke');

INSERT OR IGNORE INTO research_members (project_id, user_id)
SELECT rp.id, u.id FROM research_projects rp, users u
WHERE rp.title = 'AI vs Expert Radiologist: A Local Validation Study'
  AND u.email IN ('brian.otieno@seed.amzmedzone.co.ke', 'carol.njeri@seed.amzmedzone.co.ke');

INSERT OR IGNORE INTO research_members (project_id, user_id)
SELECT rp.id, u.id FROM research_projects rp, users u
WHERE rp.title = 'AI-Assisted Outbreak Prediction for Cholera Surveillance'
  AND u.email IN ('faith.wambui@seed.amzmedzone.co.ke', 'david.kiprop@seed.amzmedzone.co.ke', 'amina.yusuf@seed.amzmedzone.co.ke');

INSERT OR IGNORE INTO research_members (project_id, user_id)
SELECT rp.id, u.id FROM research_projects rp, users u
WHERE rp.title = 'Kiswahili Clinical NLP for EHR Summarization'
  AND u.email IN ('david.kiprop@seed.amzmedzone.co.ke', 'george.mutua@seed.amzmedzone.co.ke');

-- ── Community study groups, each tied to a real course_id by week_number.
INSERT INTO study_groups (course_id, name, description, created_by, created_at)
SELECT c.id, 'Foundations Study Circle', 'Working through AI/ML basics together, week by week.', u.id, datetime('now', '-20 days')
FROM courses c, users u WHERE c.week_number = 1 AND u.email = 'david.kiprop@seed.amzmedzone.co.ke';

INSERT INTO study_groups (course_id, name, description, created_by, created_at)
SELECT c.id, 'Ethics Discussion Group', 'Weekly debate on the ethical dilemmas raised in Week 04.', u.id, datetime('now', '-17 days')
FROM courses c, users u WHERE c.week_number = 4 AND u.email = 'carol.njeri@seed.amzmedzone.co.ke';

INSERT INTO study_groups (course_id, name, description, created_by, created_at)
SELECT c.id, 'Diagnostic Algorithms Crew', 'Comparing notes on CDSS case studies.', u.id, datetime('now', '-14 days')
FROM courses c, users u WHERE c.week_number = 6 AND u.email = 'amina.yusuf@seed.amzmedzone.co.ke';

INSERT INTO study_groups (course_id, name, description, created_by, created_at)
SELECT c.id, 'Imaging AI Study Group', 'Practicing image interpretation alongside the Week 07 lab.', u.id, datetime('now', '-11 days')
FROM courses c, users u WHERE c.week_number = 7 AND u.email = 'brian.otieno@seed.amzmedzone.co.ke';

INSERT INTO study_groups (course_id, name, description, created_by, created_at)
SELECT c.id, 'NLP & LLMs Practice Group', 'Hands-on with clinical NLP tools from Week 09.', u.id, datetime('now', '-8 days')
FROM courses c, users u WHERE c.week_number = 9 AND u.email = 'faith.wambui@seed.amzmedzone.co.ke';

INSERT INTO study_groups (course_id, name, description, created_by, created_at)
SELECT c.id, 'Capstone Support Group', 'Peer feedback on capstone presentations.', u.id, datetime('now', '-3 days')
FROM courses c, users u WHERE c.week_number = 10 AND u.email = 'george.mutua@seed.amzmedzone.co.ke';

INSERT OR IGNORE INTO study_group_members (group_id, user_id)
SELECT sg.id, u.id FROM study_groups sg, users u
WHERE sg.name = 'Foundations Study Circle'
  AND u.email IN ('david.kiprop@seed.amzmedzone.co.ke', 'amina.yusuf@seed.amzmedzone.co.ke', 'george.mutua@seed.amzmedzone.co.ke');

INSERT OR IGNORE INTO study_group_members (group_id, user_id)
SELECT sg.id, u.id FROM study_groups sg, users u
WHERE sg.name = 'Ethics Discussion Group'
  AND u.email IN ('carol.njeri@seed.amzmedzone.co.ke', 'faith.wambui@seed.amzmedzone.co.ke');

INSERT OR IGNORE INTO study_group_members (group_id, user_id)
SELECT sg.id, u.id FROM study_groups sg, users u
WHERE sg.name = 'Diagnostic Algorithms Crew'
  AND u.email IN ('amina.yusuf@seed.amzmedzone.co.ke', 'brian.otieno@seed.amzmedzone.co.ke', 'david.kiprop@seed.amzmedzone.co.ke');

INSERT OR IGNORE INTO study_group_members (group_id, user_id)
SELECT sg.id, u.id FROM study_groups sg, users u
WHERE sg.name = 'Imaging AI Study Group'
  AND u.email IN ('brian.otieno@seed.amzmedzone.co.ke', 'carol.njeri@seed.amzmedzone.co.ke');

INSERT OR IGNORE INTO study_group_members (group_id, user_id)
SELECT sg.id, u.id FROM study_groups sg, users u
WHERE sg.name = 'NLP & LLMs Practice Group'
  AND u.email IN ('faith.wambui@seed.amzmedzone.co.ke', 'george.mutua@seed.amzmedzone.co.ke', 'david.kiprop@seed.amzmedzone.co.ke');

INSERT OR IGNORE INTO study_group_members (group_id, user_id)
SELECT sg.id, u.id FROM study_groups sg, users u
WHERE sg.name = 'Capstone Support Group'
  AND u.email IN ('george.mutua@seed.amzmedzone.co.ke', 'amina.yusuf@seed.amzmedzone.co.ke');
