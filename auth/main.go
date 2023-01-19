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
}

func main() {
	r := gin.Default()

	// Routes
	r.POST("/signup", controllers.Signup)

	// Run the server
	r.Run()
}
