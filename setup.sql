-- eo-doc-cms Database Setup
-- Run this against the existing 'userdir' database
-- Adds a proper documents table as an independent entity

CREATE TABLE IF NOT EXISTS documents (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id    INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    category    VARCHAR(100) DEFAULT 'general',
    file_name   TEXT NOT NULL,
    file_path   TEXT NOT NULL,        -- relative path from uploads root
    file_size   BIGINT NOT NULL,
    mime_type   VARCHAR(100) NOT NULL,
    status      VARCHAR(20) DEFAULT 'pending'
                CHECK (status IN ('pending','approved','rejected','archived')),
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    reviewed_by INTEGER REFERENCES admin_accounts(id),
    reviewed_at TIMESTAMPTZ,
    review_note TEXT
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_documents_owner    ON documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_documents_status   ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded ON documents(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_user     ON documents(user_id);

-- Full-text search vector (generated column)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS search_vector tsvector
    GENERATED ALWAYS AS (
        to_tsvector('english',
            coalesce(title,'') || ' ' ||
            coalesce(description,'') || ' ' ||
            coalesce(category,'')
        )
    ) STORED;

CREATE INDEX IF NOT EXISTS idx_documents_fts ON documents USING GIN(search_vector);
