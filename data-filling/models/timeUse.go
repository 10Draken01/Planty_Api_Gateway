package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type TimeUse struct {
	ID         primitive.ObjectID `bson:"_id,omitempty"`
	TimeInit   time.Time          `bson:"time_init"`
	TimeFinal  time.Time          `bson:"time_final"`
	TotalHours float64            `bson:"total_hours"`
}
