package main

import (
	"context"
	"encoding/json"
	"errors"
	"regexp"
	"testing"

	sqlmock "github.com/DATA-DOG/go-sqlmock"
)

func TestWorkspaceStoreSaveDocumentContentKeepsWorkspaceAndRouteRev(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("create sqlmock: %v", err)
	}
	defer db.Close()

	store := NewWorkspaceStore(db)

	lockQuery := regexp.QuoteMeta(`SELECT d.content_rev, d.meta_rev, w.workspace_rev, w.route_rev, w.op_seq
FROM workspace_documents d
JOIN workspaces w ON w.id = d.workspace_id
WHERE d.workspace_id = $1 AND d.id = $2
FOR UPDATE OF d, w`)
	updateDocument := regexp.QuoteMeta(`UPDATE workspace_documents
SET content_json = $3::jsonb, content_rev = content_rev + 1, updated_at = NOW()
WHERE workspace_id = $1 AND id = $2
RETURNING content_rev, meta_rev`)
	bumpSequenceOnly := regexp.QuoteMeta(`UPDATE workspaces
SET op_seq = op_seq + 1, updated_at = NOW()
WHERE id = $1
RETURNING workspace_rev, route_rev, op_seq`)
	insertOperation := regexp.QuoteMeta(`INSERT INTO workspace_operations (workspace_id, op_seq, domain, document_id, payload_json, created_at)
VALUES ($1, $2, $3, $4, $5::jsonb, NOW())`)

	mock.ExpectBegin()
	mock.ExpectQuery(lockQuery).
		WithArgs("ws_1", "doc_home").
		WillReturnRows(sqlmock.NewRows([]string{"content_rev", "meta_rev", "workspace_rev", "route_rev", "op_seq"}).AddRow(3, 1, 9, 4, 33))
	mock.ExpectQuery(updateDocument).
		WithArgs("ws_1", "doc_home", `{"title":"next"}`).
		WillReturnRows(sqlmock.NewRows([]string{"content_rev", "meta_rev"}).AddRow(4, 1))
	mock.ExpectQuery(bumpSequenceOnly).
		WithArgs("ws_1").
		WillReturnRows(sqlmock.NewRows([]string{"workspace_rev", "route_rev", "op_seq"}).AddRow(9, 4, 34))
	mock.ExpectExec(insertOperation).
		WithArgs("ws_1", int64(34), "mir.document", "doc_home", `{"intent":"content.update"}`).
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	result, err := store.SaveDocumentContent(context.Background(), SaveDocumentContentParams{
		WorkspaceID:        "ws_1",
		DocumentID:         "doc_home",
		ExpectedContentRev: 3,
		Content:            json.RawMessage(`{"title":"next"}`),
		OperationPayload:   json.RawMessage(`{"intent":"content.update"}`),
	})
	if err != nil {
		t.Fatalf("save document content: %v", err)
	}
	if result.WorkspaceRev != 9 {
		t.Fatalf("workspaceRev changed unexpectedly: got %d", result.WorkspaceRev)
	}
	if result.RouteRev != 4 {
		t.Fatalf("routeRev changed unexpectedly: got %d", result.RouteRev)
	}
	if len(result.UpdatedDocuments) != 1 || result.UpdatedDocuments[0].ContentRev != 4 {
		t.Fatalf("unexpected updated documents: %+v", result.UpdatedDocuments)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations: %v", err)
	}
}

func TestWorkspaceStoreSaveDocumentContentReturnsDocumentConflict(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("create sqlmock: %v", err)
	}
	defer db.Close()

	store := NewWorkspaceStore(db)

	lockQuery := regexp.QuoteMeta(`SELECT d.content_rev, d.meta_rev, w.workspace_rev, w.route_rev, w.op_seq
FROM workspace_documents d
JOIN workspaces w ON w.id = d.workspace_id
WHERE d.workspace_id = $1 AND d.id = $2
FOR UPDATE OF d, w`)

	mock.ExpectBegin()
	mock.ExpectQuery(lockQuery).
		WithArgs("ws_1", "doc_home").
		WillReturnRows(sqlmock.NewRows([]string{"content_rev", "meta_rev", "workspace_rev", "route_rev", "op_seq"}).AddRow(6, 2, 10, 5, 40))
	mock.ExpectRollback()

	_, err = store.SaveDocumentContent(context.Background(), SaveDocumentContentParams{
		WorkspaceID:        "ws_1",
		DocumentID:         "doc_home",
		ExpectedContentRev: 5,
		Content:            json.RawMessage(`{"title":"ignored"}`),
	})
	if err == nil {
		t.Fatalf("expected conflict error")
	}

	var conflictErr *WorkspaceRevisionConflictError
	if !errors.As(err, &conflictErr) {
		t.Fatalf("expected WorkspaceRevisionConflictError, got %T", err)
	}
	if conflictErr.ConflictType != WorkspaceConflictDocument {
		t.Fatalf("unexpected conflict type: %s", conflictErr.ConflictType)
	}
	if conflictErr.ServerContentRev != 6 {
		t.Fatalf("unexpected server content rev: %d", conflictErr.ServerContentRev)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations: %v", err)
	}
}

func TestWorkspaceStoreSaveRouteManifestIncrementsWorkspaceAndRouteRev(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("create sqlmock: %v", err)
	}
	defer db.Close()

	store := NewWorkspaceStore(db)

	lockWorkspace := regexp.QuoteMeta(`SELECT workspace_rev, route_rev, op_seq
FROM workspaces
WHERE id = $1
FOR UPDATE`)
	upsertRoute := regexp.QuoteMeta(`INSERT INTO workspace_routes (workspace_id, manifest_json, updated_at)
VALUES ($1, $2::jsonb, NOW())
ON CONFLICT (workspace_id) DO UPDATE
SET manifest_json = EXCLUDED.manifest_json, updated_at = EXCLUDED.updated_at`)
	bumpWorkspaceAndRoute := regexp.QuoteMeta(`UPDATE workspaces
SET workspace_rev = workspace_rev + 1, route_rev = route_rev + 1, op_seq = op_seq + 1, updated_at = NOW()
WHERE id = $1
RETURNING workspace_rev, route_rev, op_seq`)
	insertOperation := regexp.QuoteMeta(`INSERT INTO workspace_operations (workspace_id, op_seq, domain, document_id, payload_json, created_at)
VALUES ($1, $2, $3, $4, $5::jsonb, NOW())`)

	mock.ExpectBegin()
	mock.ExpectQuery(lockWorkspace).
		WithArgs("ws_1").
		WillReturnRows(sqlmock.NewRows([]string{"workspace_rev", "route_rev", "op_seq"}).AddRow(9, 4, 34))
	mock.ExpectExec(upsertRoute).
		WithArgs("ws_1", sqlmock.AnyArg()).
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectQuery(bumpWorkspaceAndRoute).
		WithArgs("ws_1").
		WillReturnRows(sqlmock.NewRows([]string{"workspace_rev", "route_rev", "op_seq"}).AddRow(10, 5, 35))
	mock.ExpectExec(insertOperation).
		WithArgs("ws_1", int64(35), "workspace.route", nil, `{"intent":"route.update"}`).
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	result, err := store.SaveRouteManifest(context.Background(), SaveRouteManifestParams{
		WorkspaceID:          "ws_1",
		ExpectedWorkspaceRev: 9,
		ExpectedRouteRev:     4,
		RouteManifest:        json.RawMessage(`{"version":"1","root":{"id":"root"}}`),
		OperationPayload:     json.RawMessage(`{"intent":"route.update"}`),
	})
	if err != nil {
		t.Fatalf("save route manifest: %v", err)
	}
	if result.WorkspaceRev != 10 || result.RouteRev != 5 || result.OpSeq != 35 {
		t.Fatalf("unexpected result: %+v", result)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations: %v", err)
	}
}
