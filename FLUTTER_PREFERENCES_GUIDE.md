# 🌱 Guía de Implementación: Pantalla de Preferencias de Usuario

## 📌 Resumen

Esta guía contiene todos los archivos necesarios para implementar la pantalla de preferencias de usuario en Flutter siguiendo arquitectura limpia (MVVM).

## 🎯 Funcionalidades

1. **Categoría de plantas preferida**: Radio buttons para seleccionar entre aromatic, medicinal, vegetable, ornamental
2. **Nivel de experiencia**: Selector visual (1=Novato, 2=Intermedio, 3=Experimentado)
3. **Plantas favoritas**: Lista multi-selección obtenida del endpoint GET /plants

## 🏗️ Arquitectura

```
lib/features/preferences/
├── data/
│   ├── datasource/
│   │   ├── plants_datasource.dart          # HTTP calls a /plants
│   │   └── user_preferences_datasource.dart # HTTP calls para actualizar user
│   ├── models/
│   │   ├── plant_model.dart                 # Modelo de Plant
│   │   └── user_preferences_model.dart      # Modelo de preferencias
│   └── repositories/
│       └── user_preferences_repository_impl.dart
├── domain/
│   ├── entities/
│   │   ├── plant_entity.dart
│   │   └── user_preferences_entity.dart
│   ├── repositories/
│   │   └── user_preferences_repository.dart
│   └── usecases/
│       ├── get_plants_usecase.dart
│       └── update_user_preferences_usecase.dart
├── presentation/
│   ├── pages/
│   │   └── user_preferences_page.dart       # Pantalla principal
│   ├── providers/
│   │   └── user_preferences_provider.dart   # ViewModel (MVVM)
│   └── widgets/
│       ├── category_selector_widget.dart
│       ├── experience_selector_widget.dart
│       └── plants_multi_selector_widget.dart
└── di/
    └── preferences_di.dart                  # Dependency Injection

```

## 🔧 Backend (Ya Completado)

### ✅ Cambios en api-users:

1. **UserModel** - Nuevos campos:
   - `preferred_plant_category?: 'aromatic' | 'medicinal' | 'vegetable' | 'ornamental'`
   - `favorite_plants?: number[]`

2. **Endpoint PUT /users/:id** ahora acepta:
   ```json
   {
     "preferred_plant_category": "medicinal",
     "favorite_plants": [1, 5, 12]
   }
   ```

## 📱 Archivos Flutter a Crear

### IMPORTANTE: Ruta Base
Todos los archivos se crean dentro de:
```
Planty/lib/features/preferences/
```

---

## 📄 ARCHIVO 1: Domain Entity - Plant

**Ruta**: `lib/features/preferences/domain/entities/plant_entity.dart`

```dart
class PlantEntity {
  final int id;
  final String species;
  final String scientificName;
  final List<String> type;
  final String sunRequirement;
  final int weeklyWatering;
  final int harvestDays;
  final String soilType;
  final int waterPerKg;
  final List<String> benefits;
  final double size;

  PlantEntity({
    required this.id,
    required this.species,
    required this.scientificName,
    required this.type,
    required this.sunRequirement,
    required this.weeklyWatering,
    required this.harvestDays,
    required this.soilType,
    required this.waterPerKg,
    required this.benefits,
    required this.size,
  });
}
```

---

## 📄 ARCHIVO 2: Domain Entity - UserPreferences

**Ruta**: `lib/features/preferences/domain/entities/user_preferences_entity.dart`

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
    return {
      if (preferredPlantCategory != null)
        'preferred_plant_category': preferredPlantCategory,
      'experience_level': experienceLevel,
      if (favoritePlants.isNotEmpty) 'favorite_plants': favoritePlants,
    };
  }
}
```

---

## 📄 ARCHIVO 3: Data Model - Plant

**Ruta**: `lib/features/preferences/data/models/plant_model.dart`

```dart
import '../../domain/entities/plant_entity.dart';

class PlantModel extends PlantEntity {
  PlantModel({
    required super.id,
    required super.species,
    required super.scientificName,
    required super.type,
    required super.sunRequirement,
    required super.weeklyWatering,
    required super.harvestDays,
    required super.soilType,
    required super.waterPerKg,
    required super.benefits,
    required super.size,
  });

  factory PlantModel.fromJson(Map<String, dynamic> json) {
    return PlantModel(
      id: json['id'] as int,
      species: json['species'] as String,
      scientificName: json['scientificName'] as String,
      type: List<String>.from(json['type'] as List),
      sunRequirement: json['sunRequirement'] as String,
      weeklyWatering: json['weeklyWatering'] as int,
      harvestDays: json['harvestDays'] as int,
      soilType: json['soilType'] as String,
      waterPerKg: json['waterPerKg'] as int,
      benefits: List<String>.from(json['benefits'] as List),
      size: (json['size'] as num).toDouble(),
    );
  }
}
```

---

## 📄 ARCHIVO 4: Data Source - Plants

**Ruta**: `lib/features/preferences/data/datasource/plants_datasource.dart`

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

    try {
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
    } catch (e) {
      throw ServerException(message: 'Error de conexión: $e');
    }
  }
}
```

---

## 📄 ARCHIVO 5: Data Source - User Preferences

**Ruta**: `lib/features/preferences/data/datasource/user_preferences_datasource.dart`

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

    try {
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
    } catch (e) {
      if (e is ServerException) rethrow;
      throw ServerException(message: 'Error de conexión: $e');
    }
  }
}
```

---

## 📝 Continúa en el siguiente archivo...

La guía completa incluye 15+ archivos. Los archivos más importantes son:
1. ✅ Entities (Domain)
2. ✅ Models (Data)
3. ✅ DataSources (Data)
4. 🔄 Repository (siguiente)
5. 🔄 UseCases (siguiente)
6. 🔄 Provider/ViewModel (siguiente)
7. 🔄 UI/Widgets (siguiente)
8. 🔄 Dependency Injection (siguiente)

## ⚙️ Configuración Requerida

### 1. Actualizar pubspec.yaml (ya tiene las dependencias):
- ✅ provider
- ✅ http
- ✅ flutter_dotenv
- ✅ flutter_secure_storage

### 2. Configurar .env:
```env
API_GATEWAY_URL=http://tu-ip:3000
```

### 3. Agregar ruta en app_routes.dart:
```dart
GoRoute(
  path: '/preferences',
  name: 'preferences',
  builder: (context, state) => const UserPreferencesPage(),
),
```

## 🚀 Flujo de Uso

1. **Después del registro exitoso** → Navegar a `/preferences`
2. Usuario completa el formulario
3. Al presionar "Guardar", se llama a `PUT /users/:id`
4. Navegar a home si todo es exitoso

## 🎨 UI Recomendada

- **CategorySelector**: Material Radio Buttons o Cards seleccionables
- **ExperienceSelector**: Slider o segmented buttons
- **PlantsMultiSelector**: ListView con Checkboxes, buscar y filtrar

