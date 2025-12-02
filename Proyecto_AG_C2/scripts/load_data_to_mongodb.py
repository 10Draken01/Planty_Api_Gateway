"""
Script para cargar datos JSON a MongoDB.
Carga las colecciones Plants y Matriz desde archivos JSON.
"""
import os
import sys
import json
import asyncio
from pathlib import Path
from pymongo import MongoClient
from dotenv import load_dotenv

# Agregar el directorio raíz al path
root_dir = Path(__file__).parent.parent
sys.path.insert(0, str(root_dir))

# Cargar variables de entorno
load_dotenv(root_dir / ".env")


def load_json_file(file_path: str) -> dict | list:
    """Carga un archivo JSON"""
    with open(file_path, 'r', encoding='utf-8') as file:
        return json.load(file)


def transform_compatibility_matrix(matrix_data: dict) -> list:
    """
    Transforma la matriz de compatibilidad de formato anidado a lista de pares.

    Entrada: {"Cilantro": {"Epazote": 0.5, ...}, ...}
    Salida: [{"plant1": "Cilantro", "plant2": "Epazote", "compatibility": 0.5}, ...]
    """
    pairs = []

    for plant1, compatibilities in matrix_data.items():
        for plant2, compatibility_value in compatibilities.items():
            # Evitar duplicados (solo agregar si plant1 <= plant2 alfabéticamente)
            if plant1 <= plant2:
                pairs.append({
                    "plant1": plant1,
                    "plant2": plant2,
                    "compatibility": compatibility_value
                })

    return pairs


def main():
    """Función principal del script"""
    print("=" * 60)
    print("  Script de Carga de Datos a MongoDB - PlantGen")
    print("=" * 60)

    # 1. Leer configuración de MongoDB
    mongo_user = os.getenv("MONGO_ROOT_USER", "admin")
    mongo_password = os.getenv("MONGO_ROOT_PASSWORD", "TuPassword123!")
    mongo_host = os.getenv("MONGO_HOST", "localhost")
    mongo_port = os.getenv("MONGO_PORT", "27017")
    mongo_db = os.getenv("MONGO_DATABASE", "Data_plants")

    print(f"\n📊 Configuración MongoDB:")
    print(f"  - Host: {mongo_host}:{mongo_port}")
    print(f"  - Usuario: {mongo_user}")
    print(f"  - Base de datos: {mongo_db}")

    # 2. Conectar a MongoDB
    # Si no hay usuario/password, conectar sin autenticación (para desarrollo local)
    if not mongo_user or mongo_user == "none":
        mongo_uri = f"mongodb://{mongo_host}:{mongo_port}/"
        print("  ⚠️  Modo: Sin autenticación (desarrollo local)")
    else:
        mongo_uri = f"mongodb://{mongo_user}:{mongo_password}@{mongo_host}:{mongo_port}/?authSource=admin"
        print("  🔒 Modo: Con autenticación")

    try:
        print(f"\n🔌 Conectando a MongoDB...")
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
        client.admin.command('ping')
        print("✓ Conexión exitosa")
    except Exception as e:
        print(f"✗ Error al conectar: {e}")
        print("\n⚠️  Asegúrate de que MongoDB esté corriendo:")
        if mongo_user and mongo_user != "none":
            print("   docker run -d -p 27017:27017 --name mongodb \\")
            print(f"     -e MONGO_INITDB_ROOT_USERNAME={mongo_user} \\")
            print(f"     -e MONGO_INITDB_ROOT_PASSWORD={mongo_password} \\")
            print("     mongo:latest")
        else:
            print("   mongod --dbpath /data/db")
            print("   o verifica que tu MongoDB local esté corriendo")
        sys.exit(1)

    db = client[mongo_db]

    # 3. Cargar datos de plantas
    plants_file = root_dir / "data" / "plants_with_id.json"
    print(f"\n📁 Cargando plantas desde: {plants_file}")

    if not plants_file.exists():
        print(f"✗ Archivo no encontrado: {plants_file}")
        sys.exit(1)

    plants_data = load_json_file(plants_file)
    print(f"✓ Se cargaron {len(plants_data)} plantas")

    # 4. Insertar plantas en colección Plants
    plants_collection = db["Plants"]

    # Limpiar colección existente
    result = plants_collection.delete_many({})
    print(f"  - Se eliminaron {result.deleted_count} documentos existentes")

    # Insertar nuevos datos
    result = plants_collection.insert_many(plants_data)
    print(f"✓ Se insertaron {len(result.inserted_ids)} plantas en colección 'Plants'")

    # Crear índices
    plants_collection.create_index("id", unique=True)
    plants_collection.create_index("species", unique=True)
    print("✓ Índices creados: id (único), species (único)")

    # 5. Cargar matriz de compatibilidad
    matrix_file = root_dir / "data" / "matriz_compatibilities.json"
    print(f"\n📁 Cargando matriz de compatibilidad desde: {matrix_file}")

    if not matrix_file.exists():
        print(f"✗ Archivo no encontrado: {matrix_file}")
        sys.exit(1)

    matrix_data = load_json_file(matrix_file)
    print(f"✓ Se cargó matriz con {len(matrix_data)} plantas")

    # 6. Transformar matriz a pares
    print("\n🔄 Transformando matriz a pares...")
    pairs = transform_compatibility_matrix(matrix_data)
    print(f"✓ Se generaron {len(pairs)} pares de compatibilidad")

    # 7. Insertar pares en colección Matriz
    matriz_collection = db["Matriz"]

    # Limpiar colección existente
    result = matriz_collection.delete_many({})
    print(f"  - Se eliminaron {result.deleted_count} documentos existentes")

    # Insertar nuevos datos
    result = matriz_collection.insert_many(pairs)
    print(f"✓ Se insertaron {len(result.inserted_ids)} pares en colección 'Matriz'")

    # Crear índices compuestos para búsquedas eficientes
    matriz_collection.create_index([("plant1", 1), ("plant2", 1)], unique=True)
    matriz_collection.create_index("plant1")
    matriz_collection.create_index("plant2")
    print("✓ Índices creados: (plant1, plant2) único, plant1, plant2")

    # 8. Verificación final
    print("\n✅ Verificación final:")
    plants_count = plants_collection.count_documents({})
    matriz_count = matriz_collection.count_documents({})

    print(f"  - Colección 'Plants': {plants_count} documentos")
    print(f"  - Colección 'Matriz': {matriz_count} documentos")

    # Mostrar ejemplos
    print("\n📋 Ejemplo de planta:")
    example_plant = plants_collection.find_one({"id": 1})
    if example_plant:
        print(f"  ID: {example_plant['id']}")
        print(f"  Especie: {example_plant['species']}")
        print(f"  Nombre científico: {example_plant['scientificName']}")
        print(f"  Tipos: {', '.join(example_plant['type'])}")

    print("\n📋 Ejemplo de par de compatibilidad:")
    example_pair = matriz_collection.find_one({})
    if example_pair:
        print(f"  {example_pair['plant1']} + {example_pair['plant2']}: {example_pair['compatibility']}")

    print("\n" + "=" * 60)
    print("✅ Carga de datos completada exitosamente")
    print("=" * 60)

    client.close()


if __name__ == "__main__":
    main()
