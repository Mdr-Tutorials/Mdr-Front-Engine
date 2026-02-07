package main

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

type Server struct {
	cfg      Config
	db       *sql.DB
	router   *gin.Engine
	users    *UserStore
	sessions *SessionStore
	projects *ProjectStore
}

func NewServer(cfg Config) (*Server, error) {
	db, err := openDatabase(cfg)
	if err != nil {
		return nil, fmt.Errorf("initialize database: %w", err)
	}

	router := gin.Default()
	server := &Server{
		cfg:      cfg,
		db:       db,
		router:   router,
		users:    NewUserStore(db),
		sessions: NewSessionStore(db),
		projects: NewProjectStore(db),
	}
	router.Use(corsMiddleware(cfg.AllowedOrigins))
	server.registerRoutes()
	return server, nil
}

func (server *Server) registerRoutes() {
	api := server.router.Group("/api")
	api.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "pong"})
	})
	api.GET("/community/projects", server.handleCommunityListProjects)
	api.GET("/community/projects/:id", server.handleCommunityGetProject)
	api.POST("/auth/register", server.handleRegister)
	api.POST("/auth/login", server.handleLogin)
	api.POST("/auth/logout", server.requireAuth(), server.handleLogout)
	api.GET("/auth/me", server.requireAuth(), server.handleMe)
	api.PATCH("/users/me", server.requireAuth(), server.handleUpdateMe)
	api.GET("/users/:id", server.requireAuth(), server.handleGetUser)
	api.GET("/projects", server.requireAuth(), server.handleListProjects)
	api.POST("/projects", server.requireAuth(), server.handleCreateProject)
	api.GET("/projects/:id", server.requireAuth(), server.handleGetProject)
	api.GET("/projects/:id/mir", server.requireAuth(), server.handleGetProjectMIR)
	api.PUT("/projects/:id/mir", server.requireAuth(), server.handleSaveProjectMIR)
	api.POST("/projects/:id/publish", server.requireAuth(), server.handlePublishProject)
	api.DELETE("/projects/:id", server.requireAuth(), server.handleDeleteProject)
}

func (server *Server) Run() error {
	return server.router.Run(server.cfg.Address)
}

func (server *Server) Close() error {
	if server.db == nil {
		return nil
	}
	return server.db.Close()
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
	if session == nil {
		respondError(c, http.StatusInternalServerError, "session_failed", "Could not create session.")
		return
	}
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
	if session == nil {
		respondError(c, http.StatusInternalServerError, "session_failed", "Could not create session.")
		return
	}
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

func (server *Server) handleListProjects(c *gin.Context) {
	user := getAuthUser(c)
	if user == nil {
		respondError(c, http.StatusUnauthorized, "unauthorized", "Authentication required.")
		return
	}
	projects, err := server.projects.ListByOwner(user.ID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "projects_list_failed", "Could not load projects.")
		return
	}
	c.JSON(http.StatusOK, gin.H{"projects": projects})
}

func (server *Server) handleCreateProject(c *gin.Context) {
	user := getAuthUser(c)
	if user == nil {
		respondError(c, http.StatusUnauthorized, "unauthorized", "Authentication required.")
		return
	}
	var request struct {
		Name         string          `json:"name"`
		Description  string          `json:"description"`
		ResourceType ResourceType    `json:"resourceType"`
		IsPublic     bool            `json:"isPublic"`
		MIR          json.RawMessage `json:"mir"`
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		respondError(c, http.StatusBadRequest, "invalid_payload", "Invalid request payload.")
		return
	}
	resourceType := request.ResourceType
	if strings.TrimSpace(string(resourceType)) == "" {
		resourceType = ResourceTypeProject
	}
	project, err := server.projects.Create(
		user.ID,
		request.Name,
		request.Description,
		resourceType,
		request.IsPublic,
		request.MIR,
	)
	if err != nil {
		if errors.Is(err, errInvalidResourceType) {
			respondError(c, http.StatusBadRequest, "invalid_resource_type", "Resource type is invalid.")
			return
		}
		var syntaxErr *json.SyntaxError
		if errors.As(err, &syntaxErr) {
			respondError(c, http.StatusBadRequest, "invalid_mir", "MIR document is invalid.")
			return
		}
		respondError(c, http.StatusInternalServerError, "project_create_failed", "Could not create project.")
		return
	}
	c.JSON(http.StatusCreated, gin.H{"project": toProjectSummary(project)})
}

func (server *Server) handleGetProject(c *gin.Context) {
	user := getAuthUser(c)
	if user == nil {
		respondError(c, http.StatusUnauthorized, "unauthorized", "Authentication required.")
		return
	}
	project, err := server.projects.GetByID(user.ID, c.Param("id"))
	if err != nil {
		if errors.Is(err, errProjectNotFound) {
			respondError(c, http.StatusNotFound, "not_found", "Project not found.")
			return
		}
		respondError(c, http.StatusInternalServerError, "project_get_failed", "Could not load project.")
		return
	}
	c.JSON(http.StatusOK, gin.H{"project": project})
}

func (server *Server) handleGetProjectMIR(c *gin.Context) {
	user := getAuthUser(c)
	if user == nil {
		respondError(c, http.StatusUnauthorized, "unauthorized", "Authentication required.")
		return
	}
	project, err := server.projects.GetByID(user.ID, c.Param("id"))
	if err != nil {
		if errors.Is(err, errProjectNotFound) {
			respondError(c, http.StatusNotFound, "not_found", "Project not found.")
			return
		}
		respondError(c, http.StatusInternalServerError, "project_get_failed", "Could not load project.")
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"id":        project.ID,
		"mir":       project.MIR,
		"updatedAt": project.UpdatedAt,
	})
}

func (server *Server) handleSaveProjectMIR(c *gin.Context) {
	user := getAuthUser(c)
	if user == nil {
		respondError(c, http.StatusUnauthorized, "unauthorized", "Authentication required.")
		return
	}
	var request struct {
		MIR json.RawMessage `json:"mir"`
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		respondError(c, http.StatusBadRequest, "invalid_payload", "Invalid request payload.")
		return
	}
	project, err := server.projects.SaveMIR(user.ID, c.Param("id"), request.MIR)
	if err != nil {
		if errors.Is(err, errProjectNotFound) {
			respondError(c, http.StatusNotFound, "not_found", "Project not found.")
			return
		}
		var syntaxErr *json.SyntaxError
		if errors.As(err, &syntaxErr) {
			respondError(c, http.StatusBadRequest, "invalid_mir", "MIR document is invalid.")
			return
		}
		respondError(c, http.StatusInternalServerError, "project_save_failed", "Could not save project.")
		return
	}
	c.JSON(http.StatusOK, gin.H{"project": project})
}

func (server *Server) handlePublishProject(c *gin.Context) {
	user := getAuthUser(c)
	if user == nil {
		respondError(c, http.StatusUnauthorized, "unauthorized", "Authentication required.")
		return
	}

	project, err := server.projects.SetPublic(user.ID, c.Param("id"), true)
	if err != nil {
		if errors.Is(err, errProjectNotFound) {
			respondError(c, http.StatusNotFound, "not_found", "Project not found.")
			return
		}
		respondError(c, http.StatusInternalServerError, "project_publish_failed", "Could not publish project.")
		return
	}
	c.JSON(http.StatusOK, gin.H{"project": project})
}

func (server *Server) handleDeleteProject(c *gin.Context) {
	user := getAuthUser(c)
	if user == nil {
		respondError(c, http.StatusUnauthorized, "unauthorized", "Authentication required.")
		return
	}

	err := server.projects.Delete(user.ID, c.Param("id"))
	if err != nil {
		if errors.Is(err, errProjectNotFound) {
			respondError(c, http.StatusNotFound, "not_found", "Project not found.")
			return
		}
		respondError(c, http.StatusInternalServerError, "project_delete_failed", "Could not delete project.")
		return
	}
	c.Status(http.StatusNoContent)
}

func (server *Server) handleCommunityListProjects(c *gin.Context) {
	options := CommunityListOptions{
		Keyword:      c.Query("keyword"),
		ResourceType: ResourceType(c.Query("resourceType")),
		Sort:         c.DefaultQuery("sort", "latest"),
		Page:         parsePositiveInt(c.Query("page"), 1),
		PageSize:     parsePositiveInt(c.Query("pageSize"), 20),
	}

	projects, err := server.projects.ListPublic(options)
	if err != nil {
		if errors.Is(err, errInvalidResourceType) {
			respondError(c, http.StatusBadRequest, "invalid_resource_type", "Resource type is invalid.")
			return
		}
		respondError(c, http.StatusInternalServerError, "community_list_failed", "Could not load community projects.")
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"projects": projects,
		"page":     options.Page,
		"pageSize": options.PageSize,
		"sort":     strings.ToLower(strings.TrimSpace(options.Sort)),
	})
}

func (server *Server) handleCommunityGetProject(c *gin.Context) {
	project, err := server.projects.GetPublicByID(c.Param("id"))
	if err != nil {
		if errors.Is(err, errProjectNotFound) {
			respondError(c, http.StatusNotFound, "not_found", "Project not found.")
			return
		}
		respondError(c, http.StatusInternalServerError, "community_get_failed", "Could not load project.")
		return
	}

	c.JSON(http.StatusOK, gin.H{"project": project})
}

func toProjectSummary(project *Project) ProjectSummary {
	if project == nil {
		return ProjectSummary{}
	}
	return ProjectSummary{
		ID:           project.ID,
		ResourceType: project.ResourceType,
		Name:         project.Name,
		Description:  project.Description,
		IsPublic:     project.IsPublic,
		StarsCount:   project.StarsCount,
		CreatedAt:    project.CreatedAt,
		UpdatedAt:    project.UpdatedAt,
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
