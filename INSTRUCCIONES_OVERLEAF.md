# Instrucciones para compilar en Overleaf

## Opción 1: Usar el archivo compatible con pdflatex (RECOMENDADO)

1. Abre Overleaf
2. Sube el archivo `Presupuesto_Planty_ApiGateway_pdflatex.tex`
3. Asegúrate de que esté seleccionado como compilador **pdfLaTeX** (es el predeterminado)
4. Haz clic en "Recompile"
5. ✅ Debería compilar sin errores

## Opción 2: Cambiar el compilador a XeLaTeX

Si quieres usar el archivo original con fontspec:

1. Abre Overleaf
2. Sube el archivo `Presupuesto_Planty_ApiGateway.tex`
3. Haz clic en el **menú** (icono de hamburguesa arriba a la izquierda)
4. En la sección "Settings", busca **Compiler**
5. Cambia de "pdfLaTeX" a **"XeLaTeX"**
6. Haz clic en "Recompile"
7. ✅ Ahora debería compilar correctamente

## Diferencias entre los archivos

- **`Presupuesto_Planty_ApiGateway_pdflatex.tex`**:
  - ✅ Funciona directamente en Overleaf sin cambios
  - ❌ No usa fontspec (menos flexibilidad tipográfica)
  - Usa fuentes sans-serif estándar de LaTeX

- **`Presupuesto_Planty_ApiGateway.tex`**:
  - ⚠️ Requiere cambiar compilador a XeLaTeX
  - ✅ Usa fontspec para mayor control tipográfico
  - Mejor para personalizaciones futuras

## Notas sobre imágenes

El documento incluye referencias a imágenes decorativas que son **OPCIONALES**:
- `abstract-background.jpg`
- `checkmark-icon.png`
- `analyst-icon.png`
- `tester-icon.png`
- `designer-icon.png`
- `developer-icon.png`

Si no tienes estas imágenes:
1. El documento seguirá compilando
2. Aparecerán cuadros con el nombre del archivo faltante
3. Puedes comentar esas líneas con `%` al inicio

## Personalización

Reemplaza los siguientes campos en el documento:

1. **Portada** (líneas 60-66):
   - `[Tu Nombre]`
   - `[Nombres del Equipo]`
   - `[Integrante 2]`
   - `[Integrante 3]`
   - `[Integrante 4]`

2. **Costos y presupuestos**: Ya están calculados basándose en el análisis real del repositorio

## Solución de problemas

### Error: "File not found"
- Las imágenes referenciadas no existen. Coméntalas o súbelas a Overleaf.

### Error: "fontspec requires XeLaTeX"
- Cambia el compilador a XeLaTeX (ver Opción 2 arriba) o usa la versión `_pdflatex.tex`

### Error: "Undefined control sequence"
- Verifica que todos los paquetes estén cargados correctamente
- Overleaf debería tener todos los paquetes necesarios

## Resultado final

El documento generará un PDF profesional de aproximadamente **12-13 páginas** con:
- ✅ Portada elegante en azul
- ✅ Problemática
- ✅ Ficha del producto
- ✅ Salarios
- ✅ Diagrama de actividades
- ✅ Tabla de actividades
- ✅ Cronograma
- ✅ Tabla de costos
- ✅ Presupuesto final
- ✅ Análisis de punto de equilibrio
- ✅ Comparación con competidores
- ✅ Página de agradecimiento

Total calculado: **$41,024.95 MXN**
