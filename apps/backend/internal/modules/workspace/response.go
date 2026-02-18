package workspace

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strings"
)

func MapStoreError(err error) *RequestFailure {
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
		return &RequestFailure{Status: http.StatusConflict, Payload: BuildConflictPayload(conflictErr)}
	}
	if errors.Is(err, ErrWorkspaceNotFound) {
		return &RequestFailure{Status: http.StatusNotFound, Payload: map[string]any{"error": "not_found", "message": "Workspace not found."}}
	}
	if errors.Is(err, ErrWorkspaceDocumentNotFound) {
		return &RequestFailure{Status: http.StatusNotFound, Payload: map[string]any{"error": "not_found", "message": "Workspace document not found."}}
	}
	var syntaxErr *json.SyntaxError
	if errors.As(err, &syntaxErr) {
		return NewRequestFailure(http.StatusUnprocessableEntity, ErrorMIRValidationFailed, "Invalid JSON document payload.", map[string]any{"offset": syntaxErr.Offset})
	}
	if IsWorkspaceEnvelopeError(err) {
		return NewRequestFailure(http.StatusUnprocessableEntity, ErrorInvalidPayload, err.Error(), nil)
	}
	return &RequestFailure{Status: http.StatusInternalServerError, Payload: map[string]any{"error": "workspace_operation_failed", "message": "Could not process workspace request."}}
}

func BuildConflictPayload(conflictErr *WorkspaceRevisionConflictError) map[string]any {
	payload := map[string]any{
		"error":              "revision_conflict",
		"conflictType":       conflictErr.ConflictType,
		"workspaceId":        conflictErr.WorkspaceID,
		"serverWorkspaceRev": conflictErr.ServerWorkspaceRev,
		"serverRouteRev":     conflictErr.ServerRouteRev,
		"opSeq":              conflictErr.ServerOpSeq,
	}
	if strings.TrimSpace(conflictErr.DocumentID) != "" {
		payload["serverDocument"] = map[string]any{
			"id":         conflictErr.DocumentID,
			"contentRev": conflictErr.ServerContentRev,
			"metaRev":    conflictErr.ServerMetaRev,
		}
	}
	return payload
}

func BuildMutationSuccessPayload(result *WorkspaceMutationResult, acceptedMutationID string) map[string]any {
	response := map[string]any{
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
	return response
}

func LogWorkspaceConflictFailure(
	action string,
	method string,
	path string,
	workspaceID string,
	documentID string,
	expectedWorkspaceRev int64,
	expectedRouteRev int64,
	expectedContentRev int64,
	clientMutationID string,
	failure *RequestFailure,
) {
	if failure == nil || failure.Status != http.StatusConflict {
		return
	}
	conflictType, _ := failure.Payload["conflictType"]
	serverWorkspaceRev, _ := failure.Payload["serverWorkspaceRev"]
	serverRouteRev, _ := failure.Payload["serverRouteRev"]
	opSeq, _ := failure.Payload["opSeq"]
	log.Printf(
		"[workspace] 409 action=%s method=%s path=%s workspace=%s document=%s clientMutationId=%s expectedWorkspaceRev=%d expectedRouteRev=%d expectedContentRev=%d conflictType=%v serverWorkspaceRev=%v serverRouteRev=%v serverOpSeq=%v",
		action,
		method,
		path,
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

func IsWorkspaceEnvelopeError(err error) bool {
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

func DefaultCapabilities() map[string]bool {
	return map[string]bool{
		"core.mir.document.update@1.0":             true,
		"core.route.manifest.update@1.0":           true,
		"core.settings.global.update@1.0":          true,
		"core.nodegraph.node.move@1.0":             false,
		"core.nodegraph.edge.connect@1.0":          false,
		"core.animation.timeline.keyframe.add@1.0": false,
		"core.animation.clip.bind@1.0":             false,
	}
}
