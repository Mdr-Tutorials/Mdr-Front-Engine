package auth

import "github.com/gin-gonic/gin"

const contextAuthUserKey = "authUser"

func RequireAuth[T any](
	resolveToken func(c *gin.Context) string,
	resolveSession func(token string) (string, bool),
	resolveUser func(userID string) (*T, bool),
	onUnauthorized gin.HandlerFunc,
) gin.HandlerFunc {
	return func(c *gin.Context) {
		token := resolveToken(c)
		if token == "" {
			onUnauthorized(c)
			c.Abort()
			return
		}
		userID, ok := resolveSession(token)
		if !ok {
			onUnauthorized(c)
			c.Abort()
			return
		}
		user, ok := resolveUser(userID)
		if !ok {
			onUnauthorized(c)
			c.Abort()
			return
		}
		c.Set(contextAuthUserKey, user)
		c.Next()
	}
}

func GetAuthUser[T any](c *gin.Context) (*T, bool) {
	value, ok := c.Get(contextAuthUserKey)
	if !ok {
		return nil, false
	}
	user, ok := value.(*T)
	if !ok {
		return nil, false
	}
	return user, true
}
