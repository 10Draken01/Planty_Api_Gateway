/**
 * Script para poblar la base de datos con las plantas iniciales
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const MONGO_URI = 'mongodb://localhost:27017';
const DB_NAME = 'planty_plants';
const COLLECTION_NAME = 'plants';

// Ruta al archivo JSON con los datos de las plantas
const PLANTS_DATA_PATH = path.join(__dirname, '..', '..', 'Proyecto_AG_C2', 'data', 'plants_with_id.json');

async function seedDatabase() {
  let client = null;

  try {
    console.log('🌱 Iniciando proceso de seed de la base de datos...\n');

    // 1. Conectar a MongoDB
    console.log('📡 Conectando a MongoDB...');
    client = new MongoClient(MONGO_URI);
    await client.connect();
    console.log('✓ Conectado a MongoDB\n');

    // 2. Obtener la base de datos y colección
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // 3. Limpiar colección existente
    console.log('🧹 Limpiando colección existente...');
    await collection.deleteMany({});
    console.log('✓ Colección limpiada\n');

    // 4. Leer datos del archivo JSON
    console.log('📖 Leyendo datos de plantas...');
    const rawData = fs.readFileSync(PLANTS_DATA_PATH, 'utf-8');
    const plantsData = JSON.parse(rawData);
    console.log(`✓ ${plantsData.length} plantas encontradas\n`);

    // 5. Transformar datos (cambiar 'id' a '_id')
    console.log('🔄 Transformando datos...');
    const transformedPlants = plantsData.map(plant => ({
      _id: plant.id,
      species: plant.species,
      scientificName: plant.scientificName,
      type: plant.type,
      sunRequirement: plant.sunRequirement,
      weeklyWatering: plant.weeklyWatering,
      harvestDays: plant.harvestDays,
      soilType: plant.soilType,
      waterPerKg: plant.waterPerKg,
      benefits: plant.benefits,
      size: plant.size
    }));
    console.log('✓ Datos transformados\n');

    // 6. Insertar datos en la base de datos
    console.log('💾 Insertando plantas en la base de datos...');
    const result = await collection.insertMany(transformedPlants);
    console.log(`✓ ${result.insertedCount} plantas insertadas exitosamente\n`);

    // 7. Verificar inserción
    console.log('🔍 Verificando inserción...');
    const count = await collection.countDocuments();
    console.log(`✓ Total de plantas en la base de datos: ${count}\n`);

    // 8. Mostrar algunas estadísticas
    console.log('📊 Estadísticas:');
    const aromatic = await collection.countDocuments({ type: 'aromatic' });
    const medicinal = await collection.countDocuments({ type: 'medicinal' });
    const vegetable = await collection.countDocuments({ type: 'vegetable' });
    const ornamental = await collection.countDocuments({ type: 'ornamental' });

    console.log(`   - Aromáticas: ${aromatic}`);
    console.log(`   - Medicinales: ${medicinal}`);
    console.log(`   - Vegetales: ${vegetable}`);
    console.log(`   - Ornamentales: ${ornamental}`);

    console.log('\n✅ Seed completado exitosamente!');
    console.log('🚀 Ahora puedes consultar las plantas en: GET http://localhost:3005/plants\n');

  } catch (error) {
    console.error('\n❌ Error durante el seed:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Conexión cerrada');
    }
  }
}

// Ejecutar el script
seedDatabase();
