package auth

import "github.com/gin-gonic/gin"

type RouteHandlers struct {
	Register    gin.HandlerFunc
	Login       gin.HandlerFunc
	Logout      gin.HandlerFunc
	Me          gin.HandlerFunc
	UpdateMe    gin.HandlerFunc
	GetUser     gin.HandlerFunc
	RequireAuth gin.HandlerFunc
}

func RegisterRoutes(api *gin.RouterGroup, handlers RouteHandlers) {
	api.POST("/auth/register", handlers.Register)
	api.POST("/auth/login", handlers.Login)
	api.POST("/auth/logout", handlers.RequireAuth, handlers.Logout)
	api.GET("/auth/me", handlers.RequireAuth, handlers.Me)
	api.PATCH("/users/me", handlers.RequireAuth, handlers.UpdateMe)
	api.GET("/users/:id", handlers.RequireAuth, handlers.GetUser)
}
