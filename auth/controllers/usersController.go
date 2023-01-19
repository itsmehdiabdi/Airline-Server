package controllers

import (
	"auth/initializers"
	"auth/models"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"net/http"
	"strconv"
)

func Signup(c *gin.Context) {
	// Get the user's data from the request body
	var body struct {
		Email       string `json:"email" binding:"required"`
		PhoneNumber string `json:"phoneNumber" binding:"required"`
		Male        string `json:"male" binding:"required"`
		FirstName   string `json:"firstName" binding:"required"`
		LastName    string `json:"lastName" binding:"required"`
		Password    string `json:"password" binding:"required"`
	}

	// If the request body is not valid, return an error
	if c.Bind(&body) != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	// hash the user's password
	hash, err := bcrypt.GenerateFromPassword([]byte(body.Password), 10)

	// If there was an error while hashing the password, return an error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error while hashing password"})
		return
	}

	// convert the Male string to a boolean
	isMale, _ := strconv.ParseBool(body.Male)

	// Create a new user account
	user := models.UserAccount{
		Email:        body.Email,
		PhoneNumber:  body.PhoneNumber,
		Male:         isMale,
		FirstName:    body.FirstName,
		LastName:     body.LastName,
		PasswordHash: string(hash),
	}

	// Save the user account to the database
	result := initializers.DB.Create(&user)

	// If there was an error while saving the user account, return an error
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error while creating user"})
		return
	}

	// Return the success message
	c.JSON(http.StatusOK, gin.H{"message": "user created successfully"})
}
