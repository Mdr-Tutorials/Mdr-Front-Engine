package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

const (
	workspaceErrorUnsupportedIntent   = "UNSUPPORTED_INTENT"
	workspaceErrorReservedDomain      = "RESERVED_DOMAIN_DISABLED"
	workspaceErrorInvalidVersion      = "INVALID_ENVELOPE_VERSION"
	workspaceErrorInvalidPayload      = "INVALID_ENVELOPE_PAYLOAD"
	workspaceErrorMIRValidationFailed = "MIR_VALIDATION_FAILED"
)

type workspaceDocumentResponse struct {
	ID         string                `json:"id"`
	Type       WorkspaceDocumentType `json:"type"`
	Path       string                `json:"path"`
	ContentRev int64                 `json:"contentRev"`
	MetaRev    int64                 `json:"metaRev"`
	Content    json.RawMessage       `json:"content"`
	UpdatedAt  time.Time             `json:"updatedAt"`
}

type workspaceSnapshotResponse struct {
	ID            string                      `json:"id"`
	WorkspaceRev  int64                       `json:"workspaceRev"`
	RouteRev      int64                       `json:"routeRev"`
	OpSeq         int64                       `json:"opSeq"`
	Tree          json.RawMessage             `json:"tree"`
	Documents     []workspaceDocumentResponse `json:"documents"`
	RouteManifest json.RawMessage             `json:"routeManifest"`
}

type saveWorkspaceDocumentRequest struct {
	ExpectedContentRev   int64                     `json:"expectedContentRev"`
	ExpectedWorkspaceRev int64                     `json:"expectedWorkspaceRev"`
	ExpectedRouteRev     int64                     `json:"expectedRouteRev"`
	Content              json.RawMessage           `json:"content"`
	ClientMutationID     string                    `json:"clientMutationId"`
	Command              *WorkspaceCommandEnvelope `json:"command,omitempty"`
}

type workspaceIntentActor struct {
	UserID   string `json:"userId"`
	ClientID string `json:"clientId"`
}

type workspaceIntentEnvelope struct {
	ID             string                `json:"id"`
	Namespace      string                `json:"namespace"`
	Type           string                `json:"type"`
	Version        string                `json:"version"`
	Payload        json.RawMessage       `json:"payload"`
	IdempotencyKey string                `json:"idempotencyKey"`
	Actor          *workspaceIntentActor `json:"actor"`
	IssuedAt       time.Time             `json:"issuedAt"`
}

type applyWorkspaceIntentRequest struct {
	ExpectedWorkspaceRev int64                   `json:"expectedWorkspaceRev"`
	ExpectedRouteRev     int64                   `json:"expectedRouteRev"`
	Intent               workspaceIntentEnvelope `json:"intent"`
	ClientMutationID     string                  `json:"clientMutationId"`
}

type applyWorkspaceBatchRequest struct {
	ExpectedWorkspaceRev int64             `json:"expectedWorkspaceRev"`
	ExpectedRouteRev     int64             `json:"expectedRouteRev"`
	Operations           []json.RawMessage `json:"operations"`
	ClientBatchID        string            `json:"clientBatchId"`
}

type batchOperationKind struct {
	Op string `json:"op"`
}

type batchSaveDocumentOperation struct {
	Op                 string                    `json:"op"`
	DocumentID         string                    `json:"documentId"`
	ExpectedContentRev int64                     `json:"expectedContentRev"`
	Content            json.RawMessage           `json:"content"`
	Command            *WorkspaceCommandEnvelope `json:"command,omitempty"`
}

type batchIntentOperation struct {
	Op     string                  `json:"op"`
	Intent workspaceIntentEnvelope `json:"intent"`
}

type workspaceRequestFailure struct {
	status  int
	payload gin.H
}

func (server *Server) handleGetWorkspace(c *gin.Context) {
	workspaceID := strings.TrimSpace(c.Param("workspaceId"))
	user := getAuthUser(c)
	if user == nil {
		sendWorkspaceFailure(c, &workspaceRequestFailure{
			status: http.StatusUnauthorized,
			payload: gin.H{
				"error":   "unauthorized",
				"message": "Authentication required.",
			},
		})
		return
	}

	snapshot, err := server.getWorkspaceSnapshotForUser(c.Request.Context(), user.ID, workspaceID)
	if err != nil {
		sendWorkspaceFailure(c, mapWorkspaceStoreError(err))
		return
	}

	documents := make([]workspaceDocumentResponse, 0, len(snapshot.Documents))
	for _, document := range snapshot.Documents {
		documents = append(documents, workspaceDocumentResponse{
			ID:         document.ID,
			Type:       document.Type,
			Path:       document.Path,
			ContentRev: document.ContentRev,
			MetaRev:    document.MetaRev,
			Content:    document.Content,
			UpdatedAt:  document.UpdatedAt,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"workspace": workspaceSnapshotResponse{
			ID:            snapshot.Workspace.ID,
			WorkspaceRev:  snapshot.Workspace.WorkspaceRev,
			RouteRev:      snapshot.Workspace.RouteRev,
			OpSeq:         snapshot.Workspace.OpSeq,
			Tree:          snapshot.Workspace.Tree,
			Documents:     documents,
			RouteManifest: snapshot.RouteManifest,
		},
	})
}

func (server *Server) handleGetWorkspaceCapabilities(c *gin.Context) {
	workspaceID := strings.TrimSpace(c.Param("workspaceId"))
	user := getAuthUser(c)
	if user == nil {
		sendWorkspaceFailure(c, &workspaceRequestFailure{
			status: http.StatusUnauthorized,
			payload: gin.H{
				"error":   "unauthorized",
				"message": "Authentication required.",
			},
		})
		return
	}

	if _, err := server.getWorkspaceSnapshotForUser(c.Request.Context(), user.ID, workspaceID); err != nil {
		sendWorkspaceFailure(c, mapWorkspaceStoreError(err))
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"workspaceId":  workspaceID,
		"capabilities": defaultWorkspaceCapabilities(),
	})
}

func (server *Server) getWorkspaceSnapshotForUser(
	ctx context.Context,
	userID string,
	workspaceID string,
) (*WorkspaceSnapshot, error) {
	normalizedWorkspaceID := strings.TrimSpace(workspaceID)
	snapshot, err := server.workspaces.GetSnapshot(ctx, normalizedWorkspaceID)
	if err == nil {
		return snapshot, nil
	}
	if !errors.Is(err, errWorkspaceNotFound) {
		return nil, err
	}

	project, projectErr := server.projects.GetByID(strings.TrimSpace(userID), normalizedWorkspaceID)
	if projectErr != nil {
		if errors.Is(projectErr, errProjectNotFound) {
			return nil, errWorkspaceNotFound
		}
		return nil, projectErr
	}
	if bootstrapErr := server.bootstrapProjectWorkspace(ctx, project); bootstrapErr != nil {
		return nil, bootstrapErr
	}
	return server.workspaces.GetSnapshot(ctx, normalizedWorkspaceID)
}

func (server *Server) handleSaveWorkspaceDocument(c *gin.Context) {
	workspaceID := strings.TrimSpace(c.Param("workspaceId"))
	documentID := strings.TrimSpace(c.Param("documentId"))
	user := getAuthUser(c)
	if user == nil {
		sendWorkspaceFailure(c, &workspaceRequestFailure{
			status: http.StatusUnauthorized,
			payload: gin.H{
				"error":   "unauthorized",
				"message": "Authentication required.",
			},
		})
		return
	}

	var request saveWorkspaceDocumentRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		sendWorkspaceFailure(c, newWorkspaceRequestFailure(http.StatusBadRequest, workspaceErrorInvalidPayload, "Invalid request payload.", nil))
		return
	}
	if request.ExpectedContentRev <= 0 {
		sendWorkspaceFailure(c, newWorkspaceRequestFailure(http.StatusUnprocessableEntity, workspaceErrorInvalidPayload, "expectedContentRev must be positive.", nil))
		return
	}
	if len(request.Content) == 0 {
		sendWorkspaceFailure(c, newWorkspaceRequestFailure(http.StatusUnprocessableEntity, workspaceErrorMIRValidationFailed, "content is required.", nil))
		return
	}

	command := resolveDocumentCommand(workspaceID, documentID, request.Command)
	result, err := server.workspaces.SaveDocumentContent(c.Request.Context(), SaveDocumentContentParams{
		WorkspaceID:        workspaceID,
		DocumentID:         documentID,
		ExpectedContentRev: request.ExpectedContentRev,
		Content:            request.Content,
		Command:            command,
	})
	if err != nil {
		failure := mapWorkspaceStoreError(err)
		logWorkspaceConflictFailure(
			c,
			"saveDocument",
			workspaceID,
			documentID,
			request.ExpectedWorkspaceRev,
			request.ExpectedRouteRev,
			request.ExpectedContentRev,
			request.ClientMutationID,
			failure,
		)
		sendWorkspaceFailure(c, failure)
		return
	}

	server.trySyncProjectMirrorFromWorkspace(c.Request.Context(), user.ID, workspaceID)
	respondWorkspaceMutationSuccess(c, result, strings.TrimSpace(request.ClientMutationID))
}

func (server *Server) handleApplyWorkspaceIntent(c *gin.Context) {
	workspaceID := strings.TrimSpace(c.Param("workspaceId"))

	var request applyWorkspaceIntentRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		sendWorkspaceFailure(c, newWorkspaceRequestFailure(http.StatusBadRequest, workspaceErrorInvalidPayload, "Invalid request payload.", nil))
		return
	}

	result, failure := server.applyIntentMutation(c.Request.Context(), workspaceID, request)
	if failure != nil {
		logWorkspaceConflictFailure(
			c,
			"applyIntent",
			workspaceID,
			"",
			request.ExpectedWorkspaceRev,
			request.ExpectedRouteRev,
			0,
			request.ClientMutationID,
			failure,
		)
		sendWorkspaceFailure(c, failure)
		return
	}

	respondWorkspaceMutationSuccess(c, result, strings.TrimSpace(request.ClientMutationID))
}

func (server *Server) handleApplyWorkspaceBatch(c *gin.Context) {
	workspaceID := strings.TrimSpace(c.Param("workspaceId"))
	user := getAuthUser(c)
	if user == nil {
		sendWorkspaceFailure(c, &workspaceRequestFailure{
			status: http.StatusUnauthorized,
			payload: gin.H{
				"error":   "unauthorized",
				"message": "Authentication required.",
			},
		})
		return
	}

	var request applyWorkspaceBatchRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		sendWorkspaceFailure(c, newWorkspaceRequestFailure(http.StatusBadRequest, workspaceErrorInvalidPayload, "Invalid request payload.", nil))
		return
	}
	if request.ExpectedWorkspaceRev <= 0 {
		sendWorkspaceFailure(c, newWorkspaceRequestFailure(http.StatusUnprocessableEntity, workspaceErrorInvalidPayload, "expectedWorkspaceRev must be positive.", nil))
		return
	}
	if len(request.Operations) == 0 {
		sendWorkspaceFailure(c, newWorkspaceRequestFailure(http.StatusUnprocessableEntity, workspaceErrorInvalidPayload, "operations must not be empty.", nil))
		return
	}

	currentWorkspaceRev := request.ExpectedWorkspaceRev
	currentRouteRev := request.ExpectedRouteRev
	var latest *WorkspaceMutationResult

	for index, operationRaw := range request.Operations {
		var operationKind batchOperationKind
		if err := json.Unmarshal(operationRaw, &operationKind); err != nil {
			sendWorkspaceFailure(c, newWorkspaceRequestFailure(
				http.StatusUnprocessableEntity,
				workspaceErrorInvalidPayload,
				"Invalid batch operation payload.",
				gin.H{"index": index},
			))
			return
		}

		switch strings.TrimSpace(operationKind.Op) {
		case "saveDocument":
			var operation batchSaveDocumentOperation
			if err := json.Unmarshal(operationRaw, &operation); err != nil {
				sendWorkspaceFailure(c, newWorkspaceRequestFailure(
					http.StatusUnprocessableEntity,
					workspaceErrorInvalidPayload,
					"Invalid saveDocument operation payload.",
					gin.H{"index": index},
				))
				return
			}
			documentID := strings.TrimSpace(operation.DocumentID)
			if documentID == "" {
				sendWorkspaceFailure(c, newWorkspaceRequestFailure(
					http.StatusUnprocessableEntity,
					workspaceErrorInvalidPayload,
					"saveDocument operation requires documentId.",
					gin.H{"index": index},
				))
				return
			}
			if operation.ExpectedContentRev <= 0 {
				sendWorkspaceFailure(c, newWorkspaceRequestFailure(
					http.StatusUnprocessableEntity,
					workspaceErrorInvalidPayload,
					"saveDocument operation requires expectedContentRev > 0.",
					gin.H{"index": index},
				))
				return
			}
			if len(operation.Content) == 0 {
				sendWorkspaceFailure(c, newWorkspaceRequestFailure(
					http.StatusUnprocessableEntity,
					workspaceErrorMIRValidationFailed,
					"saveDocument operation requires content.",
					gin.H{"index": index},
				))
				return
			}

			command := resolveDocumentCommand(workspaceID, documentID, operation.Command)
			result, err := server.workspaces.SaveDocumentContent(c.Request.Context(), SaveDocumentContentParams{
				WorkspaceID:        workspaceID,
				DocumentID:         documentID,
				ExpectedContentRev: operation.ExpectedContentRev,
				Content:            operation.Content,
				Command:            command,
			})
			if err != nil {
				failure := mapWorkspaceStoreError(err)
				logWorkspaceConflictFailure(
					c,
					"batch.saveDocument",
					workspaceID,
					documentID,
					currentWorkspaceRev,
					currentRouteRev,
					operation.ExpectedContentRev,
					request.ClientBatchID,
					failure,
				)
				sendWorkspaceFailure(c, failure)
				return
			}
			latest = result
			currentWorkspaceRev = result.WorkspaceRev
			currentRouteRev = result.RouteRev
		case "intent":
			var operation batchIntentOperation
			if err := json.Unmarshal(operationRaw, &operation); err != nil {
				sendWorkspaceFailure(c, newWorkspaceRequestFailure(
					http.StatusUnprocessableEntity,
					workspaceErrorInvalidPayload,
					"Invalid intent operation payload.",
					gin.H{"index": index},
				))
				return
			}
			result, failure := server.applyIntentMutation(c.Request.Context(), workspaceID, applyWorkspaceIntentRequest{
				ExpectedWorkspaceRev: currentWorkspaceRev,
				ExpectedRouteRev:     currentRouteRev,
				Intent:               operation.Intent,
			})
			if failure != nil {
				logWorkspaceConflictFailure(
					c,
					"batch.intent",
					workspaceID,
					"",
					currentWorkspaceRev,
					currentRouteRev,
					0,
					request.ClientBatchID,
					failure,
				)
				sendWorkspaceFailure(c, failure)
				return
			}
			latest = result
			currentWorkspaceRev = result.WorkspaceRev
			currentRouteRev = result.RouteRev
		default:
			sendWorkspaceFailure(c, newWorkspaceRequestFailure(
				http.StatusUnprocessableEntity,
				workspaceErrorInvalidPayload,
				"Unsupported batch operation.",
				gin.H{"index": index, "op": strings.TrimSpace(operationKind.Op)},
			))
			return
		}
	}

	if latest == nil {
		sendWorkspaceFailure(c, newWorkspaceRequestFailure(http.StatusUnprocessableEntity, workspaceErrorInvalidPayload, "Batch did not include executable operations.", nil))
		return
	}

	server.trySyncProjectMirrorFromWorkspace(c.Request.Context(), user.ID, workspaceID)
	respondWorkspaceMutationSuccess(c, latest, strings.TrimSpace(request.ClientBatchID))
}

func (server *Server) trySyncProjectMirrorFromWorkspace(
	ctx context.Context,
	userID string,
	workspaceID string,
) {
	if server == nil || server.projects == nil || server.workspaces == nil {
		return
	}
	snapshot, err := server.getWorkspaceSnapshotForUser(ctx, userID, workspaceID)
	if err != nil {
		log.Printf("[workspace] mirror sync skipped workspace=%s reason=%v", workspaceID, err)
		return
	}
	mir, ok := resolveCanonicalWorkspaceMIR(snapshot)
	if !ok {
		log.Printf("[workspace] mirror sync skipped workspace=%s reason=no_canonical_document", workspaceID)
		return
	}
	projectID := strings.TrimSpace(snapshot.Workspace.ProjectID)
	if projectID == "" {
		projectID = strings.TrimSpace(workspaceID)
	}
	if _, err := server.projects.SaveMIR(strings.TrimSpace(userID), projectID, mir); err != nil {
		log.Printf("[workspace] mirror sync failed workspace=%s project=%s err=%v", workspaceID, projectID, err)
		return
	}
	log.Printf("[workspace] mirror sync success workspace=%s project=%s", workspaceID, projectID)
}

func resolveCanonicalWorkspaceMIR(snapshot *WorkspaceSnapshot) (json.RawMessage, bool) {
	if snapshot == nil || len(snapshot.Documents) == 0 {
		return nil, false
	}
	for _, document := range snapshot.Documents {
		if document.Type == WorkspaceDocumentTypeMIRPage &&
			(strings.TrimSpace(document.Path) == "/" || strings.TrimSpace(document.Path) == "") {
			return document.Content, true
		}
	}
	for _, document := range snapshot.Documents {
		if document.Type == WorkspaceDocumentTypeMIRPage {
			return document.Content, true
		}
	}
	return snapshot.Documents[0].Content, true
}

func (server *Server) applyIntentMutation(
	ctx context.Context,
	workspaceID string,
	request applyWorkspaceIntentRequest,
) (*WorkspaceMutationResult, *workspaceRequestFailure) {
	if request.ExpectedWorkspaceRev <= 0 {
		return nil, newWorkspaceRequestFailure(http.StatusUnprocessableEntity, workspaceErrorInvalidPayload, "expectedWorkspaceRev must be positive.", nil)
	}

	intent := normalizeWorkspaceIntent(request.Intent)
	if intent.ID == "" || intent.Namespace == "" || intent.Type == "" || intent.Version == "" || intent.IssuedAt.IsZero() {
		return nil, newWorkspaceRequestFailure(http.StatusUnprocessableEntity, workspaceErrorInvalidPayload, "intent envelope is incomplete.", nil)
	}
	if intent.Version != "1.0" {
		return nil, newWorkspaceRequestFailure(http.StatusUnprocessableEntity, workspaceErrorInvalidVersion, "Unsupported intent version.", gin.H{"version": intent.Version})
	}
	if isReservedIntentDomain(intent.Namespace) {
		return nil, newWorkspaceRequestFailure(http.StatusUnprocessableEntity, workspaceErrorReservedDomain, "Reserved domain is disabled.", gin.H{"namespace": intent.Namespace})
	}
	if intent.Namespace != "core.route" || intent.Type != "manifest.update" {
		return nil, newWorkspaceRequestFailure(http.StatusUnprocessableEntity, workspaceErrorUnsupportedIntent, "Unsupported intent.", gin.H{"namespace": intent.Namespace, "type": intent.Type})
	}
	if request.ExpectedRouteRev <= 0 {
		return nil, newWorkspaceRequestFailure(http.StatusUnprocessableEntity, workspaceErrorInvalidPayload, "expectedRouteRev must be positive for route intents.", nil)
	}

	var payload struct {
		RouteManifest json.RawMessage `json:"routeManifest"`
	}
	if len(intent.Payload) == 0 || json.Unmarshal(intent.Payload, &payload) != nil || len(payload.RouteManifest) == 0 {
		return nil, newWorkspaceRequestFailure(http.StatusUnprocessableEntity, workspaceErrorInvalidPayload, "intent payload.routeManifest is required.", nil)
	}

	command := WorkspaceCommandEnvelope{
		ID:         intent.ID,
		Namespace:  intent.Namespace,
		Type:       intent.Type,
		Version:    intent.Version,
		IssuedAt:   intent.IssuedAt,
		ForwardOps: make([]WorkspacePatchOp, 0),
		ReverseOps: make([]WorkspacePatchOp, 0),
		Target: WorkspaceCommandTarget{
			WorkspaceID: workspaceID,
		},
	}

	result, err := server.workspaces.SaveRouteManifest(ctx, SaveRouteManifestParams{
		WorkspaceID:          workspaceID,
		ExpectedWorkspaceRev: request.ExpectedWorkspaceRev,
		ExpectedRouteRev:     request.ExpectedRouteRev,
		RouteManifest:        payload.RouteManifest,
		Command:              command,
	})
	if err != nil {
		return nil, mapWorkspaceStoreError(err)
	}

	return result, nil
}

func resolveDocumentCommand(workspaceID, documentID string, provided *WorkspaceCommandEnvelope) WorkspaceCommandEnvelope {
	if provided != nil {
		command := *provided
		return command
	}

	now := time.Now().UTC()
	return WorkspaceCommandEnvelope{
		ID:         fmt.Sprintf("cmd_%d", now.UnixNano()),
		Namespace:  "core.mir",
		Type:       "document.update",
		Version:    "1.0",
		IssuedAt:   now,
		ForwardOps: make([]WorkspacePatchOp, 0),
		ReverseOps: make([]WorkspacePatchOp, 0),
		Target: WorkspaceCommandTarget{
			WorkspaceID: workspaceID,
			DocumentID:  documentID,
		},
	}
}

func normalizeWorkspaceIntent(intent workspaceIntentEnvelope) workspaceIntentEnvelope {
	intent.ID = strings.TrimSpace(intent.ID)
	intent.Namespace = strings.TrimSpace(intent.Namespace)
	intent.Type = strings.TrimSpace(intent.Type)
	intent.Version = strings.TrimSpace(intent.Version)
	intent.IdempotencyKey = strings.TrimSpace(intent.IdempotencyKey)
	if !intent.IssuedAt.IsZero() {
		intent.IssuedAt = intent.IssuedAt.UTC()
	}
	return intent
}

func mapWorkspaceStoreError(err error) *workspaceRequestFailure {
	if err == nil {
		return nil
	}

	var conflictErr *WorkspaceRevisionConflictError
	if errors.As(err, &conflictErr) {
		log.Printf(
			"[workspace] conflict mapped type=%s workspace=%s document=%s serverWorkspaceRev=%d serverRouteRev=%d serverContentRev=%d serverMetaRev=%d serverOpSeq=%d",
			conflictErr.ConflictType,
			conflictErr.WorkspaceID,
			conflictErr.DocumentID,
			conflictErr.ServerWorkspaceRev,
			conflictErr.ServerRouteRev,
			conflictErr.ServerContentRev,
			conflictErr.ServerMetaRev,
			conflictErr.ServerOpSeq,
		)
		return &workspaceRequestFailure{
			status:  http.StatusConflict,
			payload: buildWorkspaceConflictPayload(conflictErr),
		}
	}
	if errors.Is(err, errWorkspaceNotFound) {
		return &workspaceRequestFailure{
			status: http.StatusNotFound,
			payload: gin.H{
				"error":   "not_found",
				"message": "Workspace not found.",
			},
		}
	}
	if errors.Is(err, errWorkspaceDocumentNotFound) {
		return &workspaceRequestFailure{
			status: http.StatusNotFound,
			payload: gin.H{
				"error":   "not_found",
				"message": "Workspace document not found.",
			},
		}
	}

	var syntaxErr *json.SyntaxError
	if errors.As(err, &syntaxErr) {
		return newWorkspaceRequestFailure(
			http.StatusUnprocessableEntity,
			workspaceErrorMIRValidationFailed,
			"Invalid JSON document payload.",
			gin.H{"offset": syntaxErr.Offset},
		)
	}

	if isWorkspaceEnvelopeError(err) {
		return newWorkspaceRequestFailure(http.StatusUnprocessableEntity, workspaceErrorInvalidPayload, err.Error(), nil)
	}

	return &workspaceRequestFailure{
		status: http.StatusInternalServerError,
		payload: gin.H{
			"error":   "workspace_operation_failed",
			"message": "Could not process workspace request.",
		},
	}
}

func buildWorkspaceConflictPayload(conflictErr *WorkspaceRevisionConflictError) gin.H {
	payload := gin.H{
		"error":              "revision_conflict",
		"conflictType":       conflictErr.ConflictType,
		"workspaceId":        conflictErr.WorkspaceID,
		"serverWorkspaceRev": conflictErr.ServerWorkspaceRev,
		"serverRouteRev":     conflictErr.ServerRouteRev,
		"opSeq":              conflictErr.ServerOpSeq,
	}
	if strings.TrimSpace(conflictErr.DocumentID) != "" {
		payload["serverDocument"] = gin.H{
			"id":         conflictErr.DocumentID,
			"contentRev": conflictErr.ServerContentRev,
			"metaRev":    conflictErr.ServerMetaRev,
		}
	}
	return payload
}

func respondWorkspaceMutationSuccess(c *gin.Context, result *WorkspaceMutationResult, acceptedMutationID string) {
	response := gin.H{
		"workspaceId":  result.WorkspaceID,
		"workspaceRev": result.WorkspaceRev,
		"routeRev":     result.RouteRev,
		"opSeq":        result.OpSeq,
	}
	if len(result.UpdatedDocuments) > 0 {
		response["updatedDocuments"] = result.UpdatedDocuments
	}
	if acceptedMutationID != "" {
		response["acceptedMutationId"] = acceptedMutationID
	}
	c.JSON(http.StatusOK, response)
}

func sendWorkspaceFailure(c *gin.Context, failure *workspaceRequestFailure) {
	if failure == nil {
		return
	}
	c.JSON(failure.status, failure.payload)
}

func logWorkspaceConflictFailure(
	c *gin.Context,
	action string,
	workspaceID string,
	documentID string,
	expectedWorkspaceRev int64,
	expectedRouteRev int64,
	expectedContentRev int64,
	clientMutationID string,
	failure *workspaceRequestFailure,
) {
	if failure == nil || failure.status != http.StatusConflict {
		return
	}
	conflictType, _ := failure.payload["conflictType"]
	serverWorkspaceRev, _ := failure.payload["serverWorkspaceRev"]
	serverRouteRev, _ := failure.payload["serverRouteRev"]
	opSeq, _ := failure.payload["opSeq"]
	log.Printf(
		"[workspace] 409 action=%s method=%s path=%s workspace=%s document=%s clientMutationId=%s expectedWorkspaceRev=%d expectedRouteRev=%d expectedContentRev=%d conflictType=%v serverWorkspaceRev=%v serverRouteRev=%v serverOpSeq=%v",
		action,
		c.Request.Method,
		c.FullPath(),
		workspaceID,
		documentID,
		strings.TrimSpace(clientMutationID),
		expectedWorkspaceRev,
		expectedRouteRev,
		expectedContentRev,
		conflictType,
		serverWorkspaceRev,
		serverRouteRev,
		opSeq,
	)
}

func newWorkspaceRequestFailure(status int, code string, message string, details any) *workspaceRequestFailure {
	payload := gin.H{
		"error":   "request_error",
		"code":    code,
		"message": message,
	}
	if details != nil {
		payload["details"] = details
	}
	return &workspaceRequestFailure{
		status:  status,
		payload: payload,
	}
}

func isReservedIntentDomain(namespace string) bool {
	return strings.HasPrefix(namespace, "core.nodegraph") || strings.HasPrefix(namespace, "core.animation")
}

func isWorkspaceEnvelopeError(err error) bool {
	if err == nil {
		return false
	}
	message := err.Error()
	return strings.HasPrefix(message, "command.") ||
		strings.HasPrefix(message, "patch operation") ||
		strings.Contains(message, "target.documentId") ||
		strings.Contains(message, "target.workspaceId") ||
		strings.Contains(message, "expectedContentRev") ||
		strings.Contains(message, "expectedWorkspaceRev") ||
		strings.Contains(message, "expectedRouteRev")
}

func defaultWorkspaceCapabilities() map[string]bool {
	return map[string]bool{
		"core.mir.document.update@1.0":             true,
		"core.route.manifest.update@1.0":           true,
		"core.nodegraph.node.move@1.0":             false,
		"core.nodegraph.edge.connect@1.0":          false,
		"core.animation.timeline.keyframe.add@1.0": false,
		"core.animation.clip.bind@1.0":             false,
	}
}
