package response

import "github.com/gin-gonic/gin"

type Diagnostic struct {
	Code      string         `json:"code"`
	Message   string         `json:"message"`
	Severity  string         `json:"severity,omitempty"`
	Domain    string         `json:"domain,omitempty"`
	Retryable *bool          `json:"retryable,omitempty"`
	Path      string         `json:"path,omitempty"`
	TargetRef map[string]any `json:"targetRef,omitempty"`
	DocsURL   string         `json:"docsUrl,omitempty"`
	Details   any            `json:"details,omitempty"`
}

type ErrorPayload struct {
	Code        string       `json:"code"`
	Message     string       `json:"message"`
	Severity    string       `json:"severity,omitempty"`
	Domain      string       `json:"domain,omitempty"`
	Retryable   *bool        `json:"retryable,omitempty"`
	RequestID   string       `json:"requestId,omitempty"`
	DocsURL     string       `json:"docsUrl,omitempty"`
	Details     any          `json:"details,omitempty"`
	Diagnostics []Diagnostic `json:"diagnostics,omitempty"`
}

type ErrorEnvelope struct {
	Error ErrorPayload `json:"error"`
}

type ErrorOption func(*ErrorPayload)

func WithDetails(details any) ErrorOption {
	return func(payload *ErrorPayload) {
		payload.Details = details
	}
}

func WithDomain(domain string) ErrorOption {
	return func(payload *ErrorPayload) {
		payload.Domain = domain
	}
}

func WithSeverity(severity string) ErrorOption {
	return func(payload *ErrorPayload) {
		payload.Severity = severity
	}
}

func WithRetryable(retryable bool) ErrorOption {
	return func(payload *ErrorPayload) {
		payload.Retryable = &retryable
	}
}

func WithDiagnostics(diagnostics []Diagnostic) ErrorOption {
	return func(payload *ErrorPayload) {
		payload.Diagnostics = diagnostics
	}
}

func Error(c *gin.Context, status int, code, message string, options ...ErrorOption) {
	payload := NewErrorPayload(code, message, options...)
	if requestID := c.GetHeader("X-Request-Id"); requestID != "" {
		payload.RequestID = requestID
		c.Header("X-Request-Id", requestID)
	}
	c.JSON(status, ErrorEnvelope{Error: payload})
}

func NewErrorPayload(code, message string, options ...ErrorOption) ErrorPayload {
	payload := ErrorPayload{
		Code:    code,
		Message: message,
	}
	for _, option := range options {
		option(&payload)
	}
	return payload
}

func NewErrorEnvelope(code, message string, options ...ErrorOption) ErrorEnvelope {
	return ErrorEnvelope{Error: NewErrorPayload(code, message, options...)}
}
