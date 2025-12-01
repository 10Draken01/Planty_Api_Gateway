package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Orchard struct {
	ID           primitive.ObjectID `bson:"_id,omitempty"`
	Name         string             `bson:"name"`
	Description  string             `bson:"description"`
	PlantsId     []string           `bson:"plants_id"`
	Width        float64            `bson:"width"`
	Height       float64            `bson:"height"`
	State        bool               `bson:"state"`
	CreatedAt    time.Time          `bson:"createAt"`
	UpdatedAt    time.Time          `bson:"updatedAt"`
	TimeOfLife   int                `bson:"timeOfLife"`
	StreakOfDays int                `bson:"streakOfDays"`
	CountPlants  int                `bson:"countPlants"`
}
