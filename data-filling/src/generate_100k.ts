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
const USERS_SERVICE_URL = process.env.USERS_SERVICE_URL || 'http://localhost:3001/users';
const ORCHARDS_SERVICE_URL = process.env.ORCHARDS_SERVICE_URL || 'http://localhost:3002/orchards';

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
  experience_level: 1 | 2 | 3;
  tokenFCM?: string;
  profile_image?: string;
  createdAt: Date;
  count_orchards: number;
  max_orchards: number;
}

interface OrchardData {
  userId: string;
  name: string;
  description: string;
  width: number;
  height: number;
  plants_id: string[];
  countPlants: number;
  timeOfLife: number;
  streakOfDays: number;
  state: boolean;
}

/**
 * Genera datos de un usuario aleatorio.
 */
function generateUserData(): UserData {
  // Distribución de experiencia: 30% principiante, 50% intermedio, 20% experto
  const experienceRoll = Math.random();
  let experience_level: 1 | 2 | 3;
  if (experienceRoll < 0.3) experience_level = 1;
  else if (experienceRoll < 0.8) experience_level = 2;
  else experience_level = 3;

  // 60% tiene tokenFCM
  const tokenFCM = Math.random() < 0.6 ? faker.string.alphanumeric(152) : undefined;

  // 70% tiene profile_image
  const profile_image = Math.random() < 0.7 ? faker.image.avatar() : undefined;

  // Fecha de creación en últimos 2 años
  const createdAt = faker.date.between({
    from: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });

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
    tokenFCM,
    profile_image,
    createdAt,
    count_orchards,
    max_orchards: 3,
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

  // Distribución aleatoria que sume 100
  const vegRoll = Math.random() * 60 + 10; // 10-70
  const medRoll = Math.random() * (100 - vegRoll);
  const ornRoll = Math.random() * (100 - vegRoll - medRoll);
  const aroRoll = 100 - vegRoll - medRoll - ornRoll;

  return {
    userExperience,
    dimensions: { width, height },
    waterLimit: width * height * (50 + Math.random() * 30), // 50-80 L/m²/semana
    objective: objectives[Math.floor(Math.random() * objectives.length)],
    categoryDistribution: {
      vegetable: Math.round(vegRoll),
      medicinal: Math.round(medRoll),
      ornamental: Math.round(ornRoll),
      aromatic: Math.round(aroRoll),
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
    ...userData,
    password: hashedPassword,
  });

  return response.data.data?._id || response.data._id;
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
 * Crea un orchard en el sistema.
 */
async function createOrchard(userId: string, agSolution: any): Promise<void> {
  const layout = agSolution.layout;
  const estimations = agSolution.estimations;

  const orchardData: OrchardData = {
    userId,
    name: `Huerto ${faker.word.adjective()} ${faker.word.noun()}`,
    description: `Huerto generado con AG - ${layout.totalPlants} plantas`,
    width: layout.dimensions.width,
    height: layout.dimensions.height,
    plants_id: layout.plants.map((p: any) => p.plantId.toString()),
    countPlants: layout.totalPlants,
    timeOfLife: Math.floor(Math.random() * 365), // 0-365 días
    streakOfDays: Math.floor(Math.random() * 90), // 0-90 días
    state: true,
  };

  await axios.post(ORCHARDS_SERVICE_URL, orchardData);
}

/**
 * Procesa un usuario: crea usuario y sus orchards.
 */
async function processUser(): Promise<void> {
  const userData = generateUserData();

  // Crear usuario
  const userId = await createUser(userData);

  // Crear orchards
  for (let i = 0; i < userData.count_orchards; i++) {
    const agSolution = await generateOrchardFromAG(userData.experience_level);
    await createOrchard(userId, agSolution);
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
    concurrency: 50,
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
