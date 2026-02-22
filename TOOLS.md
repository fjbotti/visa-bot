# TOOLS.md - Herramientas del VisaBot

## Web Search

Para buscar requisitos actualizados de visas en sitios oficiales.

## Fuentes de Referencia

- Embajadas y consulados oficiales
- Sitios de inmigración de cada país
- VFS Global / TLS Contact (centros de visas)

## Bases de Conocimiento (TODO)

<!-- TODO: Agregar base de datos de requisitos por país/tipo de visa -->

- Requisitos por país de destino
- Documentos estándar por tipo de visa
- Tiempos de procesamiento típicos
- Costos de trámite

## Browserbase (Cloud Browser)

Browser automation for visa appointment sites using [Browserbase](https://browserbase.com).

- **API key:** `/home/clawd/.config/secrets/browserbase_api_key`
- **Skill:** `steel-visa-browser` — see SKILL.md for full docs
- **Script:** `scripts/bb-prenotami-login.js`
- **Screenshots:** `/tmp/visabot-screenshots/`
- **Plan:** Developer ($20/mo — 1 concurrent session, 1GB proxy)

### Prenotami Login (Verified Working)

```bash
node scripts/bb-prenotami-login.js <email> <password>
```

**Key settings:**
- `solveCaptchas: false` — MUST be off (solver interferes with native reCAPTCHA)
- `proxies: [{ type: 'browserbase', geolocation: { country: 'AR' } }]` — AR residential proxy required

### Supported Sites

- Italian consulate (prenotami.esteri.it) ✅ VERIFIED
- US Embassy (ais.usvisa-info.com) — Phase 2
- VFS Global (vfsglobal.com)
- TLS Contact (tlscontact.com)
- BLS International (blsinternational.com)

### Security

- **Never log user passwords** — only use in browser session
- **Always release Browserbase sessions** (in `finally` block)
- **Don't persist credentials** in memory files or logs

---

*Mantener actualizado - los requisitos cambian frecuentemente.*
