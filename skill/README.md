# VisaBot Skill

Skill de Clawdbot para asistencia en trámites de visa.

## Características

- 📋 Recolección guiada de datos para formularios (DS-160)
- 🔔 Monitoreo de disponibilidad de turnos
- 📝 Checklists de documentos por tipo de visa
- 🤖 Automatización opcional con Steel Cloud

## Estructura

```
skills/visabot/
├── SKILL.md              # Instrucciones para el agente
├── config.json           # Configuración del skill
├── README.md             # Este archivo
├── scripts/
│   ├── check-steel.js    # Verificar config de Steel
│   ├── monitor-slots.js  # Monitorear turnos
│   └── book-appointment.js # Reservar turnos
├── templates/
│   ├── messages/         # Templates de mensajes
│   └── forms/            # Mapeo de formularios
├── data/                 # Datos de referencia
└── storage/              # Persistencia de trámites
```

## Uso

### Comandos del usuario

- `/visa nuevo` - Iniciar nuevo trámite
- `/visa estado` - Ver estado de trámites
- `/visa docs` - Ver documentos pendientes
- `/visa turnos` - Ver monitoreo activo

### Scripts

```bash
# Verificar Steel
node scripts/check-steel.js

# Monitorear turnos
node scripts/monitor-slots.js --tramite-id=<id>

# Reservar turno
node scripts/book-appointment.js --tramite-id=<id> --slot-id=<slot>
```

## Configuración de Steel (opcional)

Para automatización de browser:

1. Crear cuenta en [Steel.dev](https://steel.dev)
2. Obtener API key
3. Guardar en `~/.config/secrets/steel_api_key`

Sin Steel, el skill funciona en modo manual con instrucciones paso a paso.

## Países soportados

- 🇺🇸 Estados Unidos (B1/B2, F1)
- 🇮🇹 Italia (próximamente)
- 🇪🇸 España (próximamente)

## Licencia

MIT
