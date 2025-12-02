/**
 * Generador masivo de 100,000 usuarios y huertos para PlantGen.
 *
 * Uso:
 *   npm run generate -- --count 1000 --concurrency 50
 *   npm run generate -- --count 100000 --concurrency 200 --resume checkpoint.json
 */
import { faker } from '@faker-js/faker';
import axios, { AxiosError } from 'axios';
import bcrypt from 'bcrypt';
import fs from 'fs';
import cliProgress from 'cli-progress';
import colors from 'colors';
import PQueue from 'p-queue';

// Configuración
const AG_SERVICE_URL = process.env.AG_SERVICE_URL || 'http://localhost:3005/v1';
const USERS_SERVICE_URL = process.env.USERS_SERVICE_URL || 'http://localhost:3001/api/create';
const ORCHARDS_SERVICE_URL = process.env.ORCHARDS_SERVICE_URL || 'http://localhost:3004/orchards';

const SALT_ROUNDS = 12;

interface GenerationConfig {
  count: number;
  concurrency: number;
  batchSize: number;
  resumeFile?: string;
}

interface Checkpoint {
  completed: number;
  failed: number;
  userIds: string[];
  timestamp: string;
}

interface UserData {
  name: string;
  email: string;
  password: string;
  experience_level: 1 | 2 | 3 | 4;
  profile_image?: string;
  historyTimeUse_ids: string[];
  count_orchards: number;
}

interface OrchardData {
  name: string;
  description: string;
  width: number;
  height: number;
  plants_id?: string[];
  state?: boolean;
}

/**
 * Genera datos de un usuario aleatorio.
 */
function generateUserData(): UserData {
  // Distribución de experiencia: 30% principiante, 50% intermedio, 15% avanzado, 5% experto
  const experienceRoll = Math.random();
  let experience_level: 1 | 2 | 3 | 4;
  if (experienceRoll < 0.3) experience_level = 1;
  else if (experienceRoll < 0.8) experience_level = 2;
  else if (experienceRoll < 0.95) experience_level = 3;
  else experience_level = 4;

  // 70% tiene profile_image
  const profile_image = Math.random() < 0.7 ? faker.image.avatar() : undefined;

  // Generar historial de uso en el mes anterior (últimos 30 días)
  const historyTimeUse_ids: string[] = [];
  const today = new Date();
  const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  // 60% de usuarios tienen historial de uso
  if (Math.random() < 0.6) {
    // Generar entre 1 y 15 fechas de uso
    const usageCount = Math.floor(Math.random() * 15) + 1;
    for (let i = 0; i < usageCount; i++) {
      const randomDate = faker.date.between({ from: lastMonth, to: today });
      historyTimeUse_ids.push(randomDate.toISOString());
    }
  }

  // 30% sin huertos, 40% con 1, 20% con 2, 10% con 3
  const orchardRoll = Math.random();
  let count_orchards: number;
  if (orchardRoll < 0.3) count_orchards = 0;
  else if (orchardRoll < 0.7) count_orchards = 1;
  else if (orchardRoll < 0.9) count_orchards = 2;
  else count_orchards = 3;

  return {
    name: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
    password: faker.internet.password({ length: 12 }),
    experience_level,
    profile_image,
    historyTimeUse_ids,
    count_orchards,
  };
}

/**
 * Genera parámetros para llamar al AG Service.
 */
function generateAGParams(userExperience: number) {
  const objectives: ('alimenticio' | 'medicinal' | 'sostenible' | 'ornamental')[] = [
    'alimenticio',
    'medicinal',
    'sostenible',
    'ornamental',
  ];

  const width = 1 + Math.random() * 4; // 1-5 m
  const height = 1 + Math.random() * 3; // 1-4 m

  // Generar distribución aleatoria que sume exactamente 100
  // Primero generamos 3 valores aleatorios entre 0-100
  const rand1 = Math.random() * 100;
  const rand2 = Math.random() * 100;
  const rand3 = Math.random() * 100;
  const total = rand1 + rand2 + rand3;

  // Normalizamos para que los primeros 3 sumen entre 70-90 (dejando 10-30 para el cuarto)
  const targetSum = 70 + Math.random() * 20;
  const vegetable = Math.floor((rand1 / total) * targetSum);
  const medicinal = Math.floor((rand2 / total) * targetSum);
  const ornamental = Math.floor((rand3 / total) * targetSum);

  // El cuarto valor se calcula para que sume exactamente 100
  const aromatic = 100 - vegetable - medicinal - ornamental;

  return {
    userExperience,
    dimensions: { width, height },
    waterLimit: width * height * (50 + Math.random() * 30), // 50-80 L/m²/semana
    objective: objectives[Math.floor(Math.random() * objectives.length)],
    categoryDistribution: {
      vegetable,
      medicinal,
      ornamental,
      aromatic,
    },
    location: {
      lat: 14 + Math.random() * 6, // Chiapas region
      lon: -95 + Math.random() * 4,
    },
  };
}

/**
 * Crea un usuario en el sistema.
 */
async function createUser(userData: UserData): Promise<string> {
  const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);

  const response = await axios.post(USERS_SERVICE_URL, {
    name: userData.name,
    email: userData.email,
    password: hashedPassword,
    experience_level: userData.experience_level,
    profile_image: userData.profile_image,
    historyTimeUse_ids: userData.historyTimeUse_ids,
  });

  const userId = response.data.data?.id || response.data.data?._id || response.data.id;

  if (!userId) {
    throw new Error(`Failed to get user ID from response: ${JSON.stringify(response.data)}`);
  }

  return userId;
}

/**
 * Llama al AG Service para generar un huerto.
 */
async function generateOrchardFromAG(userExperience: number): Promise<any> {
  const params = generateAGParams(userExperience);

  const response = await axios.post(`${AG_SERVICE_URL}/generate`, params);

  if (!response.data.success || !response.data.solutions || response.data.solutions.length === 0) {
    throw new Error('AG Service returned no solutions');
  }

  return response.data.solutions[0]; // Usar la mejor solución
}

/**
 * Crea un orchard en el sistema y retorna su ID.
 */
async function createOrchard(agSolution: any): Promise<string> {
  const layout = agSolution.layout;

  const orchardData: OrchardData = {
    name: `Huerto ${faker.word.adjective()} ${faker.word.noun()}`.substring(0, 50),
    description: `Huerto generado con AG - ${layout.totalPlants} plantas en ${layout.dimensions.width.toFixed(1)}x${layout.dimensions.height.toFixed(1)}m`,
    width: layout.dimensions.width,
    height: layout.dimensions.height,
    plants_id: layout.plants.map((p: any) => p.plantId.toString()),
    state: true,
  };

  const response = await axios.post(ORCHARDS_SERVICE_URL, orchardData);

  const orchardId = response.data.data?._id || response.data._id;

  if (!orchardId) {
    throw new Error(`Failed to get orchard ID from response: ${JSON.stringify(response.data)}`);
  }

  return orchardId;
}

/**
 * Actualiza el usuario para agregar IDs de huertos.
 */
async function updateUserOrchards(userId: string, orchardIds: string[]): Promise<void> {
  const updateUrl = USERS_SERVICE_URL.replace('/create', `/${userId}`);
  await axios.put(updateUrl, { orchards_id: orchardIds });
}

/**
 * Pequeño delay para evitar rate limiting
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Procesa un usuario: crea usuario y sus orchards.
 */
async function processUser(): Promise<void> {
  const userData = generateUserData();

  // Crear usuario
  const userId = await createUser(userData);

  // Delay entre operaciones para evitar rate limiting
  await delay(300);

  // Crear orchards y recolectar sus IDs
  const orchardIds: string[] = [];
  for (let i = 0; i < userData.count_orchards; i++) {
    // El AG Service solo acepta niveles 1-3, mapear nivel 4 a 3
    const agExperience = userData.experience_level > 3 ? 3 : userData.experience_level;
    const agSolution = await generateOrchardFromAG(agExperience);
    await delay(300); // Delay entre llamadas al AG

    const orchardId = await createOrchard(agSolution);
    orchardIds.push(orchardId);
    await delay(300); // Delay entre creaciones de orchards
  }

  // Actualizar usuario con los IDs de los huertos si creó alguno
  if (orchardIds.length > 0) {
    await updateUserOrchards(userId, orchardIds);
  }
}

/**
 * Guarda checkpoint de progreso.
 */
function saveCheckpoint(checkpoint: Checkpoint, filename: string) {
  fs.writeFileSync(filename, JSON.stringify(checkpoint, null, 2));
}

/**
 * Carga checkpoint de progreso.
 */
function loadCheckpoint(filename: string): Checkpoint | null {
  if (!fs.existsSync(filename)) return null;
  return JSON.parse(fs.readFileSync(filename, 'utf-8'));
}

/**
 * Main - Genera N usuarios con concurrencia controlada.
 */
async function main() {
  const args = process.argv.slice(2);
  const config: GenerationConfig = {
    count: 1000,
    concurrency: 3, // Reducido a 3 para evitar rate limiting estricto
    batchSize: 200,
  };

  // Parsear argumentos
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--count' && args[i + 1]) config.count = parseInt(args[i + 1]);
    if (args[i] === '--concurrency' && args[i + 1]) config.concurrency = parseInt(args[i + 1]);
    if (args[i] === '--batch-size' && args[i + 1]) config.batchSize = parseInt(args[i + 1]);
    if (args[i] === '--resume' && args[i + 1]) config.resumeFile = args[i + 1];
  }

  console.log(colors.cyan(`\n🌱 PlantGen DB Fill - Generating ${config.count} users\n`));
  console.log(`Configuration:
  - Concurrency: ${config.concurrency}
  - Batch Size: ${config.batchSize}
  - Resume File: ${config.resumeFile || 'None'}\n`);

  // Cargar checkpoint si existe
  let checkpoint: Checkpoint = {
    completed: 0,
    failed: 0,
    userIds: [],
    timestamp: new Date().toISOString(),
  };

  if (config.resumeFile) {
    const loaded = loadCheckpoint(config.resumeFile);
    if (loaded) {
      checkpoint = loaded;
      console.log(colors.yellow(`Resuming from checkpoint: ${checkpoint.completed} users completed\n`));
    }
  }

  const remaining = config.count - checkpoint.completed;
  if (remaining <= 0) {
    console.log(colors.green('All users already generated!'));
    return;
  }

  // Progress bar
  const progressBar = new cliProgress.SingleBar({
    format: 'Progress |' + colors.cyan('{bar}') + '| {percentage}% | {value}/{total} users | ETA: {eta}s',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
  });

  progressBar.start(remaining, 0);

  // Queue con concurrencia limitada
  const queue = new PQueue({ concurrency: config.concurrency });

  let completed = checkpoint.completed;
  let failed = checkpoint.failed;

  // Procesar usuarios en batches
  for (let i = 0; i < remaining; i++) {
    queue.add(async () => {
      try {
        await processUser();
        completed++;
        progressBar.increment();

        // Guardar checkpoint cada 500 usuarios
        if (completed % 500 === 0) {
          saveCheckpoint(
            { completed, failed, userIds: [], timestamp: new Date().toISOString() },
            'checkpoint.json'
          );
        }
      } catch (error) {
        failed++;
        if (error instanceof AxiosError) {
          const status = error.response?.status;
          const data = error.response?.data;
          console.error(colors.red(`\nAPI Error [${status}]: ${error.message}`));
          if (data) {
            console.error(colors.yellow(`Response: ${JSON.stringify(data).substring(0, 200)}`));
          }
        } else if (error instanceof Error) {
          console.error(colors.red(`\nError: ${error.message}`));
        } else {
          console.error(colors.red(`\nUnexpected error: ${error}`));
        }
      }
    });
  }

  // Esperar a que termine todo
  await queue.onIdle();

  progressBar.stop();

  console.log(colors.green(`\n✅ Generation completed!
  - Total users: ${completed}
  - Failed: ${failed}
  - Success rate: ${((completed / (completed + failed)) * 100).toFixed(2)}%\n`));

  // Guardar checkpoint final
  saveCheckpoint({ completed, failed, userIds: [], timestamp: new Date().toISOString() }, 'final_checkpoint.json');
}

// Ejecutar
main().catch((error) => {
  console.error(colors.red(`Fatal error: ${error.message}`));
  process.exit(1);
});
