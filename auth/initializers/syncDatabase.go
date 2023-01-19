package initializers

import "auth/models"

func SyncDatabase() {
	DB.AutoMigrate(&models.UserAccount{})
	DB.AutoMigrate(&models.UnauthorizedToken{})
}
