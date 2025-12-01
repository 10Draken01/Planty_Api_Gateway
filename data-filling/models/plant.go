package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type PlantType string

const (
	Ornamental  PlantType = "ornamental"
	Medicinal   PlantType = "medicinal"
	Alimenticia PlantType = "alimenticia"
	Decorativa  PlantType = "decorativa"
)

type SunRequirementType string

const (
	Poca  SunRequirementType = "poca"
	Mucha SunRequirementType = "mucha"
)

type Plant struct {
	ID             primitive.ObjectID `bson:"_id,omitempty"`
	Name           string             `bson:"name"`
	Species        string             `bson:"species"`
	ScientificName string             `bson:"scientificName"`
	Type           PlantType          `bson:"type"`
	SunRequirement SunRequirementType `bson:"sunRequirement"`
	WeeklyWatering int                `bson:"weeklyWatering"`
	HarvestDays    int                `bson:"harvestDays"`
	SoilType       string             `bson:"soildType"`
	WaterPerKg     int                `bson:"waterPerKg"`
	Benefits       []string           `bson:"benefits"`
	Size           int                `bson:"size"`
	Notes          string             `bson:"notes"`
	Tags           []string           `bson:"tags"`
}
