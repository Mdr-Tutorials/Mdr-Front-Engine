package main

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

type Server struct {
	cfg      Config
	router   *gin.Engine
	users    *UserStore
	sessions *SessionStore
}

func NewServer(cfg Config) *Server {
	router := gin.Default()
	server := &Server{
		cfg:      cfg,
		router:   router,
		users:    NewUserStore(),
		sessions: NewSessionStore(),
	}
	router.Use(corsMiddleware(cfg.AllowedOrigins))
	server.registerRoutes()
	return server
}

func (server *Server) registerRoutes() {
	api := server.router.Group("/api")
	api.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "pong"})
	})
	api.POST("/auth/register", server.handleRegister)
	api.POST("/auth/login", server.handleLogin)
	api.POST("/auth/logout", server.requireAuth(), server.handleLogout)
	api.GET("/auth/me", server.requireAuth(), server.handleMe)
	api.PATCH("/users/me", server.requireAuth(), server.handleUpdateMe)
	api.GET("/users/:id", server.requireAuth(), server.handleGetUser)
}

func (server *Server) Run() error {
	return server.router.Run(server.cfg.Address)
}

func (server *Server) handleRegister(c *gin.Context) {
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
	user, err := server.users.Create(email, request.Name, request.Description, passwordHash)
	if err != nil {
		if errors.Is(err, errEmailExists) {
			respondError(c, http.StatusConflict, "email_exists", "Email already registered.")
			return
		}
		respondError(c, http.StatusInternalServerError, "create_failed", "Could not create user.")
		return
	}
	session := server.sessions.Create(user.ID, server.cfg.TokenTTL)
	c.JSON(http.StatusCreated, gin.H{
		"user":      NewPublicUser(user),
		"token":     session.Token,
		"expiresAt": session.ExpiresAt,
	})
}

func (server *Server) handleLogin(c *gin.Context) {
	var request struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		respondError(c, http.StatusBadRequest, "invalid_payload", "Invalid request payload.")
		return
	}
	user, ok := server.users.GetByEmail(request.Email)
	if !ok {
		respondError(c, http.StatusUnauthorized, "invalid_credentials", "Invalid email or password.")
		return
	}
	if bcrypt.CompareHashAndPassword(user.PasswordHash, []byte(request.Password)) != nil {
		respondError(c, http.StatusUnauthorized, "invalid_credentials", "Invalid email or password.")
		return
	}
	session := server.sessions.Create(user.ID, server.cfg.TokenTTL)
	c.JSON(http.StatusOK, gin.H{
		"user":      NewPublicUser(user),
		"token":     session.Token,
		"expiresAt": session.ExpiresAt,
	})
}

func (server *Server) handleLogout(c *gin.Context) {
	token := getAuthToken(c)
	if token != "" {
		server.sessions.Delete(token)
	}
	c.Status(http.StatusNoContent)
}

func (server *Server) handleMe(c *gin.Context) {
	user := getAuthUser(c)
	if user == nil {
		respondError(c, http.StatusUnauthorized, "unauthorized", "Authentication required.")
		return
	}
	c.JSON(http.StatusOK, gin.H{"user": NewPublicUser(user)})
}

func (server *Server) handleGetUser(c *gin.Context) {
	userID := c.Param("id")
	user, ok := server.users.GetByID(userID)
	if !ok {
		respondError(c, http.StatusNotFound, "not_found", "User not found.")
		return
	}
	c.JSON(http.StatusOK, gin.H{"user": NewPublicUser(user)})
}

func (server *Server) handleUpdateMe(c *gin.Context) {
	user := getAuthUser(c)
	if user == nil {
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
	updated, err := server.users.Update(user.ID, request.Name, request.Description)
	if err != nil {
		if errors.Is(err, errUserNotFound) {
			respondError(c, http.StatusNotFound, "not_found", "User not found.")
			return
		}
		respondError(c, http.StatusInternalServerError, "update_failed", "Could not update user.")
		return
	}
	c.JSON(http.StatusOK, gin.H{"user": NewPublicUser(updated)})
}

func (server *Server) requireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		token := getAuthToken(c)
		if token == "" {
			respondError(c, http.StatusUnauthorized, "unauthorized", "Authentication required.")
			c.Abort()
			return
		}
		session, ok := server.sessions.Get(token)
		if !ok {
			respondError(c, http.StatusUnauthorized, "invalid_token", "Session expired or invalid.")
			c.Abort()
			return
		}
		user, ok := server.users.GetByID(session.UserID)
		if !ok {
			respondError(c, http.StatusUnauthorized, "invalid_user", "User not found.")
			c.Abort()
			return
		}
		c.Set("authUser", user)
		c.Next()
	}
}

func respondError(c *gin.Context, status int, code, message string) {
	c.JSON(status, gin.H{
		"error":   code,
		"message": message,
	})
}

func isValidEmail(email string) bool {
	email = strings.TrimSpace(email)
	if email == "" {
		return false
	}
	if !strings.Contains(email, "@") {
		return false
	}
	return true
}

func getAuthToken(c *gin.Context) string {
	authHeader := c.GetHeader("Authorization")
	if authHeader != "" {
		parts := strings.Fields(authHeader)
		if len(parts) == 2 && strings.EqualFold(parts[0], "Bearer") {
			return strings.TrimSpace(parts[1])
		}
	}
	return strings.TrimSpace(c.GetHeader("X-Auth-Token"))
}

func getAuthUser(c *gin.Context) *User {
	value, ok := c.Get("authUser")
	if !ok {
		return nil
	}
	user, ok := value.(*User)
	if !ok {
		return nil
	}
	return user
}

func corsMiddleware(allowed []string) gin.HandlerFunc {
	allowedMap := make(map[string]struct{}, len(allowed))
	for _, origin := range allowed {
		allowedMap[origin] = struct{}{}
	}

	return func(c *gin.Context) {
		origin := c.GetHeader("Origin")
		if origin != "" {
			if len(allowedMap) == 0 {
				c.Header("Access-Control-Allow-Origin", origin)
				c.Header("Vary", "Origin")
			} else if _, ok := allowedMap[origin]; ok {
				c.Header("Access-Control-Allow-Origin", origin)
				c.Header("Vary", "Origin")
			}
		}
		c.Header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Authorization,Content-Type,X-Auth-Token")
		c.Header("Access-Control-Expose-Headers", "Authorization,Content-Type")

		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	}
}
