# PULPO.ai Mobile

App móvil multilingüe para iOS, Android y Web. **React Native 0.83** + **Expo SDK 55** + **Expo Router 5** (file-based routing) + **Apollo Client** + **Zustand** + **i18next**.

---

## Quickstart

```bash
cd mobile
npm install              # ~3s en buena conexión

# Setear endpoint del backend
cp .env.example .env     # si existe; si no, crear:
cat > .env <<EOF
EXPO_PUBLIC_API_URL=http://localhost:4000/graphql
EXPO_PUBLIC_COMPETITION_MODE=league_demo
EXPO_PUBLIC_DEFAULT_LANGUAGE=en
EOF

# Arrancar
npm start                # Expo Dev Tools — escanear QR con Expo Go (iOS/Android)
npm run ios              # iOS Simulator (requiere Xcode)
npm run android          # Android Emulator
npm run web              # browser → http://localhost:8081
```

---

## Variables de entorno

Las vars con prefijo `EXPO_PUBLIC_` son inyectadas al bundle JS y son públicas. **No pongas secretos aquí.**

| Variable | Descripción |
|----------|-------------|
| `EXPO_PUBLIC_API_URL` | Endpoint GraphQL del backend |
| `EXPO_PUBLIC_COMPETITION_MODE` | `league_demo` o `world_cup` (debe coincidir con el backend) |
| `EXPO_PUBLIC_DEFAULT_LANGUAGE` | `en` por default; el usuario puede cambiarlo en Ajustes |

⚠️ El backend debe ser accesible desde el dispositivo. Para testing en device físico, usa la IP LAN de tu máquina (no `localhost`):

```env
EXPO_PUBLIC_API_URL=http://192.168.0.35:4000/graphql
```

Y en `backend/.env` añade ese origen a `CORS_ORIGIN`.

---

## Estructura

```
mobile/
├── App.js / index.js
├── app.json                       Configuración Expo (slug, scheme, icons)
├── babel.config.js
├── metro.config.js
├── assets/
│   ├── icon.png                   1024×1024 (Pulpo logo)
│   ├── splash-icon.png
│   ├── favicon.png                512×512 para web
│   ├── polla-icon.png             1024×1024 (variante Polla)
│   └── fonts/                     Space Grotesk + Lexend
├── app/                           Routing file-based (Expo Router)
│   ├── _layout.jsx                Root layout: providers (Apollo, i18n, fonts)
│   ├── (tabs)/
│   │   ├── _layout.jsx            Tab bar (2 tabs)
│   │   ├── index.jsx              Tab Chat
│   │   └── polla.jsx              Tab Polla
│   ├── auth/
│   │   ├── login.jsx
│   │   └── register.jsx
│   ├── polla/
│   │   ├── [groupId].jsx          Grupo dinámico
│   │   ├── create.jsx
│   │   └── invite.jsx
│   └── settings/                  Ajustes (idioma, sesión, about)
└── src/
    ├── apollo/
    │   ├── client.js              ApolloClient + auth link (Bearer token)
    │   ├── queries.js
    │   └── mutations.js
    ├── components/
    │   ├── chat/                  ChatPanel, ChatInput, MessageBubble, PulpoAvatar, QuickChips, TypingIndicator, InlineVizCard, RegistrationPromptModal
    │   ├── polla/                 GroupCard, InviteButton, LeaderboardList, ScoreStepper
    │   ├── predictions/           ProbabilityBars, PodiumForecast, FeaturedMatchup, TopPerformerCard
    │   ├── context/
    │   └── shared/
    ├── hooks/
    ├── i18n/
    │   ├── i18n.js                Setup i18next + detector
    │   └── locales/               en, es, fr, pt, de, it
    ├── store/
    │   ├── authStore.js           Zustand: token, refreshToken, user (con expo-secure-store)
    │   └── chatStore.js           Zustand: mensajes, sessionId
    ├── styles/
    │   ├── colors.js              Bioluminescent palette
    │   └── typography.js          Space Grotesk + Lexend scales
    └── utils/
```

---

## Sistema de diseño

Dark mode únicamente. Pure black como base. Acentos:

| Token | Hex | Uso |
|-------|-----|-----|
| `colors.primary` | `#b1a1ff` | Lavender — marca, CTAs |
| `colors.secondary` | `#00e3fd` | Cyan — datos, links, tab activo |
| `colors.tertiary` | `#c2ff99` | Lime — éxito, trends |
| `colors.error` | `#ff6e84` | Coral — errores |
| `gradients.signature` | `[primary, secondary, tertiary]` | Wordmark, hero accents |
| `gradients.primaryToSecondary` | `[primary, secondary]` | Botones CTA, avatar Pulpo |

Tipografía:
- **Space Grotesk Bold** — display, headlines, números (uppercase, tight tracking)
- **Lexend Light/Regular/Medium** — body, labels, navegación

Importar desde [`src/styles/colors.js`](src/styles/colors.js) y [`src/styles/typography.js`](src/styles/typography.js). NO hardcodear hex en componentes.

---

## i18n

6 idiomas en [`src/i18n/locales/`](src/i18n/locales/). Cada uno con `translation.json` y las mismas keys (CI debería verificarlo).

```js
import { useTranslation } from 'react-i18next';
const { t } = useTranslation();
return <Text>{t('chat.empty_state')}</Text>;
```

Cambiar idioma en runtime: el usuario lo hace desde Ajustes; internamente `i18n.changeLanguage(code)` y se persiste con `expo-secure-store`.

---

## Apollo Client

Configurado en [`src/apollo/client.js`](src/apollo/client.js). Auth link inyecta `Authorization: Bearer <token>` desde `authStore`. La cache se normaliza por `id`.

```js
import { useQuery } from '@apollo/client';
import { GET_FIXTURES } from '../apollo/queries';

const { data, loading, error } = useQuery(GET_FIXTURES, {
  variables: { competition: 'la_liga_2025', limit: 10 },
});
```

---

## Build & deploy

### Web export (estático)

```bash
npx expo export --platform web
# -> dist/
```

Servir con cualquier static host (Cloudflare Pages, Vercel, S3+CloudFront). En desarrollo con un servidor SPA-aware (Expo Router exporta `polla.html`, no `polla/index.html`).

### iOS / Android via EAS

Pre-requisito: cuenta Expo + EAS CLI (`npm install -g eas-cli`).

```bash
eas login
eas build --platform ios --profile preview      # TestFlight
eas build --platform android --profile preview  # APK / AAB
eas submit --platform ios                       # App Store Connect
eas submit --platform android                   # Google Play Console
```

OTA updates (sin re-review):

```bash
eas update --branch production --message "Hotfix: prediction display"
```

### App Store assets requeridos

- App icon 1024×1024 (sin canal alfa) — ya en `assets/icon.png`.
- Screenshots: 6.7" iPhone, 6.5" iPhone, 12.9" iPad. Se pueden generar con Expo Web export + Playwright (ver [`/tmp/pulpo_screenshots.mjs`](../docs/user_manual/screenshots/)).
- Feature graphic Play Store: 1024×500.
- Descripciones en los 6 idiomas.
- Edad: **12+** (predicciones, no gambling real).
- Privacy policy URL.

---

## Testing manual rápido

```bash
# 1. Asegurar que el backend está arriba
curl http://127.0.0.1:4000/health

# 2. Web export y servir
npx expo export --platform web
npx serve dist                # o usar el server SPA del repo

# 3. Abrir en browser, navegar a /, /polla, /auth/login, /settings
```

Para device físico: instala **Expo Go** de la App Store / Play Store, corre `npm start`, escanea el QR.

---

## Troubleshooting

| Síntoma | Causa | Fix |
|---------|-------|-----|
| `Network error` en cualquier query | Backend down o `EXPO_PUBLIC_API_URL` incorrecta | Verificar `curl <api>/health`; usar IP LAN si estás en device |
| Tab Polla no carga, redirige a login | Sin token o token vencido | Hacer login (no se puede usar Polla anónimo) |
| Fonts no cargan en primer render | Splash quitado antes de `useFonts()` | Esperar `fontsLoaded === true` antes de quitar splash |
| Web build falla con error de pkg RN | Algún paquete no soporta web | Stub con alias en `metro.config.js` o `Platform.OS !== 'web'` guard |
| Cambios en `.env` no se reflejan | Expo cachea | `npm start --clear` |

---

## Plataformas soportadas

| Plataforma | Estado | Notas |
|------------|:---:|-------|
| iOS 15+ | ✓ | Tested en simulador y device físico |
| Android 7+ | ✓ | Tested en emulador |
| Web (Chrome, Safari, Firefox modernos) | ✓ | Algunos efectos (haptics) son no-op |
| iPadOS | ✓ | Layout adaptativo (split en tablet) |

---

🐙 Manual de usuario completo: [../docs/user_manual/index.html](../docs/user_manual/index.html).
