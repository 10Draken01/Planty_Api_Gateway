# 📋 RESUMEN EJECUTIVO - AVISO DE PRIVACIDAD PLANTY

## 🎯 Información Clave

| **Campo** | **Detalle** |
|-----------|-------------|
| **Proyecto** | Planty - Sistema de Gestión de Huertos Urbanos |
| **Institución** | Universidad Politécnica de Chiapas |
| **Naturaleza** | Proyecto Integrador Académico |
| **Período** | Enero - Junio 2025 |
| **Responsable** | Armando Rodríguez Villarreal |
| **Contacto ARCO** | bs.personal.0001@gmail.com |
| **Base Legal** | Ley Federal de Protección de Datos Personales (INAI) |

---

## 👥 Equipo de Desarrollo

1. **Leonardo Favio Nájera Morales** - Matrícula: 231230
2. **Edgar Fabricio Jiménez Urbina** - Matrícula: 231221
3. **Armando Rodríguez Villarreal** - Matrícula: 231184
4. **Ángel Gabriel Guzmán Pérez** - Matrícula: 223270

---

## 📊 Datos Personales Recopilados

### Datos de Identificación
- ✅ Nombre completo
- ✅ Correo electrónico
- ✅ Contraseña (cifrada - **DATO SENSIBLE**)
- ⚪ Imagen de perfil (opcional)
- ✅ Fecha de registro

### Datos de Uso
- ✅ Nivel de experiencia en cultivo
- ✅ Información de huertos (nombre, dimensiones, descripción)
- ✅ Información de plantas (especies, requerimientos, notas)
- ✅ Historial de actividades
- ✅ Preferencias de configuración
- ✅ Token de dispositivo (notificaciones)

### Datos Técnicos
- ✅ UUID (identificador único)
- ✅ Token de sesión (JWT)
- ✅ Fecha/hora de uso

### ❌ Datos que NO se recopilan
- ❌ Ubicación GPS
- ❌ Datos biométricos
- ❌ Información financiera
- ❌ Datos de salud
- ❌ Preferencias políticas/religiosas

---

## 🎯 Finalidades del Tratamiento

### Finalidades Primarias (Necesarias)
1. Crear y administrar cuenta de usuario
2. Proporcionar funcionalidades de gestión de huertos
3. Generar recomendaciones mediante algoritmo genético
4. Enviar notificaciones sobre riego, clima y recomendaciones
5. Brindar asistencia mediante chatbot IA (local)
6. Almacenar y gestionar información de huertos

### Finalidades Secundarias (Opcionales)
1. Mejorar experiencia de usuario
2. Desarrollo y evaluación del proyecto

---

## 🤖 Microservicios y Tratamiento de Datos

### 1. Microservicio de Autenticación
- **Datos:** Email, contraseña (cifrada), nombre, ID usuario
- **Procesamiento:** Login, registro, gestión de tokens JWT
- **Seguridad:** Cifrado bcrypt, HTTPS, tokens seguros

### 2. Microservicio de Chatbot
- **Tecnología:** IA Local (Llama 3.2)
- **Datos:** Mensajes del usuario, session ID
- **Almacenamiento:** Solo en dispositivo, NO en servidor
- **Terceros:** NINGUNO - 100% local
- **Privacidad:** Conversaciones NO compartidas

### 3. Microservicio de Huertos
**Entidad: Orchard**
- ID, nombre, descripción
- Dimensiones (width, height)
- Lista de plantas asociadas
- Estado, fecha de creación/actualización
- Tiempo de vida, racha de días
- Contador de plantas

**Entidad: Plant**
- ID, nombre, especie, nombre científico
- Tipo, requerimientos de sol
- Riego semanal, días de cosecha
- Tipo de suelo, agua por kg
- Beneficios, tamaño, notas, tags

### 4. Microservicio de Notificaciones
- **Plataforma:** Firebase Cloud Messaging
- **Datos:** Token de dispositivo
- **Tipos de notificaciones:**
  - Recordatorios de riego
  - Alertas climáticas
  - Recomendaciones de huertos
- **Tercero:** Google (Firebase)

### 5. Microservicio de Algoritmo Genético
- **Función:** Genera 3 plantillas de huertos optimizadas
- **Input:**
  - Plantas seleccionadas
  - Espacio disponible (width × height)
  - Requerimientos hídricos
  - Categoría (Vegetal | Medicinal | Ornamental | Aromática)
- **Procesamiento:** Algoritmo genético local
- **Output:** Recomendaciones personalizadas
- **Privacidad:** Procesamiento local, sin compartir datos

### 6. Modelo de Machine Learning
- **Función:** Categorización de usuarios y recomendaciones
- **Datos analizados:**
  - Patrones de uso
  - Nivel de experiencia
  - Tipos de plantas cultivadas
  - Historial de actividades
- **Output:**
  - Recomendaciones de huertos
  - Recordatorios inteligentes de riego
  - Alertas de riesgos para plantas

---

## 🔒 Datos Sensibles (Según LFPDPPP)

### ✅ Clasificación Oficial
**ÚNICO DATO SENSIBLE:** Contraseña de acceso

### ❌ NO son Datos Sensibles
- Nombre, email, imagen de perfil
- Información de huertos y plantas
- Nivel de experiencia
- Preferencias de la app
- Historial de uso

**Fundamento:** Art. 3, fracc. VI de la LFPDPPP - No revelan origen étnico, estado de salud, información genética, creencias religiosas, preferencia sexual, etc.

---

## 🌐 Transferencia de Datos a Terceros

| **Tercero** | **Finalidad** | **Datos Transferidos** | **Base Legal** |
|-------------|---------------|------------------------|----------------|
| Firebase Cloud Messaging (Google) | Notificaciones push | Token de dispositivo, ID usuario | Consentimiento |
| Servicios de nube | Almacenamiento seguro | Todos los datos de la app | Consentimiento |

### 🛡️ Importante sobre el Chatbot
- ✅ IA 100% local (Llama 3.2)
- ✅ Conversaciones NO enviadas a terceros
- ✅ NO se usa OpenAI, Google Gemini u otros
- ✅ Conversaciones NO almacenadas en servidor

---

## ⚖️ Derechos ARCO

### Derechos del Usuario
1. **Acceso:** Conocer qué datos tenemos
2. **Rectificación:** Corregir datos inexactos
3. **Cancelación:** Eliminar tu cuenta y datos
4. **Oposición:** Negarte al tratamiento

### Procedimiento
- 📧 **Contacto:** bs.personal.0001@gmail.com
- 📝 **Requisitos:** Nombre, email registrado, solicitud clara, ID oficial
- ⏱️ **Tiempo de respuesta:** Máximo 1 hora
- 👤 **Responsable:** Leonardo Favio Nájera Morales

---

## 🔐 Medidas de Seguridad Implementadas

### Técnicas
1. **Cifrado de contraseñas:** bcrypt/hash con salt
2. **Comunicación segura:** HTTPS/TLS
3. **Autenticación:** JSON Web Tokens (JWT)
4. **Almacenamiento:** Secure Storage en dispositivo
5. **Arquitectura:** Microservicios con autenticación
6. **Validación:** Prevención de SQL injection y XSS
7. **Rate Limiting:** Protección contra ataques de fuerza bruta

### Administrativas
1. Acceso restringido a datos
2. Logs de actividad
3. Política de contraseñas seguras
4. Respaldos periódicos (según configuración)

---

## 📅 Conservación de Datos

| **Aspecto** | **Detalle** |
|-------------|-------------|
| **Período** | Durante el proyecto (enero - junio 2025) |
| **Post-proyecto** | Eliminación automática |
| **Eliminación anticipada** | Disponible bajo solicitud |
| **Método de eliminación** | Borrado seguro de bases de datos |

---

## 👶 Política para Menores de Edad

| **Categoría** | **Edad** | **Requisito** |
|---------------|----------|---------------|
| **Prohibido** | < 13 años | No puede usar la app |
| **Con consentimiento** | 13-17 años | Requiere autorización de padres/tutores |
| **Sin restricción** | ≥ 18 años | Puede usar libremente |

### Verificación
- ⚠️ Al registrarse siendo menor de 18, el usuario declara tener consentimiento
- ⚠️ La app NO verifica activamente la edad
- ⚠️ Padres/tutores pueden solicitar eliminación de cuenta de menores

---

## 🎓 Naturaleza del Proyecto

### Características
- ✅ Proyecto integrador académico
- ✅ Fines exclusivamente educativos
- ✅ NO tiene fines comerciales
- ✅ NO se venderán datos a terceros
- ✅ NO habrá publicidad dirigida

### Alcance Temporal
- **Inicio:** Enero 2025
- **Fin:** Junio 2025
- **Evaluación:** Proyecto integrador universitario

---

## 📜 Cumplimiento Legal

### Normativa Aplicable
1. **Ley Federal de Protección de Datos Personales en Posesión de los Particulares**
2. **Reglamento de la LFPDPPP**
3. **Lineamientos del Aviso de Privacidad (INAI)**
4. **Código de Mejores Prácticas (INAI)**

### Autoridad Competente
- **Instituto Nacional de Transparencia, Acceso a la Información y Protección de Datos Personales (INAI)**
- **Sitio web:** www.inai.org.mx

---

## 🔄 Actualización del Aviso

### Notificación de Cambios
Los cambios se notificarán mediante:
1. ✉️ Notificación in-app
2. 📧 Correo electrónico
3. 📱 Sección de configuración

### Aceptación
- El uso continuado de la app implica aceptación de cambios
- Cambios sustanciales requerirán nuevo consentimiento expreso

---

## ✅ Consentimiento

### Momento del Consentimiento
- Al crear cuenta en la aplicación
- Checkbox explícito: "He leído y acepto el Aviso de Privacidad"
- Acceso al texto completo del aviso

### Forma
- ✅ Consentimiento expreso (checkbox)
- ✅ Accesible antes del registro
- ✅ Puede revocarse en cualquier momento

---

## 📞 Contacto

### Para Ejercer Derechos ARCO
📧 **Email principal:** bs.personal.0001@gmail.com
👤 **Responsable:** Leonardo Favio Nájera Morales
⏱️ **Tiempo de respuesta:** Máximo 1 hora

### Información del Proyecto
📧 **Email institucional:** 231184@ids.upchiapas.edu.mx
👤 **Responsable del proyecto:** Armando Rodríguez Villarreal
🏛️ **Institución:** Universidad Politécnica de Chiapas
📍 **Ubicación:** Suchiapa, Chiapas, México, C.P. 29150

---

## 📄 Documentos Generados

1. ✅ **aviso_privacidad_simplificado.tex** - Versión LaTeX completa
2. ✅ **aviso_privacidad_app.md** - Versión corta para app
3. ✅ **privacy_policy.dart** - Constantes para Flutter
4. ✅ **privacy_policy_page.dart** - Página Flutter completa
5. ✅ **RESUMEN_AVISO_PRIVACIDAD.md** - Este documento

---

**Fecha de elaboración:** Enero 2025
**Última actualización:** Enero 2025
**Versión:** 1.0

---

*Este aviso cumple con los lineamientos del INAI para proyectos académicos y ha sido elaborado conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares.*
