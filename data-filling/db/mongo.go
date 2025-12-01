package db

import (
	"context"
	"log"
	"os"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var Client *mongo.Client

func Connect() (*mongo.Database, error) {
	uri := os.Getenv("MONGO_URI")
	dbName := os.Getenv("MONGO_DB")

	if uri == "" {
		uri = "mongodb://localhost:27017"
	}
	if dbName == "" {
		dbName = "testdb"
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri))
	if err != nil {
		return nil, err
	}

	if err := client.Ping(ctx, nil); err != nil {
		return nil, err
	}

	Client = client
	log.Println("Mongo db conectado")
	db := client.Database(dbName)
	return db, nil
}

func Disconnect() {
	if Client == nil {
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := Client.Disconnect(ctx); err != nil {
		log.Println("Error al desconectar Mongo:", err)
	}

	log.Println("MongoDB desconectado")
}
