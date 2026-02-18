package auth

import (
	"errors"
	"net/http"
	"strings"
	"time"

	backendresponse "github.com/Mdr-Tutorials/mdr-front-engine/apps/backend/internal/platform/http/response"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

type Handler struct {
	users    *UserStore
	sessions *SessionStore
	tokenTTL time.Duration
}

func NewHandler(users *UserStore, sessions *SessionStore, tokenTTL time.Duration) *Handler {
	return &Handler{users: users, sessions: sessions, tokenTTL: tokenTTL}
}

func (handler *Handler) RequireAuth() gin.HandlerFunc {
	return RequireAuth(
		ResolveToken,
		func(token string) (string, bool) {
			session, ok := handler.sessions.Get(token)
			if !ok {
				return "", false
			}
			return session.UserID, true
		},
		func(userID string) (*User, bool) {
			return handler.users.GetByID(userID)
		},
		func(c *gin.Context) {
			respondError(c, http.StatusUnauthorized, "unauthorized", "Authentication required.")
		},
	)
}

func (handler *Handler) Routes(requireAuth gin.HandlerFunc) RouteHandlers {
	return RouteHandlers{
		Register:    handler.HandleRegister,
		Login:       handler.HandleLogin,
		Logout:      handler.HandleLogout,
		Me:          handler.HandleMe,
		UpdateMe:    handler.HandleUpdateMe,
		GetUser:     handler.HandleGetUser,
		RequireAuth: requireAuth,
	}
}

func (handler *Handler) HandleRegister(c *gin.Context) {
	var request struct {
		Email       string `json:"email"`
		Password    string `json:"password"`
		Name        string `json:"name"`
		Description string `json:"description"`
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		respondError(c, http.StatusBadRequest, "invalid_payload", "Invalid request payload.")
		return
	}
	email := strings.TrimSpace(request.Email)
	password := request.Password
	if !isValidEmail(email) {
		respondError(c, http.StatusBadRequest, "invalid_email", "Email is invalid.")
		return
	}
	if len(password) < 8 {
		respondError(c, http.StatusBadRequest, "weak_password", "Password must be at least 8 characters.")
		return
	}
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "hash_failed", "Could not secure password.")
		return
	}
	user, err := handler.users.Create(email, request.Name, request.Description, passwordHash)
	if err != nil {
		if errors.Is(err, ErrEmailExists) {
			respondError(c, http.StatusConflict, "email_exists", "Email already registered.")
			return
		}
		respondError(c, http.StatusInternalServerError, "create_failed", "Could not create user.")
		return
	}
	session := handler.sessions.Create(user.ID, handler.tokenTTL)
	if session == nil {
		respondError(c, http.StatusInternalServerError, "session_failed", "Could not create session.")
		return
	}
	c.JSON(http.StatusCreated, gin.H{"user": NewPublicUser(user), "token": session.Token, "expiresAt": session.ExpiresAt})
}

func (handler *Handler) HandleLogin(c *gin.Context) {
	var request struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		respondError(c, http.StatusBadRequest, "invalid_payload", "Invalid request payload.")
		return
	}
	user, ok := handler.users.GetByEmail(request.Email)
	if !ok {
		respondError(c, http.StatusUnauthorized, "invalid_credentials", "Invalid email or password.")
		return
	}
	if bcrypt.CompareHashAndPassword(user.PasswordHash, []byte(request.Password)) != nil {
		respondError(c, http.StatusUnauthorized, "invalid_credentials", "Invalid email or password.")
		return
	}
	session := handler.sessions.Create(user.ID, handler.tokenTTL)
	if session == nil {
		respondError(c, http.StatusInternalServerError, "session_failed", "Could not create session.")
		return
	}
	c.JSON(http.StatusOK, gin.H{"user": NewPublicUser(user), "token": session.Token, "expiresAt": session.ExpiresAt})
}

func (handler *Handler) HandleLogout(c *gin.Context) {
	token := ResolveToken(c)
	if token != "" {
		handler.sessions.Delete(token)
	}
	c.Status(http.StatusNoContent)
}

func (handler *Handler) HandleMe(c *gin.Context) {
	user, ok := GetAuthUser[User](c)
	if !ok {
		respondError(c, http.StatusUnauthorized, "unauthorized", "Authentication required.")
		return
	}
	c.JSON(http.StatusOK, gin.H{"user": NewPublicUser(user)})
}

func (handler *Handler) HandleGetUser(c *gin.Context) {
	userID := c.Param("id")
	user, ok := handler.users.GetByID(userID)
	if !ok {
		respondError(c, http.StatusNotFound, "not_found", "User not found.")
		return
	}
	c.JSON(http.StatusOK, gin.H{"user": NewPublicUser(user)})
}

func (handler *Handler) HandleUpdateMe(c *gin.Context) {
	user, ok := GetAuthUser[User](c)
	if !ok {
		respondError(c, http.StatusUnauthorized, "unauthorized", "Authentication required.")
		return
	}
	var request struct {
		Name        *string `json:"name"`
		Description *string `json:"description"`
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		respondError(c, http.StatusBadRequest, "invalid_payload", "Invalid request payload.")
		return
	}
	updated, err := handler.users.Update(user.ID, request.Name, request.Description)
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			respondError(c, http.StatusNotFound, "not_found", "User not found.")
			return
		}
		respondError(c, http.StatusInternalServerError, "update_failed", "Could not update user.")
		return
	}
	c.JSON(http.StatusOK, gin.H{"user": NewPublicUser(updated)})
}

func respondError(c *gin.Context, status int, code, message string) {
	backendresponse.Error(c, status, code, message)
}

func isValidEmail(email string) bool {
	email = strings.TrimSpace(email)
	if email == "" {
		return false
	}
	return strings.Contains(email, "@")
}
