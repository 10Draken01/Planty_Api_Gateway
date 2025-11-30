"""
Script de migración de esquema MongoDB para PlantGen Recommender.

Cambios:
1. Elimina orchards_id de users (con backup)
2. Añade userId a orchards
3. Añade max_orchards: 3 a users
4. Crea índices optimizados
"""
import pymongo
from datetime import datetime
import sys

# Configuración
MONGO_URI = "mongodb://admin:password123@localhost:27017/plantgen?authSource=admin"
DB_NAME = "plantgen"

def main():
    print("🔄 PlantGen Schema Migration")
    print("=" * 50)

    # Conectar a MongoDB
    try:
        client = pymongo.MongoClient(MONGO_URI)
        db = client[DB_NAME]
        print(f"✅ Connected to MongoDB: {DB_NAME}\n")
    except Exception as e:
        print(f"❌ Failed to connect to MongoDB: {e}")
        sys.exit(1)

    users_collection = db['users']
    orchards_collection = db['orchards']
    backup_collection = db['users_backup']

    # ===== 1. BACKUP DE USERS =====
    print("Step 1: Creating backup of users collection...")
    try:
        users_count = users_collection.count_documents({})
        backup_collection.delete_many({})  # Limpiar backup anterior

        if users_count > 0:
            users_data = list(users_collection.find({}))
            backup_collection.insert_many(users_data)
            print(f"✅ Backed up {users_count} users to 'users_backup'\n")
        else:
            print("⚠️  No users found to backup\n")
    except Exception as e:
        print(f"❌ Backup failed: {e}")
        sys.exit(1)

    # ===== 2. MIGRAR ORCHARDS: AÑADIR userId =====
    print("Step 2: Adding userId to orchards...")
    try:
        # Obtener mapeo user._id -> orchards_id
        users_with_orchards = users_collection.find(
            {"orchards_id": {"$exists": True, "$ne": []}},
            {"_id": 1, "orchards_id": 1}
        )

        orchards_updated = 0
        for user in users_with_orchards:
            user_id = str(user['_id'])
            orchard_ids = user.get('orchards_id', [])

            for orchard_id in orchard_ids:
                result = orchards_collection.update_one(
                    {"_id": orchard_id},
                    {"$set": {"userId": user_id}}
                )
                if result.modified_count > 0:
                    orchards_updated += 1

        print(f"✅ Updated {orchards_updated} orchards with userId\n")
    except Exception as e:
        print(f"❌ Failed to update orchards: {e}")
        sys.exit(1)

    # ===== 3. REMOVER orchards_id DE USERS =====
    print("Step 3: Removing orchards_id from users...")
    try:
        result = users_collection.update_many(
            {"orchards_id": {"$exists": True}},
            {"$unset": {"orchards_id": ""}}
        )
        print(f"✅ Removed orchards_id from {result.modified_count} users\n")
    except Exception as e:
        print(f"❌ Failed to remove orchards_id: {e}")
        sys.exit(1)

    # ===== 4. AÑADIR max_orchards A USERS =====
    print("Step 4: Adding max_orchards to users...")
    try:
        result = users_collection.update_many(
            {"max_orchards": {"$exists": False}},
            {"$set": {"max_orchards": 3}}
        )
        print(f"✅ Added max_orchards to {result.modified_count} users\n")
    except Exception as e:
        print(f"❌ Failed to add max_orchards: {e}")
        sys.exit(1)

    # ===== 5. CREAR ÍNDICES =====
    print("Step 5: Creating optimized indexes...")
    try:
        # Índices en users
        users_collection.create_index("email", unique=True)
        users_collection.create_index("experience_level")
        users_collection.create_index("cluster_id")  # Para recommender

        # Índices en orchards
        orchards_collection.create_index("userId")
        orchards_collection.create_index([("userId", 1), ("state", 1)])

        print("✅ Indexes created successfully\n")
    except Exception as e:
        print(f"⚠️  Some indexes may already exist: {e}\n")

    # ===== 6. SUMMARY =====
    print("=" * 50)
    print("Migration Summary:")
    print(f"  - Users backed up: {users_count}")
    print(f"  - Orchards updated: {orchards_updated}")
    print(f"  - Users migrated: {result.modified_count}")
    print(f"  - Timestamp: {datetime.now().isoformat()}")
    print("\n✅ Migration completed successfully!")
    print("\nNote: Backup saved in 'users_backup' collection")

    client.close()


if __name__ == "__main__":
    main()
