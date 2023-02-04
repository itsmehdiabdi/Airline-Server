package controllers

import (
	"auth/initializers"
	"auth/models"
	"context"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"
	"github.com/redis/go-redis/v9"
	"golang.org/x/crypto/bcrypt"
	"net/http"
	"os"
	"strconv"
	"time"
)

var ctx = context.Background()

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

	// Check if the user already exists
	var users models.UserAccount
	emailCheck := initializers.DB.Where("email = ?", body.Email).First(&users)
	phoneNumberCheck := initializers.DB.Where("phone_number = ?", body.PhoneNumber).First(&users)

	// If the user already exists, return an error
	if emailCheck.RowsAffected != 0 || phoneNumberCheck.RowsAffected != 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "user already exists"})
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

func Login(c *gin.Context) {
	// Get the user's data from the request body
	var body struct {
		Email       string `json:"email"`
		PhoneNumber string `json:"phoneNumber"`
		Password    string `json:"password" binding:"required"`
	}

	// If the request body is not valid, return an error
	if c.Bind(&body) != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	// Get the user account from the database
	var user models.UserAccount
	if body.Email != "" {
		initializers.DB.First(&user, "email = ?", body.Email)
		if user.ID == 0 {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid email or password"})
			return
		}
	} else if body.PhoneNumber != "" {
		initializers.DB.First(&user, "phone_number = ?", body.PhoneNumber)
		if user.ID == 0 {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid phone number or password"})
			return
		}
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	// Compare the user's password with the password hash
	err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(body.Password))

	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid email or password"})
		return
	}

	// Create refresh token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"userId": user.ID,
		"exp":    time.Now().Add(time.Hour * 24).Unix(),
	})

	// Sign and get the complete encoded token as a string using the secret
	tokenString, err := token.SignedString([]byte(os.Getenv("REFRESH_JWT_SECRET")))

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error while signing token"})
		return
	}

	// Return the token
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie("token", tokenString, 86400, "/", "", false, true)

	// Return the success message
	c.JSON(http.StatusOK, gin.H{"message": "user logged in successfully"})
}

func Refresh(c *gin.Context) {
	// Get the cookie from the request
	cookie, _ := c.Cookie("token")

	// Parse the token
	claims := jwt.MapClaims{}
	_, err := jwt.ParseWithClaims(cookie, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(os.Getenv("REFRESH_JWT_SECRET")), nil
	})

	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	// Check Redis cache for unauthorized tokens
	_, err = initializers.RedisClient.Get(ctx, cookie).Result()

	if err != redis.Nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized token"})
		return
	}

	// check unauthorized tokens table
	var unauthorizedToken models.UnauthorizedToken
	initializers.DB.Where("token = ?", cookie).First(&unauthorizedToken)

	if unauthorizedToken.UserID != 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized token"})
		return
	}

	// Create access token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"userId": claims["userId"],
		"exp":    time.Now().Add(time.Minute * 15).Unix(),
	})

	// Sign and get the complete encoded token as a string using the secret
	tokenString, err := token.SignedString([]byte(os.Getenv("ACCESS_JWT_SECRET")))

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error while signing token"})
		return
	}

	// Return the access token
	c.JSON(http.StatusOK, gin.H{"access_token": tokenString})
}

func GetUser(c *gin.Context) {
	// Get the token from the request header
	token := c.GetHeader("Authorization")

	// Parse the token
	claims := jwt.MapClaims{}
	_, err := jwt.ParseWithClaims(token, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(os.Getenv("ACCESS_JWT_SECRET")), nil
	})

	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	// Get the user account from the database
	userId := claims["userId"].(float64)
	var user models.UserAccount
	initializers.DB.Where("id = ?", userId).First(&user)

	// Return the user account
	c.JSON(http.StatusOK, gin.H{"user": user})
}

func Logout(c *gin.Context) {
	// Get the cookie from the request
	cookie, _ := c.Cookie("token")

	// Get the user account from the database
	claims := jwt.MapClaims{}
	_, err := jwt.ParseWithClaims(cookie, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(os.Getenv("REFRESH_JWT_SECRET")), nil
	})

	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	userId := claims["userId"].(float64)
	var user models.UserAccount
	initializers.DB.Where("id = ?", userId).First(&user)

	// Store the token in the unauthorized tokens table
	unauthorizedToken := models.UnauthorizedToken{
		UserID:     user.ID,
		User:       user,
		Token:      cookie,
		Expiration: time.Now().Add(time.Hour * 24),
	}

	result := initializers.DB.Create(&unauthorizedToken)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error while logging out"})
		return
	}

	// Store the token in the redis cache
	redisClient := initializers.RedisClient
	redisClient.Set(ctx, cookie, "true", time.Hour*24)

	// Delete the cookie
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie("token", "", -1, "/", "", false, true)

	// Return the success message
	c.JSON(http.StatusOK, gin.H{"message": "user logged out successfully"})
}
