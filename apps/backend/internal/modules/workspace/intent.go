package workspace

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"
)

const (
	ErrorUnsupportedIntent          = "UNSUPPORTED_INTENT"
	ErrorReservedDomain             = "RESERVED_DOMAIN_DISABLED"
	ErrorInvalidVersion             = "INVALID_ENVELOPE_VERSION"
	ErrorInvalidPayload             = "INVALID_ENVELOPE_PAYLOAD"
	ErrorMIRValidationFailed        = "MIR_VALIDATION_FAILED"
	ErrorMIRGraphPatchPathForbidden = "MIR_GRAPH_PATCH_PATH_FORBIDDEN"
)

type IntentActor struct {
	UserID   string `json:"userId"`
	ClientID string `json:"clientId"`
}

type IntentEnvelope struct {
	ID             string          `json:"id"`
	Namespace      string          `json:"namespace"`
	Type           string          `json:"type"`
	Version        string          `json:"version"`
	Payload        json.RawMessage `json:"payload"`
	IdempotencyKey string          `json:"idempotencyKey"`
	Actor          *IntentActor    `json:"actor"`
	IssuedAt       time.Time       `json:"issuedAt"`
}

type ApplyIntentRequest struct {
	ExpectedWorkspaceRev int64          `json:"expectedWorkspaceRev"`
	ExpectedRouteRev     int64          `json:"expectedRouteRev"`
	Intent               IntentEnvelope `json:"intent"`
}

type RequestFailure struct {
	Status  int
	Payload map[string]any
}

func NewRequestFailure(status int, code string, message string, details any) *RequestFailure {
	payload := map[string]any{
		"error":   "request_error",
		"code":    code,
		"message": message,
	}
	if details != nil {
		payload["details"] = details
	}
	return &RequestFailure{Status: status, Payload: payload}
}

func ResolveDocumentCommand(workspaceID, documentID string, provided *WorkspaceCommandEnvelope) WorkspaceCommandEnvelope {
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

func (module *Module) ApplyIntentMutation(ctx context.Context, workspaceID string, request ApplyIntentRequest) (*WorkspaceMutationResult, *RequestFailure) {
	if request.ExpectedWorkspaceRev <= 0 {
		return nil, NewRequestFailure(http.StatusUnprocessableEntity, ErrorInvalidPayload, "expectedWorkspaceRev must be positive.", nil)
	}
	intent := NormalizeIntent(request.Intent)
	if intent.ID == "" || intent.Namespace == "" || intent.Type == "" || intent.Version == "" || intent.IssuedAt.IsZero() {
		return nil, NewRequestFailure(http.StatusUnprocessableEntity, ErrorInvalidPayload, "intent envelope is incomplete.", nil)
	}
	if intent.Version != "1.0" {
		return nil, NewRequestFailure(http.StatusUnprocessableEntity, ErrorInvalidVersion, "Unsupported intent version.", mapKV("version", intent.Version))
	}
	if IsReservedIntentDomain(intent.Namespace) {
		return nil, NewRequestFailure(http.StatusUnprocessableEntity, ErrorReservedDomain, "Reserved domain is disabled.", mapKV("namespace", intent.Namespace))
	}
	command := WorkspaceCommandEnvelope{
		ID:         intent.ID,
		Namespace:  intent.Namespace,
		Type:       intent.Type,
		Version:    intent.Version,
		IssuedAt:   intent.IssuedAt,
		ForwardOps: make([]WorkspacePatchOp, 0),
		ReverseOps: make([]WorkspacePatchOp, 0),
		Target:     WorkspaceCommandTarget{WorkspaceID: workspaceID},
	}
	request.Intent = intent
	handlers := module.intentHandlers
	if handlers == nil {
		// Allow callers to construct Module via struct literal without going
		// through NewModule; without this guard every intent would fall
		// through to "Unsupported intent" silently.
		handlers = defaultIntentHandlers()
	}
	for _, handler := range handlers {
		if handler.CanHandle(intent) {
			return handler.Handle(ctx, module.store, workspaceID, request, intent, command)
		}
	}
	return nil, NewRequestFailure(
		http.StatusUnprocessableEntity,
		ErrorUnsupportedIntent,
		"Unsupported intent.",
		mapKV("namespace", intent.Namespace, "type", intent.Type),
	)
}

func NormalizeIntent(intent IntentEnvelope) IntentEnvelope {
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

func IsReservedIntentDomain(namespace string) bool {
	return strings.HasPrefix(namespace, "core.nodegraph") || strings.HasPrefix(namespace, "core.animation")
}

func mapKV(kv ...any) map[string]any {
	if len(kv) == 0 {
		return nil
	}
	payload := make(map[string]any, len(kv)/2)
	for i := 0; i+1 < len(kv); i += 2 {
		key, ok := kv[i].(string)
		if !ok {
			continue
		}
		payload[key] = kv[i+1]
	}
	return payload
}
