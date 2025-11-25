# Documentación de Medición COSMIC - ApiGateway

Esta carpeta contiene el análisis completo de **Puntos Función COSMIC** del proyecto ApiGateway.

## 📊 Resultado Principal

**Total de Puntos Función COSMIC: 117 CFPs**

## 📁 Archivos en esta Carpeta

### 1. `PuntosFuncion_COSMIC.tex`
**Tipo:** Documento LaTeX completo y formal

**Contenido:**
- Portada y tabla de contenidos
- Resumen ejecutivo con cifras totales
- Alcance del conteo y metodología COSMIC v4.0
- Descripción detallada de los 23 procesos funcionales
- Tabla consolidada con movimientos E/X/R/W
- Cálculo paso a paso con verificaciones
- Supuestos, decisiones de medición y evidencias
- Anexos con glosario y referencias normativas

**Uso:** Compilar con `pdflatex` o cualquier editor LaTeX para generar el PDF formal.

```bash
pdflatex PuntosFuncion_COSMIC.tex
```

### 2. `puntos_cosmic.json`
**Tipo:** Datos estructurados JSON

**Contenido:**
- Metadata del proyecto y análisis
- Definición del límite del software
- 23 procesos funcionales con detalle completo:
  - ID, nombre, descripción
  - Servicio y endpoint REST
  - Movimientos Entry/Exit/Read/Write
  - CFPs totales por proceso
  - Evidencia (referencias de código)
- Resumen por microservicio
- Totales del proyecto
- Supuestos y observaciones
- Trazabilidad completa

**Uso:** Importar en herramientas de análisis, bases de datos, o aplicaciones de gestión de proyectos.

### 3. `RESUMEN_EJECUTIVO.md`
**Tipo:** Resumen ejecutivo en Markdown (máximo 300 palabras)

**Contenido:**
- Resultado principal (117 CFPs)
- Distribución por microservicio
- Hallazgos clave
- Composición funcional
- Aplicaciones prácticas
- Recomendaciones

**Uso:** Lectura rápida para stakeholders y gestores de proyecto.

### 4. `README.md`
**Tipo:** Guía de navegación (este archivo)

## 🎯 Resumen de Resultados

| Microservicio | Procesos Funcionales | CFPs | % del Total |
|--------------|----------------------|------|-------------|
| **Orchard Service** | 9 | 44 | 37.6% |
| **Chatbot Service** | 6 | 32 | 27.4% |
| **Users Service** | 5 | 29 | 24.8% |
| **Authentication Service** | 3 | 12 | 10.3% |
| **TOTAL** | **23** | **117** | **100%** |

## 🔍 Composición de Movimientos

- **Entry (E):** 51 CFPs (43.6%)
- **Read (R):** 25 CFPs (21.4%)
- **Exit (X):** 23 CFPs (19.7%)
- **Write (W):** 18 CFPs (15.4%)

## 📋 Procesos Funcionales Medidos

### Authentication Service (12 CFPs)
- PF-AUTH-001: Registro de Usuario (6 CFPs)
- PF-AUTH-002: Inicio de Sesión (4 CFPs)
- PF-AUTH-003: Validación de Token (2 CFPs)

### Users Service (29 CFPs)
- PF-USER-001: Creación de Usuario (9 CFPs)
- PF-USER-002: Consulta por ID (3 CFPs)
- PF-USER-003: Consulta por Email (3 CFPs)
- PF-USER-004: Actualización de Usuario (10 CFPs)
- PF-USER-005: Eliminación de Usuario (4 CFPs)

### Chatbot Service (32 CFPs)
- PF-CHAT-001: Envío de Mensaje al Chatbot (9 CFPs)
- PF-CHAT-002: Consulta de Historial (3 CFPs)
- PF-DOC-001: Carga de Documento PDF (5 CFPs)
- PF-DOC-002: Procesamiento de Documento (8 CFPs)
- PF-DOC-003: Listar Documentos (2 CFPs)
- PF-DOC-004: Eliminación de Documento (5 CFPs)

### Orchard Service (44 CFPs)
- PF-ORC-001: Crear Huerto (7 CFPs)
- PF-ORC-002: Consulta por ID (3 CFPs)
- PF-ORC-003: Listar Huertos (3 CFPs)
- PF-ORC-004: Actualizar Huerto (9 CFPs)
- PF-ORC-005: Eliminar Huerto (4 CFPs)
- PF-ORC-006: Activar Huerto (4 CFPs)
- PF-ORC-007: Desactivar Huerto (4 CFPs)
- PF-ORC-008: Agregar Planta (5 CFPs)
- PF-ORC-009: Remover Planta (5 CFPs)

## 📖 Metodología

**Estándar:** COSMIC v4.0 (ISO/IEC 19761:2011)

**Método:** Análisis estático de código fuente con mapeo de endpoints REST a procesos funcionales COSMIC.

**Evidencia:** Trazabilidad completa a archivos de código fuente (controladores, casos de uso, repositorios).

## 🎓 Documento de Referencia

Este análisis se basó en la estructura metodológica del documento:
- `Docs/PuntosFuncionCosmic.pdf` (Proyecto PIWEB)

## ⚠️ Supuestos Importantes

1. **Ollama** se considera usuario funcional externo (fuera del límite)
2. **ChromaDB** se considera almacenamiento persistente interno
3. **API Gateway** actúa como proxy transparente (sin procesos propios)
4. **Servicios de notificaciones y algoritmo genético** no fueron medidos (sin implementación visible)

## 📞 Contacto

**Analista:** Especialista Certificado COSMIC (CCFL)
**Fecha de Análisis:** 24 de noviembre de 2025
**Versión COSMIC:** 4.0

## 🔗 Referencias

- [COSMIC Measurement Manual v4.0](https://cosmic-sizing.org/)
- ISO/IEC 19761:2011 - COSMIC FSM Method
- Documento de referencia: `Docs/PuntosFuncionCosmic.pdf`

---

**Generado automáticamente por:** Claude Code (Especialista COSMIC CCFL)
