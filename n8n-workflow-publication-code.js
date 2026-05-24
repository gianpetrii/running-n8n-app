// ============================================
// WORKFLOW 2: PUBLICACIÓN EN INSTAGRAM
// Nodo Code - Generar Caption
// ============================================

// Obtener el item actual
const item = $input.item.json;

// Función para formatear fecha en español
function formatDate(dateString) {
  if (!dateString) return null;
  
  const date = new Date(dateString);
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  
  const diaSemana = dias[date.getDay()];
  const dia = date.getDate();
  const mes = meses[date.getMonth()];
  const anio = date.getFullYear();
  
  return `${diaSemana} ${dia} de ${mes} de ${anio}`;
}

// Función para parsear contact_info JSON
function parseContactInfo(contactInfoString) {
  if (!contactInfoString) return {};
  
  try {
    return JSON.parse(contactInfoString);
  } catch (e) {
    return {};
  }
}

// Extraer datos
const name = item.name || 'Carrera sin nombre';
const location = item.location || 'Ubicación a confirmar';
const raceDate = item.race_at;
const startTime = item.start_time;
const distances = item.distances || 'Distancias a confirmar';
const category = item.category || 'Running';
const imageUrl = item.image_url;
const airtableId = item.id; // ID de Airtable para actualizar después
const contactInfo = parseContactInfo(item.contact_info);

// Formatear fecha
const formattedDate = formatDate(raceDate);
const dateText = formattedDate ? `📅 Fecha: ${formattedDate}` : '📅 Fecha: A confirmar';
const timeText = startTime ? ` - ${startTime}hs` : '';

// Construir sección de contacto
let contactText = '';
if (contactInfo.instagram && contactInfo.instagram.length > 0) {
  contactText += `📱 Instagram: @${contactInfo.instagram[0]}\n`;
}
if (contactInfo.whatsapp && contactInfo.whatsapp.length > 0) {
  contactText += `💬 WhatsApp: +${contactInfo.whatsapp[0]}\n`;
}
if (contactInfo.email && contactInfo.email.length > 0) {
  contactText += `📧 Email: ${contactInfo.email[0]}\n`;
}
if (contactInfo.facebook && contactInfo.facebook.length > 0) {
  contactText += `👥 Facebook: ${contactInfo.facebook[0]}\n`;
}

// Construir caption
const caption = `🏃‍♂️ ${name.toUpperCase()} 🏃‍♀️

${dateText}${timeText}
📍 Ubicación: ${location}
🏁 Distancias: ${distances}
🎯 Categoría: ${category}

${contactText}
¡No te lo pierdas! 🔥

#running #carrera #trail #argentina #correr #runner #trailrunning #ultratrail #fitness #deporte #carrerapopular #run #marathon #maratón #sport`;

// Retornar datos estructurados
return {
  airtable_id: airtableId,
  image_url: imageUrl,
  caption: caption
};
