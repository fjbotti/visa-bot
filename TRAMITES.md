# 📋 Especificación Detallada de Trámites

> Cada trámite con sus pasos, formularios, campos y estados.

---

## 📑 Índice

1. [Sistema de Estados](#sistema-de-estados)
2. [USA B1/B2 - Visa Turismo/Negocios](#usa-b1b2---visa-turismonegocio)
3. [Italia - Ciudadanía Jure Sanguinis](#italia---ciudadanía-jure-sanguinis)
4. [España - Visa Schengen](#españa---visa-schengen)
5. [España - Ley de Nietos (Ciudadanía)](#españa---ley-de-nietos-ciudadanía)
6. [UK - Visitor Visa](#uk---visitor-visa)
7. [Canadá - Visitor Visa](#canadá---visitor-visa)
8. [Schengen Genérico](#schengen-genérico)
9. [Modelo de Datos de Estado](#modelo-de-datos-de-estado)

---

## 🔄 Sistema de Estados

Cada trámite tiene un estado global y sub-estados por paso:

```
┌─────────────────────────────────────────────────────────────┐
│                    ESTADOS GLOBALES                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  CREATED ──▶ DATA_COLLECTION ──▶ FORMS_PENDING             │
│                                       │                     │
│                                       ▼                     │
│                              FORMS_COMPLETED                │
│                                       │                     │
│                                       ▼                     │
│                              PAYMENT_PENDING                │
│                                       │                     │
│                                       ▼                     │
│                              PAYMENT_COMPLETED              │
│                                       │                     │
│                                       ▼                     │
│                              APPOINTMENT_HUNTING            │
│                                       │                     │
│                                       ▼                     │
│                              APPOINTMENT_SCHEDULED          │
│                                       │                     │
│                                       ▼                     │
│                              INTERVIEW_PENDING              │
│                                       │                     │
│                    ┌──────────────────┼──────────────────┐  │
│                    ▼                  ▼                  ▼  │
│              APPROVED            REFUSED            PENDING │
│                    │                                        │
│                    ▼                                        │
│              COMPLETED                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🇺🇸 USA B1/B2 - Visa Turismo/Negocios

### Resumen

| Campo | Valor |
|-------|-------|
| **Formulario principal** | DS-160 |
| **Sistema de turnos** | ustraveldocs.com / ais.usvisa-info.com |
| **Costo** | $185 USD (MRV fee) |
| **Tiempo estimado** | 3-12 meses |
| **Entrevista** | Sí (excepto menores de 14 o mayores de 79) |

### Pasos del Trámite

```
┌─────────────────────────────────────────────────────────────┐
│                    USA B1/B2 WORKFLOW                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  PASO 1: Recolección de Datos                               │
│  └─▶ Estado: DATA_COLLECTION                                │
│      └─▶ Sub-estados: PERSONAL | PASSPORT | TRAVEL |        │
│                       FAMILY | WORK | SECURITY              │
│                                                             │
│  PASO 2: Completar DS-160                                   │
│  └─▶ Estado: FORM_DS160                                     │
│      └─▶ Sub-estados: STARTED | IN_PROGRESS | SUBMITTED     │
│      └─▶ Output: Confirmation Number (AA00XXXXXX)           │
│                                                             │
│  PASO 3: Crear cuenta ustraveldocs                          │
│  └─▶ Estado: ACCOUNT_CREATION                               │
│      └─▶ Sub-estados: PENDING | CREATED | VERIFIED          │
│                                                             │
│  PASO 4: Pagar MRV Fee ($185)                               │
│  └─▶ Estado: PAYMENT                                        │
│      └─▶ Sub-estados: PENDING | PROCESSING | COMPLETED      │
│      └─▶ Output: Receipt Number                             │
│                                                             │
│  PASO 5: Agendar Cita (Monitoreo)                           │
│  └─▶ Estado: APPOINTMENT_HUNTING                            │
│      └─▶ Sub-estados: MONITORING | SLOT_FOUND | BOOKING     │
│                                                             │
│  PASO 6: Cita Agendada                                      │
│  └─▶ Estado: APPOINTMENT_SCHEDULED                          │
│      └─▶ Data: Fecha, Hora, Ubicación                       │
│                                                             │
│  PASO 7: Preparación Entrevista                             │
│  └─▶ Estado: INTERVIEW_PREP                                 │
│      └─▶ Checklist de documentos                            │
│      └─▶ Tips de entrevista                                 │
│                                                             │
│  PASO 8: Post-Entrevista                                    │
│  └─▶ Estado: INTERVIEW_COMPLETED                            │
│      └─▶ Resultado: APPROVED | REFUSED | ADMINISTRATIVE     │
│                                                             │
│  PASO 9: Entrega de Pasaporte                               │
│  └─▶ Estado: PASSPORT_DELIVERY                              │
│      └─▶ Tracking number DHL                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### PASO 1: Recolección de Datos

#### 1.1 Datos Personales (PERSONAL)

| Campo | Tipo | Requerido | Validación | Ejemplo |
|-------|------|-----------|------------|---------|
| `surname` | string | ✅ | Solo letras, mayúsculas | BOTI |
| `given_name` | string | ✅ | Solo letras | MARTINA |
| `full_name_native` | string | ❌ | Si aplica | - |
| `other_names_used` | boolean | ✅ | - | false |
| `other_names_list` | array | Condicional | Si other_names_used=true | [] |
| `sex` | enum | ✅ | M/F | F |
| `marital_status` | enum | ✅ | SINGLE/MARRIED/DIVORCED/WIDOWED | SINGLE |
| `birth_date` | date | ✅ | No futuro, edad válida | 2022-06-01 |
| `birth_city` | string | ✅ | - | Buenos Aires |
| `birth_state` | string | ✅ | - | Buenos Aires |
| `birth_country` | string | ✅ | Código ISO | ARG |
| `nationality` | string | ✅ | Código ISO | ARG |
| `other_nationalities` | boolean | ✅ | - | false |
| `national_id` | string | ❌ | DNI format | 12345678 |
| `us_ssn` | string | ❌ | Si tiene | - |
| `us_tax_id` | string | ❌ | Si tiene | - |

#### 1.2 Datos del Pasaporte (PASSPORT)

| Campo | Tipo | Requerido | Validación | Ejemplo |
|-------|------|-----------|------------|---------|
| `passport_type` | enum | ✅ | REGULAR/OFFICIAL/DIPLOMATIC | REGULAR |
| `passport_number` | string | ✅ | Alfanumérico | AAA123456 |
| `passport_book_number` | string | ❌ | Si existe | - |
| `passport_country` | string | ✅ | Código ISO | ARG |
| `passport_city_issued` | string | ✅ | - | Buenos Aires |
| `passport_state_issued` | string | ❌ | - | Buenos Aires |
| `passport_country_issued` | string | ✅ | Código ISO | ARG |
| `passport_issue_date` | date | ✅ | Pasado | 2023-01-15 |
| `passport_expiry_date` | date | ✅ | Futuro, >6 meses de viaje | 2033-01-15 |
| `passport_lost_stolen` | boolean | ✅ | - | false |
| `passport_lost_details` | string | Condicional | Si lost=true | - |

#### 1.3 Datos del Viaje (TRAVEL)

| Campo | Tipo | Requerido | Validación | Ejemplo |
|-------|------|-----------|------------|---------|
| `travel_purpose` | enum | ✅ | TOURISM/BUSINESS/MEDICAL/STUDY | TOURISM |
| `travel_specific_plans` | boolean | ✅ | - | true |
| `arrival_date` | date | Condicional | Si specific_plans=true | 2026-12-26 |
| `arrival_flight` | string | ❌ | - | AA1234 |
| `arrival_city` | string | ✅ | - | Orlando |
| `departure_date` | date | Condicional | - | 2027-01-05 |
| `stay_duration` | number | ✅ | En días | 10 |
| `stay_duration_unit` | enum | ✅ | DAYS/WEEKS/MONTHS | DAYS |
| `us_address_line1` | string | ✅ | - | 123 Disney Way |
| `us_address_city` | string | ✅ | - | Orlando |
| `us_address_state` | string | ✅ | Código estado | FL |
| `us_address_zip` | string | ✅ | 5 dígitos | 32830 |
| `trip_payer` | enum | ✅ | SELF/COMPANY/SPONSOR/OTHER | SELF |
| `payer_details` | object | Condicional | Si payer!=SELF | {} |

#### 1.4 Acompañantes (COMPANIONS)

| Campo | Tipo | Requerido | Validación | Ejemplo |
|-------|------|-----------|------------|---------|
| `traveling_with_others` | boolean | ✅ | - | true |
| `companions` | array | Condicional | Si traveling_with_others=true | [] |
| `companion.name` | string | ✅ | - | Federico Boti |
| `companion.relationship` | enum | ✅ | SPOUSE/CHILD/PARENT/FRIEND/GROUP | PARENT |
| `group_travel` | boolean | ✅ | - | false |
| `group_name` | string | Condicional | - | - |

#### 1.5 Viajes Anteriores a USA (PREVIOUS_TRAVEL)

| Campo | Tipo | Requerido | Validación | Ejemplo |
|-------|------|-----------|------------|---------|
| `previous_us_travel` | boolean | ✅ | - | false |
| `previous_visits` | array | Condicional | - | [] |
| `visit.arrival_date` | date | ✅ | - | - |
| `visit.stay_length` | string | ✅ | - | - |
| `us_drivers_license` | boolean | ✅ | - | false |
| `previous_visa` | boolean | ✅ | - | false |
| `previous_visa_number` | string | Condicional | - | - |
| `previous_visa_issue_date` | date | Condicional | - | - |
| `previous_visa_same_type` | boolean | Condicional | - | - |
| `previous_visa_same_country` | boolean | Condicional | - | - |
| `ten_printed` | boolean | ✅ | Biométricos previos | false |
| `visa_refused` | boolean | ✅ | - | false |
| `visa_refused_details` | string | Condicional | - | - |
| `visa_revoked` | boolean | ✅ | - | false |
| `immigrant_petition` | boolean | ✅ | - | false |

#### 1.6 Contacto en USA (US_CONTACT)

| Campo | Tipo | Requerido | Validación | Ejemplo |
|-------|------|-----------|------------|---------|
| `us_contact_name` | string | ✅ | - | Hotel Disney |
| `us_contact_organization` | string | ❌ | - | Disney Resorts |
| `us_contact_relationship` | enum | ✅ | RELATIVE/FRIEND/BUSINESS/HOTEL/OTHER | HOTEL |
| `us_contact_address` | string | ✅ | - | 1 Disney Way |
| `us_contact_city` | string | ✅ | - | Orlando |
| `us_contact_state` | string | ✅ | - | FL |
| `us_contact_zip` | string | ✅ | - | 32830 |
| `us_contact_phone` | string | ✅ | - | +1 407 123 4567 |
| `us_contact_email` | string | ❌ | Email válido | - |

#### 1.7 Datos Familiares (FAMILY)

| Campo | Tipo | Requerido | Validación | Ejemplo |
|-------|------|-----------|------------|---------|
| `father_surname` | string | ✅ | - | BOTI |
| `father_given_name` | string | ✅ | - | FEDERICO JOSE |
| `father_birth_date` | date | ✅ | - | 1988-05-15 |
| `father_in_us` | boolean | ✅ | - | false |
| `father_us_status` | enum | Condicional | CITIZEN/LPR/NONIMMIGRANT/OTHER | - |
| `mother_surname` | string | ✅ | - | CONDE |
| `mother_given_name` | string | ✅ | - | MARIA GIMENA |
| `mother_birth_date` | date | ✅ | - | 1990-03-20 |
| `mother_in_us` | boolean | ✅ | - | false |
| `immediate_relatives_in_us` | boolean | ✅ | - | false |
| `relatives_in_us` | array | Condicional | - | [] |

#### 1.8 Datos Laborales/Educativos (WORK_EDUCATION)

*Nota: Para menores de edad, se completa con info de los padres*

| Campo | Tipo | Requerido | Validación | Ejemplo |
|-------|------|-----------|------------|---------|
| `occupation` | enum | ✅ | Lista predefinida | CHILD |
| `employer_name` | string | Condicional | Si trabaja | - |
| `employer_address` | string | Condicional | - | - |
| `employer_city` | string | Condicional | - | - |
| `employer_phone` | string | Condicional | - | - |
| `job_title` | string | Condicional | - | - |
| `start_date` | date | Condicional | - | - |
| `monthly_salary` | number | Condicional | - | - |
| `job_description` | string | Condicional | - | - |
| `previous_employers` | array | ❌ | Últimos 5 años | [] |
| `education_level` | enum | ✅ | NO_FORMAL/PRIMARY/SECONDARY/UNIVERSITY | NO_FORMAL |
| `schools_attended` | array | Condicional | - | [] |

#### 1.9 Preguntas de Seguridad (SECURITY)

| Campo | Tipo | Requerido | Ejemplo |
|-------|------|-----------|---------|
| `disease_communicable` | boolean | ✅ | false |
| `disorder_mental` | boolean | ✅ | false |
| `drug_abuser` | boolean | ✅ | false |
| `arrested_convicted` | boolean | ✅ | false |
| `controlled_substances` | boolean | ✅ | false |
| `prostitution` | boolean | ✅ | false |
| `money_laundering` | boolean | ✅ | false |
| `human_trafficking` | boolean | ✅ | false |
| `aided_trafficking` | boolean | ✅ | false |
| `trafficking_related` | boolean | ✅ | false |
| `illegal_gambling` | boolean | ✅ | false |
| `espionage` | boolean | ✅ | false |
| `terrorist_activity` | boolean | ✅ | false |
| `terrorist_support` | boolean | ✅ | false |
| `terrorist_org_member` | boolean | ✅ | false |
| `genocide` | boolean | ✅ | false |
| `torture` | boolean | ✅ | false |
| `extrajudicial_killing` | boolean | ✅ | false |
| `child_soldier` | boolean | ✅ | false |
| `religious_freedom` | boolean | ✅ | false |
| `organ_trafficking` | boolean | ✅ | false |
| `deportation` | boolean | ✅ | false |
| `child_custody` | boolean | ✅ | false |
| `voting_violation` | boolean | ✅ | false |
| `tax_evasion` | boolean | ✅ | false |

### PASO 2: Formulario DS-160

#### Estados del DS-160

| Estado | Descripción | Acciones posibles |
|--------|-------------|-------------------|
| `NOT_STARTED` | No iniciado | Iniciar |
| `IN_PROGRESS` | En progreso | Continuar, Guardar |
| `REVIEW` | Revisión final | Editar, Enviar |
| `SUBMITTED` | Enviado | Ver confirmación |
| `EXPIRED` | Expirado (30 días sin actividad) | Reiniciar |

#### Secciones del DS-160

| Sección | Campos | Estado |
|---------|--------|--------|
| Personal 1 | Nombre, Sexo, Estado Civil, Fechas | ⬜ |
| Personal 2 | Nacionalidad, IDs | ⬜ |
| Address & Phone | Dirección, Teléfono, Email | ⬜ |
| Passport | Datos pasaporte | ⬜ |
| Travel | Info del viaje | ⬜ |
| Travel Companions | Acompañantes | ⬜ |
| Previous US Travel | Viajes anteriores | ⬜ |
| US Contact | Contacto en USA | ⬜ |
| Family | Padres, Cónyuge | ⬜ |
| Work/Education Present | Trabajo/Estudio actual | ⬜ |
| Work/Education Previous | Historial | ⬜ |
| Additional Work | Info adicional | ⬜ |
| Security 1-5 | Preguntas seguridad | ⬜ |
| Photo | Foto 5x5 | ⬜ |
| Review | Revisión | ⬜ |
| Sign & Submit | Firma electrónica | ⬜ |

#### Output del DS-160

```json
{
  "confirmation_number": "AA00123456789",
  "barcode_page_url": "https://...",
  "submission_date": "2026-02-15T10:30:00Z",
  "expiry_date": "2027-02-15T10:30:00Z",
  "photo_uploaded": true
}
```

### PASO 3: Cuenta ustraveldocs

| Campo | Tipo | Requerido |
|-------|------|-----------|
| `email` | string | ✅ |
| `password` | string | ✅ (encrypted) |
| `account_verified` | boolean | ✅ |
| `ds160_linked` | boolean | ✅ |

### PASO 4: Pago MRV

| Campo | Tipo | Ejemplo |
|-------|------|---------|
| `payment_method` | enum | BANK_DEPOSIT/ONLINE |
| `payment_date` | date | 2026-02-16 |
| `receipt_number` | string | 0012-3456-7890 |
| `amount_usd` | number | 185 |
| `bank_reference` | string | ABC123 |

### PASO 5-6: Monitoreo y Cita

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `monitoring_active` | boolean | Si está buscando turnos |
| `preferred_dates` | array[date] | Fechas preferidas |
| `min_date` | date | Fecha mínima aceptable |
| `max_date` | date | Fecha máxima aceptable |
| `location` | string | Buenos Aires |
| `auto_book` | boolean | Reservar automáticamente |
| `appointment_date` | date | Fecha conseguida |
| `appointment_time` | string | Hora |
| `appointment_location` | string | Dirección embajada |
| `confirmation_number` | string | Número confirmación |

### PASO 7: Checklist Entrevista

```json
{
  "documents": [
    {
      "name": "Pasaporte vigente",
      "required": true,
      "checked": false,
      "notes": "Original, no copia"
    },
    {
      "name": "Confirmación DS-160",
      "required": true,
      "checked": false,
      "notes": "Página con código de barras"
    },
    {
      "name": "Foto 5x5",
      "required": true,
      "checked": false,
      "notes": "Fondo blanco, reciente"
    },
    {
      "name": "Recibo de pago MRV",
      "required": true,
      "checked": false,
      "notes": "Impreso"
    },
    {
      "name": "Confirmación de cita",
      "required": true,
      "checked": false,
      "notes": "Impresa"
    },
    {
      "name": "Partida de nacimiento",
      "required": true,
      "checked": false,
      "notes": "Para menores"
    },
    {
      "name": "Pasaportes de los padres",
      "required": true,
      "checked": false,
      "notes": "Con visa vigente o acompañando"
    },
    {
      "name": "Prueba de fondos",
      "required": false,
      "checked": false,
      "notes": "Extractos bancarios 3 meses"
    },
    {
      "name": "Prueba de empleo",
      "required": false,
      "checked": false,
      "notes": "Carta del empleador"
    },
    {
      "name": "Itinerario de viaje",
      "required": false,
      "checked": false,
      "notes": "Reservas hotel/vuelos"
    }
  ]
}
```

---

## 🇮🇹 Italia - Ciudadanía Jure Sanguinis

### Resumen

| Campo | Valor |
|-------|-------|
| **Sistema de turnos** | Prenota Online (prenotami.esteri.it) |
| **Costo** | €300 (tasa ciudadanía) + apostillas |
| **Tiempo estimado** | 2-10 años (depende consulado) |
| **Entrevista** | Sí, presentación de documentos |

### Pasos del Trámite

```
┌─────────────────────────────────────────────────────────────┐
│              ITALIA CIUDADANÍA WORKFLOW                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  PASO 1: Verificar Elegibilidad                             │
│  └─▶ Estado: ELIGIBILITY_CHECK                              │
│      └─▶ Línea de sangre sin interrupciones                 │
│      └─▶ AVO no naturalizado antes de hijo                  │
│                                                             │
│  PASO 2: Armar Árbol Genealógico                            │
│  └─▶ Estado: GENEALOGY                                      │
│      └─▶ Identificar todos los ancestros                    │
│      └─▶ Desde AVO italiano hasta solicitante               │
│                                                             │
│  PASO 3: Recolectar Actas                                   │
│  └─▶ Estado: DOCUMENTS_COLLECTION                           │
│      └─▶ Actas de nacimiento                                │
│      └─▶ Actas de matrimonio                                │
│      └─▶ Actas de defunción                                 │
│      └─▶ CNN (Certificado No Naturalización)                │
│                                                             │
│  PASO 4: Rectificar Actas                                   │
│  └─▶ Estado: DOCUMENTS_RECTIFICATION                        │
│      └─▶ Corregir errores de nombres/fechas                 │
│      └─▶ Vía judicial si necesario                          │
│                                                             │
│  PASO 5: Traducir Documentos                                │
│  └─▶ Estado: TRANSLATIONS                                   │
│      └─▶ Traductor público matriculado                      │
│                                                             │
│  PASO 6: Apostillar/Legalizar                               │
│  └─▶ Estado: APOSTILLE                                      │
│      └─▶ Apostilla de La Haya                               │
│                                                             │
│  PASO 7: Conseguir Turno Consulado                          │
│  └─▶ Estado: APPOINTMENT_HUNTING                            │
│      └─▶ Prenota Online                                     │
│      └─▶ Espera: 2-10 años según consulado                  │
│                                                             │
│  PASO 8: Presentación en Consulado                          │
│  └─▶ Estado: CONSULATE_APPOINTMENT                          │
│      └─▶ Entrega de carpeta completa                        │
│                                                             │
│  PASO 9: Espera Resolución                                  │
│  └─▶ Estado: PROCESSING                                     │
│      └─▶ 6-24 meses después de presentación                 │
│                                                             │
│  PASO 10: Transcripción en Italia                           │
│  └─▶ Estado: TRANSCRIPTION                                  │
│      └─▶ Inscripción en comune italiano                     │
│                                                             │
│  PASO 11: Documentos Italianos                              │
│  └─▶ Estado: COMPLETED                                      │
│      └─▶ Solicitar pasaporte italiano                       │
│      └─▶ Solicitar CI italiana                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Documentos Requeridos por Persona en Línea

| Documento | Por quién | Detalles |
|-----------|-----------|----------|
| Acta de Nacimiento | Todos en línea | Original, no copia |
| Acta de Matrimonio | Casados en línea | Si aplica |
| Acta de Defunción | Fallecidos en línea | Si aplica |
| CNN | AVO | Certificado de No Naturalización |
| Traducción | Todos los docs ARG | Por traductor público |
| Apostilla | Todos los docs | Apostilla de La Haya |

### Tracking de Documentos

```json
{
  "genealogy_tree": [
    {
      "person_id": "avo",
      "name": "Giuseppe Botti",
      "relationship": "Tatarabuelo",
      "birth_country": "IT",
      "documents": {
        "birth_certificate": {
          "status": "OBTAINED",
          "source": "Comune di Roma",
          "date_obtained": "2025-01-15",
          "translated": true,
          "apostilled": true
        },
        "marriage_certificate": {
          "status": "OBTAINED",
          "translated": true,
          "apostilled": true
        },
        "death_certificate": {
          "status": "PENDING",
          "source": "Registro Civil ARG"
        },
        "cnn": {
          "status": "OBTAINED",
          "date": "2025-02-01"
        }
      }
    },
    {
      "person_id": "gen1",
      "name": "Antonio Botti",
      "relationship": "Bisabuelo",
      "birth_country": "ARG",
      "documents": {
        "birth_certificate": {
          "status": "NEEDS_RECTIFICATION",
          "issue": "Nombre mal escrito",
          "action": "Rectificación judicial"
        }
      }
    }
  ]
}
```

---

## 🇪🇸 España - Visa Schengen

### Resumen

| Campo | Valor |
|-------|-------|
| **Formulario** | Formulario Schengen estándar |
| **Sistema de turnos** | BLS International |
| **Costo** | €80 + fee BLS (~€20) |
| **Tiempo** | 15-45 días |

### Pasos del Trámite

```
┌─────────────────────────────────────────────────────────────┐
│              ESPAÑA SCHENGEN WORKFLOW                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  PASO 1: Recolección de Datos                               │
│  └─▶ Estado: DATA_COLLECTION                                │
│                                                             │
│  PASO 2: Completar Formulario Schengen                      │
│  └─▶ Estado: FORM_SCHENGEN                                  │
│      └─▶ Formulario PDF o online                            │
│                                                             │
│  PASO 3: Contratar Seguro de Viaje                          │
│  └─▶ Estado: TRAVEL_INSURANCE                               │
│      └─▶ Mínimo €30,000 cobertura médica                    │
│      └─▶ Cobertura en zona Schengen                         │
│                                                             │
│  PASO 4: Reunir Documentos                                  │
│  └─▶ Estado: DOCUMENTS                                      │
│      └─▶ Ver checklist abajo                                │
│                                                             │
│  PASO 5: Conseguir Turno BLS                                │
│  └─▶ Estado: APPOINTMENT_HUNTING                            │
│                                                             │
│  PASO 6: Cita en BLS                                        │
│  └─▶ Estado: BLS_APPOINTMENT                                │
│      └─▶ Entrega documentos + biométricos                   │
│                                                             │
│  PASO 7: Espera Resolución                                  │
│  └─▶ Estado: PROCESSING                                     │
│                                                             │
│  PASO 8: Retiro de Pasaporte                                │
│  └─▶ Estado: COMPLETED                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Campos del Formulario Schengen

| Campo | Tipo | Requerido |
|-------|------|-----------|
| `surname` | string | ✅ |
| `surname_at_birth` | string | ❌ |
| `first_names` | string | ✅ |
| `birth_date` | date | ✅ |
| `birth_place` | string | ✅ |
| `birth_country` | string | ✅ |
| `current_nationality` | string | ✅ |
| `nationality_at_birth` | string | ❌ |
| `sex` | enum | ✅ |
| `marital_status` | enum | ✅ |
| `parental_authority` | string | Para menores |
| `national_id_number` | string | ❌ |
| `passport_type` | enum | ✅ |
| `passport_number` | string | ✅ |
| `passport_issue_date` | date | ✅ |
| `passport_valid_until` | date | ✅ |
| `passport_issued_by` | string | ✅ |
| `home_address` | string | ✅ |
| `email` | string | ✅ |
| `phone` | string | ✅ |
| `residence_different` | boolean | ✅ |
| `occupation` | string | ✅ |
| `employer_name` | string | ✅ |
| `employer_address` | string | ✅ |
| `employer_phone` | string | ✅ |
| `travel_purpose` | enum | ✅ |
| `destination_country` | string | ✅ |
| `first_entry_country` | string | ✅ |
| `entries_requested` | enum | SINGLE/DOUBLE/MULTIPLE |
| `duration_of_stay` | number | ✅ |
| `previous_schengen_visas` | array | ❌ |
| `fingerprints_collected` | boolean | ✅ |
| `entry_permit` | string | Si tiene |
| `arrival_date` | date | ✅ |
| `departure_date` | date | ✅ |
| `inviting_person` | object | ❌ |
| `inviting_company` | object | ❌ |
| `accommodation` | string | ✅ |
| `travel_costs_paid_by` | enum | ✅ |

### Checklist Documentos Schengen España

```json
{
  "documents": [
    { "name": "Pasaporte", "required": true, "notes": "Vigencia >3 meses post-viaje, 2 páginas libres" },
    { "name": "Formulario Schengen", "required": true, "notes": "Firmado" },
    { "name": "Foto 3.5x4.5", "required": true, "notes": "Fondo blanco, reciente" },
    { "name": "Seguro de viaje", "required": true, "notes": "€30,000 mínimo" },
    { "name": "Reserva de vuelo", "required": true, "notes": "Ida y vuelta" },
    { "name": "Reserva de hotel", "required": true, "notes": "O carta de invitación" },
    { "name": "Extractos bancarios", "required": true, "notes": "3 meses" },
    { "name": "Carta de empleo", "required": true, "notes": "Con permiso de vacaciones" },
    { "name": "Fee BLS", "required": true, "notes": "€80 + €20" }
  ]
}
```

---

## 🇪🇸 España - Ley de Nietos (Ciudadanía)

### Resumen

| Campo | Valor |
|-------|-------|
| **Ley** | Ley 20/2022 de Memoria Democrática |
| **Sistema** | Consulado español |
| **Costo** | Gratuito |
| **Deadline** | Octubre 2025 |

### Pasos del Trámite

```
┌─────────────────────────────────────────────────────────────┐
│              ESPAÑA LEY DE NIETOS WORKFLOW                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  PASO 1: Verificar Elegibilidad                             │
│  └─▶ Estado: ELIGIBILITY_CHECK                              │
│      └─▶ Hijo/nieto de español de origen                    │
│      └─▶ O hijo/nieto de exiliado                           │
│                                                             │
│  PASO 2: Recolección de Datos                               │
│  └─▶ Estado: DATA_COLLECTION                                │
│                                                             │
│  PASO 3: Obtener Documentos                                 │
│  └─▶ Estado: DOCUMENTS                                      │
│      └─▶ Acta nacimiento español (abuelo/padre)             │
│      └─▶ Actas de toda la línea                             │
│                                                             │
│  PASO 4: Conseguir Turno Consulado                          │
│  └─▶ Estado: APPOINTMENT_HUNTING                            │
│                                                             │
│  PASO 5: Presentación Consulado                             │
│  └─▶ Estado: CONSULATE_APPOINTMENT                          │
│                                                             │
│  PASO 6: Espera Resolución                                  │
│  └─▶ Estado: PROCESSING                                     │
│      └─▶ Hasta 1 año                                        │
│                                                             │
│  PASO 7: Juramento                                          │
│  └─▶ Estado: OATH                                           │
│                                                             │
│  PASO 8: Inscripción en Registro Civil                      │
│  └─▶ Estado: CIVIL_REGISTRY                                 │
│                                                             │
│  PASO 9: Documentos Españoles                               │
│  └─▶ Estado: COMPLETED                                      │
│      └─▶ DNI español                                        │
│      └─▶ Pasaporte español                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🇬🇧 UK - Visitor Visa

### Resumen

| Campo | Valor |
|-------|-------|
| **Formulario** | Online en gov.uk |
| **Sistema** | TLS Contact / VFS |
| **Costo** | £115 (6 meses) / £400 (2 años) |
| **Tiempo** | 3-6 semanas |

### Pasos del Trámite

```
┌─────────────────────────────────────────────────────────────┐
│                    UK VISITOR WORKFLOW                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  PASO 1: Recolección de Datos                               │
│  └─▶ Estado: DATA_COLLECTION                                │
│                                                             │
│  PASO 2: Completar Formulario Online                        │
│  └─▶ Estado: FORM_ONLINE                                    │
│      └─▶ apply-to-visit-the-uk                              │
│                                                             │
│  PASO 3: Pagar Visa Fee                                     │
│  └─▶ Estado: PAYMENT                                        │
│                                                             │
│  PASO 4: Agendar Cita VAC (Biométricos)                     │
│  └─▶ Estado: APPOINTMENT_HUNTING                            │
│      └─▶ TLS Contact o VFS                                  │
│                                                             │
│  PASO 5: Cita VAC                                           │
│  └─▶ Estado: VAC_APPOINTMENT                                │
│      └─▶ Biométricos + documentos                           │
│                                                             │
│  PASO 6: Espera Resolución                                  │
│  └─▶ Estado: PROCESSING                                     │
│                                                             │
│  PASO 7: Retiro Pasaporte                                   │
│  └─▶ Estado: COMPLETED                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🇨🇦 Canadá - Visitor Visa

### Resumen

| Campo | Valor |
|-------|-------|
| **Formulario** | IMM 5257 + IMM 5645 |
| **Sistema** | IRCC Online |
| **Costo** | CAD $100 + biométricos $85 |
| **Tiempo** | 4-8 semanas |

### Pasos del Trámite

```
┌─────────────────────────────────────────────────────────────┐
│                  CANADÁ VISITOR WORKFLOW                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  PASO 1: Crear cuenta IRCC                                  │
│  └─▶ Estado: ACCOUNT_CREATION                               │
│                                                             │
│  PASO 2: Recolección de Datos                               │
│  └─▶ Estado: DATA_COLLECTION                                │
│                                                             │
│  PASO 3: Completar Formularios                              │
│  └─▶ Estado: FORMS                                          │
│      └─▶ IMM 5257 (Application)                             │
│      └─▶ IMM 5645 (Family Information)                      │
│                                                             │
│  PASO 4: Subir Documentos                                   │
│  └─▶ Estado: DOCUMENTS_UPLOAD                               │
│                                                             │
│  PASO 5: Pagar Fees                                         │
│  └─▶ Estado: PAYMENT                                        │
│                                                             │
│  PASO 6: Biométricos (VAC)                                  │
│  └─▶ Estado: BIOMETRICS                                     │
│      └─▶ Turno en VFS                                       │
│                                                             │
│  PASO 7: Espera Resolución                                  │
│  └─▶ Estado: PROCESSING                                     │
│                                                             │
│  PASO 8: Passport Request                                   │
│  └─▶ Estado: PASSPORT_REQUEST                               │
│      └─▶ Si aprueban, piden pasaporte                       │
│                                                             │
│  PASO 9: Visa Estampada                                     │
│  └─▶ Estado: COMPLETED                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🇪🇺 Schengen Genérico

### Campos Universales (Aplican a todos los países Schengen)

El formulario es el mismo, pero cada país tiene su propio sistema de turnos:

| País | Sistema de Turnos |
|------|-------------------|
| Francia | TLS Contact |
| Alemania | VFS Global |
| Italia | Prenota / VFS |
| España | BLS International |
| Portugal | VFS Global |
| Países Bajos | VFS Global |
| Bélgica | TLS Contact |
| Austria | VFS Global |

---

## 💾 Modelo de Datos de Estado

### Estructura Principal

```typescript
interface Tramite {
  id: string;
  userId: string;
  type: TramiteType; // USA_B1B2, ITALY_CITIZENSHIP, SPAIN_SCHENGEN, etc.
  
  // Estado global
  status: GlobalStatus;
  statusHistory: StatusChange[];
  
  // Progreso
  currentStep: number;
  totalSteps: number;
  completionPercentage: number;
  
  // Datos recolectados
  applicantData: ApplicantData;
  travelData?: TravelData;
  familyData?: FamilyData;
  workData?: WorkData;
  
  // Formularios
  forms: FormState[];
  
  // Documentos
  documents: DocumentState[];
  
  // Citas
  appointments: AppointmentState[];
  
  // Monitoreo
  monitoring?: MonitoringState;
  
  // Pagos
  payments: PaymentState[];
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastActivityAt: Date;
  
  // Notas
  notes: Note[];
}

interface FormState {
  formType: string; // DS160, SCHENGEN, IMM5257, etc.
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'SUBMITTED' | 'EXPIRED';
  sections: SectionState[];
  confirmationNumber?: string;
  submittedAt?: Date;
  expiresAt?: Date;
  savedData: Record<string, any>;
}

interface SectionState {
  name: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ERROR';
  fields: FieldState[];
  completedAt?: Date;
  errors?: string[];
}

interface FieldState {
  name: string;
  value: any;
  valid: boolean;
  touched: boolean;
  error?: string;
}

interface DocumentState {
  type: string;
  name: string;
  required: boolean;
  status: 'PENDING' | 'UPLOADED' | 'VERIFIED' | 'REJECTED';
  fileUrl?: string;
  uploadedAt?: Date;
  verifiedAt?: Date;
  rejectionReason?: string;
  notes?: string;
}

interface StatusChange {
  from: string;
  to: string;
  changedAt: Date;
  reason?: string;
  automatic: boolean;
}
```

### API Endpoints

```typescript
// Obtener estado actual del trámite
GET /api/tramites/:id
Response: Tramite

// Actualizar datos de un paso
PATCH /api/tramites/:id/steps/:stepId
Body: { data: Record<string, any> }
Response: { success: boolean, nextStep?: string }

// Obtener checklist de documentos
GET /api/tramites/:id/documents/checklist
Response: DocumentChecklist[]

// Subir documento
POST /api/tramites/:id/documents
Body: FormData (file + metadata)
Response: DocumentState

// Obtener estado de monitoreo
GET /api/tramites/:id/monitoring
Response: MonitoringState

// Continuar trámite (obtener siguiente acción)
GET /api/tramites/:id/next-action
Response: { 
  action: string, 
  step: string, 
  data?: any,
  message: string 
}
```

### Notificaciones de Cambio de Estado

```typescript
interface StateChangeNotification {
  tramiteId: string;
  userId: string;
  previousStatus: string;
  newStatus: string;
  message: string;
  actionRequired: boolean;
  actionUrl?: string;
  channels: ('telegram' | 'whatsapp' | 'email')[];
}

// Ejemplos de mensajes
const notifications = {
  'FORM_COMPLETED': '✅ Formulario DS-160 completado! Siguiente paso: pagar la visa.',
  'PAYMENT_COMPLETED': '💳 Pago recibido! Activando monitoreo de turnos...',
  'SLOT_FOUND': '🎉 ¡TURNO DISPONIBLE! Fecha: {date}. ¿Reservamos?',
  'APPOINTMENT_SCHEDULED': '📅 Cita confirmada: {date} a las {time} en {location}',
  'VISA_APPROVED': '🎊 ¡VISA APROBADA! Tu pasaporte estará listo en {days} días.'
};
```

---

*Documento creado: Febrero 2026*
*Versión: 1.0*
*Parte de: VisaBot Specification*
