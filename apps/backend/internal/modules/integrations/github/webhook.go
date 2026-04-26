package github

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"strings"
)

var ErrMissingWebhookSecret = errors.New("github webhook secret is not configured")
var ErrInvalidWebhookSignature = errors.New("invalid github webhook signature")

func VerifyWebhookSignature(secret, signatureHeader string, payload []byte) error {
	secret = strings.TrimSpace(secret)
	signatureHeader = strings.TrimSpace(signatureHeader)
	if secret == "" {
		return ErrMissingWebhookSecret
	}
	if signatureHeader == "" || !strings.HasPrefix(signatureHeader, "sha256=") {
		return ErrInvalidWebhookSignature
	}

	expectedMAC := hmac.New(sha256.New, []byte(secret))
	_, _ = expectedMAC.Write(payload)
	expectedSignature := "sha256=" + hex.EncodeToString(expectedMAC.Sum(nil))
	if !hmac.Equal([]byte(expectedSignature), []byte(signatureHeader)) {
		return ErrInvalidWebhookSignature
	}
	return nil
}
