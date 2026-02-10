# 🌍 VisaBot - Especificación del Producto

> Asistente inteligente para tramitación de visas con monitoreo de turnos y automatización.

---

## 📋 Índice

1. [Visión General](#visión-general)
2. [Propuesta de Valor](#propuesta-de-valor)
3. [Países Soportados](#países-soportados)
4. [Funcionalidades](#funcionalidades)
5. [Flujo de Usuario](#flujo-de-usuario)
6. [Arquitectura Técnica](#arquitectura-técnica)
7. [Integraciones](#integraciones)
8. [Modelo de Datos](#modelo-de-datos)
9. [Gestión de Estado](#gestión-de-estado)
10. [Alertas y Notificaciones](#alertas-y-notificaciones)
11. [Monetización](#monetización)
12. [MVP - Fase 1](#mvp---fase-1)
13. [Roadmap](#roadmap)
14. [Riesgos y Mitigaciones](#riesgos-y-mitigaciones)

> 📄 **Ver también:** [TRAMITES.md](./TRAMITES.md) - Especificación detallada de cada trámite con formularios, campos y pasos.

---

## 🎯 Visión General

**VisaBot** es un asistente conversacional que guía a los usuarios en todo el proceso de obtención de visas, desde la recolección de datos hasta la reserva de turnos en consulados/embajadas.

### Problema que resuelve

- 😤 Formularios complicados (DS-160, etc.)
- 😤 Turnos imposibles de conseguir
- 😤 No saber qué documentos llevar
- 😤 Proceso diferente para cada país

### Solución

- 🤖 Bot conversacional que recolecta datos paso a paso
- 🔔 Monitoreo 24/7 de disponibilidad de turnos
- 📋 Checklists personalizados por tipo de visa
- 🌐 Automatización de reservas con browser

---

## 💎 Propuesta de Valor

| Para el Usuario | Beneficio |
|-----------------|-----------|
| Formularios | Se completan solos con datos que ya diste |
| Turnos | Te avisamos apenas hay disponibilidad |
| Documentación | Checklist exacto de lo que necesitás |
| Seguimiento | Estado actualizado de tu trámite |
| Soporte | Ayuda humana si algo falla |

---

## 🌍 Países Soportados

### Fase 1 (MVP)
| País | Visa | Sistema de Turnos |
|------|------|-------------------|
| 🇺🇸 Estados Unidos | B1/B2 (turismo/negocios) | ustraveldocs.com |

### Fase 2
| País | Visa | Sistema de Turnos |
|------|------|-------------------|
| 🇮🇹 Italia | Schengen / Ciudadanía | Prenota Online |
| 🇪🇸 España | Schengen | BLS International |

### Fase 3
| País | Visa | Sistema de Turnos |
|------|------|-------------------|
| 🇬🇧 Reino Unido | Visitor | TLS Contact |
| 🇧🇷 Brasil | Turismo | VFS Global |
| 🇨🇦 Canadá | Visitor | IRCC |
| 🇦🇺 Australia | Visitor | ImmiAccount |

---

## ⚙️ Funcionalidades

### 1. Onboarding Conversacional

```
Bot: ¡Hola! ¿Para qué país necesitás visa?
User: Estados Unidos
Bot: ¿Es para turismo, negocios o estudio?
User: Turismo
Bot: Perfecto, visa B1/B2. ¿Para quién es?
User: Para mi hija de 3 años
Bot: Entendido. Vamos a necesitar algunos datos...
```

**Características:**
- Conversación natural (texto o audio)
- Validación en tiempo real
- Guardado de progreso
- Multi-idioma (ES, EN, PT)

### 2. Recolección de Datos

**Datos personales:**
- Nombre completo
- Fecha y lugar de nacimiento
- Nacionalidad
- Pasaporte (número, emisión, vencimiento)
- Foto (validación automática de requisitos)
- Dirección y contacto

**Datos familiares:**
- Padres (para menores)
- Cónyuge
- Hijos

**Datos laborales:**
- Ocupación
- Empleador
- Ingresos

**Datos del viaje:**
- Fechas tentativas
- Destino específico
- Alojamiento
- Quién financia

### 3. Generación de Formularios

| País | Formulario | Automatización |
|------|------------|----------------|
| 🇺🇸 USA | DS-160 | Llenado automático via browser |
| 🇮🇹 Italia | Formulario Schengen | PDF pre-llenado |
| 🇪🇸 España | Formulario Schengen | PDF pre-llenado |

**Output:**
- Formulario completado
- Número de confirmación
- PDF para imprimir

### 4. Monitoreo de Turnos

```
┌──────────────────────────────────────────────────┐
│              MONITOR DE TURNOS                   │
├──────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐   │
│  │  Steel   │───▶│ Scraper  │───▶│  Alert   │   │
│  │  Cloud   │    │  Logic   │    │  Engine  │   │
│  │ ☁️ API   │    │          │    │          │   │
│  └──────────┘    └──────────┘    └──────────┘   │
│       │               │               │          │
│       ▼               ▼               ▼          │
│  ┌─────────────────────────┐  ┌──────────────┐  │
│  │    Target Sites         │  │   Channels   │  │
│  │  • ustraveldocs.com     │  │  • Telegram  │  │
│  │  • prenotami.esteri.it  │  │  • WhatsApp  │  │
│  │  • blsspainvisa.com     │  │  • Email     │  │
│  │  • vfsglobal.com        │  │  • Push      │  │
│  └─────────────────────────┘  └──────────────┘  │
│                                                  │
│  Ventajas Steel:                                │
│  ✅ IPs residenciales (no ban)                  │
│  ✅ CAPTCHA solving automático                  │
│  ✅ Sessions persistentes                       │
│  ✅ Anti-fingerprint                            │
└──────────────────────────────────────────────────┘
```

**Frecuencia de chequeo:**
- Cada 15 minutos (horario laboral)
- Cada 1 hora (noche)
- Instantáneo ante liberación masiva (detectado via patrones)

**Tipos de alerta:**
- 🟢 Turno disponible en fecha deseada
- 🟡 Turno disponible en fecha cercana
- 🔴 Cancelación detectada (oportunidad!)

### 5. Reserva de Turnos

**Modo semi-automático (recomendado):**
1. Bot detecta turno
2. Alerta al usuario
3. Usuario confirma
4. Bot reserva con browser automation
5. Confirmación al usuario

**Modo automático (premium):**
1. Bot detecta turno
2. Bot reserva automáticamente
3. Notifica al usuario con confirmación

### 6. Checklist de Documentos

**Generado dinámicamente según:**
- País de destino
- Tipo de visa
- Perfil del solicitante (menor, empleado, autónomo, etc.)
- Consulado específico

**Ejemplo para USA B1/B2 (menor):**
```markdown
## Documentos Requeridos - Martina Boti

### Obligatorios
- [ ] Pasaporte vigente (mínimo 6 meses)
- [ ] Foto 5x5 cm fondo blanco
- [ ] Confirmación DS-160 impresa
- [ ] Recibo de pago de visa ($185 USD)
- [ ] Partida de nacimiento

### Del padre/madre acompañante
- [ ] Pasaporte con visa vigente
- [ ] Prueba de empleo/ingresos
- [ ] Extractos bancarios (3 meses)

### Recomendados
- [ ] Carta de la escuela/guardería
- [ ] Reserva de hotel (no pagar aún)
- [ ] Itinerario de viaje
```

### 7. Seguimiento Post-Entrevista

- Estado de la visa (aprobada/rechazada/pendiente)
- Tracking de pasaporte (cuando lo envían)
- Recordatorio de vigencia de visa

---

## 🔄 Flujo de Usuario

```
┌──────────────────────────────────────────────────────────────┐
│                      FLUJO PRINCIPAL                         │
└──────────────────────────────────────────────────────────────┘

     ┌─────────┐
     │ Usuario │
     │  Nuevo  │
     └────┬────┘
          │
          ▼
    ┌───────────┐
    │ Selección │
    │   País    │
    └─────┬─────┘
          │
          ▼
    ┌───────────┐
    │ Tipo de   │
    │   Visa    │
    └─────┬─────┘
          │
          ▼
    ┌───────────┐
    │Recolección│──────┐
    │  Datos    │      │ Guardado
    └─────┬─────┘      │ progresivo
          │            │
          ▼            ▼
    ┌───────────┐  ┌───────┐
    │ Generar   │  │  DB   │
    │Formulario │  │Perfil │
    └─────┬─────┘  └───────┘
          │
          ▼
    ┌───────────┐
    │  Pago de  │
    │   Visa    │
    └─────┬─────┘
          │
          ▼
    ┌───────────┐
    │ Activar   │
    │ Monitoreo │
    └─────┬─────┘
          │
          ▼
    ┌───────────┐     ┌───────────┐
    │  Turno    │────▶│  Alerta   │
    │Disponible!│     │  Usuario  │
    └─────┬─────┘     └─────┬─────┘
          │                 │
          ▼                 ▼
    ┌───────────┐     ┌───────────┐
    │  Reserva  │◀────│ Confirma  │
    │Automática │     │  Usuario  │
    └─────┬─────┘     └───────────┘
          │
          ▼
    ┌───────────┐
    │ Checklist │
    │Documentos │
    └─────┬─────┘
          │
          ▼
    ┌───────────┐
    │Entrevista │
    │(presencial)│
    └─────┬─────┘
          │
          ▼
    ┌───────────┐
    │   VISA    │
    │ APROBADA! │
    └───────────┘
```

---

## 🏗️ Arquitectura Técnica

```
┌─────────────────────────────────────────────────────────────────┐
│                        ARQUITECTURA                              │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Telegram   │  │   WhatsApp   │  │   Web App    │
│     Bot      │  │   (futuro)   │  │   (futuro)   │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       └────────────┬────┴─────────────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │    API Gateway      │
         │   (Node.js/Bun)     │
         └──────────┬──────────┘
                    │
       ┌────────────┼────────────┐
       │            │            │
       ▼            ▼            ▼
┌─────────────┐ ┌─────────┐ ┌─────────────┐
│Conversation │ │  Form   │ │  Booking    │
│   Engine    │ │Generator│ │   Engine    │
│  (Claude)   │ │         │ │  (Steel)    │
└──────┬──────┘ └────┬────┘ └──────┬──────┘
       │             │             │
       └─────────────┼─────────────┘
                     │
                     ▼
         ┌─────────────────────┐
         │      Database       │
         │    (PostgreSQL)     │
         └──────────┬──────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │   Queue / Cron      │
         │   (Bull / Cron)     │
         └──────────┬──────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │   Steel Cloud       │
         │  (Browser API)      │
         │  ☁️ Anti-detect     │
         │  ☁️ IPs rotativas   │
         │  ☁️ CAPTCHA solve   │
         └─────────────────────┘
```

### Stack Tecnológico

| Componente | Tecnología |
|------------|------------|
| Backend | Node.js / Bun + TypeScript |
| Bot Framework | Grammy (Telegram) / Baileys (WhatsApp) |
| AI/NLP | Claude API (Anthropic) |
| Browser Automation | **Steel** (cloud browser API) |
| Database | PostgreSQL + Prisma |
| Queue | Bull (Redis) |
| Cron | Node-cron |
| Hosting | VPS (Hetzner/DigitalOcean) |
| Cache | Redis |
| Storage | S3 (para fotos/documentos) |

### ¿Por qué Steel en vez de Playwright local?

| Aspecto | Playwright Local | Steel Cloud |
|---------|------------------|-------------|
| **Anti-bot detection** | ❌ Fácil de detectar | ✅ Browsers reales, fingerprints rotativos |
| **IPs** | ❌ IP fija del server | ✅ IPs residenciales/rotativas |
| **CAPTCHAs** | ❌ Hay que resolver | ✅ Solving incluido (planes pagos) |
| **Mantenimiento** | ❌ Updates de browsers | ✅ Manejado por Steel |
| **Escalabilidad** | ❌ Limitado por RAM | ✅ Escala automático |
| **Costo** | ✅ Gratis | ⚠️ Por uso |

**Steel es ideal para sitios como ustraveldocs que detectan bots agresivamente.**

---

## 🔌 Integraciones

### Sistemas de Turnos

| Sistema | URL | Método |
|---------|-----|--------|
| ustraveldocs | ais.usvisa-info.com | Playwright + Login |
| Prenota Online | prenotami.esteri.it | Playwright + Login |
| BLS Spain | blsspainvisa.com | Playwright + Login |
| VFS Global | vfsglobal.com | Playwright + Login |

### Canales de Comunicación

| Canal | Librería | Estado |
|-------|----------|--------|
| Telegram | Grammy | MVP |
| WhatsApp | Baileys/Clawdbot | Fase 2 |
| Email | Nodemailer | Fase 2 |
| Push | Web Push API | Fase 3 |

### Pagos

| Proveedor | Uso |
|-----------|-----|
| MercadoPago | Argentina |
| Stripe | Internacional |

### Browser Automation (Steel)

| Característica | Detalle |
|----------------|---------|
| **API** | REST + SDK Node.js |
| **Sessions** | Persistentes (cookies, localStorage) |
| **Proxies** | Residenciales incluidos (planes pagos) |
| **Anti-detect** | Fingerprints rotativos automáticos |
| **CAPTCHA** | Solving incluido en Plan Pro+ |
| **Docs** | https://docs.steel.dev |

```javascript
// Ejemplo de uso Steel
import Steel from 'steel-sdk';

const steel = new Steel({ apiKey: process.env.STEEL_API_KEY });

const session = await steel.sessions.create({
  proxy: 'residential',
  solveCaptcha: true
});

await session.goto('https://ais.usvisa-info.com');
await session.fill('#user_email', credentials.email);
await session.fill('#user_password', credentials.password);
await session.click('input[type="submit"]');

// Verificar disponibilidad...
const slots = await session.evaluate(() => {
  return document.querySelector('.available-slots')?.innerText;
});

await session.close();
```

### CAPTCHA Solving

| Método | Costo | Notas |
|--------|-------|-------|
| Steel Pro (incluido) | $0 | Mejor opción si usás Pro |
| 2Captcha | $2.99/1000 | Backup |
| Anti-Captcha | $2.00/1000 | Backup |
| CapSolver | $1.50/1000 | Más barato |

---

## 📊 Modelo de Datos

```prisma
// schema.prisma

model User {
  id            String    @id @default(uuid())
  telegramId    String?   @unique
  whatsappId    String?   @unique
  email         String?   @unique
  phone         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  applicants    Applicant[]
  subscriptions Subscription[]
}

model Applicant {
  id              String    @id @default(uuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id])
  
  // Personal
  firstName       String
  lastName        String
  birthDate       DateTime
  birthCity       String
  birthCountry    String
  nationality     String
  gender          String
  
  // Passport
  passportNumber  String
  passportIssue   DateTime
  passportExpiry  DateTime
  passportCountry String
  
  // Contact
  email           String
  phone           String
  address         String
  city            String
  postalCode      String
  country         String
  
  // Employment
  occupation      String?
  employer        String?
  employerAddress String?
  income          Decimal?
  
  // Relations
  applications    Application[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model Application {
  id              String    @id @default(uuid())
  applicantId     String
  applicant       Applicant @relation(fields: [applicantId], references: [id])
  
  // Visa Details
  country         String    // US, IT, ES, etc
  visaType        String    // B1B2, SCHENGEN, etc
  status          ApplicationStatus @default(DATA_COLLECTION)
  
  // Form
  formType        String?   // DS160, SCHENGEN_FORM, etc
  formNumber      String?   // Confirmation number
  formData        Json?     // All form fields
  
  // Trip
  tripPurpose     String?
  tripStartDate   DateTime?
  tripEndDate     DateTime?
  tripDestination String?
  tripAccommodation String?
  tripSponsor     String?
  
  // Appointment
  appointmentDate DateTime?
  appointmentTime String?
  appointmentLocation String?
  
  // Documents
  documents       Document[]
  
  // Monitoring
  monitoring      Monitoring?
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

enum ApplicationStatus {
  DATA_COLLECTION
  FORM_PENDING
  FORM_COMPLETED
  PAYMENT_PENDING
  PAYMENT_COMPLETED
  MONITORING_ACTIVE
  APPOINTMENT_SCHEDULED
  INTERVIEW_PENDING
  VISA_APPROVED
  VISA_DENIED
  CANCELLED
}

model Document {
  id            String    @id @default(uuid())
  applicationId String
  application   Application @relation(fields: [applicationId], references: [id])
  
  type          String    // PASSPORT, PHOTO, BANK_STATEMENT, etc
  name          String
  url           String    // S3 URL
  verified      Boolean   @default(false)
  
  createdAt     DateTime  @default(now())
}

model Monitoring {
  id            String    @id @default(uuid())
  applicationId String    @unique
  application   Application @relation(fields: [applicationId], references: [id])
  
  active        Boolean   @default(true)
  system        String    // ustraveldocs, prenota, etc
  location      String    // Buenos Aires, Madrid, etc
  
  // Credentials (encrypted)
  credentials   String    // JSON encrypted
  
  // Preferences
  preferredDates    DateTime[]
  minDate           DateTime?
  maxDate           DateTime?
  autoBook          Boolean   @default(false)
  
  // Stats
  lastCheck         DateTime?
  checksCount       Int       @default(0)
  slotsFound        Int       @default(0)
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  alerts        Alert[]
}

model Alert {
  id            String    @id @default(uuid())
  monitoringId  String
  monitoring    Monitoring @relation(fields: [monitoringId], references: [id])
  
  type          AlertType
  message       String
  slotDate      DateTime?
  slotTime      String?
  
  sent          Boolean   @default(false)
  sentAt        DateTime?
  
  actioned      Boolean   @default(false)
  actionedAt    DateTime?
  action        String?   // BOOKED, DISMISSED, EXPIRED
  
  createdAt     DateTime  @default(now())
}

enum AlertType {
  SLOT_AVAILABLE
  SLOT_PREFERRED
  CANCELLATION_DETECTED
  BOOKING_CONFIRMED
  BOOKING_FAILED
  SYSTEM_ERROR
}

model Subscription {
  id            String    @id @default(uuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  
  plan          String    // FREE, BASIC, PREMIUM
  status        String    // ACTIVE, CANCELLED, EXPIRED
  
  startDate     DateTime
  endDate       DateTime?
  
  // Limits
  maxApplications   Int
  maxMonitorings    Int
  autoBookEnabled   Boolean
  
  // Payment
  paymentId     String?
  amount        Decimal?
  currency      String?
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

---

## 🔄 Gestión de Estado

### Principio: Trámite Continuable

Cada usuario puede **pausar y retomar** su trámite en cualquier momento. El sistema guarda:

- ✅ Todos los datos ingresados
- ✅ Estado de cada formulario
- ✅ Documentos subidos
- ✅ Historial de cambios
- ✅ Posición exacta en el flujo

### Persistencia de Estado

```typescript
// Cada vez que el usuario ingresa un dato
await tramiteService.saveProgress(tramiteId, {
  step: 'personal_data',
  field: 'birth_date',
  value: '2022-06-01',
  timestamp: new Date()
});

// El usuario puede irse y volver
const tramite = await tramiteService.getTramite(tramiteId);
console.log(tramite.currentStep); // 'personal_data'
console.log(tramite.completionPercentage); // 35%
```

### Conversación Contextual

Cuando el usuario vuelve, el bot sabe exactamente dónde quedó:

```
Usuario: Hola
Bot: ¡Hola! Veo que estás en el trámite de visa USA para Martina.
     Quedaste en el paso "Datos del viaje" (35% completado).
     
     ¿Querés continuar desde ahí?
     
     [▶️ Continuar] [📋 Ver resumen] [❌ Cancelar trámite]
```

### Estados por Trámite

Ver **[TRAMITES.md](./TRAMITES.md)** para el detalle completo de estados por cada tipo de trámite.

Resumen de estados globales:

| Estado | Descripción | Auto-avance |
|--------|-------------|-------------|
| `CREATED` | Trámite iniciado | → DATA_COLLECTION |
| `DATA_COLLECTION` | Recolectando datos | Cuando completa |
| `FORMS_PENDING` | Formularios por llenar | Cuando completa |
| `FORMS_COMPLETED` | Formularios listos | → PAYMENT |
| `PAYMENT_PENDING` | Esperando pago | Cuando paga |
| `PAYMENT_COMPLETED` | Pago confirmado | → MONITORING |
| `APPOINTMENT_HUNTING` | Buscando turnos | Cuando encuentra |
| `APPOINTMENT_SCHEDULED` | Turno agendado | → INTERVIEW |
| `INTERVIEW_PENDING` | Pre-entrevista | Manual |
| `APPROVED` | Visa aprobada | → COMPLETED |
| `REFUSED` | Visa rechazada | Fin |
| `COMPLETED` | Trámite finalizado | Fin |

### Recuperación de Sesión

```typescript
// Al iniciar conversación
async function handleUserMessage(userId: string, message: string) {
  // Buscar trámites activos
  const activeTramites = await tramiteService.getActiveTramites(userId);
  
  if (activeTramites.length > 0) {
    // Ofrecer continuar
    return {
      message: `Tenés ${activeTramites.length} trámite(s) en curso`,
      options: activeTramites.map(t => ({
        text: `${t.type} - ${t.applicantName} (${t.completionPercentage}%)`,
        action: `continue_${t.id}`
      }))
    };
  }
  
  // Si no hay trámites, iniciar nuevo
  return showNewTramiteOptions();
}
```

---

## 🔔 Alertas y Notificaciones

### Canales

```typescript
interface AlertChannels {
  telegram: {
    enabled: boolean;
    chatId: string;
    priority: 'all' | 'urgent' | 'none';
  };
  whatsapp: {
    enabled: boolean;
    phone: string;
    priority: 'all' | 'urgent' | 'none';
  };
  email: {
    enabled: boolean;
    address: string;
    priority: 'all' | 'urgent' | 'none';
  };
}
```

### Tipos de Alerta

| Tipo | Prioridad | Acción |
|------|-----------|--------|
| Turno disponible (fecha deseada) | 🔴 URGENTE | Notificar + opción reservar |
| Turno disponible (otra fecha) | 🟡 NORMAL | Notificar |
| Cancelación detectada | 🔴 URGENTE | Notificar inmediato |
| Formulario por vencer | 🟡 NORMAL | Recordatorio |
| Turno mañana | 🔴 URGENTE | Recordatorio + checklist |
| Visa aprobada | 🟢 INFO | Felicitaciones + próximos pasos |

### Formato de Mensaje

```
🎉 ¡TURNO DISPONIBLE!

📍 Embajada USA - Buenos Aires
📅 Martes 15 de Abril, 2025
🕐 10:30 AM

👤 Para: Martina Boti
🎫 Tipo: Visa B1/B2

⚡ Este turno puede desaparecer en minutos.

[✅ RESERVAR AHORA]  [❌ Ignorar]
```

---

## 💰 Monetización

### Planes

| Plan | Precio | Incluye |
|------|--------|---------|
| **Free** | $0 | 1 aplicación, alertas email, sin auto-reserva |
| **Basic** | $29 USD/mes | 3 aplicaciones, alertas Telegram/WA, sin auto-reserva |
| **Premium** | $59 USD/mes | 10 aplicaciones, auto-reserva, soporte prioritario |
| **Por reserva** | $49 USD | Pago único por reserva exitosa |

### Revenue Streams

1. **Suscripciones** - Ingreso recurrente
2. **Pago por éxito** - Por cada reserva conseguida
3. **Servicios adicionales:**
   - Llenado de formulario: +$15 USD
   - Revisión de documentos: +$25 USD
   - Acompañamiento entrevista (guía): +$20 USD

---

## 🚀 MVP - Fase 1

### Alcance

- ✅ Solo visa USA (B1/B2)
- ✅ Solo Argentina (Buenos Aires)
- ✅ Solo Telegram
- ✅ Monitoreo de turnos
- ✅ Alertas manuales
- ✅ Checklist de documentos
- ⏳ DS-160 semi-automático (guía paso a paso)

### Timeline

| Semana | Entregable |
|--------|------------|
| 1 | Setup proyecto, DB, bot básico Telegram |
| 2 | Flujo conversacional, recolección de datos |
| 3 | Integración Playwright + ustraveldocs |
| 4 | Monitor de turnos + alertas |
| 5 | Testing + fixes |
| 6 | Beta con usuarios reales (vos!) |

### Recursos y Costos Detallados

#### Steel - Browser Cloud API

| Plan | Precio | Browser Hours | Proxy | CAPTCHA | Ideal para |
|------|--------|---------------|-------|---------|------------|
| **Hobby** | $0 | 100 hrs/mes | ❌ | ❌ | Testing |
| **Starter** | $50/mes | 500 hrs/mes | ✅ Residential | ❌ | MVP |
| **Pro** | $200/mes | 2000 hrs/mes | ✅ Residential | ✅ | Producción |
| **Scale** | $500/mes | 5000 hrs/mes | ✅ Premium | ✅ | Alto volumen |

**Cálculo de uso:**
- 1 chequeo de turnos = ~2 minutos = 0.033 hrs
- 100 usuarios x 6 chequeos/día = 600 chequeos/día
- 600 x 0.033 x 30 días = ~600 hrs/mes → **Plan Pro**

#### Costos Mensuales MVP (50 usuarios)

| Concepto | Costo/mes | Notas |
|----------|-----------|-------|
| VPS (4GB RAM) | $20 | Hetzner/DigitalOcean |
| Steel Starter | $50 | 500 hrs browser |
| Claude API | $30 | ~1000 conversaciones |
| PostgreSQL | $0 | Incluido en VPS |
| Redis | $0 | Incluido en VPS |
| Dominio | $1 | ($12/año) |
| **TOTAL** | **$101/mes** | |

#### Costos Mensuales Producción (200 usuarios)

| Concepto | Costo/mes | Notas |
|----------|-----------|-------|
| VPS (8GB RAM) | $40 | Más capacidad |
| Steel Pro | $200 | 2000 hrs + CAPTCHA |
| Claude API | $80 | ~3000 conversaciones |
| PostgreSQL managed | $15 | Supabase/Neon |
| Redis managed | $10 | Upstash |
| S3 Storage | $5 | Documentos/fotos |
| Dominio | $1 | |
| **TOTAL** | **$351/mes** | |

#### Costos por Transacción

| Acción | Costo Steel | Costo Claude | Total |
|--------|-------------|--------------|-------|
| 1 chequeo de turnos | $0.003 | $0 | $0.003 |
| 1 reserva completa | $0.05 | $0.02 | $0.07 |
| 1 DS-160 asistido | $0.10 | $0.15 | $0.25 |
| Onboarding completo | $0.02 | $0.10 | $0.12 |

#### Análisis de Rentabilidad

**Escenario MVP (50 usuarios, plan Basic $29):**
```
Ingresos:  50 x $29 = $1,450/mes
Costos:    $101/mes
Profit:    $1,349/mes (93% margen)
```

**Escenario Producción (200 usuarios mix):**
```
Ingresos:
- 100 usuarios Basic ($29)  = $2,900
- 80 usuarios Premium ($59) = $4,720
- 20 reservas exitosas ($49)= $980
Total:                        $8,600/mes

Costos:    $351/mes
Profit:    $8,249/mes (96% margen)
```

#### Break-even Analysis

| Plan | Costo fijo | Usuarios necesarios (Basic $29) |
|------|------------|--------------------------------|
| MVP | $101/mes | 4 usuarios |
| Producción | $351/mes | 13 usuarios |

**Conclusión: El negocio es rentable desde el usuario #4.**

---

## 📅 Roadmap

### Q1 2025 - MVP
- [x] Especificación
- [ ] Bot Telegram básico
- [ ] Flujo USA B1/B2
- [ ] Monitor ustraveldocs
- [ ] Beta privada

### Q2 2025 - Expansión
- [ ] WhatsApp integration
- [ ] Italia (Prenota)
- [ ] España (BLS)
- [ ] Pagos (MercadoPago)

### Q3 2025 - Scale
- [ ] Web app
- [ ] Más países
- [ ] Auto-reserva premium
- [ ] App mobile

### Q4 2025 - Enterprise
- [ ] API para agencias
- [ ] White-label
- [ ] B2B partnerships

---

## ⚠️ Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Bloqueo de bots | Alta | Alto | Rotación IPs, delays aleatorios, modo semi-auto |
| Cambios en sitios | Media | Alto | Monitoreo de cambios, alertas, updates rápidos |
| CAPTCHAs | Media | Medio | Servicios de solving, fallback manual |
| Competencia | Media | Medio | Diferenciación por UX y soporte |
| Legal/ToS | Baja | Alto | Términos claros, modo semi-automático |

---

## 📝 Próximos Pasos

1. **Validar** esta spec con Federico ✅
2. **Definir** stack final
3. **Setup** repositorio y proyecto
4. **Desarrollar** MVP en 6 semanas
5. **Probar** con caso real (Martina)
6. **Iterar** según feedback

---

## 🏆 Top 10 Trámites Más Difíciles del Mundo

> Oportunidades de alto valor donde VisaBot puede diferenciarse.

### Ranking por Dificultad + Demanda

| # | País/Trámite | Dificultad | Demanda LATAM | Tiempo Promedio | Tasa Rechazo | 💰 Oportunidad |
|---|--------------|------------|---------------|-----------------|--------------|----------------|
| 1 | 🇺🇸 **USA B1/B2** | ⭐⭐⭐⭐⭐ | Altísima | 3-12 meses | 20-40% | $$$$ |
| 2 | 🇮🇹 **Italia - Ciudadanía** | ⭐⭐⭐⭐⭐ | Altísima (ARG/BRA) | 2-10 años | N/A | $$$$$ |
| 3 | 🇪🇸 **España - Ciudadanía** | ⭐⭐⭐⭐⭐ | Alta | 1-3 años | Variable | $$$$ |
| 4 | 🇬🇧 **UK Visitor** | ⭐⭐⭐⭐ | Alta | 1-3 meses | 15-25% | $$$ |
| 5 | 🇨🇦 **Canadá Visitor** | ⭐⭐⭐⭐ | Altísima | 2-6 meses | 25-35% | $$$$ |
| 6 | 🇦🇺 **Australia Visitor** | ⭐⭐⭐⭐ | Alta | 1-3 meses | 15-20% | $$$ |
| 7 | 🇪🇺 **Schengen (cualquier país)** | ⭐⭐⭐⭐ | Altísima | 1-2 meses | 10-20% | $$$$ |
| 8 | 🇯🇵 **Japón Turismo** | ⭐⭐⭐ | Media-Alta | 1-2 semanas | 5-10% | $$ |
| 9 | 🇨🇳 **China Turismo** | ⭐⭐⭐⭐ | Media | 1-2 meses | 10-15% | $$ |
| 10 | 🇦🇪 **UAE Residencia** | ⭐⭐⭐ | Creciente | 2-4 semanas | Bajo | $$$ |

### Detalle por Trámite

#### 1. 🇺🇸 USA B1/B2 (Turismo/Negocios)
| Aspecto | Detalle |
|---------|---------|
| **Por qué es difícil** | Entrevista obligatoria, alta tasa de rechazo, turnos escasos |
| **Dolor principal** | Conseguir turno puede tomar 6-12 meses |
| **Formularios** | DS-160 (largo y complejo) |
| **Documentación** | Extensiva: lazos con país origen, solvencia económica |
| **Costo visa** | $185 USD |
| **Nuestro valor** | Monitoreo 24/7, DS-160 guiado, checklist personalizado |

#### 2. 🇮🇹 Italia - Ciudadanía (Jure Sanguinis)
| Aspecto | Detalle |
|---------|---------|
| **Por qué es difícil** | Cola de años en consulados, documentación histórica compleja |
| **Dolor principal** | Turnos en consulados ARG: 8-10 años de espera |
| **Formularios** | Múltiples, apostillados |
| **Documentación** | Actas desde el ancestro italiano, traducciones, apostillas |
| **Costo trámite** | €300-500 + apostillas/traducciones |
| **Nuestro valor** | Monitoreo Prenota, checklist de actas, seguimiento |

#### 3. 🇪🇸 España - Ciudadanía/Residencia
| Aspecto | Detalle |
|---------|---------|
| **Por qué es difícil** | Requisitos de residencia, proceso largo |
| **Dolor principal** | Ley de Nietos compleja, turnos BLS saturados |
| **Formularios** | Varios según vía (nietos, residencia, etc.) |
| **Documentación** | Actas, NIE, empadronamiento |
| **Costo** | Variable |
| **Nuestro valor** | Guía por tipo de trámite, monitoreo BLS |

#### 4. 🇬🇧 UK Visitor Visa
| Aspecto | Detalle |
|---------|---------|
| **Por qué es difícil** | Post-Brexit más estricto, documentación financiera |
| **Dolor principal** | Online pero complejo, biométricos en VAC |
| **Formularios** | Formulario online extenso |
| **Documentación** | Prueba financiera, itinerario, lazos |
| **Costo** | £115 (6 meses) |
| **Nuestro valor** | Guía paso a paso, checklist, seguimiento |

#### 5. 🇨🇦 Canadá Visitor Visa
| Aspecto | Detalle |
|---------|---------|
| **Por qué es difícil** | Alta tasa rechazo LATAM, biométricos |
| **Dolor principal** | Proceso online pero muchos rechazos |
| **Formularios** | IMM 5257, IMM 5645, etc. |
| **Documentación** | Extensiva, cartas invitación, solvencia |
| **Costo** | CAD $100 + biométricos $85 |
| **Nuestro valor** | Optimización de aplicación, docs sugeridos |

#### 6. 🇦🇺 Australia Visitor (Subclass 600)
| Aspecto | Detalle |
|---------|---------|
| **Por qué es difícil** | Online pero detallado, health check a veces |
| **Dolor principal** | ImmiAccount confuso, tiempos variables |
| **Formularios** | Online en ImmiAccount |
| **Documentación** | Financiera, propósito, lazos |
| **Costo** | AUD $190 |
| **Nuestro valor** | Guía ImmiAccount, checklist |

#### 7. 🇪🇺 Schengen (Ejemplo: Francia/Alemania)
| Aspecto | Detalle |
|---------|---------|
| **Por qué es difícil** | Varía por país, turnos saturados |
| **Dolor principal** | Cada consulado tiene sus reglas |
| **Formularios** | Formulario Schengen estándar |
| **Documentación** | Seguro viaje obligatorio, reservas, itinerario |
| **Costo** | €80 |
| **Nuestro valor** | Guía por país, turnos VFS/TLS |

#### 8. 🇯🇵 Japón Turismo
| Aspecto | Detalle |
|---------|---------|
| **Por qué es difícil** | Relativamente fácil pero requiere agencia |
| **Dolor principal** | Solo se tramita via agencias autorizadas |
| **Formularios** | Formulario de visa simple |
| **Documentación** | Itinerario, hotel, financiera |
| **Costo** | Gratis |
| **Nuestro valor** | Conexión con agencias, checklist |

#### 9. 🇨🇳 China Turismo
| Aspecto | Detalle |
|---------|---------|
| **Por qué es difícil** | Requiere itinerario detallado, invitación a veces |
| **Dolor principal** | Formulario largo, fotos específicas |
| **Formularios** | Formulario visa china |
| **Documentación** | Itinerario completo, reservas, carta empleador |
| **Costo** | ~$140 USD |
| **Nuestro valor** | Guía fotográfica, checklist estricto |

#### 10. 🇦🇪 UAE Residencia/Golden Visa
| Aspecto | Detalle |
|---------|---------|
| **Por qué es difícil** | Requiere sponsor o inversión |
| **Dolor principal** | Proceso via PRO/sponsor |
| **Formularios** | Online via ICA |
| **Documentación** | Depende del tipo (trabajo, inversión, freelance) |
| **Costo** | Variable ($500-2000) |
| **Nuestro valor** | Guía por categoría, conexión con PROs |

### 🎯 Priorización para VisaBot

| Prioridad | Trámite | Por qué |
|-----------|---------|---------|
| 🥇 | USA B1/B2 | Mayor demanda, dolor de turnos, alto valor |
| 🥈 | Italia Ciudadanía | Enorme demanda ARG/BRA, alto valor, largo plazo |
| 🥉 | Schengen | Alta demanda, múltiples países = escala |
| 4 | España | Ley de nietos = demanda puntual alta |
| 5 | Canadá | Alta demanda, buen margen |

---

*Documento creado: Febrero 2026*
*Versión: 1.1*
*Autor: Neo (con Federico)*
