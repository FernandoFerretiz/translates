
# Herramienta de Traducción JSON con DeepL

Este script permite comparar archivos **JSON** de traducciones, identificar claves faltantes en archivos secundarios y generar las traducciones correspondientes utilizando la API de **DeepL**. Además, guarda un **log en formato Markdown** (`log.md`) que organiza las traducciones generadas.

---

## Requisitos

1. **Node.js** instalado (versión >= 12).
2. Una cuenta de **DeepL** para obtener tu clave API.
3. Archivo base `en.json` que contiene las claves y valores en inglés.
4. Archivos JSON adicionales que deben compararse con el archivo base.

---

## Instalación

1. **Clona este repositorio** o descarga los archivos.
   ```bash
   git clone <URL-del-repositorio>
   cd <directorio-del-repositorio>
   ```

2. **Instala las dependencias**:
   ```bash
   npm install
   ```

3. **Configura tu clave de API de DeepL**:
   - Crea un archivo `.env` en la raíz del proyecto.
   - Agrega tu clave API en el archivo:
     ```plaintext
     DEEPL_API_KEY=tu_clave_api_aquí
     ```

4. **Estructura de archivos JSON**:
   - Asegúrate de tener un archivo `en.json` en la carpeta que contenga las claves base.
   - Coloca los demás archivos JSON en el mismo directorio.

---

## Uso

1. **Ejecuta el script**:
   ```bash
   node script.js
   ```

2. **Sigue las instrucciones**:
   - Introduce la ruta donde se encuentran tus archivos JSON.
   - Selecciona los archivos JSON que deseas procesar (excluyendo `en.json`).
   - Elige si deseas **sobrescribir** los archivos originales o guardar las traducciones en una carpeta nueva (`/translates`).

3. **Traducciones generadas**:
   - El script utiliza **DeepL** para traducir las claves faltantes en cada archivo JSON seleccionado.
   - Las claves y traducciones se guardarán en el archivo `log.md` con un formato legible en Markdown.

---

## Salida

### Ejemplo de archivo `log.md`:

```markdown
# Traducciones Generadas

## Traducción para el idioma: `es`

| Clave              | Traducción         |
|--------------------|--------------------|
| greeting           | Hola              |
| farewell           | Adiós             |
| user.name          | Nombre de usuario |

---

## Traducción para el idioma: `fr`

| Clave              | Traducción         |
|--------------------|--------------------|
| greeting           | Bonjour           |
| farewell           | Au revoir         |
| user.name          | Nom d'utilisateur |

---
```

### Traducciones JSON

Los archivos traducidos se guardarán de acuerdo a tu selección:
- **Si sobrescribes**: Los archivos originales serán actualizados con las traducciones.
- **Si usas una carpeta nueva**: Los archivos traducidos se guardarán en la carpeta `/translates`.

---

## Notas adicionales

- Asegúrate de que `en.json` esté completo y bien estructurado.
- Verifica tu clave de **DeepL** y el límite de uso de la API para evitar errores.
- Si algún archivo JSON tiene problemas, el script mostrará mensajes de error.

---
