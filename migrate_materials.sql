CREATE TABLE IF NOT EXISTS course_materials (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id     INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  material_type TEXT NOT NULL DEFAULT 'file',
  file_key      TEXT,
  file_name     TEXT,
  mime_type     TEXT,
  file_size     INTEGER,
  external_url  TEXT,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  uploaded_by   INTEGER REFERENCES users(id),
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_course_materials_course ON course_materials(course_id);
