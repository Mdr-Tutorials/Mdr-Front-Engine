package main

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"regexp"
	"strings"
	"testing"
	"time"

	sqlmock "github.com/DATA-DOG/go-sqlmock"
	"github.com/gin-gonic/gin"
)

func TestHandleGetWorkspaceReturnsSnapshot(t *testing.T) {
	server, mock, cleanup := newWorkspaceHandlerTestServer(t)
	defer cleanup()

	expectWorkspaceSnapshotQueries(mock, "ws_1")

	context, response := newWorkspaceHandlerContext(
		http.MethodGet,
		"/api/workspaces/ws_1",
		"",
		gin.Params{{Key: "workspaceId", Value: "ws_1"}},
	)

	server.handleGetWorkspace(context)

	if response.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", response.Code, response.Body.String())
	}
	var payload map[string]any
	if err := json.Unmarshal(response.Body.Bytes(), &payload); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	workspace, ok := payload["workspace"].(map[string]any)
	if !ok {
		t.Fatalf("missing workspace payload: %v", payload)
	}
	if workspace["id"] != "ws_1" {
		t.Fatalf("unexpected workspace id: %v", workspace["id"])
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations: %v", err)
	}
}

func TestHandleGetWorkspaceNotFound(t *testing.T) {
	server, mock, cleanup := newWorkspaceHandlerTestServer(t)
	defer cleanup()

	workspaceQuery := regexp.QuoteMeta(`SELECT w.id, w.project_id, w.owner_id, w.name, w.workspace_rev, w.route_rev, w.op_seq, w.tree_root_id, w.tree_json, w.created_at, w.updated_at, r.manifest_json
FROM workspaces w
LEFT JOIN workspace_routes r ON r.workspace_id = w.id
WHERE w.id = $1`)
	mock.ExpectQuery(workspaceQuery).WithArgs("ws_missing").WillReturnError(sql.ErrNoRows)

	context, response := newWorkspaceHandlerContext(
		http.MethodGet,
		"/api/workspaces/ws_missing",
		"",
		gin.Params{{Key: "workspaceId", Value: "ws_missing"}},
	)

	server.handleGetWorkspace(context)

	if response.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d: %s", response.Code, response.Body.String())
	}
	var payload map[string]any
	if err := json.Unmarshal(response.Body.Bytes(), &payload); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if payload["error"] != "not_found" {
		t.Fatalf("unexpected error payload: %v", payload)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations: %v", err)
	}
}

func TestHandleGetWorkspaceCapabilitiesReturnsCapabilityMap(t *testing.T) {
	server, mock, cleanup := newWorkspaceHandlerTestServer(t)
	defer cleanup()

	expectWorkspaceSnapshotQueries(mock, "ws_1")

	context, response := newWorkspaceHandlerContext(
		http.MethodGet,
		"/api/workspaces/ws_1/capabilities",
		"",
		gin.Params{{Key: "workspaceId", Value: "ws_1"}},
	)

	server.handleGetWorkspaceCapabilities(context)

	if response.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", response.Code, response.Body.String())
	}
	var payload struct {
		WorkspaceID  string          `json:"workspaceId"`
		Capabilities map[string]bool `json:"capabilities"`
	}
	if err := json.Unmarshal(response.Body.Bytes(), &payload); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if payload.WorkspaceID != "ws_1" {
		t.Fatalf("unexpected workspaceId: %s", payload.WorkspaceID)
	}
	if !payload.Capabilities["core.mir.document.update@1.0"] {
		t.Fatalf("missing core mir capability: %+v", payload.Capabilities)
	}
	if payload.Capabilities["core.nodegraph.node.move@1.0"] {
		t.Fatalf("reserved nodegraph capability should be false: %+v", payload.Capabilities)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations: %v", err)
	}
}

func TestHandleSaveWorkspaceDocumentRejectsInvalidExpectedContentRev(t *testing.T) {
	server, mock, cleanup := newWorkspaceHandlerTestServer(t)
	defer cleanup()

	context, response := newWorkspaceHandlerContext(
		http.MethodPut,
		"/api/workspaces/ws_1/documents/doc_home",
		`{"expectedContentRev":0,"content":{"title":"next"}}`,
		gin.Params{
			{Key: "workspaceId", Value: "ws_1"},
			{Key: "documentId", Value: "doc_home"},
		},
	)

	server.handleSaveWorkspaceDocument(context)

	if response.Code != http.StatusUnprocessableEntity {
		t.Fatalf("expected 422, got %d: %s", response.Code, response.Body.String())
	}
	var payload map[string]any
	if err := json.Unmarshal(response.Body.Bytes(), &payload); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if payload["code"] != workspaceErrorInvalidPayload {
		t.Fatalf("unexpected error payload: %v", payload)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations: %v", err)
	}
}

func TestHandleSaveWorkspaceDocumentReturnsConflict(t *testing.T) {
	server, mock, cleanup := newWorkspaceHandlerTestServer(t)
	defer cleanup()

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

	context, response := newWorkspaceHandlerContext(
		http.MethodPut,
		"/api/workspaces/ws_1/documents/doc_home",
		`{"expectedContentRev":5,"content":{"title":"next"}}`,
		gin.Params{
			{Key: "workspaceId", Value: "ws_1"},
			{Key: "documentId", Value: "doc_home"},
		},
	)

	server.handleSaveWorkspaceDocument(context)

	if response.Code != http.StatusConflict {
		t.Fatalf("expected 409, got %d: %s", response.Code, response.Body.String())
	}
	var payload map[string]any
	if err := json.Unmarshal(response.Body.Bytes(), &payload); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if payload["error"] != "revision_conflict" || payload["conflictType"] != string(WorkspaceConflictDocument) {
		t.Fatalf("unexpected conflict payload: %v", payload)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations: %v", err)
	}
}

func TestHandleApplyWorkspaceIntentRejectsUnsupportedIntent(t *testing.T) {
	server, mock, cleanup := newWorkspaceHandlerTestServer(t)
	defer cleanup()

	context, response := newWorkspaceHandlerContext(
		http.MethodPost,
		"/api/workspaces/ws_1/intents",
		`{
			"expectedWorkspaceRev": 9,
			"expectedRouteRev": 4,
			"intent": {
				"id": "intent_1",
				"namespace": "core.route",
				"type": "create",
				"version": "1.0",
				"payload": {},
				"issuedAt": "2026-02-08T10:00:00Z"
			}
		}`,
		gin.Params{{Key: "workspaceId", Value: "ws_1"}},
	)

	server.handleApplyWorkspaceIntent(context)

	if response.Code != http.StatusUnprocessableEntity {
		t.Fatalf("expected 422, got %d: %s", response.Code, response.Body.String())
	}
	var payload map[string]any
	if err := json.Unmarshal(response.Body.Bytes(), &payload); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if payload["code"] != workspaceErrorUnsupportedIntent {
		t.Fatalf("unexpected error payload: %v", payload)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations: %v", err)
	}
}

func TestHandleApplyWorkspaceIntentReturnsRouteConflict(t *testing.T) {
	server, mock, cleanup := newWorkspaceHandlerTestServer(t)
	defer cleanup()

	lockWorkspace := regexp.QuoteMeta(`SELECT workspace_rev, route_rev, op_seq
FROM workspaces
WHERE id = $1
FOR UPDATE`)

	mock.ExpectBegin()
	mock.ExpectQuery(lockWorkspace).
		WithArgs("ws_1").
		WillReturnRows(sqlmock.NewRows([]string{"workspace_rev", "route_rev", "op_seq"}).AddRow(9, 5, 35))
	mock.ExpectRollback()

	context, response := newWorkspaceHandlerContext(
		http.MethodPost,
		"/api/workspaces/ws_1/intents",
		`{
			"expectedWorkspaceRev": 9,
			"expectedRouteRev": 4,
			"intent": {
				"id": "intent_2",
				"namespace": "core.route",
				"type": "manifest.update",
				"version": "1.0",
				"payload": {
					"routeManifest": {"version":"1","root":{"id":"root"}}
				},
				"issuedAt": "2026-02-08T10:02:00Z"
			}
		}`,
		gin.Params{{Key: "workspaceId", Value: "ws_1"}},
	)

	server.handleApplyWorkspaceIntent(context)

	if response.Code != http.StatusConflict {
		t.Fatalf("expected 409, got %d: %s", response.Code, response.Body.String())
	}
	var payload map[string]any
	if err := json.Unmarshal(response.Body.Bytes(), &payload); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if payload["error"] != "revision_conflict" || payload["conflictType"] != string(WorkspaceConflictRoute) {
		t.Fatalf("unexpected conflict payload: %v", payload)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations: %v", err)
	}
}

func TestHandleApplyWorkspaceBatchRejectsUnsupportedOperation(t *testing.T) {
	server, mock, cleanup := newWorkspaceHandlerTestServer(t)
	defer cleanup()

	context, response := newWorkspaceHandlerContext(
		http.MethodPost,
		"/api/workspaces/ws_1/batch",
		`{
			"expectedWorkspaceRev": 9,
			"operations": [
				{"op":"noop"}
			]
		}`,
		gin.Params{{Key: "workspaceId", Value: "ws_1"}},
	)

	server.handleApplyWorkspaceBatch(context)

	if response.Code != http.StatusUnprocessableEntity {
		t.Fatalf("expected 422, got %d: %s", response.Code, response.Body.String())
	}
	var payload map[string]any
	if err := json.Unmarshal(response.Body.Bytes(), &payload); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if payload["code"] != workspaceErrorInvalidPayload {
		t.Fatalf("unexpected error payload: %v", payload)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations: %v", err)
	}
}

func newWorkspaceHandlerTestServer(t *testing.T) (*Server, sqlmock.Sqlmock, func()) {
	t.Helper()
	gin.SetMode(gin.TestMode)

	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("create sqlmock: %v", err)
	}

	server := &Server{
		workspaces: NewWorkspaceStore(db),
	}
	return server, mock, func() {
		_ = db.Close()
	}
}

func newWorkspaceHandlerContext(method, path, body string, params gin.Params) (*gin.Context, *httptest.ResponseRecorder) {
	response := httptest.NewRecorder()
	context, _ := gin.CreateTestContext(response)

	var bodyReader *strings.Reader
	if body == "" {
		bodyReader = strings.NewReader("")
	} else {
		bodyReader = strings.NewReader(body)
	}
	request := httptest.NewRequest(method, path, bodyReader)
	if body != "" {
		request.Header.Set("Content-Type", "application/json")
	}
	context.Request = request
	context.Params = params
	return context, response
}

func expectWorkspaceSnapshotQueries(mock sqlmock.Sqlmock, workspaceID string) {
	now := time.Date(2026, time.February, 8, 9, 0, 0, 0, time.UTC)

	workspaceQuery := regexp.QuoteMeta(`SELECT w.id, w.project_id, w.owner_id, w.name, w.workspace_rev, w.route_rev, w.op_seq, w.tree_root_id, w.tree_json, w.created_at, w.updated_at, r.manifest_json
FROM workspaces w
LEFT JOIN workspace_routes r ON r.workspace_id = w.id
WHERE w.id = $1`)
	documentQuery := regexp.QuoteMeta(`SELECT workspace_id, id, doc_type, name, path, content_rev, meta_rev, content_json, updated_at
FROM workspace_documents
WHERE workspace_id = $1
ORDER BY path ASC`)

	mock.ExpectQuery(workspaceQuery).
		WithArgs(workspaceID).
		WillReturnRows(sqlmock.NewRows([]string{
			"id", "project_id", "owner_id", "name", "workspace_rev", "route_rev", "op_seq", "tree_root_id", "tree_json", "created_at", "updated_at", "manifest_json",
		}).AddRow(
			workspaceID,
			"project_1",
			"user_1",
			"Workspace One",
			3,
			2,
			11,
			"root",
			[]byte(`{"rootId":"root","nodes":[]}`),
			now,
			now,
			[]byte(`{"version":"1","root":{"id":"root"}}`),
		))
	mock.ExpectQuery(documentQuery).
		WithArgs(workspaceID).
		WillReturnRows(sqlmock.NewRows([]string{
			"workspace_id", "id", "doc_type", "name", "path", "content_rev", "meta_rev", "content_json", "updated_at",
		}).AddRow(
			workspaceID,
			"doc_home",
			"mir-page",
			"Home",
			"/home",
			4,
			1,
			[]byte(`{"type":"page"}`),
			now,
		))
}
