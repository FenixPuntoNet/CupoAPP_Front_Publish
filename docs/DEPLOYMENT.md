# Deployment Guide - CupoApp Frontend

## 🚀 Guía de Despliegue

Esta guía cubre el proceso completo de despliegue de CupoApp frontend tanto para web como para dispositivos móviles.

## 📋 Preparación para Despliegue

### 1. Prerrequisitos

#### Para Despliegue Web:
- Node.js 18+ LTS
- npm o yarn
- Git
- Cuenta en plataforma de hosting (Vercel, Netlify, etc.)

#### Para Despliegue Móvil:
- **Android:**
  - Android Studio 4.0+
  - Android SDK 21+
  - Java JDK 17
  - Gradle 8.0+

- **iOS:**
  - macOS
  - Xcode 14+
  - iOS 13+
  - Apple Developer Account

### 2. Variables de Entorno

#### Archivo .env.production
```bash
# API Configuration
VITE_API_URL=https://cupo-backend.fly.dev
VITE_TELEFUNC_URL=https://cupo-backend.fly.dev/_telefunc

# Google Maps
VITE_GOOGLE_MAPS_API_KEY=your_production_maps_key

# Environment
VITE_APP_ENV=production

# Feature Flags
VITE_ENABLE_DEBUG=false
VITE_ENABLE_MOCK_DATA=false

# Sentry (opcional)
VITE_SENTRY_DSN=your_sentry_dsn
VITE_SENTRY_ENVIRONMENT=production

# Analytics (opcional)
VITE_GA_TRACKING_ID=your_google_analytics_id
```

#### Archivo .env.staging
```bash
# API Configuration
VITE_API_URL=https://cupo-backend-staging.fly.dev
VITE_TELEFUNC_URL=https://cupo-backend-staging.fly.dev/_telefunc

# Google Maps
VITE_GOOGLE_MAPS_API_KEY=your_staging_maps_key

# Environment
VITE_APP_ENV=staging

# Feature Flags
VITE_ENABLE_DEBUG=true
VITE_ENABLE_MOCK_DATA=false
```

## 🌐 Despliegue Web

### 1. Build de Producción

```bash
# Instalar dependencias
npm ci

# Ejecutar tests
npm run test

# Lint código
npm run lint

# Type check
npm run type-check

# Build optimizado
npm run build

# Preview del build (opcional)
npm run preview
```

### 2. Vercel Deployment

#### Configuración automática (recomendado):
```bash
# Instalar Vercel CLI
npm i -g vercel

# Login en Vercel
vercel login

# Deploy
vercel --prod
```

#### Configuración manual:
```json
// vercel.json
{
  "version": 2,
  "name": "cupoapp-frontend",
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "handle": "filesystem"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "VITE_API_URL": "@vite_api_url",
    "VITE_TELEFUNC_URL": "@vite_telefunc_url",
    "VITE_GOOGLE_MAPS_API_KEY": "@vite_google_maps_api_key"
  }
}
```

### 3. Netlify Deployment

#### Netlify.toml
```toml
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.css"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### 4. AWS S3 + CloudFront

#### Deploy Script
```bash
#!/bin/bash
# deploy-aws.sh

# Build de producción
npm run build

# Sync con S3
aws s3 sync dist/ s3://cupoapp-frontend-prod --delete

# Invalidar CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"

echo "✅ Deployment to AWS completed"
```

### 5. Firebase Hosting

#### firebase.json
```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "/static/**",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      }
    ]
  }
}
```

```bash
# Deploy a Firebase
npm run build
firebase deploy --only hosting
```

## 📱 Despliegue Móvil

### 1. Preparación de Assets Móviles

#### Generar iconos
```bash
# Crear iconos para todas las plataformas
npx @capacitor/assets generate

# O manualmente colocar en:
# android/app/src/main/res/
# ios/App/App/Assets.xcassets/
```

#### Splash Screens
```bash
# Generar splash screens automáticamente
npx @capacitor/assets generate --splash
```

### 2. Configuración de Capacitor

#### capacitor.config.ts (Producción)
```typescript
import { CapacitorConfig } from '@capacitor/core';

const config: CapacitorConfig = {
  appId: 'com.cupoapp.mobile',
  appName: 'CupoApp',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1a1a1a',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#1a1a1a'
    },
    Keyboard: {
      resize: 'body',
      style: 'DARK'
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false
  },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true
  }
};

export default config;
```

### 3. Android Deployment

#### Preparación del Build
```bash
# Build web
npm run build

# Sync con Capacitor
npx cap sync android

# Copiar recursos
npx cap copy android
```

#### Configuración de Release

##### android/app/build.gradle
```gradle
android {
    compileSdkVersion 34
    
    defaultConfig {
        applicationId "com.cupoapp.mobile"
        minSdkVersion 22
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }

    signingConfigs {
        release {
            storeFile file('cupoapp-release-key.jks')
            storePassword System.getenv("STORE_PASSWORD")
            keyAlias System.getenv("KEY_ALIAS")
            keyPassword System.getenv("KEY_PASSWORD")
        }
    }

    buildTypes {
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
            signingConfig signingConfigs.release
        }
    }
}
```

#### Generar Keystore
```bash
# Crear keystore para firma
keytool -genkey -v -keystore cupoapp-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias cupoapp-key

# Mover a android/app/
mv cupoapp-release-key.jks android/app/
```

#### Build APK/AAB
```bash
# Abrir Android Studio
npx cap open android

# O build desde CLI
cd android
./gradlew assembleRelease  # Para APK
./gradlew bundleRelease    # Para AAB (recomendado para Play Store)
```

#### Deploy a Google Play Store

1. **Preparar metadatos:**
   - Iconos de aplicación (512x512, 192x192, etc.)
   - Screenshots (phone, tablet, TV)
   - Descripción de la app
   - Política de privacidad

2. **Upload en Google Play Console:**
   ```bash
   # Ubicación del AAB
   android/app/build/outputs/bundle/release/app-release.aab
   ```

3. **Testing tracks:**
   - Internal testing
   - Closed testing (Alpha/Beta)
   - Open testing
   - Production

### 4. iOS Deployment

#### Preparación del Build
```bash
# Build web
npm run build

# Sync con Capacitor
npx cap sync ios

# Abrir en Xcode
npx cap open ios
```

#### Configuración en Xcode

1. **General Settings:**
   - Bundle Identifier: `com.cupoapp.mobile`
   - Version: `1.0.0`
   - Build: `1`
   - Team: Seleccionar Apple Developer Team

2. **Signing & Capabilities:**
   - ✅ Automatically manage signing
   - Distribution Certificate
   - Provisioning Profile

3. **Info.plist configuración:**
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>CupoApp necesita acceso a tu ubicación para encontrar viajes cercanos</string>

<key>NSCameraUsageDescription</key>
<string>CupoApp necesita acceso a la cámara para tomar fotos de perfil</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>CupoApp necesita acceso a la galería para seleccionar fotos</string>
```

#### Build para App Store
```bash
# En Xcode:
# 1. Product → Archive
# 2. Distribute App → App Store Connect
# 3. Upload to App Store Connect
```

#### Deploy a App Store

1. **App Store Connect setup:**
   - App information
   - Pricing and availability
   - App privacy
   - Screenshots y metadata

2. **TestFlight (Beta testing):**
   - Internal testing (hasta 100 testers)
   - External testing (hasta 10,000 testers)

3. **Production release:**
   - Submit for review
   - Release management

## 🔄 CI/CD Pipelines

### 1. GitHub Actions

#### .github/workflows/web-deploy.yml
```yaml
name: Web Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm run test
    
    - name: Run linting
      run: npm run lint
    
    - name: Type check
      run: npm run type-check

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build
      run: npm run build
      env:
        VITE_API_URL: ${{ secrets.VITE_API_URL }}
        VITE_TELEFUNC_URL: ${{ secrets.VITE_TELEFUNC_URL }}
        VITE_GOOGLE_MAPS_API_KEY: ${{ secrets.VITE_GOOGLE_MAPS_API_KEY }}
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
        vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
        vercel-args: '--prod'
```

#### .github/workflows/android-deploy.yml
```yaml
name: Android Deploy

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Setup Java
      uses: actions/setup-java@v4
      with:
        java-version: '17'
        distribution: 'adopt'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build web
      run: npm run build
      env:
        VITE_API_URL: ${{ secrets.VITE_API_URL }}
        VITE_TELEFUNC_URL: ${{ secrets.VITE_TELEFUNC_URL }}
        VITE_GOOGLE_MAPS_API_KEY: ${{ secrets.VITE_GOOGLE_MAPS_API_KEY }}
    
    - name: Capacitor sync
      run: npx cap sync android
    
    - name: Build Android APK
      run: |
        cd android
        ./gradlew assembleRelease
      env:
        STORE_PASSWORD: ${{ secrets.STORE_PASSWORD }}
        KEY_ALIAS: ${{ secrets.KEY_ALIAS }}
        KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}
    
    - name: Upload APK
      uses: actions/upload-artifact@v4
      with:
        name: app-release.apk
        path: android/app/build/outputs/apk/release/app-release.apk
```

### 2. GitLab CI/CD

#### .gitlab-ci.yml
```yaml
stages:
  - test
  - build
  - deploy

variables:
  NODE_VERSION: "18"

test:
  stage: test
  image: node:${NODE_VERSION}
  cache:
    paths:
      - node_modules/
  script:
    - npm ci
    - npm run test
    - npm run lint
    - npm run type-check
  only:
    - merge_requests
    - main

build:web:
  stage: build
  image: node:${NODE_VERSION}
  cache:
    paths:
      - node_modules/
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 hour
  only:
    - main

deploy:production:
  stage: deploy
  image: node:${NODE_VERSION}
  dependencies:
    - build:web
  script:
    - npm install -g vercel
    - vercel --token $VERCEL_TOKEN --confirm --prod
  environment:
    name: production
    url: https://cupoapp.com
  only:
    - main
```

## 🔍 Monitoring y Observabilidad

### 1. Sentry Integration

```typescript
// src/lib/sentry.ts
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_APP_ENV,
    tracesSampleRate: 0.1,
    integrations: [
      new BrowserTracing({
        routingInstrumentation: Sentry.reactRouterV6Instrumentation(
          React.useEffect,
          useLocation,
          useNavigationType,
          createRoutesFromChildren,
          matchRoutes
        ),
      }),
    ],
  });
}
```

### 2. Performance Monitoring

```typescript
// src/lib/analytics.ts
export const trackPageView = (page: string) => {
  if (import.meta.env.PROD && window.gtag) {
    window.gtag('config', import.meta.env.VITE_GA_TRACKING_ID, {
      page_path: page,
    });
  }
};

export const trackEvent = (action: string, category: string, label?: string) => {
  if (import.meta.env.PROD && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
    });
  }
};
```

### 3. Health Checks

```typescript
// src/utils/healthCheck.ts
export const performHealthCheck = async () => {
  const checks = {
    api: false,
    database: false,
    websocket: false,
  };

  try {
    // API Health Check
    const apiResponse = await fetch(`${import.meta.env.VITE_API_URL}/health`);
    checks.api = apiResponse.ok;

    // Database Check (through API)
    const dbResponse = await fetch(`${import.meta.env.VITE_API_URL}/health/db`);
    checks.database = dbResponse.ok;

    // WebSocket Check
    // Implementation depends on your WebSocket setup

  } catch (error) {
    console.error('Health check failed:', error);
  }

  return checks;
};
```

## 📋 Post-Deployment Checklist

### Web Deployment:
- [ ] ✅ Build sin errores
- [ ] ✅ All environment variables configuradas
- [ ] ✅ SSL certificate activo
- [ ] ✅ CDN/Cache configurado
- [ ] ✅ Redirect rules funcionando
- [ ] ✅ SEO metadata correcto
- [ ] ✅ Performance audit > 90
- [ ] ✅ Error tracking funcionando
- [ ] ✅ Analytics configurado

### Mobile Deployment:
- [ ] ✅ App builds sin errores
- [ ] ✅ Certificates válidos
- [ ] ✅ App permissions configurados
- [ ] ✅ Icons y splash screens
- [ ] ✅ Store metadata completo
- [ ] ✅ Testing en dispositivos reales
- [ ] ✅ Crash reporting activo
- [ ] ✅ Push notifications funcionando

### General:
- [ ] ✅ Backup strategies implementadas
- [ ] ✅ Rollback plan definido
- [ ] ✅ Monitoring alerts configuradas
- [ ] ✅ Documentation actualizada
- [ ] ✅ Team notificado del deploy

## 🚨 Troubleshooting de Deployment

### Errores Comunes:

#### Build Failures:
```bash
# Clear cache y retry
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
npm run build
```

#### Memory Issues:
```bash
# Aumentar memoria para Node.js
export NODE_OPTIONS="--max-old-space-size=8192"
npm run build
```

#### Capacitor Sync Issues:
```bash
# Clean y re-sync
npx cap clean android
npx cap clean ios
npm run build
npx cap sync
```

Este documento proporciona una guía completa para el despliegue exitoso de CupoApp en todas las plataformas objetivo.
