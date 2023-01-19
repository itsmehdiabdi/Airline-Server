package models

type UserAccount struct {
	ID           int64  `gorm:"primary_key;auto_increment;not_null"`
	Email        string `gorm:"unique;not null;default:null;uniqueIndex"`
	PhoneNumber  string `gorm:"unique;not null;default:null;uniqueIndex"`
	Male         bool   `gorm:"type:bool"`
	FirstName    string
	LastName     string
	PasswordHash string
}
