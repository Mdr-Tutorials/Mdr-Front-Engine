package github

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"testing"
)

func TestVerifyWebhookSignature(t *testing.T) {
	secret := "dev-secret"
	payload := []byte(`{"action":"created"}`)
	mac := hmac.New(sha256.New, []byte(secret))
	_, _ = mac.Write(payload)
	signature := "sha256=" + hex.EncodeToString(mac.Sum(nil))

	if err := VerifyWebhookSignature(secret, signature, payload); err != nil {
		t.Fatalf("expected signature to verify: %v", err)
	}
}

func TestVerifyWebhookSignatureRejectsInvalidSignature(t *testing.T) {
	err := VerifyWebhookSignature("dev-secret", "sha256=bad", []byte(`{}`))
	if !errors.Is(err, ErrInvalidWebhookSignature) {
		t.Fatalf("expected invalid signature error, got %v", err)
	}
}

func TestVerifyWebhookSignatureRequiresSecret(t *testing.T) {
	err := VerifyWebhookSignature("", "sha256=bad", []byte(`{}`))
	if !errors.Is(err, ErrMissingWebhookSecret) {
		t.Fatalf("expected missing secret error, got %v", err)
	}
}
