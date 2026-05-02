package workspace

import "github.com/gin-gonic/gin"

type RouteHandlers struct {
	RequireAuth              gin.HandlerFunc
	GetWorkspace             gin.HandlerFunc
	GetWorkspaceCapabilities gin.HandlerFunc
	PatchWorkspaceDocument   gin.HandlerFunc
	ApplyWorkspaceIntent     gin.HandlerFunc
	ApplyWorkspaceBatch      gin.HandlerFunc
}

func RegisterRoutes(api *gin.RouterGroup, handlers RouteHandlers) {
	api.GET("/workspaces/:workspaceId", handlers.RequireAuth, handlers.GetWorkspace)
	api.GET("/workspaces/:workspaceId/capabilities", handlers.RequireAuth, handlers.GetWorkspaceCapabilities)
	api.PATCH("/workspaces/:workspaceId/documents/:documentId", handlers.RequireAuth, handlers.PatchWorkspaceDocument)
	api.POST("/workspaces/:workspaceId/intents", handlers.RequireAuth, handlers.ApplyWorkspaceIntent)
	api.POST("/workspaces/:workspaceId/batch", handlers.RequireAuth, handlers.ApplyWorkspaceBatch)
}
