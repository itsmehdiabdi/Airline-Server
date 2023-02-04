package main

import (
	"auth/controllers"
	"auth/initializers"
	"github.com/gin-gonic/gin"
)

func init() {
	initializers.LoadEnvVariables()
	initializers.ConnectToDb()
	initializers.SyncDatabase()
	initializers.ConnectToRedis()
}

func main() {
	r := gin.Default()

	// Routes
	r.POST("/api/signup", controllers.Signup)
	r.POST("/api/login", controllers.Login)
	r.POST("/api/refresh", controllers.Refresh)
	r.GET("/api/user", controllers.GetUser)
	r.DELETE("/api/logout", controllers.Logout)

	// Run the server
	r.Run()
}
