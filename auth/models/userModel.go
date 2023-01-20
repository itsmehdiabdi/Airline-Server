package models

type UserAccount struct {
	ID           int64  `json:"id" gorm:"primary_key;auto_increment;not_null"`
	Email        string `json:"email" gorm:"unique;not null;default:null;uniqueIndex"`
	PhoneNumber  string `json:"phoneNumber" gorm:"unique;not null;default:null;uniqueIndex"`
	Male         bool   `json:"male" gorm:"type:bool"`
	FirstName    string `json:"firstName"`
	LastName     string `json:"lastName"`
	PasswordHash string `json:"-"`
}
