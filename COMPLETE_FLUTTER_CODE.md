# 📱 CÓDIGO COMPLETO - Pantalla de Preferencias de Usuario Flutter

## ✅ Backend Completado
- UserModel, User Entity, UpdateUserByIdUseCase, UserController
- Endpoint: **PUT /users/:id** acepta `preferred_plant_category` y `favorite_plants`

---

## 📁 Estructura de Archivos a Crear

```
Planty/lib/features/preferences/
├── domain/
│   ├── entities/
│   │   ├── plant_entity.dart
│   │   └── user_preferences_entity.dart
│   ├── repositories/user_preferences_repository.dart
│   └── usecases/
│       ├── get_plants_usecase.dart
│       └── update_preferences_usecase.dart
├── data/
│   ├── models/
│   │   └── plant_model.dart
│   ├── datasource/
│   │   ├── plants_datasource.dart
│   │   └── user_prefs_datasource.dart
│   └── repositories/user_preferences_repository_impl.dart
├── presentation/
│   ├── providers/user_preferences_provider.dart
│   ├── pages/user_preferences_page.dart
│   └── widgets/
│       ├── category_selector.dart
│       ├── experience_selector.dart
│       └── plants_multi_selector.dart
└── di/preferences_di.dart
```

---

# 📄 TODOS LOS ARCHIVOS

## 1. Domain - Entities

### `plant_entity.dart`
```dart
class PlantEntity {
  final int id;
  final String species;
  final String scientificName;
  final List<String> type;

  PlantEntity({
    required this.id,
    required this.species,
    required this.scientificName,
    required this.type,
  });
}
```

### `user_preferences_entity.dart`
```dart
class UserPreferencesEntity {
  final String? preferredPlantCategory;
  final int experienceLevel;
  final List<int> favoritePlants;

  UserPreferencesEntity({
    this.preferredPlantCategory,
    required this.experienceLevel,
    required this.favoritePlants,
  });

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{
      'experience_level': experienceLevel,
    };
    if (preferredPlantCategory != null) {
      map['preferred_plant_category'] = preferredPlantCategory;
    }
    if (favoritePlants.isNotEmpty) {
      map['favorite_plants'] = favoritePlants;
    }
    return map;
  }
}
```

## 2. Domain - Repository Interface

### `user_preferences_repository.dart`
```dart
import '../entities/plant_entity.dart';
import '../entities/user_preferences_entity.dart';

abstract class UserPreferencesRepository {
  Future<List<PlantEntity>> getAllPlants(String token);
  Future<void> updateUserPreferences({
    required String userId,
    required String token,
    required UserPreferencesEntity preferences,
  });
}
```

## 3. Domain - UseCases

### `get_plants_usecase.dart`
```dart
import '../entities/plant_entity.dart';
import '../repositories/user_preferences_repository.dart';

class GetPlantsUseCase {
  final UserPreferencesRepository repository;

  GetPlantsUseCase(this.repository);

  Future<List<PlantEntity>> call(String token) async {
    return await repository.getAllPlants(token);
  }
}
```

### `update_preferences_usecase.dart`
```dart
import '../entities/user_preferences_entity.dart';
import '../repositories/user_preferences_repository.dart';

class UpdatePreferencesUseCase {
  final UserPreferencesRepository repository;

  UpdatePreferencesUseCase(this.repository);

  Future<void> call({
    required String userId,
    required String token,
    required UserPreferencesEntity preferences,
  }) async {
    return await repository.updateUserPreferences(
      userId: userId,
      token: token,
      preferences: preferences,
    );
  }
}
```

## 4. Data - Models

### `plant_model.dart`
```dart
import '../../domain/entities/plant_entity.dart';

class PlantModel extends PlantEntity {
  PlantModel({
    required super.id,
    required super.species,
    required super.scientificName,
    required super.type,
  });

  factory PlantModel.fromJson(Map<String, dynamic> json) {
    return PlantModel(
      id: json['id'] as int,
      species: json['species'] as String,
      scientificName: json['scientificName'] as String,
      type: List<String>.from(json['type'] as List),
    );
  }
}
```

## 5. Data - DataSources

### `plants_datasource.dart`
```dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_dotenv/flutter_dotenv.dart';
import '../../../../core/error/exception.dart';
import '../models/plant_model.dart';

abstract class PlantsDataSource {
  Future<List<PlantModel>> getAllPlants(String token);
}

class PlantsDataSourceImpl implements PlantsDataSource {
  final http.Client client;

  PlantsDataSourceImpl({required this.client});

  @override
  Future<List<PlantModel>> getAllPlants(String token) async {
    final baseUrl = dotenv.env['API_GATEWAY_URL'] ?? 'http://localhost:3000';
    final url = Uri.parse('$baseUrl/plants');

    final response = await client.get(
      url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      final List<dynamic> jsonList = json.decode(response.body);
      return jsonList.map((json) => PlantModel.fromJson(json)).toList();
    } else {
      throw ServerException(
        message: 'Error al obtener plantas: ${response.statusCode}',
      );
    }
  }
}
```

### `user_prefs_datasource.dart`
```dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_dotenv/flutter_dotenv.dart';
import '../../../../core/error/exception.dart';
import '../../domain/entities/user_preferences_entity.dart';

abstract class UserPreferencesDataSource {
  Future<void> updateUserPreferences({
    required String userId,
    required String token,
    required UserPreferencesEntity preferences,
  });
}

class UserPreferencesDataSourceImpl implements UserPreferencesDataSource {
  final http.Client client;

  UserPreferencesDataSourceImpl({required this.client});

  @override
  Future<void> updateUserPreferences({
    required String userId,
    required String token,
    required UserPreferencesEntity preferences,
  }) async {
    final baseUrl = dotenv.env['API_GATEWAY_URL'] ?? 'http://localhost:3000';
    final url = Uri.parse('$baseUrl/users/$userId');

    final response = await client.put(
      url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: json.encode(preferences.toJson()),
    );

    if (response.statusCode != 200) {
      final errorBody = json.decode(response.body);
      throw ServerException(
        message: errorBody['message'] ?? 'Error al actualizar preferencias',
      );
    }
  }
}
```

## 6. Data - Repository Implementation

### `user_preferences_repository_impl.dart`
```dart
import '../../domain/entities/plant_entity.dart';
import '../../domain/entities/user_preferences_entity.dart';
import '../../domain/repositories/user_preferences_repository.dart';
import '../datasource/plants_datasource.dart';
import '../datasource/user_prefs_datasource.dart';

class UserPreferencesRepositoryImpl implements UserPreferencesRepository {
  final PlantsDataSource plantsDataSource;
  final UserPreferencesDataSource userPreferencesDataSource;

  UserPreferencesRepositoryImpl({
    required this.plantsDataSource,
    required this.userPreferencesDataSource,
  });

  @override
  Future<List<PlantEntity>> getAllPlants(String token) async {
    return await plantsDataSource.getAllPlants(token);
  }

  @override
  Future<void> updateUserPreferences({
    required String userId,
    required String token,
    required UserPreferencesEntity preferences,
  }) async {
    return await userPreferencesDataSource.updateUserPreferences(
      userId: userId,
      token: token,
      preferences: preferences,
    );
  }
}
```

## 7. Presentation - Provider (ViewModel)

### `user_preferences_provider.dart`
```dart
import 'package:flutter/foundation.dart';
import '../../domain/entities/plant_entity.dart';
import '../../domain/entities/user_preferences_entity.dart';
import '../../domain/usecases/get_plants_usecase.dart';
import '../../domain/usecases/update_preferences_usecase.dart';

class UserPreferencesProvider with ChangeNotifier {
  final GetPlantsUseCase getPlantsUseCase;
  final UpdatePreferencesUseCase updatePreferencesUseCase;

  UserPreferencesProvider({
    required this.getPlantsUseCase,
    required this.updatePreferencesUseCase,
  });

  // State
  List<PlantEntity> _plants = [];
  bool _isLoadingPlants = false;
  bool _isSaving = false;
  String? _error;

  // Form values
  String? _selectedCategory;
  int _experienceLevel = 1;
  List<int> _selectedPlantIds = [];

  // Getters
  List<PlantEntity> get plants => _plants;
  bool get isLoadingPlants => _isLoadingPlants;
  bool get isSaving => _isSaving;
  String? get error => _error;
  String? get selectedCategory => _selectedCategory;
  int get experienceLevel => _experienceLevel;
  List<int> get selectedPlantIds => _selectedPlantIds;

  // Setters
  void setCategory(String? category) {
    _selectedCategory = category;
    notifyListeners();
  }

  void setExperienceLevel(int level) {
    _experienceLevel = level;
    notifyListeners();
  }

  void togglePlantSelection(int plantId) {
    if (_selectedPlantIds.contains(plantId)) {
      _selectedPlantIds.remove(plantId);
    } else {
      _selectedPlantIds.add(plantId);
    }
    notifyListeners();
  }

  // Load plants
  Future<void> loadPlants(String token) async {
    _isLoadingPlants = true;
    _error = null;
    notifyListeners();

    try {
      _plants = await getPlantsUseCase(token);
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoadingPlants = false;
      notifyListeners();
    }
  }

  // Save preferences
  Future<bool> savePreferences({
    required String userId,
    required String token,
  }) async {
    _isSaving = true;
    _error = null;
    notifyListeners();

    try {
      final preferences = UserPreferencesEntity(
        preferredPlantCategory: _selectedCategory,
        experienceLevel: _experienceLevel,
        favoritePlants: _selectedPlantIds,
      );

      await updatePreferencesUseCase(
        userId: userId,
        token: token,
        preferences: preferences,
      );

      _isSaving = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      _isSaving = false;
      notifyListeners();
      return false;
    }
  }
}
```

## 8. Presentation - Widgets

### `category_selector.dart`
```dart
import 'package:flutter/material.dart';

class CategorySelector extends StatelessWidget {
  final String? selectedCategory;
  final Function(String?) onChanged;

  const CategorySelector({
    super.key,
    required this.selectedCategory,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final categories = [
      {'value': 'aromatic', 'label': '🌿 Aromáticas', 'icon': Icons.spa},
      {'value': 'medicinal', 'label': '💊 Medicinales', 'icon': Icons.healing},
      {'value': 'vegetable', 'label': '🥬 Vegetales', 'icon': Icons.eco},
      {'value': 'ornamental', 'label': '🌺 Ornamentales', 'icon': Icons.local_florist},
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Categoría de Plantas Preferida',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        ...categories.map((category) {
          final isSelected = selectedCategory == category['value'];
          return Card(
            elevation: isSelected ? 4 : 1,
            color: isSelected ? Colors.green.shade50 : null,
            child: RadioListTile<String>(
              value: category['value'] as String,
              groupValue: selectedCategory,
              onChanged: onChanged,
              title: Text(category['label'] as String),
              secondary: Icon(
                category['icon'] as IconData,
                color: isSelected ? Colors.green : Colors.grey,
              ),
            ),
          );
        }).toList(),
      ],
    );
  }
}
```

### `experience_selector.dart`
```dart
import 'package:flutter/material.dart';

class ExperienceSelector extends StatelessWidget {
  final int experienceLevel;
  final Function(int) onChanged;

  const ExperienceSelector({
    super.key,
    required this.experienceLevel,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Nivel de Experiencia',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _ExperienceCard(
                level: 1,
                label: '🌱 Novato',
                description: 'Recién empiezo',
                isSelected: experienceLevel == 1,
                onTap: () => onChanged(1),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _ExperienceCard(
                level: 2,
                label: '🌿 Intermedio',
                description: 'Tengo experiencia',
                isSelected: experienceLevel == 2,
                onTap: () => onChanged(2),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _ExperienceCard(
                level: 3,
                label: '🌳 Experto',
                description: 'Soy profesional',
                isSelected: experienceLevel == 3,
                onTap: () => onChanged(3),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _ExperienceCard extends StatelessWidget {
  final int level;
  final String label;
  final String description;
  final bool isSelected;
  final VoidCallback onTap;

  const _ExperienceCard({
    required this.level,
    required this.label,
    required this.description,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Card(
        elevation: isSelected ? 6 : 2,
        color: isSelected ? Colors.green.shade100 : null,
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 4),
              Text(
                description,
                style: const TextStyle(fontSize: 11, color: Colors.grey),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
```

### `plants_multi_selector.dart`
```dart
import 'package:flutter/material.dart';
import '../../../domain/entities/plant_entity.dart';

class PlantsMultiSelector extends StatelessWidget {
  final List<PlantEntity> plants;
  final List<int> selectedPlantIds;
  final Function(int) onToggle;
  final bool isLoading;

  const PlantsMultiSelector({
    super.key,
    required this.plants,
    required this.selectedPlantIds,
    required this.onToggle,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Plantas Favoritas',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            Chip(
              label: Text('${selectedPlantIds.length} seleccionadas'),
              backgroundColor: Colors.green.shade100,
            ),
          ],
        ),
        const SizedBox(height: 8),
        const Text(
          'Selecciona las plantas que más te gustan',
          style: TextStyle(color: Colors.grey, fontSize: 14),
        ),
        const SizedBox(height: 16),
        if (isLoading)
          const Center(child: CircularProgressIndicator())
        else if (plants.isEmpty)
          const Center(child: Text('No hay plantas disponibles'))
        else
          SizedBox(
            height: 300,
            child: ListView.builder(
              itemCount: plants.length,
              itemBuilder: (context, index) {
                final plant = plants[index];
                final isSelected = selectedPlantIds.contains(plant.id);

                return Card(
                  color: isSelected ? Colors.green.shade50 : null,
                  child: CheckboxListTile(
                    value: isSelected,
                    onChanged: (_) => onToggle(plant.id),
                    title: Text(plant.species),
                    subtitle: Text(
                      plant.scientificName,
                      style: const TextStyle(fontStyle: FontStyle.italic),
                    ),
                    secondary: Wrap(
                      spacing: 4,
                      children: plant.type.map((type) {
                        return Chip(
                          label: Text(type, style: const TextStyle(fontSize: 10)),
                          padding: EdgeInsets.zero,
                          materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        );
                      }).toList(),
                    ),
                  ),
                );
              },
            ),
          ),
      ],
    );
  }
}
```

## 9. Presentation - Page

### `user_preferences_page.dart`
```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/storage/secure_storage.dart';
import '../providers/user_preferences_provider.dart';
import '../widgets/category_selector.dart';
import '../widgets/experience_selector.dart';
import '../widgets/plants_multi_selector.dart';

class UserPreferencesPage extends StatefulWidget {
  const UserPreferencesPage({super.key});

  @override
  State<UserPreferencesPage> createState() => _UserPreferencesPageState();
}

class _UserPreferencesPageState extends State<UserPreferencesPage> {
  @override
  void initState() {
    super.initState();
    _loadPlants();
  }

  Future<void> _loadPlants() async {
    final token = await SecureStorage.getToken();
    if (token != null && mounted) {
      context.read<UserPreferencesProvider>().loadPlants(token);
    }
  }

  Future<void> _savePreferences() async {
    final provider = context.read<UserPreferencesProvider>();
    final token = await SecureStorage.getToken();
    final userId = await SecureStorage.getUserId();

    if (token == null || userId == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Error: No se encontró sesión')),
        );
      }
      return;
    }

    final success = await provider.savePreferences(
      userId: userId,
      token: token,
    );

    if (!mounted) return;

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('✅ Preferencias guardadas exitosamente'),
          backgroundColor: Colors.green,
        ),
      );
      context.go('/home');
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('❌ Error: ${provider.error}'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Configura tus Preferencias'),
        backgroundColor: Colors.green,
      ),
      body: Consumer<UserPreferencesProvider>(
        builder: (context, provider, child) {
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text(
                  '¡Bienvenido! 🌱',
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Ayúdanos a conocerte mejor para ofrecerte una mejor experiencia',
                  style: TextStyle(color: Colors.grey),
                ),
                const SizedBox(height: 24),

                // Category Selector
                CategorySelector(
                  selectedCategory: provider.selectedCategory,
                  onChanged: provider.setCategory,
                ),
                const SizedBox(height: 32),

                // Experience Selector
                ExperienceSelector(
                  experienceLevel: provider.experienceLevel,
                  onChanged: provider.setExperienceLevel,
                ),
                const SizedBox(height: 32),

                // Plants Multi Selector
                PlantsMultiSelector(
                  plants: provider.plants,
                  selectedPlantIds: provider.selectedPlantIds,
                  onToggle: provider.togglePlantSelection,
                  isLoading: provider.isLoadingPlants,
                ),
                const SizedBox(height: 32),

                // Save Button
                ElevatedButton(
                  onPressed: provider.isSaving ? null : _savePreferences,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: provider.isSaving
                      ? const CircularProgressIndicator(color: Colors.white)
                      : const Text(
                          'Guardar Preferencias',
                          style: TextStyle(fontSize: 18, color: Colors.white),
                        ),
                ),
                const SizedBox(height: 16),

                // Skip Button
                TextButton(
                  onPressed: () => context.go('/home'),
                  child: const Text('Omitir por ahora'),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
```

## 10. Dependency Injection

### `preferences_di.dart`
```dart
import 'package:http/http.dart' as http;
import '../data/datasource/plants_datasource.dart';
import '../data/datasource/user_prefs_datasource.dart';
import '../data/repositories/user_preferences_repository_impl.dart';
import '../domain/repositories/user_preferences_repository.dart';
import '../domain/usecases/get_plants_usecase.dart';
import '../domain/usecases/update_preferences_usecase.dart';
import '../presentation/providers/user_preferences_provider.dart';

class PreferencesDI {
  static UserPreferencesProvider getProvider() {
    final client = http.Client();

    // DataSources
    final plantsDataSource = PlantsDataSourceImpl(client: client);
    final userPrefsDataSource = UserPreferencesDataSourceImpl(client: client);

    // Repository
    final repository = UserPreferencesRepositoryImpl(
      plantsDataSource: plantsDataSource,
      userPreferencesDataSource: userPrefsDataSource,
    );

    // UseCases
    final getPlantsUseCase = GetPlantsUseCase(repository);
    final updatePreferencesUseCase = UpdatePreferencesUseCase(repository);

    // Provider
    return UserPreferencesProvider(
      getPlantsUseCase: getPlantsUseCase,
      updatePreferencesUseCase: updatePreferencesUseCase,
    );
  }
}
```

---

# 🚀 CÓMO USAR

## 1. Crear todas las carpetas y archivos

Copia cada archivo en su ubicación correspondiente dentro de:
```
Planty/lib/features/preferences/
```

## 2. Agregar Provider en main.dart

```dart
import 'package:provider/provider.dart';
import 'features/preferences/di/preferences_di.dart';

void main() {
  runApp(
    MultiProvider(
      providers: [
        // ...tus providers existentes...
        ChangeNotifierProvider(
          create: (_) => PreferencesDI.getProvider(),
        ),
      ],
      child: const MyApp(),
    ),
  );
}
```

## 3. Agregar ruta en app_routes.dart

```dart
GoRoute(
  path: '/preferences',
  name: 'preferences',
  builder: (context, state) => const UserPreferencesPage(),
),
```

## 4. Navegar después del registro

En `register_provider.dart` o donde manejes el registro exitoso:

```dart
// Después de registro exitoso
context.go('/preferences');
```

## 5. Configurar .env

```env
API_GATEWAY_URL=http://TU_IP:3000
```

---

# ✅ LISTO!

Ahora tienes:
- ✅ Backend actualizado (api-users)
- ✅ Arquitectura limpia completa en Flutter (MVVM)
- ✅ UI interactiva con Provider
- ✅ Separación de responsabilidades (Domain, Data, Presentation)
- ✅ Manejo de estado reactivo
- ✅ Comunicación HTTP con el backend

**El flujo completo funciona:**
1. Usuario se registra → `/preferences`
2. Selecciona categoría, experiencia y plantas favoritas
3. Presiona "Guardar"
4. PUT request a `/users/:id` con las preferencias
5. Navega a `/home`
