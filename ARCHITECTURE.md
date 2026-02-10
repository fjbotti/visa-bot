# 🏗️ Arquitectura de Solución - VisaBot

## Opciones de Arquitectura

### Opción A: 100% sobre Clawdbot ⭐ Recomendada para MVP

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLAWDBOT                                │
│                    (Tu instancia actual)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Telegram   │  │   WhatsApp   │  │    Cron      │          │
│  │   Channel    │  │   Channel    │  │    Jobs      │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                 │                   │
│         └────────────┬────┴─────────────────┘                   │
│                      │                                          │
│                      ▼                                          │
│         ┌─────────────────────────┐                             │
│         │     Claude (Neo)        │                             │
│         │   Conversation Engine   │                             │
│         └───────────┬─────────────┘                             │
│                     │                                           │
│                     ▼                                           │
│         ┌─────────────────────────┐                             │
│         │    VisaBot Skill        │ ◀── NUEVO                   │
│         │  /skills/visabot/       │                             │
│         ├─────────────────────────┤                             │
│         │ • Flujos de trámites    │                             │
│         │ • Validaciones          │                             │
│         │ • Checklists            │                             │
│         │ • Templates mensajes    │                             │
│         └───────────┬─────────────┘                             │
│                     │                                           │
│         ┌───────────┴───────────┐                               │
│         │                       │                               │
│         ▼                       ▼                               │
│  ┌─────────────┐        ┌─────────────┐                         │
│  │   exec()    │        │  Browser    │                         │
│  │  Steel SDK  │        │   Tool      │                         │
│  └─────────────┘        └─────────────┘                         │
│         │                       │                               │
│         └───────────┬───────────┘                               │
│                     │                                           │
│                     ▼                                           │
│         ┌─────────────────────────┐                             │
│         │      Steel Cloud        │                             │
│         │   (Browser Automation)  │                             │
│         └─────────────────────────┘                             │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Persistencia                          │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │  memory/visabot/           │  SQLite/PostgreSQL         │   │
│  │  ├── tramites/             │  (para escalar)            │   │
│  │  │   ├── user123.json      │                            │   │
│  │  │   └── user456.json      │                            │   │
│  │  └── monitoring/           │                            │   │
│  │      └── active.json       │                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Ventajas:**
- ✅ Ya tenés todo funcionando (Telegram, WhatsApp, Claude)
- ✅ Cron jobs nativos para monitoreo
- ✅ Sin infraestructura adicional
- ✅ Claude ya conoce tu contexto
- ✅ Desarrollo rápido (skill = archivos MD + scripts)

**Desventajas:**
- ⚠️ Escala limitada al VPS actual
- ⚠️ Todo corre en un proceso
- ⚠️ Si Clawdbot se cae, todo se cae

**Ideal para:** MVP, <100 usuarios

---

### Opción B: Microservicios Separados

```
┌─────────────────────────────────────────────────────────────────┐
│                        ARQUITECTURA                              │
└─────────────────────────────────────────────────────────────────┘

     ┌──────────────┐         ┌──────────────┐
     │   Telegram   │         │   WhatsApp   │
     └──────┬───────┘         └──────┬───────┘
            │                        │
            └───────────┬────────────┘
                        │
                        ▼
            ┌─────────────────────────┐
            │       CLAWDBOT          │
            │   (Conversation Layer)  │
            │                         │
            │  • Recibe mensajes      │
            │  • Procesa con Claude   │
            │  • Envía respuestas     │
            └───────────┬─────────────┘
                        │
                        │ HTTP/API
                        ▼
            ┌─────────────────────────┐
            │    VISABOT SERVICE      │  ◀── Servicio separado
            │    (Node.js/Bun)        │
            ├─────────────────────────┤
            │                         │
            │  ┌─────────────────┐    │
            │  │   API Routes    │    │
            │  │ /tramites       │    │
            │  │ /documents      │    │
            │  │ /appointments   │    │
            │  └────────┬────────┘    │
            │           │             │
            │  ┌────────┴────────┐    │
            │  │                 │    │
            │  ▼                 ▼    │
            │ ┌─────┐      ┌─────┐    │
            │ │Queue│      │Cron │    │
            │ │Bull │      │Jobs │    │
            │ └──┬──┘      └──┬──┘    │
            │    │            │       │
            │    └─────┬──────┘       │
            │          ▼              │
            │  ┌─────────────────┐    │
            │  │  Booking Engine │    │
            │  │    (Steel)      │    │
            │  └─────────────────┘    │
            │                         │
            └───────────┬─────────────┘
                        │
            ┌───────────┴───────────┐
            │                       │
            ▼                       ▼
    ┌─────────────┐         ┌─────────────┐
    │ PostgreSQL  │         │    Redis    │
    │   (Data)    │         │   (Queue)   │
    └─────────────┘         └─────────────┘
```

**Ventajas:**
- ✅ Escala independiente
- ✅ Separación de concerns
- ✅ Booking engine puede correr en otro server
- ✅ Más resiliente

**Desventajas:**
- ❌ Más complejidad
- ❌ Más infraestructura
- ❌ Más costo

**Ideal para:** Producción, >100 usuarios

---

### Opción C: Híbrido (Clawdbot + Worker)

```
┌─────────────────────────────────────────────────────────────────┐
│                    VPS PRINCIPAL (actual)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                      CLAWDBOT                            │   │
│  │  • Telegram/WhatsApp                                     │   │
│  │  • Conversación (Claude)                                 │   │
│  │  • Skill VisaBot (lógica de negocio)                     │   │
│  │  • API interna para worker                               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                            │                                    │
│                            │ localhost:3001                     │
│                            ▼                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   BOOKING WORKER                         │   │
│  │              (Docker container)                          │   │
│  │                                                          │   │
│  │  • Monitoreo de turnos (cron cada 15 min)                │   │
│  │  • Reservas automáticas                                  │   │
│  │  • Steel SDK                                             │   │
│  │  • Cola de tareas                                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                            │                                    │
│                            ▼                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                     SQLite/PostgreSQL                    │   │
│  │                    (Estado compartido)                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS
                            ▼
               ┌─────────────────────────┐
               │      STEEL CLOUD        │
               │   (Browser Sessions)    │
               └─────────────────────────┘
```

**Ventajas:**
- ✅ Clawdbot maneja conversación (ya funciona)
- ✅ Worker dedicado para tareas pesadas
- ✅ Pueden escalar por separado
- ✅ Worker puede reiniciarse sin afectar bot

**Desventajas:**
- ⚠️ Algo más de complejidad
- ⚠️ Necesita comunicación entre procesos

**Ideal para:** Balance entre simplicidad y escalabilidad

---

## 🎯 Recomendación por Fase

| Fase | Usuarios | Arquitectura | Por qué |
|------|----------|--------------|---------|
| **MVP** | 1-50 | Opción A (100% Clawdbot) | Rápido, simple, ya tenés todo |
| **Growth** | 50-200 | Opción C (Híbrido) | Separa booking sin reescribir |
| **Scale** | 200+ | Opción B (Microservicios) | Escala real, múltiples workers |

---

## 📁 Estructura como Skill de Clawdbot (Opción A)

```
~/.clawdbot/skills/visabot/
├── SKILL.md                 # Instrucciones para Claude
├── config.json              # Configuración del skill
├── scripts/
│   ├── monitor-slots.js     # Chequear turnos (cron)
│   ├── book-appointment.js  # Reservar turno
│   ├── fill-ds160.js        # Llenar formulario
│   └── steel-session.js     # Manejo sesiones Steel
├── templates/
│   ├── messages/            # Templates de mensajes
│   │   ├── welcome.md
│   │   ├── slot-found.md
│   │   └── checklist.md
│   └── forms/               # Mapeo de formularios
│       ├── ds160-fields.json
│       └── schengen-fields.json
├── data/                    # Datos de referencia
│   ├── countries.json
│   ├── occupations.json
│   └── consulates.json
└── storage/                 # Estado persistente
    ├── tramites/
    │   └── {tramite_id}.json
    └── monitoring/
        └── active.json
```

### SKILL.md (ejemplo)

```markdown
# VisaBot Skill

Sos el asistente de trámites de visa de VisaBot.

## Comandos
- /visa nuevo - Iniciar nuevo trámite
- /visa estado - Ver estado de trámites activos
- /visa docs - Ver documentos pendientes

## Flujo de conversación

1. Preguntá para qué país es la visa
2. Preguntá quién es el solicitante
3. Recolectá datos paso a paso
4. Guardá progreso después de cada respuesta
5. Ofrecé continuar donde quedó si vuelve

## Scripts disponibles

Para monitorear turnos:
exec: node ~/.clawdbot/skills/visabot/scripts/monitor-slots.js {tramite_id}

Para reservar:
exec: node ~/.clawdbot/skills/visabot/scripts/book-appointment.js {tramite_id}

## Estado

Guardá el estado en:
~/.clawdbot/skills/visabot/storage/tramites/{tramite_id}.json
```

---

## 🔌 Integración con Clawdbot

### Cron Jobs (monitoreo)

```yaml
# En config de Clawdbot
cron:
  - name: "visa-monitor"
    schedule: "*/15 * * * *"  # Cada 15 minutos
    task: "Revisar monitoreo de turnos activos. Ejecutar script monitor-slots.js para cada trámite activo. Si hay turno, notificar al usuario."
```

### Uso de herramientas existentes

| Necesidad | Herramienta Clawdbot |
|-----------|---------------------|
| Enviar mensaje | `message` tool |
| Ejecutar script | `exec` tool |
| Programar tarea | `cron` tool |
| Navegar web | `browser` tool (+ Steel) |
| Guardar estado | `write` tool (JSON files) |
| Leer estado | `read` tool |

### Ejemplo de flujo

```
Usuario: Quiero visa para USA

Claude (Neo):
1. Lee SKILL.md de visabot
2. Pregunta datos conversacionalmente
3. Guarda progreso con write() a storage/
4. Cuando tiene todo, ejecuta scripts con exec()
5. Programa monitoreo con cron
6. Notifica resultados con message()
```

---

## 💾 Persistencia Simple (MVP)

Para el MVP, archivos JSON son suficientes:

```javascript
// storage/tramites/abc123.json
{
  "id": "abc123",
  "userId": "telegram:1840436008",
  "type": "USA_B1B2",
  "status": "DATA_COLLECTION",
  "currentStep": "travel_data",
  "completionPercentage": 45,
  "data": {
    "personal": { /* ... */ },
    "passport": { /* ... */ },
    "travel": { /* en progreso */ }
  },
  "createdAt": "2026-02-08T23:00:00Z",
  "updatedAt": "2026-02-08T23:30:00Z"
}
```

Para escalar, migrar a SQLite o PostgreSQL después.

---

## 🚀 Plan de Implementación (Opción A)

### Semana 1: Setup
- [ ] Crear estructura de skill
- [ ] SKILL.md con instrucciones base
- [ ] Scripts básicos de Steel

### Semana 2: Flujo USA
- [ ] Recolección de datos DS-160
- [ ] Validaciones
- [ ] Guardado de estado

### Semana 3: Monitoreo
- [ ] Script monitor-slots.js
- [ ] Cron job configurado
- [ ] Notificaciones

### Semana 4: Booking
- [ ] Script book-appointment.js
- [ ] Manejo de errores
- [ ] Confirmaciones

### Semana 5: Testing
- [ ] Probar con tu caso (Martina)
- [ ] Fixes

### Semana 6: Polish
- [ ] Mensajes amigables
- [ ] Edge cases
- [ ] Documentación

---

*Documento creado: Febrero 2026*
*Parte de: VisaBot Specification*
