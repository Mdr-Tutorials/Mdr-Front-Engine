package main

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"strings"
	"sync"
	"time"
)

var errEmailExists = errors.New("email already exists")
var errUserNotFound = errors.New("user not found")

type UserStore struct {
	mu      sync.RWMutex
	byID    map[string]*User
	byEmail map[string]string
}

func NewUserStore() *UserStore {
	return &UserStore{
		byID:    make(map[string]*User),
		byEmail: make(map[string]string),
	}
}

func (store *UserStore) Create(email, name, description string, passwordHash []byte) (*User, error) {
	normalized := normalizeEmail(email)
	if normalized == "" {
		return nil, errors.New("invalid email")
	}
	store.mu.Lock()
	defer store.mu.Unlock()
	if _, exists := store.byEmail[normalized]; exists {
		return nil, errEmailExists
	}
	user := &User{
		ID:           newID("usr"),
		Email:        normalized,
		Name:         strings.TrimSpace(name),
		Description:  strings.TrimSpace(description),
		PasswordHash: passwordHash,
		CreatedAt:    time.Now().UTC(),
	}
	store.byID[user.ID] = user
	store.byEmail[normalized] = user.ID
	return user, nil
}

func (store *UserStore) GetByEmail(email string) (*User, bool) {
	normalized := normalizeEmail(email)
	if normalized == "" {
		return nil, false
	}
	store.mu.RLock()
	defer store.mu.RUnlock()
	id, ok := store.byEmail[normalized]
	if !ok {
		return nil, false
	}
	user, ok := store.byID[id]
	return user, ok
}

func (store *UserStore) GetByID(id string) (*User, bool) {
	store.mu.RLock()
	defer store.mu.RUnlock()
	user, ok := store.byID[id]
	return user, ok
}

func (store *UserStore) Update(userID string, name, description *string) (*User, error) {
	store.mu.Lock()
	defer store.mu.Unlock()
	user, ok := store.byID[userID]
	if !ok {
		return nil, errUserNotFound
	}
	if name != nil {
		user.Name = strings.TrimSpace(*name)
	}
	if description != nil {
		user.Description = strings.TrimSpace(*description)
	}
	return user, nil
}

type SessionStore struct {
	mu       sync.RWMutex
	sessions map[string]*Session
}

func NewSessionStore() *SessionStore {
	return &SessionStore{
		sessions: make(map[string]*Session),
	}
}

func (store *SessionStore) Create(userID string, ttl time.Duration) *Session {
	if ttl <= 0 {
		ttl = 24 * time.Hour
	}
	session := &Session{
		Token:     newToken(),
		UserID:    userID,
		CreatedAt: time.Now().UTC(),
		ExpiresAt: time.Now().UTC().Add(ttl),
	}
	store.mu.Lock()
	store.sessions[session.Token] = session
	store.mu.Unlock()
	return session
}

func (store *SessionStore) Get(token string) (*Session, bool) {
	if token == "" {
		return nil, false
	}
	store.mu.RLock()
	session, ok := store.sessions[token]
	store.mu.RUnlock()
	if !ok {
		return nil, false
	}
	if session.ExpiresAt.Before(time.Now().UTC()) {
		store.Delete(token)
		return nil, false
	}
	return session, true
}

func (store *SessionStore) Delete(token string) {
	if token == "" {
		return
	}
	store.mu.Lock()
	delete(store.sessions, token)
	store.mu.Unlock()
}

func normalizeEmail(email string) string {
	value := strings.TrimSpace(strings.ToLower(email))
	if value == "" {
		return ""
	}
	return value
}

func newID(prefix string) string {
	return prefix + "_" + newRandomHex(16)
}

func newToken() string {
	return newRandomHex(32)
}

func newRandomHex(size int) string {
	buffer := make([]byte, size)
	_, err := rand.Read(buffer)
	if err != nil {
		return hex.EncodeToString([]byte(time.Now().Format("20060102150405.000")))
	}
	return hex.EncodeToString(buffer)
}
