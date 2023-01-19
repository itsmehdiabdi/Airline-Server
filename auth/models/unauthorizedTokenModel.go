package models

import (
	"time"
)

type UnauthorizedToken struct {
	UserID     int64 `gorm:"foreignKey:;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;"`
	User       UserAccount
	Token      string `gorm:"index;unique"`
	Expiration time.Time
}
