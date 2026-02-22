package project

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	backendauth "github.com/Mdr-Tutorials/mdr-front-engine/apps/backend/internal/modules/auth"
	backendresponse "github.com/Mdr-Tutorials/mdr-front-engine/apps/backend/internal/platform/http/response"
	"github.com/gin-gonic/gin"
)

type WorkspaceBootstrapper interface {
	BootstrapProjectWorkspace(ctx context.Context, project *Project) error
}

type Handler struct {
	store           *ProjectStore
	workspaceModule WorkspaceBootstrapper
}

func NewHandler(store *ProjectStore, workspaceModule WorkspaceBootstrapper) *Handler {
	return &Handler{store: store, workspaceModule: workspaceModule}
}

func (handler *Handler) Routes(requireAuth gin.HandlerFunc) RouteHandlers {
	return RouteHandlers{
		RequireAuth:    requireAuth,
		ListProjects:   handler.HandleListProjects,
		CreateProject:  handler.HandleCreateProject,
		GetProject:     handler.HandleGetProject,
		UpdateProject:  handler.HandleUpdateProject,
		GetProjectMIR:  handler.HandleGetProjectMIR,
		SaveProjectMIR: handler.HandleSaveProjectMIR,
		PublishProject: handler.HandlePublishProject,
		DeleteProject:  handler.HandleDeleteProject,
		ListCommunity:  handler.HandleCommunityListProjects,
		GetCommunity:   handler.HandleCommunityGetProject,
	}
}

func (handler *Handler) HandleListProjects(c *gin.Context) {
	user, ok := backendauth.GetAuthUser[backendauth.User](c)
	if !ok {
		respondError(c, http.StatusUnauthorized, "unauthorized", "Authentication required.")
		return
	}
	projects, err := handler.store.ListByOwner(user.ID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "projects_list_failed", "Could not load projects.")
		return
	}
	c.JSON(http.StatusOK, gin.H{"projects": projects})
}

func (handler *Handler) HandleCreateProject(c *gin.Context) {
	user, ok := backendauth.GetAuthUser[backendauth.User](c)
	if !ok {
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
	project, err := handler.store.Create(user.ID, request.Name, request.Description, resourceType, request.IsPublic, request.MIR)
	if err != nil {
		if errors.Is(err, ErrInvalidResourceType) {
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
	if err := handler.bootstrapProjectWorkspace(c.Request.Context(), project); err != nil {
		_ = handler.store.Delete(user.ID, project.ID)
		respondError(c, http.StatusInternalServerError, "project_create_failed", "Could not create project.")
		return
	}
	c.JSON(http.StatusCreated, gin.H{"project": toProjectSummary(project)})
}

func (handler *Handler) HandleGetProject(c *gin.Context) {
	user, ok := backendauth.GetAuthUser[backendauth.User](c)
	if !ok {
		respondError(c, http.StatusUnauthorized, "unauthorized", "Authentication required.")
		return
	}
	project, err := handler.store.GetByID(user.ID, c.Param("id"))
	if err != nil {
		if errors.Is(err, ErrProjectNotFound) {
			respondError(c, http.StatusNotFound, "not_found", "Project not found.")
			return
		}
		respondError(c, http.StatusInternalServerError, "project_get_failed", "Could not load project.")
		return
	}
	c.JSON(http.StatusOK, gin.H{"project": project})
}

func (handler *Handler) HandleUpdateProject(c *gin.Context) {
	user, ok := backendauth.GetAuthUser[backendauth.User](c)
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
	if request.Name == nil && request.Description == nil {
		respondError(c, http.StatusBadRequest, "invalid_payload", "No fields to update.")
		return
	}

	project, err := handler.store.UpdateProject(user.ID, c.Param("id"), request.Name, request.Description)
	if err != nil {
		if errors.Is(err, ErrProjectNotFound) {
			respondError(c, http.StatusNotFound, "not_found", "Project not found.")
			return
		}
		respondError(c, http.StatusInternalServerError, "project_update_failed", "Could not update project.")
		return
	}
	c.JSON(http.StatusOK, gin.H{"project": project})
}

func (handler *Handler) HandleGetProjectMIR(c *gin.Context) {
	user, ok := backendauth.GetAuthUser[backendauth.User](c)
	if !ok {
		respondError(c, http.StatusUnauthorized, "unauthorized", "Authentication required.")
		return
	}
	project, err := handler.store.GetByID(user.ID, c.Param("id"))
	if err != nil {
		if errors.Is(err, ErrProjectNotFound) {
			respondError(c, http.StatusNotFound, "not_found", "Project not found.")
			return
		}
		respondError(c, http.StatusInternalServerError, "project_get_failed", "Could not load project.")
		return
	}
	c.JSON(http.StatusOK, gin.H{"id": project.ID, "mir": project.MIR, "updatedAt": project.UpdatedAt})
}

func (handler *Handler) HandleSaveProjectMIR(c *gin.Context) {
	user, ok := backendauth.GetAuthUser[backendauth.User](c)
	if !ok {
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
	project, err := handler.store.SaveMIR(user.ID, c.Param("id"), request.MIR)
	if err != nil {
		if errors.Is(err, ErrProjectNotFound) {
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

func (handler *Handler) HandlePublishProject(c *gin.Context) {
	user, ok := backendauth.GetAuthUser[backendauth.User](c)
	if !ok {
		respondError(c, http.StatusUnauthorized, "unauthorized", "Authentication required.")
		return
	}
	project, err := handler.store.SetPublic(user.ID, c.Param("id"), true)
	if err != nil {
		if errors.Is(err, ErrProjectNotFound) {
			respondError(c, http.StatusNotFound, "not_found", "Project not found.")
			return
		}
		respondError(c, http.StatusInternalServerError, "project_publish_failed", "Could not publish project.")
		return
	}
	c.JSON(http.StatusOK, gin.H{"project": project})
}

func (handler *Handler) HandleDeleteProject(c *gin.Context) {
	user, ok := backendauth.GetAuthUser[backendauth.User](c)
	if !ok {
		respondError(c, http.StatusUnauthorized, "unauthorized", "Authentication required.")
		return
	}
	if err := handler.store.Delete(user.ID, c.Param("id")); err != nil {
		if errors.Is(err, ErrProjectNotFound) {
			respondError(c, http.StatusNotFound, "not_found", "Project not found.")
			return
		}
		respondError(c, http.StatusInternalServerError, "project_delete_failed", "Could not delete project.")
		return
	}
	c.Status(http.StatusNoContent)
}

func (handler *Handler) HandleCommunityListProjects(c *gin.Context) {
	options := CommunityListOptions{
		Keyword:      c.Query("keyword"),
		ResourceType: ResourceType(c.Query("resourceType")),
		Sort:         c.DefaultQuery("sort", "latest"),
		Page:         ParsePositiveInt(c.Query("page"), 1),
		PageSize:     ParsePositiveInt(c.Query("pageSize"), 20),
	}
	projects, err := handler.store.ListPublic(options)
	if err != nil {
		if errors.Is(err, ErrInvalidResourceType) {
			respondError(c, http.StatusBadRequest, "invalid_resource_type", "Resource type is invalid.")
			return
		}
		respondError(c, http.StatusInternalServerError, "community_list_failed", "Could not load community projects.")
		return
	}
	c.JSON(http.StatusOK, gin.H{"projects": projects, "page": options.Page, "pageSize": options.PageSize, "sort": strings.ToLower(strings.TrimSpace(options.Sort))})
}

func (handler *Handler) HandleCommunityGetProject(c *gin.Context) {
	project, err := handler.store.GetPublicByID(c.Param("id"))
	if err != nil {
		if errors.Is(err, ErrProjectNotFound) {
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
	return ProjectSummary{ID: project.ID, ResourceType: project.ResourceType, Name: project.Name, Description: project.Description, IsPublic: project.IsPublic, StarsCount: project.StarsCount, CreatedAt: project.CreatedAt, UpdatedAt: project.UpdatedAt}
}

func (handler *Handler) bootstrapProjectWorkspace(ctx context.Context, project *Project) error {
	if handler.workspaceModule == nil {
		return errors.New("workspace module is not initialized")
	}
	return handler.workspaceModule.BootstrapProjectWorkspace(ctx, project)
}

func respondError(c *gin.Context, status int, code, message string) {
	backendresponse.Error(c, status, code, message)
}
