# ⚠️ CAMBIOS IMPORTANTES - Sistema de Generación de Datos

## 🔐 Regla Crítica Implementada

### **Solo usuarios verificados pueden tener huertos**

**Razón:** `is_verified: true` significa que el usuario completó exitosamente el proceso de registro y verificación.

---

## 📋 Impacto en los Números

### Antes (lógica incorrecta)
- ❌ Usuarios no verificados: 20% podían tener huertos
- ❌ Total esperado: ~70,000 huertos

### Después (lógica correcta) ✅
- ✅ Usuarios no verificados (20,000): **0 huertos** (sin acceso)
- ✅ Usuarios verificados (80,000): ~70% tendrán huertos
- ✅ Total esperado: **~56,000 huertos**

---

## 🔄 Distribución Actualizada

### De 100,000 usuarios:

```
┌─────────────────────────────────────────────────────┐
│          USUARIOS NO VERIFICADOS (20,000)           │
│                 is_verified: false                  │
│                                                     │
│  ❌ 0 huertos (sin acceso al sistema)              │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│           USUARIOS VERIFICADOS (80,000)             │
│                 is_verified: true                   │
│                                                     │
│  Nivel 1 (40,000):                                  │
│  ├─ 50% probabilidad → ~20,000 con huertos          │
│  └─ 50% sin huertos → ~20,000 sin huertos           │
│                                                     │
│  Nivel 2 (28,000):                                  │
│  ├─ 75% probabilidad → ~21,000 con huertos          │
│  └─ 25% sin huertos → ~7,000 sin huertos            │
│                                                     │
│  Nivel 3 (12,000):                                  │
│  ├─ 90% probabilidad → ~10,800 con huertos          │
│  └─ 10% sin huertos → ~1,200 sin huertos            │
│                                                     │
│  TOTAL VERIFICADOS CON HUERTOS: ~51,800             │
└─────────────────────────────────────────────────────┘

TOTAL HUERTOS GENERADOS: ~120,000
(promedio 2.1 huertos por usuario con huertos)
```

---

## 🎯 Lógica Implementada

### En `SeedOrchardsUseCase.ts`

```typescript
private shouldUserHaveOrchards(user: UserDTO): boolean {
  // ⚠️ CRÍTICO: Solo usuarios verificados pueden crear huertos
  // is_verified: true = registro exitoso con verificación
  if (!user.is_verified) {
    return false;  // ❌ SIN ACCESO
  }

  // Usuarios verificados: según experiencia
  const probabilityByExperience = {
    1: 0.50,  // Principiantes: 50%
    2: 0.75,  // Intermedios: 75%
    3: 0.90   // Avanzados: 90%
  };

  return Math.random() < probabilityByExperience[user.experience_level];
}
```

---

## 📊 Números Finales Esperados

| Categoría | Cantidad |
|-----------|----------|
| **Total usuarios** | 100,000 |
| **Usuarios verificados** | 80,000 (80%) |
| **Usuarios NO verificados** | 20,000 (20%) |
| **Usuarios con huertos** | ~56,000 (70% de verificados) |
| **Promedio huertos/usuario** | 2.1 |
| **Total huertos** | ~120,000 |
| **Huertos activos** | ~94,000 (78%) |
| **Huertos abandonados** | ~26,000 (22%) |

---

## 🔍 Validación

Para verificar que la regla se cumple:

```bash
# 1. Generar usuarios
curl -X POST "http://localhost:3001/api/users/seed?total=1000"

# 2. Generar huertos
curl -X POST "http://localhost:3004/orchards/seed"

# 3. Verificar en MongoDB
mongosh
> use orchard_db
> db.orchards.find().forEach(function(orchard) {
    // Obtener usuario correspondiente
    const user = db.users.findOne({_id: orchard.userId});
    if (!user.is_verified) {
      print("ERROR: Huerto encontrado para usuario NO verificado: " + user.email);
    }
  })

# Resultado esperado: 0 errores
```

---

## ✅ Checklist de Corrección

- [x] Modificado `shouldUserHaveOrchards()` en SeedOrchardsUseCase.ts
- [x] Eliminada lógica de "20% para no verificados"
- [x] Actualizado SEED_ORCHARDS_GUIDE.md
- [x] Actualizado README_SEED_SYSTEM.md
- [x] Actualizada tabla de probabilidades
- [x] Actualizado flujo de ejecución
- [x] Corregidas estadísticas esperadas

---

## 🎓 Implicaciones para Clustering

Esta corrección hace los datos **más realistas**:

✅ **Comportamiento real:**
- Usuarios no verificados = usuarios que abandonaron el registro
- Solo usuarios comprometidos (verificados) invierten tiempo en crear huertos

✅ **Mejor para ML:**
- Menos ruido en los datos
- Patrones más claros
- Anomalías más significativas

✅ **Coherencia de negocio:**
- Refleja restricción real del sistema
- is_verified es prerequisito para features avanzadas

---

## 📝 Nota Final

Esta corrección es **crítica** para la coherencia del sistema. Los 20,000 usuarios no verificados representan:
- Usuarios que abandonaron el proceso de registro
- Cuentas pendientes de verificación
- Usuarios que nunca completaron el onboarding

Es lógico y esperado que **no tengan huertos**.
