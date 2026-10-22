# ХимОлимп — Подготовка к олимпиаде по химии

Статическое веб-приложение (HTML/JS) + **Capacitor** → **Android APK** через GitHub Actions.

Серверной части нет: всё работает офлайн в APK (localStorage, локальная база реакций).

---

## Как собрать APK только через GitHub (с телефона)

### 1. Создай репозиторий и залей файлы

На [github.com](https://github.com) → New repository → имя например `himolimp` → Public.

Залей **все** файлы из этой папки в **корень** репозитория (через веб-интерфейс «Upload files» или git).

Нужны как минимум:
- `index.html`, `manifest.webmanifest`, `sw.js`, `icons/`
- `package.json`, `capacitor.config.json`, `scripts/build-mobile.mjs`
- `.github/workflows/build-apk.yml`
- `.gitignore`

### 2. Запусти сборку

1. Вкладка **Actions**
2. Workflow **Build APK**
3. **Run workflow** → Run

Через 3–8 минут:
- появится **Release** с тегом `apk-latest`
- файл **`app-debug.apk`** — скачай и установи на Android  
  (Настройки → разрешить установку из неизвестных источников / из браузера)

### 3. Если сборка упала

Пришли **название шага** и **первые строки ошибки** из лога Actions — по ним можно точечно поправить workflow или конфиг.

---

## Что делает workflow

1. Node 22 + Java 21  
2. `npm install`  
3. `npm run build:mobile` → копирует сайт в `www/`  
4. `npx cap add android` + `npx cap sync android`  
5. `./gradlew assembleDebug`  
6. Публикует `app-debug.apk` в Release `apk-latest` (без zip)

---

## Локальные скрипты (если когда-нибудь будет ПК)

```bash
npm install
npm run build:mobile
npx cap add android
npx cap sync android
# APK: android/app/build/outputs/apk/debug/app-debug.apk после gradlew
```

---

## Структура

```
├── index.html
├── manifest.webmanifest
├── sw.js
├── icons/
├── package.json
├── capacitor.config.json
├── scripts/build-mobile.mjs
├── .github/workflows/
│   ├── build-apk.yml      ← сборка APK
│   └── pages.yml          ← опционально: сайт на GitHub Pages
└── .gitignore
```

`appId`: `ru.himolimp.app` — при желании смени в `capacitor.config.json` до первой сборки.

---

## Игра

- 118 элементов, сотни реакций  
- Квиз олимпиады, уроки, журнал открытий  
- Работает без интернета в APK  
