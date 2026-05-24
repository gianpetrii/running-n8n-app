# Proyecto: Automatización de Publicaciones de Carreras en Instagram

## Objetivo
Sistema automatizado con n8n que:
1. Scrapea carreras de running desde RSS de Corredor Promedio
2. Almacena en Airtable
3. Publica automáticamente en Instagram 3 meses antes de cada carrera

---

## Arquitectura: 2 Workflows Separados

### WORKFLOW 1: SCRAPING Y ALMACENAMIENTO
**Trigger:** Schedule (cada 6-12 horas)

**Flujo:**
```
RSS Feed Read → Code (procesar) → Loop Over Items → Search Airtable → IF existe?
                                                                    ├─ TRUE → Update Airtable
                                                                    └─ FALSE → Create Airtable
```

**Nodos:**
1. **RSS Feed Read**: `https://www.corredorpromedio.com/carreras/argentina/feed/`
2. **Code in JavaScript**: Procesa y extrae datos (ver archivo separado)
3. **Loop Over Items**: Itera sobre cada carrera
4. **Search Airtable**: Busca por `source_url` para deduplicación
5. **IF**: Verifica si existe (`Object.keys($json).length > 0`)
6. **Create/Update Airtable**: Inserta o actualiza registro

---

## Estructura de Datos en Airtable

### Tabla: "Eventos"
### Base: "running-argentina"

| Campo | Tipo | Descripción | Obligatorio |
|-------|------|-------------|-------------|
| `source_url` | URL | ID único del RSS (guid) | ✅ SÍ |
| `name` | Single line text | Nombre de la carrera | ✅ SÍ |
| `location` | Single line text | Ubicación completa | ✅ SÍ |
| `race_at` | Date | Fecha de la carrera (ISO) | ✅ SÍ |
| `start_time` | Single line text | Hora de inicio (HH:MM) | ❌ NO |
| `distances` | Long text | Distancias disponibles | ✅ SÍ |
| `category` | Single select | Tipo de carrera | ✅ SÍ |
| `image_url` | URL | Imagen de la carrera | ✅ SÍ |
| `contact_info` | Long text | JSON con contactos | ❌ NO |
| `website` | URL | Link del evento | ✅ SÍ |
| `published_at` | Date/Time | Fecha del RSS | ❌ NO |
| `created_at` | Date/Time | Fecha de scraping | ✅ SÍ |
| `publish_at` | Date | Cuándo publicar en IG | ❌ NO |
| `status` | Single select | Estado del proceso | ✅ SÍ |
| `published_real_at` | Date/Time | Cuándo se publicó en IG | ❌ NO |
| `instagram_post_id` | Single line text | ID del post en IG | ❌ NO |

### Valores de `category`:
- Trail
- Ultra
- Cross
- Nocturna
- Maraton (sin tilde)
- Ruta

### Valores de `status`:
- `pending` - Sin procesar
- `incomplete` - Faltan datos obligatorios
- `ready` - Lista para publicar
- `published` - Ya publicada en Instagram
- `expired` - Carrera pasada o < 3 meses
- `cancelled` - Cancelada

---

## Lógica de Procesamiento (Code Node)

### Extracción de Datos del RSS:

**Campos disponibles en RSS:**
- `title` → `name`
- `guid` → `source_url`
- `link` → `website`
- `content:encoded` → HTML con toda la info
- `content` → Snippet con imagen
- `pubDate` / `isoDate` → `published_at`

**Extracción por patrones (regex):**

1. **Fecha de carrera (`race_at`):**
   - Busca: "7 de febrero de 2026", "sábado 14 de febrero de 2026"
   - Valida: año entre 2024-2030
   - Formato salida: `YYYY-MM-DD`

2. **Ubicación (`location`):**
   - Busca: "en Ciudad, Provincia, Argentina"
   - Filtra: ubicaciones genéricas como "el", "la", "Av"

3. **Distancias (`distances`):**
   - Busca: "42K, 21K, 10K" o similar
   - Regex: `\d+K(?:,\s*\d+K)*`

4. **Categoría (`category`):**
   - Analiza título y contenido
   - Keywords: "trail", "ultra", "cross", "nocturna", "maratón"

5. **Imagen (`image_url`):**
   - Extrae primera imagen del campo `content`
   - Regex: `<img[^>]+src="([^">]+)"`

6. **Contacto (`contact_info`):**
   - Instagram: busca `@usuario`
   - WhatsApp: busca `wa.me/+numero`
   - Email: busca `mailto:email`
   - Facebook: busca `facebook.com/usuario`
   - Guarda como JSON string

### Cálculo de `publish_at`:

```javascript
// Lógica:
if (race_at > TODAY && race_at - 3 meses >= TODAY) {
  publish_at = race_at - 3 meses
} else if (race_at > TODAY && race_at - 3 meses < TODAY) {
  publish_at = TODAY + 1 día  // Publicar mañana
} else {
  publish_at = null  // Carrera pasada
}
```

### Determinación de `status`:

```javascript
if (!race_at || !location || !distances) {
  status = 'incomplete'
} else if (race_at <= TODAY) {
  status = 'expired'
} else if (publish_at) {
  status = 'ready'
} else {
  status = 'expired'
}
```

---

## WORKFLOW 2: PUBLICACIÓN EN INSTAGRAM

**Trigger:** Schedule (1 vez al día, ej: 9:00 AM)

**Flujo:**
```
Schedule → Airtable Search → IF hay carreras? → Loop → Code (caption) → Instagram → Update Airtable
                              └─ NO → Stop
```

**Nodos:**
1. **Schedule Trigger**: Diario a las 9:00 AM
2. **Airtable Search**: 
   - Filter: `AND({status} = 'ready', OR({publish_at} = TODAY(), {publish_at} < TODAY()), NOT({published_real_at}))`
3. **IF**: Verifica si hay resultados
4. **Loop Over Items**: Itera sobre carreras a publicar
5. **Code**: Genera caption formateado (ver archivo `n8n-workflow-publication-code.js`)
6. **Instagram**: Publica imagen + caption
7. **Airtable Update**: Marca como publicada

---

## Formato del Caption de Instagram

```
🏃‍♂️ [NOMBRE CARRERA] 🏃‍♀️

📅 Fecha: [Día de semana] [día] de [mes] de [año] - [HH:MM]hs
📍 Ubicación: [ubicación completa]
🏁 Distancias: [distancias]
🎯 Categoría: [categoría]

📱 Instagram: @[handle]
💬 WhatsApp: +[número]
📧 Email: [email]
👥 Facebook: [handle]

¡No te lo pierdas! 🔥

#running #carrera #trail #argentina #correr #runner #trailrunning #ultratrail #fitness #deporte #carrerapopular #run #marathon #maratón #sport
```

---

## Configuración de Instagram API

### Requisitos:
1. Cuenta de Instagram convertida a Business/Creator
2. Conectada a una página de Facebook
3. App de Facebook creada en developers.facebook.com
4. Instagram Graph API habilitada

### Credenciales necesarias en n8n:
- App ID
- App Secret
- Access Token (long-lived)

### Permisos necesarios:
- `instagram_basic`
- `instagram_content_publish`
- `pages_read_engagement`
- `pages_show_list`

---

## Estado Actual del Proyecto

### ✅ COMPLETADO:
- Workflow 1: Scraping completo y funcional
- Estructura de Airtable definida
- Lógica de extracción de datos del RSS
- Deduplicación por `source_url`
- Cálculo automático de `publish_at` y `status`
- Workflow 2: Estructura definida
- Code node para generar caption

### 🔄 EN PROGRESO:
- Configuración de credenciales de Instagram API
- Cuenta @running.argentina necesita registro como desarrollador

### ⏳ PENDIENTE:
- Completar configuración de Instagram
- Probar publicación end-to-end
- Generar Access Token long-lived
- Activar workflows en producción

---

## Notas Técnicas Importantes

### Deduplicación:
- Se usa `source_url` (guid del RSS) como clave única
- Antes de crear, siempre busca en Airtable
- Si existe: actualiza campos que pueden cambiar
- Si no existe: crea nuevo registro

### Campos que se actualizan en registros existentes:
- `name` (puede cambiar el nombre)
- `location` (puede completarse después)
- `race_at` (puede corregirse)
- `start_time` (puede agregarse)
- `distances` (puede actualizarse)
- `category` (puede cambiar)
- `image_url` (puede cambiar)
- `contact_info` (puede agregarse info)
- `publish_at` (recalcula si cambió race_at)
- `status` (recalcula según datos actuales)

### Campos que NO se actualizan:
- `source_url` (inmutable, es la clave)
- `created_at` (fecha original de scraping)
- `published_at` (fecha original del RSS)
- `published_real_at` (solo se setea al publicar)
- `instagram_post_id` (solo se setea al publicar)

### Manejo de datos incompletos:
- Carreras con `status = 'incomplete'` se guardan en Airtable
- Permite revisión y corrección manual
- En próximas ejecuciones del scraping, si se completan los datos, cambian a `ready`

### Volumen esperado:
- ~20 carreras/mes
- Scraping cada 6-12 horas es suficiente
- Publicación 1 vez al día

---

## Próximos Pasos

1. **Completar registro de desarrollador de Facebook**
   - Registrar cuenta en developers.facebook.com
   - Agregar @running.argentina como evaluador
   - Generar Access Token

2. **Probar publicación en Instagram**
   - Configurar credenciales en n8n
   - Ejecutar workflow 2 manualmente
   - Verificar post en Instagram

3. **Generar Access Token permanente**
   - Convertir token a long-lived (60 días)
   - Configurar refresh automático

4. **Activar en producción**
   - Activar trigger de workflow 1 (scraping)
   - Activar trigger de workflow 2 (publicación)
   - Monitorear primeras ejecuciones

5. **Mejoras futuras (opcional)**
   - Agregar scraping directo de páginas (si RSS falla)
   - Notificaciones de errores
   - Dashboard de métricas
   - Stories de Instagram

---

## Archivos del Proyecto

- `n8n-workflow-publication-code.js` - Code node para generar caption de Instagram
- `RESUMEN-PROYECTO.md` - Este archivo (documentación completa)
- (Pendiente) `workflow-1-scraping.json` - Export del workflow 1
- (Pendiente) `workflow-2-publication.json` - Export del workflow 2

---

## Contacto del Proyecto

- **Cuenta Instagram:** @running.argentina
- **RSS Source:** https://www.corredorpromedio.com/carreras/argentina/feed/
- **Airtable Base:** running-argentina
- **Airtable Table:** Eventos
