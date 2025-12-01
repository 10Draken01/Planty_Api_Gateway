package main

import (
	"context"
	"log"
	"math"
	"math/rand"
	"mongo-filler/db"
	"mongo-filler/models"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Base de datos de plantas según PlantGen (50 plantas para clima Af - Tropical)
var plantDatabase = []PlantInfo{
	// Aromáticas/Medicinales (14)
	{Name: "Cilantro", Scientific: "Coriandrum sativum", Type: models.Medicinal, Size: 0.15, WeeklyWater: 11, HarvestDays: 38, SunReq: models.Poca},
	{Name: "Epazote", Scientific: "Dysphania ambrosioides", Type: models.Medicinal, Size: 0.15, WeeklyWater: 9, HarvestDays: 45, SunReq: models.Poca},
	{Name: "Albahaca", Scientific: "Ocimum basilicum", Type: models.Medicinal, Size: 0.18, WeeklyWater: 18, HarvestDays: 40, SunReq: models.Mucha},
	{Name: "Hierbabuena", Scientific: "Mentha spicata", Type: models.Medicinal, Size: 0.12, WeeklyWater: 15, HarvestDays: 35, SunReq: models.Poca},
	{Name: "Orégano", Scientific: "Origanum vulgare", Type: models.Medicinal, Size: 0.20, WeeklyWater: 8, HarvestDays: 50, SunReq: models.Mucha},
	{Name: "Tomillo", Scientific: "Thymus vulgaris", Type: models.Medicinal, Size: 0.15, WeeklyWater: 7, HarvestDays: 45, SunReq: models.Mucha},
	{Name: "Romero", Scientific: "Rosmarinus officinalis", Type: models.Medicinal, Size: 0.25, WeeklyWater: 10, HarvestDays: 60, SunReq: models.Mucha},
	{Name: "Salvia", Scientific: "Salvia officinalis", Type: models.Medicinal, Size: 0.20, WeeklyWater: 9, HarvestDays: 55, SunReq: models.Mucha},
	{Name: "Toronjil Morado", Scientific: "Agastache mexicana", Type: models.Medicinal, Size: 0.18, WeeklyWater: 12, HarvestDays: 50, SunReq: models.Poca},
	{Name: "Estafiate", Scientific: "Artemisia ludoviciana", Type: models.Medicinal, Size: 0.22, WeeklyWater: 8, HarvestDays: 60, SunReq: models.Mucha},
	{Name: "Orégano Mexicano", Scientific: "Lippia graveolens", Type: models.Medicinal, Size: 0.20, WeeklyWater: 9, HarvestDays: 55, SunReq: models.Mucha},
	{Name: "Zacate Limón", Scientific: "Cymbopogon citratus", Type: models.Medicinal, Size: 0.30, WeeklyWater: 14, HarvestDays: 70, SunReq: models.Mucha},
	{Name: "Albahaca Morada", Scientific: "Ocimum basilicum purpurascens", Type: models.Medicinal, Size: 0.18, WeeklyWater: 18, HarvestDays: 42, SunReq: models.Mucha},
	{Name: "Orégano Cubano", Scientific: "Plectranthus amboinicus", Type: models.Medicinal, Size: 0.22, WeeklyWater: 11, HarvestDays: 50, SunReq: models.Poca},

	// Vegetales (22)
	{Name: "Bok Choy", Scientific: "Brassica rapa chinensis", Type: models.Alimenticia, Size: 0.20, WeeklyWater: 22, HarvestDays: 45, SunReq: models.Poca},
	{Name: "Tomate Cherry", Scientific: "Solanum lycopersicum", Type: models.Alimenticia, Size: 0.25, WeeklyWater: 20, HarvestDays: 65, SunReq: models.Mucha},
	{Name: "Berenjena", Scientific: "Solanum melongena", Type: models.Alimenticia, Size: 0.35, WeeklyWater: 25, HarvestDays: 80, SunReq: models.Mucha},
	{Name: "Amaranto", Scientific: "Amaranthus cruentus", Type: models.Alimenticia, Size: 0.30, WeeklyWater: 18, HarvestDays: 90, SunReq: models.Mucha},
	{Name: "Camote", Scientific: "Ipomoea batatas", Type: models.Alimenticia, Size: 0.40, WeeklyWater: 15, HarvestDays: 120, SunReq: models.Mucha},
	{Name: "Espinaca", Scientific: "Spinacia oleracea", Type: models.Alimenticia, Size: 0.15, WeeklyWater: 20, HarvestDays: 40, SunReq: models.Poca},
	{Name: "Rabanito", Scientific: "Raphanus sativus", Type: models.Alimenticia, Size: 0.10, WeeklyWater: 12, HarvestDays: 25, SunReq: models.Mucha},
	{Name: "Verdolaga", Scientific: "Portulaca oleracea", Type: models.Alimenticia, Size: 0.12, WeeklyWater: 8, HarvestDays: 30, SunReq: models.Mucha},
	{Name: "Pipicha", Scientific: "Porophyllum tagetoides", Type: models.Alimenticia, Size: 0.15, WeeklyWater: 10, HarvestDays: 35, SunReq: models.Poca},
	{Name: "Acelga", Scientific: "Beta vulgaris cicla", Type: models.Alimenticia, Size: 0.20, WeeklyWater: 22, HarvestDays: 50, SunReq: models.Poca},
	{Name: "Espinaca Nueva Zelanda", Scientific: "Tetragonia tetragonioides", Type: models.Alimenticia, Size: 0.25, WeeklyWater: 18, HarvestDays: 55, SunReq: models.Poca},
	{Name: "Perejil", Scientific: "Petroselinum crispum", Type: models.Alimenticia, Size: 0.12, WeeklyWater: 14, HarvestDays: 40, SunReq: models.Poca},
	{Name: "Hoja Santa", Scientific: "Piper auritum", Type: models.Alimenticia, Size: 0.35, WeeklyWater: 20, HarvestDays: 60, SunReq: models.Poca},
	{Name: "Pápalo", Scientific: "Porophyllum ruderale", Type: models.Alimenticia, Size: 0.15, WeeklyWater: 10, HarvestDays: 35, SunReq: models.Mucha},
	{Name: "Jengibre", Scientific: "Zingiber officinale", Type: models.Alimenticia, Size: 0.30, WeeklyWater: 16, HarvestDays: 180, SunReq: models.Poca},
	{Name: "Apio", Scientific: "Apium graveolens", Type: models.Alimenticia, Size: 0.18, WeeklyWater: 25, HarvestDays: 85, SunReq: models.Poca},
	{Name: "Citronela", Scientific: "Cymbopogon nardus", Type: models.Medicinal, Size: 0.28, WeeklyWater: 13, HarvestDays: 75, SunReq: models.Mucha},
	{Name: "Chile Jalapeño", Scientific: "Capsicum annuum", Type: models.Alimenticia, Size: 0.30, WeeklyWater: 20, HarvestDays: 75, SunReq: models.Mucha},
	{Name: "Calabacita", Scientific: "Cucurbita pepo", Type: models.Alimenticia, Size: 0.50, WeeklyWater: 28, HarvestDays: 55, SunReq: models.Mucha},
	{Name: "Lechuga Romana", Scientific: "Lactuca sativa", Type: models.Alimenticia, Size: 0.15, WeeklyWater: 18, HarvestDays: 45, SunReq: models.Poca},
	{Name: "Cebollín", Scientific: "Allium schoenoprasum", Type: models.Alimenticia, Size: 0.10, WeeklyWater: 12, HarvestDays: 30, SunReq: models.Mucha},
	{Name: "Zanahoria Baby", Scientific: "Daucus carota", Type: models.Alimenticia, Size: 0.12, WeeklyWater: 15, HarvestDays: 60, SunReq: models.Mucha},

	// Ornamentales (14)
	{Name: "Begonia", Scientific: "Begonia semperflorens", Type: models.Ornamental, Size: 0.20, WeeklyWater: 14, HarvestDays: 0, SunReq: models.Poca},
	{Name: "Lantana Enana", Scientific: "Lantana camara", Type: models.Ornamental, Size: 0.25, WeeklyWater: 12, HarvestDays: 0, SunReq: models.Mucha},
	{Name: "Torenia", Scientific: "Torenia fournieri", Type: models.Ornamental, Size: 0.15, WeeklyWater: 16, HarvestDays: 0, SunReq: models.Poca},
	{Name: "Flor de Muerto", Scientific: "Tagetes erecta", Type: models.Ornamental, Size: 0.20, WeeklyWater: 13, HarvestDays: 0, SunReq: models.Mucha},
	{Name: "Zinnia", Scientific: "Zinnia elegans", Type: models.Ornamental, Size: 0.18, WeeklyWater: 14, HarvestDays: 0, SunReq: models.Mucha},
	{Name: "Cole", Scientific: "Brassica oleracea acephala", Type: models.Decorativa, Size: 0.22, WeeklyWater: 15, HarvestDays: 0, SunReq: models.Poca},
	{Name: "Corazón de Jesús", Scientific: "Caladium bicolor", Type: models.Ornamental, Size: 0.25, WeeklyWater: 18, HarvestDays: 0, SunReq: models.Poca},
	{Name: "Llama del Bosque", Scientific: "Salvia splendens", Type: models.Ornamental, Size: 0.20, WeeklyWater: 14, HarvestDays: 0, SunReq: models.Mucha},
	{Name: "Alegría", Scientific: "Impatiens walleriana", Type: models.Ornamental, Size: 0.15, WeeklyWater: 20, HarvestDays: 0, SunReq: models.Poca},
	{Name: "Bromelia", Scientific: "Bromelia balansae", Type: models.Ornamental, Size: 0.28, WeeklyWater: 10, HarvestDays: 0, SunReq: models.Poca},
	{Name: "Vicaria", Scientific: "Catharanthus roseus", Type: models.Ornamental, Size: 0.18, WeeklyWater: 12, HarvestDays: 0, SunReq: models.Mucha},
	{Name: "Flor de Jamaica", Scientific: "Hibiscus sabdariffa", Type: models.Ornamental, Size: 0.35, WeeklyWater: 22, HarvestDays: 90, SunReq: models.Mucha},
	{Name: "Caléndula", Scientific: "Calendula officinalis", Type: models.Ornamental, Size: 0.20, WeeklyWater: 13, HarvestDays: 0, SunReq: models.Mucha},
	{Name: "Geranio", Scientific: "Pelargonium hortorum", Type: models.Ornamental, Size: 0.22, WeeklyWater: 14, HarvestDays: 0, SunReq: models.Mucha},
}

type PlantInfo struct {
	Name        string
	Scientific  string
	Type        models.PlantType
	Size        float64 // m²
	WeeklyWater int     // litros
	HarvestDays int
	SunReq      models.SunRequirementType
}

// Matriz de compatibilidad simplificada (valores entre -1 y 1)
var compatibilityMatrix = map[string]map[string]float64{
	"Cilantro":       {"Tomate Cherry": 1.0, "Albahaca": 1.0, "Perejil": -0.5, "Rabanito": 0.8},
	"Epazote":        {"Amaranto": 1.0, "Camote": 0.7, "Chile Jalapeño": 0.9},
	"Albahaca":       {"Tomate Cherry": 1.0, "Berenjena": 0.8, "Chile Jalapeño": 0.9, "Orégano": -0.3},
	"Tomate Cherry":  {"Albahaca": 1.0, "Cilantro": 1.0, "Zanahoria Baby": 0.7, "Cebollín": 0.8},
	"Hierbabuena":    {"Lechuga Romana": 0.6, "Espinaca": 0.5, "Tomate Cherry": -0.4},
	"Romero":         {"Salvia": 0.8, "Tomillo": 0.9, "Albahaca": -0.3},
	"Calabacita":     {"Rabanito": 0.7, "Cebollín": 0.6, "Tomate Cherry": -0.5},
	"Flor de Muerto": {"Tomate Cherry": 0.9, "Chile Jalapeño": 0.8}, // Repele plagas
	"Caléndula":      {"Tomate Cherry": 0.7, "Calabacita": 0.6},
}

func getCompatibility(plant1, plant2 string) float64 {
	if comp, exists := compatibilityMatrix[plant1]; exists {
		if val, ok := comp[plant2]; ok {
			return val
		}
	}
	if comp, exists := compatibilityMatrix[plant2]; exists {
		if val, ok := comp[plant1]; ok {
			return val
		}
	}
	return 0.0 // Neutral si no hay datos
}

// Calcula compatibilidad promedio del huerto
func calculateOrchardCompatibility(selectedPlants []PlantInfo) float64 {
	if len(selectedPlants) <= 1 {
		return 1.0
	}

	totalComp := 0.0
	pairs := 0

	for i := 0; i < len(selectedPlants); i++ {
		for j := i + 1; j < len(selectedPlants); j++ {
			comp := getCompatibility(selectedPlants[i].Name, selectedPlants[j].Name)
			totalComp += comp
			pairs++
		}
	}

	if pairs == 0 {
		return 0.5
	}

	// Normalizar a [0, 1]
	avgComp := totalComp / float64(pairs)
	return (avgComp + 1.0) / 2.0
}

// Genera huerto coherente con restricciones de PlantGen
func generateCoherentOrchard(orchardArea float64) []PlantInfo {
	maxAttempts := 50
	bestPlants := []PlantInfo{}
	bestScore := -1.0

	for attempt := 0; attempt < maxAttempts; attempt++ {
		selectedPlants := []PlantInfo{}
		usedArea := 0.0
		totalWater := 0.0

		// Objetivo: balancear tipos de plantas según pesos del AG
		// Alimenticio: 50% PSRNT, Medicinal: 45% PSRNT, Ornamental: 40% PSRNT
		targetFood := int(float64(10) * 0.50)
		targetMed := int(float64(10) * 0.30)
		targetOrn := int(float64(10) * 0.20)

		countFood := 0
		countMed := 0
		countOrn := 0

		// Shuffle plantas para variedad
		shuffled := make([]PlantInfo, len(plantDatabase))
		copy(shuffled, plantDatabase)
		rand.Shuffle(len(shuffled), func(i, j int) {
			shuffled[i], shuffled[j] = shuffled[j], shuffled[i]
		})

		for _, plant := range shuffled {
			// Restricción de espacio (max 85% según PlantGen)
			if usedArea+plant.Size > orchardArea*0.85 {
				continue
			}

			// Restricción de agua (clima Af: 80-200 L/semana)
			maxWater := 80.0 + rand.Float64()*120.0
			if totalWater+float64(plant.WeeklyWater) > maxWater {
				continue
			}

			// Balance de tipos
			canAdd := false
			switch plant.Type {
			case models.Alimenticia:
				if countFood < targetFood {
					canAdd = true
					countFood++
				}
			case models.Medicinal:
				if countMed < targetMed {
					canAdd = true
					countMed++
				}
			case models.Ornamental, models.Decorativa:
				if countOrn < targetOrn {
					canAdd = true
					countOrn++
				}
			}

			if !canAdd && len(selectedPlants) < 15 {
				// Permitir más plantas si hay espacio
				canAdd = rand.Float64() < 0.3
			}

			if canAdd {
				// Verificar compatibilidad con plantas existentes
				compatible := true
				for _, existing := range selectedPlants {
					comp := getCompatibility(plant.Name, existing.Name)
					if comp < -0.5 { // Evitar incompatibles severos
						compatible = false
						break
					}
				}

				if compatible {
					selectedPlants = append(selectedPlants, plant)
					usedArea += plant.Size
					totalWater += float64(plant.WeeklyWater)
				}
			}

			// Limitar número de plantas (5-20 según área)
			maxPlants := int(math.Min(20, math.Max(5, orchardArea*8)))
			if len(selectedPlants) >= maxPlants {
				break
			}
		}

		if len(selectedPlants) < 3 {
			continue
		}

		// Calcular score según función de aptitud PlantGen
		compatibility := calculateOrchardCompatibility(selectedPlants)
		spaceUtilization := usedArea / orchardArea
		waterEfficiency := 1.0 - (totalWater / 200.0) // Normalizado

		// Pesos para huerto balanceado (similar a "Sostenible")
		w1, w2, w3, w4 := 0.25, 0.30, 0.30, 0.15
		score := w1*compatibility + w2*0.7 + w3*waterEfficiency + w4*spaceUtilization

		if score > bestScore {
			bestScore = score
			bestPlants = selectedPlants
		}
	}

	return bestPlants
}

func main() {
	database, err := db.Connect()
	if err != nil {
		log.Fatal(err)
	}

	usersCol := database.Collection("users")
	orchardsCol := database.Collection("orchards")
	plantsCol := database.Collection("plants")
	timeUseCol := database.Collection("timeuse")

	rand.Seed(time.Now().UnixNano())

	const totalUsers = 100000
	log.Println("Generando usuarios con huertos coherentes según PlantGen AG...")

	now := time.Now()
	oneMonthAgo := now.AddDate(0, -1, 0)

	for i := 0; i < totalUsers; i++ {
		userID := primitive.NewObjectID()
		userCreatedAt := randomTimeBetween(oneMonthAgo, now)

		user := models.User{
			ID:               userID,
			Name:             randomName(),
			Email:            randomEmail(),
			Password:         "hashedPassword123",
			OrchardsID:       []string{},
			CountOrchards:    0,
			ExperienceLevel:  rand.Intn(10),
			ProfilePhoto:     "",
			CreatedAt:        userCreatedAt,
			HistoryTimeUseID: []string{},
		}

		// Crear huertos (0-4)
		orchardCount := rand.Intn(3)
		for j := 0; j < orchardCount; j++ {
			orchID := primitive.NewObjectID()
			orchardCreatedAt := randomTimeBetween(userCreatedAt, now)

			// Área del huerto (1-5 m² según PlantGen)
			orchardArea := 1.0 + rand.Float64()*4.0

			orchard := models.Orchard{
				ID:           orchID,
				Name:         randomOrchardName(),
				Description:  "Huerto optimizado con PlantGen AG",
				PlantsId:     []string{},
				Width:        math.Sqrt(orchardArea),
				Height:       math.Sqrt(orchardArea),
				State:        true,
				CreatedAt:    orchardCreatedAt,
				UpdatedAt:    now,
				TimeOfLife:   int(now.Sub(orchardCreatedAt).Hours() / 24),
				StreakOfDays: rand.Intn(50),
				CountPlants:  0,
			}

			// Generar plantas coherentes
			coherentPlants := generateCoherentOrchard(orchardArea)

			for _, plantInfo := range coherentPlants {
				plantID := primitive.NewObjectID()
				plant := models.Plant{
					ID:             plantID,
					Name:           plantInfo.Name,
					Species:        plantInfo.Name,
					ScientificName: plantInfo.Scientific,
					Type:           plantInfo.Type,
					SunRequirement: plantInfo.SunReq,
					WeeklyWatering: plantInfo.WeeklyWater,
					HarvestDays:    plantInfo.HarvestDays,
					SoilType:       "Suelo fértil, bien drenado, pH 6.0-7.0",
					WaterPerKg:     plantInfo.WeeklyWater * 20,
					Benefits:       generateBenefits(plantInfo.Type),
					Size:           int(plantInfo.Size * 100), // cm²
					Notes:          "Adaptada a clima tropical Af (Chiapas)",
					Tags:           []string{"chiapas", "tropical", "plantgen"},
				}

				_, err := plantsCol.InsertOne(context.Background(), plant)
				if err != nil {
					log.Println("Error insertando planta:", err)
				}

				orchard.PlantsId = append(orchard.PlantsId, plantID.Hex())
				orchard.CountPlants++
			}

			_, err := orchardsCol.InsertOne(context.Background(), orchard)
			if err != nil {
				log.Println("Error insertando huerto:", err)
			}

			user.OrchardsID = append(user.OrchardsID, orchID.Hex())
			user.CountOrchards++
		}

		// TimeUse
		timeUses := rand.Intn(5)
		for t := 0; t < timeUses; t++ {
			maxHoursAgo := int(now.Sub(userCreatedAt).Hours())
			if maxHoursAgo > 0 {
				start := now.Add(time.Duration(-rand.Intn(maxHoursAgo)) * time.Hour)
				end := start.Add(time.Duration(rand.Intn(5)+1) * time.Hour)

				timeUse := models.TimeUse{
					ID:         primitive.NewObjectID(),
					TimeInit:   start,
					TimeFinal:  end,
					TotalHours: end.Sub(start).Hours(),
				}

				_, err := timeUseCol.InsertOne(context.Background(), timeUse)
				if err != nil {
					log.Println("Error insertando timeUse:", err)
				}

				user.HistoryTimeUseID = append(user.HistoryTimeUseID, timeUse.ID.Hex())
			}
		}

		_, err = usersCol.InsertOne(context.Background(), user)
		if err != nil {
			log.Println("Error insertando usuario:", err)
		}

		if i%5000 == 0 {
			log.Printf("%d usuarios generados...\n", i)
		}
	}

	log.Println("Seed completado con huertos coherentes según PlantGen AG!")
}

func generateBenefits(plantType models.PlantType) []string {
	switch plantType {
	case models.Medicinal:
		return []string{"Propiedades medicinales", "Antioxidantes", "Ayuda digestión"}
	case models.Alimenticia:
		return []string{"Alto valor nutricional", "Rico en vitaminas", "Fuente de fibra"}
	case models.Ornamental, models.Decorativa:
		return []string{"Embellece el espacio", "Atrae polinizadores", "Mejora ambiente"}
	default:
		return []string{"Beneficios generales"}
	}
}

func randomTimeBetween(start, end time.Time) time.Time {
	delta := end.Unix() - start.Unix()
	if delta <= 0 {
		return start
	}
	sec := rand.Int63n(delta)
	return start.Add(time.Duration(sec) * time.Second)
}

func randomName() string {
	names := []string{
		"Carlos", "Ana", "Pedro", "Lucía", "Miguel", "Rosa", "Eduardo", "Valeria",
		"Jorge", "Sofía", "Hugo", "Fernanda", "Leonardo", "Rebeca", "Santiago", "Elena",
	}
	last := []string{
		"García", "Hernández", "Martínez", "López", "Ramírez", "Flores", "Torres", "Silva",
	}
	return names[rand.Intn(len(names))] + " " + last[rand.Intn(len(last))]
}

func randomEmail() string {
	domains := []string{"gmail.com", "outlook.com", "yahoo.com"}
	return randomString(8) + "@" + domains[rand.Intn(len(domains))]
}

func randomString(n int) string {
	letters := []rune("abcdefghijklmnopqrstuvwxyz0123456789")
	s := make([]rune, n)
	for i := range s {
		s[i] = letters[rand.Intn(len(letters))]
	}
	return string(s)
}

func randomOrchardName() string {
	names := []string{
		"Huerto Sol", "Green Patch", "Mi Jardín", "La Parcela", "EcoHuerto",
		"Huerto Aurora", "Campo Sereno", "Raíz Viva", "Tierra Noble", "Valle Vivo",
	}
	return names[rand.Intn(len(names))]
}
