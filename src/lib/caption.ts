import type { ContactInfo } from "./extract-from-html";

function formatDate(dateString: string | null | undefined): string | null {
  if (!dateString) return null;
  const date = new Date(dateString + "T12:00:00.000Z");
  if (Number.isNaN(date.getTime())) return null;
  const dias = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ];
  const meses = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ];
  const diaSemana = dias[date.getUTCDay()];
  const dia = date.getUTCDate();
  const mes = meses[date.getUTCMonth()];
  const anio = date.getUTCFullYear();
  return `${diaSemana} ${dia} de ${mes} de ${anio}`;
}

function parseContactInfo(contactInfoString: string | null | undefined): ContactInfo {
  if (!contactInfoString) return {};
  try {
    return JSON.parse(contactInfoString) as ContactInfo;
  } catch {
    return {};
  }
}

export function buildInstagramCaption(item: {
  name: string | null;
  location: string | null;
  raceAt: string | null;
  startTime: string | null;
  distances: string | null;
  category: string | null;
  contactInfo: string | null;
}): string {
  const name = item.name || "Carrera sin nombre";
  const location = item.location || "Ubicación a confirmar";
  const raceDate = item.raceAt;
  const startTime = item.startTime;
  const distances = item.distances || "Distancias a confirmar";
  const category = item.category || "Running";
  const contactInfo = parseContactInfo(item.contactInfo);

  const formattedDate = formatDate(raceDate);
  const dateText = formattedDate ? `📅 Fecha: ${formattedDate}` : "📅 Fecha: A confirmar";
  const timeText = startTime ? ` - ${startTime}hs` : "";

  let contactText = "";
  if (contactInfo.instagram?.length) {
    contactText += `📱 Instagram: @${contactInfo.instagram[0]}\n`;
  }
  if (contactInfo.whatsapp?.length) {
    contactText += `💬 WhatsApp: +${contactInfo.whatsapp[0]}\n`;
  }
  if (contactInfo.email?.length) {
    contactText += `📧 Email: ${contactInfo.email[0]}\n`;
  }
  if (contactInfo.facebook?.length) {
    contactText += `👥 Facebook: ${contactInfo.facebook[0]}\n`;
  }

  return `🏃‍♂️ ${name.toUpperCase()} 🏃‍♀️

${dateText}${timeText}
📍 Ubicación: ${location}
🏁 Distancias: ${distances}
🎯 Categoría: ${category}

${contactText}¡No te lo pierdas! 🔥

#running #carrera #trail #argentina #correr #runner #trailrunning #ultratrail #fitness #deporte #carrerapopular #run #marathon #maratón #sport`;
}
