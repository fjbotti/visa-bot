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

## Steel.dev (Cloud Browser)

Browser automation for visa appointment sites using [Steel.dev](https://docs.steel.dev).

- **API key:** `/home/clawd/.config/secrets/steel_api_key_visabot`
- **Skill:** `steel-visa-browser` — see SKILL.md for full docs
- **Script:** `~/dev/agents/visabot/scripts/steel-visa-check.js`
- **Screenshots:** `/tmp/visabot-screenshots/`
- **Plan:** Hobby (no proxy, no CAPTCHA solving)

### Usage

```bash
STEEL_API_KEY=$(cat ~/.config/secrets/steel_api_key_visabot) \
  node ~/dev/agents/visabot/scripts/steel-visa-check.js \
  --site ais.usvisa-info.com \
  --username user@email.com \
  --password "pass" \
  --action check
```

### Supported Sites

- VFS Global (vfsglobal.com)
- TLS Contact (tlscontact.com)
- US Embassy (ais.usvisa-info.com)
- BLS International (blsinternational.com)
- Italian consulate (prenotami.esteri.it)

### Security

- **Never log user passwords** — only use in browser session
- **Always clean up Steel sessions** (release after use)
- **Don't persist credentials** in memory files or logs

---

*Mantener actualizado - los requisitos cambian frecuentemente.*
