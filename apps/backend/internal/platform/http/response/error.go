package response

import "github.com/gin-gonic/gin"

func Error(c *gin.Context, status int, code, message string) {
	c.JSON(status, gin.H{
		"error":   code,
		"message": message,
	})
}
