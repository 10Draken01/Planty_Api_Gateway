# Vistas Flutter Faltantes - Planty App

## Arquitectura General

- **Patrón:** Hexagonal + MVVM
- **Estado:** Provider
- **Routing:** go_router
- **UI:** Material Design 3 + Neumorfismo

---

## 1. Vista de Lista de Huertos (Orchards List)

### Ubicación
`lib/features/orchards/presentation/pages/orchards_list.dart`

### Propósito
Mostrar todos los huertos del usuario con opciones de filtrado y búsqueda.

### Componentes Visuales

```
┌─────────────────────────────┐
│  🌱 Mis Huertos     [+]     │  AppBar
├─────────────────────────────┤
│  🔍 [Buscar huertos...]     │  Search Bar
├─────────────────────────────┤
│  📊 Filtros: [Activos▼]    │  Filters
├─────────────────────────────┤
│  ┌───────────────────────┐  │
│  │ 🏡 Huerto Principal   │  │  Orchard Card
│  │ 10m x 15m             │  │
│  │ 🌿 25 plantas         │  │
│  │ ⚠️ 3 requieren riego  │  │
│  │ [Ver] [Editar]        │  │
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │ 🏡 Huerto Secundario  │  │
│  │ 5m x 8m               │  │
│  │ 🌿 12 plantas         │  │
│  │ ✓ Todo en orden       │  │
│  │ [Ver] [Editar]        │  │
│  └───────────────────────┘  │
│                             │
│  [Crear Nuevo Huerto]       │  FAB
└─────────────────────────────┘
```

### Provider

```dart
class OrchardsProvider with ChangeNotifier {
  List<Orchard> _orchards = [];
  bool _isLoading = false;
  String _searchQuery = '';
  String _filterStatus = 'all';

  Future<void> loadOrchards();
  Future<void> createOrchard(Orchard orchard);
  Future<void> deleteOrchard(String id);
  void searchOrchards(String query);
  void filterByStatus(String status);
}
```

### Navegación
- Desde: Home → Card "Mis Huertos"
- Hacia: Orchard Detail, Create Orchard
- Ruta: `/orchards`

---

## 2. Vista de Crear Huerto (Create Orchard)

### Ubicación
`lib/features/orchards/presentation/pages/create_orchard.dart`

### Propósito
Formulario para crear un nuevo huerto con validaciones.

### Componentes Visuales

```
┌─────────────────────────────┐
│  ← Crear Nuevo Huerto       │  AppBar
├─────────────────────────────┤
│                             │
│  Información Básica         │  Section
│                             │
│  Nombre del huerto *        │
│  ┌─────────────────────────┐│
│  │ Mi huerto principal     ││  TextField
│  └─────────────────────────┘│
│                             │
│  Descripción (opcional)     │
│  ┌─────────────────────────┐│
│  │ Huerto para verduras... ││  TextField
│  └─────────────────────────┘│
│                             │
│  Dimensiones *              │  Section
│                             │
│  Ancho (m)    Largo (m)     │
│  ┌────────┐   ┌────────┐    │
│  │   10   │   │   15   │    │  Number inputs
│  └────────┘   └────────┘    │
│                             │
│  Ubicación (opcional)       │  Section
│                             │
│  📍 [Usar ubicación actual] │  Button
│                             │
│  Tipo de suelo *            │  Section
│  ○ Arcilloso                │
│  ● Limoso                   │  Radio buttons
│  ○ Arenoso                  │
│  ○ Humífero                 │
│                             │
│  Exposición solar *         │  Section
│  ● Completa (6-8h)          │
│  ○ Parcial (3-6h)           │  Radio buttons
│  ○ Sombra (<3h)             │
│                             │
│  Sistema de riego *         │  Section
│  [Manual ▼]                 │  Dropdown
│                             │
│  [Cancelar] [Crear Huerto]  │  Actions
└─────────────────────────────┘
```

### Provider

```dart
class CreateOrchardProvider with ChangeNotifier {
  String _name = '';
  String _description = '';
  double _width = 0;
  double _length = 0;
  String _soilType = 'limoso';
  String _sunExposure = 'full';
  String _wateringSystem = 'manual';
  bool _isLoading = false;

  Future<bool> createOrchard();
  void validateForm();
}
```

### Validaciones
- Nombre: Requerido, 3-100 caracteres
- Dimensiones: Requerido, > 0
- Tipo de suelo: Requerido
- Exposición solar: Requerido
- Sistema de riego: Requerido

### Navegación
- Desde: Orchards List, Home
- Hacia: Orchard Detail (después de crear)
- Ruta: `/orchards/create`

---

## 3. Vista de Detalle de Huerto (Orchard Detail)

### Ubicación
`lib/features/orchards/presentation/pages/orchard_detail.dart`

### Propósito
Mostrar información completa del huerto y gestionar sus plantas.

### Componentes Visuales

```
┌─────────────────────────────┐
│  ← Huerto Principal  [⋮]    │  AppBar (con menú)
├─────────────────────────────┤
│  ┌───────────────────────┐  │
│  │   Layout del Huerto   │  │  Mapa visual 2D
│  │                       │  │  (Canvas con plantas)
│  │   🌿  🌸  🌿         │  │
│  │        🌿             │  │
│  │   🌿       🌿        │  │
│  │                       │  │
│  └───────────────────────┘  │
│                             │
│  📊 Resumen                 │
│  Tamaño: 10m x 15m (150m²)  │
│  Plantas: 25                │
│  Salud: 🟢 Excelente         │
│                             │
│  🌿 Plantas en el Huerto    │  Section
│                             │
│  ┌───────────────────────┐  │
│  │ 🍅 Tomate Cherry      │  │  Plant Card
│  │ Plantado: 15 Mar 2024 │  │
│  │ Estado: Floreciendo   │  │
│  │ Próximo riego: Mañana │  │
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │ 🥕 Zanahoria          │  │
│  │ Plantado: 1 Mar 2024  │  │
│  │ Estado: Creciendo     │  │
│  │ Próximo riego: Hoy    │  │
│  └───────────────────────┘  │
│                             │
│  [+ Agregar Planta]         │  Button
│                             │
│  📋 Eventos Recientes       │  Section
│  • Regado - Hace 2 días     │
│  • Fertilizado - Hace 1 sem │
│                             │
│  [Ver Todos los Eventos]    │  Button
└─────────────────────────────┘
  [Generar Diseño] FAB
```

### Provider

```dart
class OrchardDetailProvider with ChangeNotifier {
  Orchard? _orchard;
  List<Plant> _plants = [];
  List<OrchardEvent> _recentEvents = [];
  bool _isLoading = false;

  Future<void> loadOrchard(String id);
  Future<void> addPlant(Plant plant);
  Future<void> removePlant(String plantId);
  Future<void> loadEvents();
}
```

### Navegación
- Desde: Orchards List
- Hacia: Add Plant, Garden Generator, Event History
- Ruta: `/orchards/:id`

---

## 4. Vista de Generador de Huertos (Garden Generator)

### Ubicación
`lib/features/garden_generator/presentation/pages/garden_generator.dart`

### Propósito
Interfaz para generar diseños de huertos con algoritmo genético.

### Componentes Visuales

```
┌─────────────────────────────┐
│  ← Generador de Diseño      │  AppBar
├─────────────────────────────┤
│  Paso 1 de 3: Plantas       │  Stepper
├─────────────────────────────┤
│                             │
│  Selecciona las plantas:    │
│                             │
│  ☑ Tomate (x3)              │  Checkbox + Counter
│  ☑ Lechuga (x5)             │
│  ☐ Zanahoria                │
│  ☑ Albahaca (x2)            │
│  ☐ Pepino                   │
│                             │
│  [Siguiente]                │  Button
└─────────────────────────────┘

┌─────────────────────────────┐
│  ← Generador de Diseño      │
├─────────────────────────────┤
│  Paso 2 de 3: Objetivos     │
├─────────────────────────────┤
│                             │
│  ¿Qué es más importante?    │
│                             │
│  Maximizar producción       │
│  ━━━━━━━━━━━━━━━━━━━━━━━━  │  Slider (0-100)
│         80%                 │
│                             │
│  Optimizar espacio          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━  │
│         60%                 │
│                             │
│  Minimizar agua             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━  │
│         40%                 │
│                             │
│  Facilitar mantenimiento    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━  │
│         70%                 │
│                             │
│  [Atrás] [Siguiente]        │
└─────────────────────────────┘

┌─────────────────────────────┐
│  ← Generador de Diseño      │
├─────────────────────────────┤
│  Paso 3 de 3: Restricciones │
├─────────────────────────────┤
│                             │
│  Ancho de caminos (cm)      │
│  ┌─────────────────────────┐│
│  │        60               ││  Number input
│  └─────────────────────────┘│
│                             │
│  Espacio mínimo (cm)        │
│  ┌─────────────────────────┐│
│  │        30               ││
│  └─────────────────────────┘│
│                             │
│  ☑ Evitar plantas           │  Checkbox
│    incompatibles            │
│                             │
│  ☑ Considerar rotación      │  Checkbox
│                             │
│  [Atrás] [Generar Diseño]   │
└─────────────────────────────┘

┌─────────────────────────────┐
│  ← Generando Diseño...      │
├─────────────────────────────┤
│                             │
│      [Spinner Animation]    │
│                             │
│  Optimizando distribución   │
│                             │
│  Generación 32 de 50        │
│  ━━━━━━━━━━━░░░░░░░ 64%    │  Progress bar
│                             │
│  Esto puede tomar 1-2 min   │
└─────────────────────────────┘
```

### Provider

```dart
class GardenGeneratorProvider with ChangeNotifier {
  List<PlantRequest> _selectedPlants = [];
  Map<String, double> _objectives = {};
  Constraints _constraints;
  GardenDesign? _generatedDesign;
  String _status = 'idle';
  int _currentGeneration = 0;

  void addPlant(PlantRequest plant);
  void removePlant(String species);
  void setObjective(String key, double value);
  Future<void> generateDesign();
  Future<void> pollDesignStatus(String designId);
}
```

### Navegación
- Desde: Home, Orchard Detail
- Hacia: Design Result
- Ruta: `/garden-generator`

---

## 5. Vista de Resultado de Diseño (Design Result)

### Ubicación
`lib/features/garden_generator/presentation/pages/design_result.dart`

### Propósito
Mostrar el diseño generado con métricas y opción de aplicar.

### Componentes Visuales

```
┌─────────────────────────────┐
│  ← Diseño Generado  [❤]     │  AppBar (guardar favorito)
├─────────────────────────────┤
│  ┌───────────────────────┐  │
│  │   Vista del Diseño    │  │  Canvas interactivo
│  │                       │  │  (zoom, pan)
│  │   🍅 🥬 🥕 🌿       │  │
│  │      🥬    🥕        │  │
│  │   🌿 🍅 🥬 🥕       │  │
│  │                       │  │
│  │  ━━━━━━━━━━━━━━━━━━  │  │  Camino
│  └───────────────────────┘  │
│  [Zoom +] [Zoom -] [Reset]  │
│                             │
│  📊 Métricas del Diseño     │  Section
│                             │
│  Fitness: 87/100 ⭐⭐⭐⭐     │
│  Total plantas: 25          │
│  Área utilizada: 142m²      │
│  Eficiencia: 94%            │
│  Compatibilidad: 91%        │
│  Producción estimada: 125kg/año │
│  Uso de agua: 45L/día       │
│                             │
│  📝 Recomendaciones         │  Section
│  • Agregar tutorado para   │
│    tomates y pepinos        │
│  • Considerar mulching      │
│  • Rotar lechugas cada 60d  │
│                             │
│  [Aplicar al Huerto]        │  Primary button
│  [Generar Nuevo Diseño]     │  Secondary button
│  [Compartir]                │  Tertiary button
└─────────────────────────────┘
```

### Provider

```dart
class DesignResultProvider with ChangeNotifier {
  GardenDesign? _design;
  bool _isApplying = false;

  Future<void> loadDesign(String id);
  Future<void> applyToOrchard(String orchardId);
  Future<void> saveAsFavorite();
  Future<void> shareDesign();
}
```

### Navegación
- Desde: Garden Generator
- Hacia: Orchard Detail (después de aplicar)
- Ruta: `/designs/:id`

---

## 6. Vista de Panel Informativo (Dashboard/Analytics)

### Ubicación
`lib/features/analytics/presentation/pages/dashboard.dart`

### Propósito
Mostrar estadísticas, gráficos y análisis del usuario.

### Componentes Visuales

```
┌─────────────────────────────┐
│  Panel Informativo          │  AppBar
├─────────────────────────────┤
│  ┌───────────────────────┐  │
│  │ Resumen General       │  │  Card
│  │ Total huertos: 3      │  │
│  │ Total plantas: 67     │  │
│  │ Cosechas este mes: 5  │  │
│  └───────────────────────┘  │
│                             │
│  📈 Producción             │  Section
│  ┌───────────────────────┐  │
│  │   [Gráfico de Barras] │  │  Chart
│  │   Ene Feb Mar Abr May │  │
│  │    ▃  ▅  ▆  ▄  ▇     │  │
│  └───────────────────────┘  │
│                             │
│  💧 Uso de Agua (Semanal)  │  Section
│  ┌───────────────────────┐  │
│  │   [Gráfico de Línea]  │  │  Line chart
│  │        ╱╲  ╱╲         │  │
│  │       ╱  ╲╱  ╲        │  │
│  │  ────╱────────╲───    │  │
│  └───────────────────────┘  │
│                             │
│  🌱 Salud de Plantas       │  Section
│  🟢 Saludables: 58 (87%)    │
│  🟡 Atención: 7 (10%)       │
│  🔴 Críticas: 2 (3%)        │
│                             │
│  📅 Próximas Tareas         │  Section
│  • Regar Huerto Principal  │
│    Hoy, 6:00 PM             │
│  • Cosechar Lechugas        │
│    Mañana                   │
│  • Fertilizar Tomates       │
│    En 3 días                │
│                             │
│  🏆 Logros                  │  Section
│  🌟 Primera Cosecha ✓       │
│  🌟 10 Plantas Sembradas ✓  │
│  🌟 Huerto Optimizado ✗     │
└─────────────────────────────┘
```

### Provider

```dart
class DashboardProvider with ChangeNotifier {
  DashboardData? _data;
  List<ChartData> _productionData = [];
  List<ChartData> _waterUsageData = [];
  List<Task> _upcomingTasks = [];

  Future<void> loadDashboard();
  Future<void> refreshData();
}
```

### Navegación
- Desde: Home → Card "Panel Informativo"
- Hacia: Orchard Detail, Task Detail
- Ruta: `/dashboard`

---

## 7. Vista de Configuración de Perfil (Profile Settings)

### Ubicación
`lib/features/profile/presentation/pages/profile_settings.dart`

### Propósito
Permitir al usuario editar su perfil y preferencias.

### Componentes Visuales

```
┌─────────────────────────────┐
│  ← Mi Perfil                │  AppBar
├─────────────────────────────┤
│        [Avatar]             │  Profile picture
│    [Cambiar Foto]           │
│                             │
│  Información Personal       │  Section
│                             │
│  Nombre                     │
│  ┌─────────────────────────┐│
│  │ Leonardo Najera         ││  TextField
│  └─────────────────────────┘│
│                             │
│  Email                      │
│  ┌─────────────────────────┐│
│  │ leo@gmail.com           ││  TextField (disabled)
│  └─────────────────────────┘│
│                             │
│  Nivel de Experiencia       │
│  ○ Principiante             │
│  ● Intermedio               │  Radio buttons
│  ○ Avanzado                 │
│                             │
│  Preferencias               │  Section
│                             │
│  Unidades                   │
│  [Métrico ▼]                │  Dropdown
│                             │
│  Tema                       │
│  ☑ Modo oscuro              │  Switch
│                             │
│  Notificaciones             │  Section
│                             │
│  ☑ Push notifications       │  Switch
│  ☑ Recordatorios de riego   │  Switch
│  ☑ Alertas de cosecha       │  Switch
│  ☐ Consejos diarios         │  Switch
│                             │
│  Seguridad                  │  Section
│                             │
│  [Cambiar Contraseña]       │  Button
│  [Configurar 2FA]           │  Button
│                             │
│  Sesión                     │  Section
│                             │
│  [Cerrar Sesión]            │  Destructive button
│  [Eliminar Cuenta]          │  Danger button
│                             │
│  [Guardar Cambios]          │  Primary button
└─────────────────────────────┘
```

### Provider

```dart
class ProfileProvider with ChangeNotifier {
  User? _user;
  String _name = '';
  int _experienceLevel = 2;
  String _units = 'metric';
  bool _darkMode = false;
  NotificationPreferences _notifPrefs;
  bool _isLoading = false;

  Future<void> loadProfile();
  Future<bool> updateProfile();
  Future<void> changePassword(String old, String new);
  Future<void> updateNotificationPreferences();
  Future<void> logout();
}
```

### Navegación
- Desde: Home → Avatar/Profile Icon
- Hacia: Change Password, Delete Account Confirmation
- Ruta: `/profile`

---

## Navegación General (go_router)

```dart
final router = GoRouter(
  routes: [
    GoRoute(path: '/', redirect: (context, state) => '/login'),
    GoRoute(path: '/login', builder: (context, state) => LoginPage()),
    GoRoute(path: '/register', builder: (context, state) => RegisterPage()),

    // Rutas protegidas
    GoRoute(path: '/home', builder: (context, state) => HomePage()),
    GoRoute(path: '/chat_bot', builder: (context, state) => ChatBotPage()),

    // Huertos
    GoRoute(path: '/orchards', builder: (context, state) => OrchardsListPage()),
    GoRoute(path: '/orchards/create', builder: (context, state) => CreateOrchardPage()),
    GoRoute(path: '/orchards/:id', builder: (context, state) => OrchardDetailPage(id: state.params['id']!)),

    // Generador
    GoRoute(path: '/garden-generator', builder: (context, state) => GardenGeneratorPage()),
    GoRoute(path: '/designs/:id', builder: (context, state) => DesignResultPage(id: state.params['id']!)),

    // Otros
    GoRoute(path: '/dashboard', builder: (context, state) => DashboardPage()),
    GoRoute(path: '/profile', builder: (context, state) => ProfileSettingsPage()),
  ],
  redirect: (context, state) {
    // Lógica de protección de rutas (JWT)
  },
);
```

---

## Dependencias Adicionales para Flutter

```yaml
dependencies:
  # Gráficos
  fl_chart: ^0.65.0              # Para gráficos en Dashboard

  # Mapas/Canvas
  flutter_map: ^6.1.0            # Para visualización de layout
  custom_paint: built-in          # Para dibujar plantas en canvas

  # Image picking
  image_picker: ^1.0.5           # Para foto de perfil

  # Notificaciones
  firebase_messaging: ^14.7.6    # Para push notifications

  # Utils
  intl: ^0.18.1                  # Para formateo de fechas/números
  cached_network_image: ^3.3.0   # Para cachear imágenes de plantas
```

---

## Resumen de Implementación

### Vistas Completadas (4/11 - 36%)
- ✅ Login
- ✅ Register
- ✅ Home
- ✅ ChatBot

### Vistas Faltantes (7/11 - 64%)
- ❌ Orchards List
- ❌ Create Orchard
- ❌ Orchard Detail
- ❌ Garden Generator
- ❌ Design Result
- ❌ Dashboard/Analytics
- ❌ Profile Settings

### Estimación de Desarrollo

| Vista | Complejidad | Tiempo Estimado |
|-------|-------------|-----------------|
| Orchards List | Media | 2 días |
| Create Orchard | Baja | 1 día |
| Orchard Detail | Alta | 3 días |
| Garden Generator | Alta | 4 días |
| Design Result | Media | 2 días |
| Dashboard | Alta | 3 días |
| Profile Settings | Baja | 1 día |
| **TOTAL** | | **16 días** |

Con 4 desarrolladores trabajando en paralelo: **~4-5 días**
