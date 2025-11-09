package main

import "github.com/gin-gonic/gin"

func main() {
	r := gin.Default()

	// 定义路由和处理函数
	r.GET("/api/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "pong",
		})
	})

	r.Run()
}
