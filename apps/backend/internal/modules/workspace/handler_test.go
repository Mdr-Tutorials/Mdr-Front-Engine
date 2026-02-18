package workspace

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
	backendauth "github.com/Mdr-Tutorials/mdr-front-engine/apps/backend/internal/modules/auth"
	backendproject "github.com/Mdr-Tutorials/mdr-front-engine/apps/backend/internal/modules/project"
	"github.com/gin-gonic/gin"
)

func TestHandleGetWorkspaceReturnsSnapshot(t *testing.T) {
	handler, mock, cleanup := newWorkspaceHandlerTestHandler(t)
	defer cleanup()

	expectWorkspaceSnapshotQueries(mock, "ws_1")

	context, response := newWorkspaceHandlerContext(
		http.MethodGet,
		"/api/workspaces/ws_1",
		"",
		gin.Params{{Key: "workspaceId", Value: "ws_1"}},
	)

	handler.HandleGetWorkspace(context)

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
	settings, ok := workspace["settings"].(map[string]any)
	if !ok {
		t.Fatalf("missing workspace settings payload: %v", workspace)
	}
	global, ok := settings["global"].(map[string]any)
	if !ok || global["eventTriggerMode"] != "selected-only" {
		t.Fatalf("unexpected settings payload: %v", settings)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations: %v", err)
	}
}

func TestHandleGetWorkspaceNotFound(t *testing.T) {
	handler, mock, cleanup := newWorkspaceHandlerTestHandler(t)
	defer cleanup()

	workspaceQuery := regexp.QuoteMeta(`SELECT w.id, w.project_id, w.owner_id, w.name, w.workspace_rev, w.route_rev, w.op_seq, w.tree_root_id, w.tree_json, w.created_at, w.updated_at, r.manifest_json, s.settings_json
FROM workspaces w
LEFT JOIN workspace_routes r ON r.workspace_id = w.id
LEFT JOIN workspace_settings s ON s.workspace_id = w.id
WHERE w.id = $1`)
	mock.ExpectQuery(workspaceQuery).WithArgs("ws_missing").WillReturnError(sql.ErrNoRows)
	projectQuery := regexp.QuoteMeta(`SELECT id, owner_id, resource_type, name, description, mir_json, is_public, stars_count, created_at, updated_at
FROM projects
WHERE owner_id = $1 AND id = $2`)
	mock.ExpectQuery(projectQuery).WithArgs("user_1", "ws_missing").WillReturnError(sql.ErrNoRows)

	context, response := newWorkspaceHandlerContext(
		http.MethodGet,
		"/api/workspaces/ws_missing",
		"",
		gin.Params{{Key: "workspaceId", Value: "ws_missing"}},
	)

	handler.HandleGetWorkspace(context)

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

func TestHandleGetWorkspaceBootstrapsFromProjectWhenMissing(t *testing.T) {
	handler, mock, cleanup := newWorkspaceHandlerTestHandler(t)
	defer cleanup()

	now := time.Date(2026, time.February, 8, 9, 0, 0, 0, time.UTC)

	workspaceQuery := regexp.QuoteMeta(`SELECT w.id, w.project_id, w.owner_id, w.name, w.workspace_rev, w.route_rev, w.op_seq, w.tree_root_id, w.tree_json, w.created_at, w.updated_at, r.manifest_json, s.settings_json
FROM workspaces w
LEFT JOIN workspace_routes r ON r.workspace_id = w.id
LEFT JOIN workspace_settings s ON s.workspace_id = w.id
WHERE w.id = $1`)
	projectQuery := regexp.QuoteMeta(`SELECT id, owner_id, resource_type, name, description, mir_json, is_public, stars_count, created_at, updated_at
FROM projects
WHERE owner_id = $1 AND id = $2`)
	insertWorkspace := regexp.QuoteMeta(`INSERT INTO workspaces (
	id, project_id, owner_id, name, workspace_rev, route_rev, op_seq, tree_root_id, tree_json, created_at, updated_at
) VALUES ($1, $2, $3, $4, 1, 1, 1, $5, $6::jsonb, $7, $8)`)
	insertRoute := regexp.QuoteMeta(`INSERT INTO workspace_routes (workspace_id, manifest_json, updated_at)
VALUES ($1, $2::jsonb, $3)`)
	insertDocument := regexp.QuoteMeta(`INSERT INTO workspace_documents (
	workspace_id, id, doc_type, name, path, content_rev, meta_rev, content_json, updated_at
) VALUES ($1, $2, $3, $4, $5, 1, 1, $6::jsonb, NOW())
RETURNING workspace_id, id, doc_type, name, path, content_rev, meta_rev, content_json, updated_at`)
	documentQuery := regexp.QuoteMeta(`SELECT workspace_id, id, doc_type, name, path, content_rev, meta_rev, content_json, updated_at
FROM workspace_documents
WHERE workspace_id = $1
ORDER BY path ASC`)

	mock.ExpectQuery(workspaceQuery).WithArgs("prj_bootstrap").WillReturnError(sql.ErrNoRows)
	mock.ExpectQuery(projectQuery).
		WithArgs("user_1", "prj_bootstrap").
		WillReturnRows(sqlmock.NewRows([]string{
			"id", "owner_id", "resource_type", "name", "description", "mir_json", "is_public", "stars_count", "created_at", "updated_at",
		}).AddRow(
			"prj_bootstrap",
			"user_1",
			"project",
			"Bootstrap Project",
			"",
			[]byte(`{"version":"1.0","ui":{"root":{"id":"root","type":"container"}}}`),
			false,
			0,
			now,
			now,
		))
	mock.ExpectBegin()
	mock.ExpectExec(insertWorkspace).WithArgs(
		"prj_bootstrap",
		"prj_bootstrap",
		"user_1",
		"Bootstrap Project",
		"root",
		`{"rootId":"root","nodes":[]}`,
		sqlmock.AnyArg(),
		sqlmock.AnyArg(),
	).WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectExec(insertRoute).WithArgs(
		"prj_bootstrap",
		`{"version":"1","root":{"id":"root"}}`,
		sqlmock.AnyArg(),
	).WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()
	mock.ExpectQuery(insertDocument).WithArgs(
		"prj_bootstrap",
		"doc_root",
		"mir-page",
		"Root",
		"/",
		`{"ui":{"root":{"id":"root","type":"container"}},"version":"1.0"}`,
	).WillReturnRows(sqlmock.NewRows([]string{
		"workspace_id", "id", "doc_type", "name", "path", "content_rev", "meta_rev", "content_json", "updated_at",
	}).AddRow(
		"prj_bootstrap",
		"doc_root",
		"mir-page",
		"Root",
		"/",
		1,
		1,
		[]byte(`{"version":"1.0","ui":{"root":{"id":"root","type":"container"}}}`),
		now,
	))
	mock.ExpectQuery(workspaceQuery).
		WithArgs("prj_bootstrap").
		WillReturnRows(sqlmock.NewRows([]string{
			"id", "project_id", "owner_id", "name", "workspace_rev", "route_rev", "op_seq", "tree_root_id", "tree_json", "created_at", "updated_at", "manifest_json", "settings_json",
		}).AddRow(
			"prj_bootstrap",
			"prj_bootstrap",
			"user_1",
			"Bootstrap Project",
			1,
			1,
			1,
			"root",
			[]byte(`{"rootId":"root","nodes":[]}`),
			now,
			now,
			[]byte(`{"version":"1","root":{"id":"root"}}`),
			[]byte(`{"global":{"theme":"dark"},"projectGlobalById":{}}`),
		))
	mock.ExpectQuery(documentQuery).
		WithArgs("prj_bootstrap").
		WillReturnRows(sqlmock.NewRows([]string{
			"workspace_id", "id", "doc_type", "name", "path", "content_rev", "meta_rev", "content_json", "updated_at",
		}).AddRow(
			"prj_bootstrap",
			"doc_root",
			"mir-page",
			"Root",
			"/",
			1,
			1,
			[]byte(`{"version":"1.0","ui":{"root":{"id":"root","type":"container"}}}`),
			now,
		))

	context, response := newWorkspaceHandlerContext(
		http.MethodGet,
		"/api/workspaces/prj_bootstrap",
		"",
		gin.Params{{Key: "workspaceId", Value: "prj_bootstrap"}},
	)

	handler.HandleGetWorkspace(context)

	if response.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", response.Code, response.Body.String())
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations: %v", err)
	}
}

func TestHandleGetWorkspaceCapabilitiesReturnsCapabilityMap(t *testing.T) {
	handler, mock, cleanup := newWorkspaceHandlerTestHandler(t)
	defer cleanup()

	expectWorkspaceSnapshotQueries(mock, "ws_1")

	context, response := newWorkspaceHandlerContext(
		http.MethodGet,
		"/api/workspaces/ws_1/capabilities",
		"",
		gin.Params{{Key: "workspaceId", Value: "ws_1"}},
	)

	handler.HandleGetWorkspaceCapabilities(context)

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
	if !payload.Capabilities["core.settings.global.update@1.0"] {
		t.Fatalf("missing core settings capability: %+v", payload.Capabilities)
	}
	if payload.Capabilities["core.nodegraph.node.move@1.0"] {
		t.Fatalf("reserved nodegraph capability should be false: %+v", payload.Capabilities)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations: %v", err)
	}
}

func TestHandleSaveWorkspaceDocumentRejectsInvalidExpectedContentRev(t *testing.T) {
	handler, mock, cleanup := newWorkspaceHandlerTestHandler(t)
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

	handler.HandleSaveWorkspaceDocument(context)

	if response.Code != http.StatusUnprocessableEntity {
		t.Fatalf("expected 422, got %d: %s", response.Code, response.Body.String())
	}
	var payload map[string]any
	if err := json.Unmarshal(response.Body.Bytes(), &payload); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if payload["code"] != ErrorInvalidPayload {
		t.Fatalf("unexpected error payload: %v", payload)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations: %v", err)
	}
}

func TestHandleSaveWorkspaceDocumentReturnsConflict(t *testing.T) {
	handler, mock, cleanup := newWorkspaceHandlerTestHandler(t)
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

	handler.HandleSaveWorkspaceDocument(context)

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
	handler, mock, cleanup := newWorkspaceHandlerTestHandler(t)
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

	handler.HandleApplyWorkspaceIntent(context)

	if response.Code != http.StatusUnprocessableEntity {
		t.Fatalf("expected 422, got %d: %s", response.Code, response.Body.String())
	}
	var payload map[string]any
	if err := json.Unmarshal(response.Body.Bytes(), &payload); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if payload["code"] != ErrorUnsupportedIntent {
		t.Fatalf("unexpected error payload: %v", payload)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations: %v", err)
	}
}

func TestHandleApplyWorkspaceIntentReturnsRouteConflict(t *testing.T) {
	handler, mock, cleanup := newWorkspaceHandlerTestHandler(t)
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

	handler.HandleApplyWorkspaceIntent(context)

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

func TestHandleApplyWorkspaceIntentSavesSettings(t *testing.T) {
	handler, mock, cleanup := newWorkspaceHandlerTestHandler(t)
	defer cleanup()

	lockWorkspace := regexp.QuoteMeta(`SELECT workspace_rev, route_rev, op_seq
FROM workspaces
WHERE id = $1
FOR UPDATE`)
	upsertSettings := regexp.QuoteMeta(`INSERT INTO workspace_settings (workspace_id, settings_json, updated_at)
VALUES ($1, $2::jsonb, NOW())
ON CONFLICT (workspace_id) DO UPDATE
SET settings_json = EXCLUDED.settings_json, updated_at = EXCLUDED.updated_at`)
	bumpWorkspaceOnly := regexp.QuoteMeta(`UPDATE workspaces
SET workspace_rev = workspace_rev + 1, op_seq = op_seq + 1, updated_at = NOW()
WHERE id = $1
RETURNING workspace_rev, route_rev, op_seq`)
	insertOperation := regexp.QuoteMeta(`INSERT INTO workspace_operations (workspace_id, op_seq, domain, document_id, payload_json, created_at)
VALUES ($1, $2, $3, $4, $5::jsonb, $6)`)

	mock.ExpectBegin()
	mock.ExpectQuery(lockWorkspace).
		WithArgs("ws_1").
		WillReturnRows(sqlmock.NewRows([]string{"workspace_rev", "route_rev", "op_seq"}).AddRow(9, 4, 34))
	mock.ExpectExec(upsertSettings).
		WithArgs("ws_1", sqlmock.AnyArg()).
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectQuery(bumpWorkspaceOnly).
		WithArgs("ws_1").
		WillReturnRows(sqlmock.NewRows([]string{"workspace_rev", "route_rev", "op_seq"}).AddRow(10, 4, 35))
	mock.ExpectExec(insertOperation).
		WithArgs("ws_1", int64(35), "core.settings.global.update@1.0", nil, sqlmock.AnyArg(), sqlmock.AnyArg()).
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	context, response := newWorkspaceHandlerContext(
		http.MethodPost,
		"/api/workspaces/ws_1/intents",
		`{
			"expectedWorkspaceRev": 9,
			"intent": {
				"id": "intent_settings_1",
				"namespace": "core.settings",
				"type": "global.update",
				"version": "1.0",
				"payload": {
					"settings": {
						"global": {"eventTriggerMode":"selected-only"},
						"projectGlobalById": {}
					}
				},
				"issuedAt": "2026-02-08T10:05:00Z"
			}
		}`,
		gin.Params{{Key: "workspaceId", Value: "ws_1"}},
	)

	handler.HandleApplyWorkspaceIntent(context)

	if response.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", response.Code, response.Body.String())
	}
	var payload map[string]any
	if err := json.Unmarshal(response.Body.Bytes(), &payload); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if payload["workspaceRev"] != float64(10) || payload["routeRev"] != float64(4) {
		t.Fatalf("unexpected mutation payload: %v", payload)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations: %v", err)
	}
}

func TestHandleApplyWorkspaceBatchRejectsUnsupportedOperation(t *testing.T) {
	handler, mock, cleanup := newWorkspaceHandlerTestHandler(t)
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

	handler.HandleApplyWorkspaceBatch(context)

	if response.Code != http.StatusUnprocessableEntity {
		t.Fatalf("expected 422, got %d: %s", response.Code, response.Body.String())
	}
	var payload map[string]any
	if err := json.Unmarshal(response.Body.Bytes(), &payload); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if payload["code"] != ErrorInvalidPayload {
		t.Fatalf("unexpected error payload: %v", payload)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations: %v", err)
	}
}

func newWorkspaceHandlerTestHandler(t *testing.T) (*Handler, sqlmock.Sqlmock, func()) {
	t.Helper()
	gin.SetMode(gin.TestMode)

	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("create sqlmock: %v", err)
	}

	projectStore := backendproject.NewProjectStore(db)
	store := NewWorkspaceStore(db)
	module := NewModule(store, projectStore)
	handler := NewHandler(store, module)
	return handler, mock, func() {
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
	context.Set("authUser", &backendauth.User{ID: "user_1"})
	return context, response
}

func expectWorkspaceSnapshotQueries(mock sqlmock.Sqlmock, workspaceID string) {
	now := time.Date(2026, time.February, 8, 9, 0, 0, 0, time.UTC)

	workspaceQuery := regexp.QuoteMeta(`SELECT w.id, w.project_id, w.owner_id, w.name, w.workspace_rev, w.route_rev, w.op_seq, w.tree_root_id, w.tree_json, w.created_at, w.updated_at, r.manifest_json, s.settings_json
FROM workspaces w
LEFT JOIN workspace_routes r ON r.workspace_id = w.id
LEFT JOIN workspace_settings s ON s.workspace_id = w.id
WHERE w.id = $1`)
	documentQuery := regexp.QuoteMeta(`SELECT workspace_id, id, doc_type, name, path, content_rev, meta_rev, content_json, updated_at
FROM workspace_documents
WHERE workspace_id = $1
ORDER BY path ASC`)

	mock.ExpectQuery(workspaceQuery).
		WithArgs(workspaceID).
		WillReturnRows(sqlmock.NewRows([]string{
			"id", "project_id", "owner_id", "name", "workspace_rev", "route_rev", "op_seq", "tree_root_id", "tree_json", "created_at", "updated_at", "manifest_json", "settings_json",
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
			[]byte(`{"global":{"eventTriggerMode":"selected-only"},"projectGlobalById":{}}`),
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
