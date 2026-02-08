package main

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
)

func openDatabase(cfg Config) (*sql.DB, error) {
	db, err := sql.Open("pgx", cfg.DatabaseURL)
	if err != nil {
		return nil, fmt.Errorf("open database: %w", err)
	}

	db.SetMaxOpenConns(cfg.DBMaxOpenConns)
	db.SetMaxIdleConns(cfg.DBMaxIdleConns)
	db.SetConnMaxLifetime(cfg.DBMaxLifetime)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		_ = db.Close()
		return nil, fmt.Errorf("ping database: %w", err)
	}

	if err := runMigrations(ctx, db); err != nil {
		_ = db.Close()
		return nil, err
	}

	return db, nil
}

func runMigrations(ctx context.Context, db *sql.DB) error {
	statements := []string{
		`CREATE TABLE IF NOT EXISTS users (
			id TEXT PRIMARY KEY,
			email TEXT NOT NULL UNIQUE,
			name TEXT NOT NULL DEFAULT '',
			description TEXT NOT NULL DEFAULT '',
			password_hash BYTEA NOT NULL,
			created_at TIMESTAMPTZ NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS sessions (
			token TEXT PRIMARY KEY,
			user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			created_at TIMESTAMPTZ NOT NULL,
			expires_at TIMESTAMPTZ NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS projects (
			id TEXT PRIMARY KEY,
			owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			resource_type TEXT NOT NULL,
			name TEXT NOT NULL DEFAULT '',
			description TEXT NOT NULL DEFAULT '',
			mir_json JSONB NOT NULL,
			is_public BOOLEAN NOT NULL DEFAULT FALSE,
			stars_count INTEGER NOT NULL DEFAULT 0,
			created_at TIMESTAMPTZ NOT NULL,
			updated_at TIMESTAMPTZ NOT NULL,
			CONSTRAINT projects_resource_type_check CHECK (resource_type IN ('project', 'component', 'nodegraph'))
		)`,
		`ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT FALSE`,
		`ALTER TABLE projects ADD COLUMN IF NOT EXISTS stars_count INTEGER NOT NULL DEFAULT 0`,
		`CREATE TABLE IF NOT EXISTS workspaces (
			id TEXT PRIMARY KEY,
			project_id TEXT NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
			owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			name TEXT NOT NULL DEFAULT '',
			workspace_rev BIGINT NOT NULL DEFAULT 1,
			route_rev BIGINT NOT NULL DEFAULT 1,
			op_seq BIGINT NOT NULL DEFAULT 1,
			tree_root_id TEXT NOT NULL DEFAULT 'root',
			tree_json JSONB NOT NULL DEFAULT '{"rootId":"root","nodes":[]}'::jsonb,
			created_at TIMESTAMPTZ NOT NULL,
			updated_at TIMESTAMPTZ NOT NULL,
			CONSTRAINT workspaces_workspace_rev_check CHECK (workspace_rev >= 1),
			CONSTRAINT workspaces_route_rev_check CHECK (route_rev >= 1),
			CONSTRAINT workspaces_op_seq_check CHECK (op_seq >= 1)
		)`,
		`CREATE TABLE IF NOT EXISTS workspace_routes (
			workspace_id TEXT PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
			manifest_json JSONB NOT NULL,
			updated_at TIMESTAMPTZ NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS workspace_documents (
			workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
			id TEXT NOT NULL,
			doc_type TEXT NOT NULL,
			name TEXT NOT NULL DEFAULT '',
			path TEXT NOT NULL,
			content_rev BIGINT NOT NULL DEFAULT 1,
			meta_rev BIGINT NOT NULL DEFAULT 1,
			content_json JSONB NOT NULL,
			updated_at TIMESTAMPTZ NOT NULL,
			PRIMARY KEY (workspace_id, id),
			CONSTRAINT workspace_documents_type_check CHECK (doc_type IN ('mir-page', 'mir-layout', 'mir-component', 'mir-graph', 'mir-animation')),
			CONSTRAINT workspace_documents_content_rev_check CHECK (content_rev >= 1),
			CONSTRAINT workspace_documents_meta_rev_check CHECK (meta_rev >= 1)
		)`,
		`CREATE UNIQUE INDEX IF NOT EXISTS idx_workspace_documents_workspace_path ON workspace_documents(workspace_id, path)`,
		`CREATE INDEX IF NOT EXISTS idx_workspace_documents_workspace_updated_at ON workspace_documents(workspace_id, updated_at DESC)`,
		`CREATE TABLE IF NOT EXISTS workspace_operations (
			workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
			op_seq BIGINT NOT NULL,
			domain TEXT NOT NULL,
			document_id TEXT,
			payload_json JSONB NOT NULL,
			created_at TIMESTAMPTZ NOT NULL,
			PRIMARY KEY (workspace_id, op_seq)
		)`,
		`CREATE INDEX IF NOT EXISTS idx_workspace_operations_workspace_created_at ON workspace_operations(workspace_id, created_at DESC)`,
		`CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)`,
		`CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at)`,
		`CREATE INDEX IF NOT EXISTS idx_projects_owner_updated_at ON projects(owner_id, updated_at DESC)`,
		`CREATE INDEX IF NOT EXISTS idx_projects_public_updated_at ON projects(updated_at DESC) WHERE is_public = TRUE`,
		`CREATE INDEX IF NOT EXISTS idx_projects_public_stars ON projects(stars_count DESC, updated_at DESC) WHERE is_public = TRUE`,
		`CREATE INDEX IF NOT EXISTS idx_projects_resource_type ON projects(resource_type)`,
		`CREATE INDEX IF NOT EXISTS idx_workspaces_owner_updated_at ON workspaces(owner_id, updated_at DESC)`,
		`CREATE INDEX IF NOT EXISTS idx_workspaces_project_id ON workspaces(project_id)`,
		`DELETE FROM sessions WHERE expires_at <= NOW()`,
	}

	for _, statement := range statements {
		if _, err := db.ExecContext(ctx, statement); err != nil {
			return fmt.Errorf("run migration: %w", err)
		}
	}

	return nil
}
