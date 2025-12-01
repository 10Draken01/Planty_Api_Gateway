package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type User struct {
	ID               primitive.ObjectID `bson:"_id,omitempty"`
	Name             string             `bson:"name"`
	Email            string             `bson:"email"`
	Password         string             `bson:"password"`
	OrchardsID       []string           `bson:"orchards_id"`
	CountOrchards    int                `bson:"count_orchards"`
	ExperienceLevel  int                `bson:"experience_level"`
	ProfilePhoto     string             `bson:"profile_photo"`
	CreatedAt        time.Time          `bson:"createdAt"`
	HistoryTimeUseID []string           `bson:"historyTimeUse_ids"`
}
