# 🏌️ La Partideta Golf - V1

**Sistema completo de gestión de partidas de golf con puntuación Stableford, handicaps dinámicos y estadísticas avanzadas.**

[![Estado](https://img.shields.io/badge/Estado-Producción%20V1-success)](https://github.com)
[![Licencia](https://img.shields.io/badge/Licencia-Privada-blue)](https://github.com)
[![Tecnología](https://img.shields.io/badge/Stack-React%20%2B%20Supabase-informational)](https://github.com)

---

## 📋 Tabla de Contenidos

- [Descripción](#-descripción)
- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Inicio Rápido](#-inicio-rápido)
- [Documentación](#-documentación)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Despliegue](#-despliegue)

---

## 🎯 Descripción

**La Partideta Golf** es una Progressive Web App (PWA) diseñada para digitalizar y mejorar la experiencia de jugar golf con amigos. Elimina el papel, automatiza cálculos complejos de Stableford con handicaps variables, y mantiene un histórico completo de estadísticas.

**Casos de uso:**
- 🎮 Partidas rápidas entre amigos (sin registro)
- 👥 Grupos permanentes con rankings históricos
- 📊 Seguimiento de evolución de jugadores
- 🏆 Sistema de premios y reconocimientos especiales
- 📱 Acceso multiplataforma (móvil, tablet, desktop)

---

## ✨ Características

### Partidas

- ✅ **Partidetas Rápidas**: Juego instantáneo sin necesidad de cuenta
- ✅ **Multipartidetas**: Grupos permanentes con código de acceso
- ✅ **Tarjeta de Puntuación Digital**: Interfaz intuitiva para ingreso de golpes
- ✅ **Cálculo Automático**: Stableford points con soporte para handicaps y slopes
- ✅ **Leaderboard en Tiempo Real**: Clasificación actualizada hoyo a hoyo
- ✅ **Acceso Compartido**: Únete con código de 4 dígitos

### Campos y Configuración

- 🏌️ **5 Campos Pre-configurados**: Costa Azahar, Mediterráneo, Panorámica, y más
- 🎯 **Sistema de Barras (Tees)**: Blancas, Amarillas, Rojas, Azules con slopes
- ⚙️ **Configuración Flexible**: 9 o 18 hoyos, personalización de stroke index
- 🔄 **Cambio de Campo**: Durante setup con confirmación

### Estadísticas y Rankings

- 📈 **Estadísticas Detalladas**: Por jugador, por campo, por temporada
- 🏆 **Rankings Especiales**: Rey del Bosque, La Paliza, Hoyo de la Muerte
- 🍺 **Sistema de Cervezas**: Contabilización automática (grupo DIVEND)
- 📚 **Archivo Histórico**: Todas las rondas completadas
- 🎯 **Métricas Avanzadas**: Fairways, GIR, putts, etc.

### Premios Especiales

- 🎉 **Hole in One**: Modal celebratorio
- 🔴 **No Pasó de Rojas**: Marca especial
- 👑 **Premio al Mejor de la Jornada**
- 🏅 **Rankings Múltiples**: Varios criterios de clasificación

### Administración

- 🔒 **Panel Admin**: Protegido con PIN
- 📊 **Gestión de Handicaps**: Actualización manual
- 👥 **Gestión de Jugadores**: CRUD completo
- 📋 **Vista de Rondas Archivadas**: Histórico completo

---

## 🛠 Tecnologías

### Frontend
- **React 18** - Librería UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **Tailwind CSS** - Framework de estilos
- **Lucide React** - Sistema de iconos

### Backend
- **Supabase** - Backend as a Service
  - PostgreSQL - Base de datos relacional
  - Row Level Security - Seguridad a nivel de fila
  - Realtime - Actualizaciones en tiempo real (opcional)
  - Auth - Autenticación (preparado para V2)

### Herramientas
- **ESLint** - Linting
- **PostCSS** - Procesamiento CSS
- **Git** - Control de versiones

---

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js >= 18.0.0
- npm >= 9.0.0
- Cuenta en Supabase (gratis)

### Instalación Local

```bash
# Clonar repositorio
git clone https://github.com/TU_USUARIO/la-partideta-golf.git
cd la-partideta-golf

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Edita .env con tus credenciales de Supabase

# Configurar base de datos
./consolidar_migraciones.sh
# Ejecuta schema_completo.sql en Supabase SQL Editor

# Iniciar servidor de desarrollo
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173) para ver la aplicación.

### Comandos Disponibles

```bash
npm run dev       # Desarrollo (puerto 5173)
npm run build     # Build para producción
npm run preview   # Preview del build (puerto 4173)
npm run lint      # Linting
npm run typecheck # Verificación de tipos
```

---

## 📚 Documentación

### Guías Principales

1. **[QUICK_START.md](./QUICK_START.md)** - Guía rápida de 30 minutos
   - Setup de Supabase
   - Configuración de variables
   - Despliegue rápido

2. **[GUIA_MIGRACION_V1.md](./GUIA_MIGRACION_V1.md)** - Guía técnica exhaustiva
   - Arquitectura completa
   - Esquema SQL detallado
   - Troubleshooting avanzado

3. **[MANUAL_TECNICO_MAESTRO.md](./MANUAL_TECNICO_MAESTRO.md)** - Manual de desarrollo
   - Arquitectura del código
   - Explicación de funcionalidades
   - Guía para desarrolladores

### Archivos Útiles

- `schema_completo.sql` - Esquema SQL consolidado (generado)
- `consolidar_migraciones.sh` - Script para consolidar migraciones
- `.env.example` - Plantilla de variables de entorno

---

## 📁 Estructura del Proyecto

```
la-partideta-golf/
├── src/
│   ├── components/         # Componentes React
│   │   ├── Auth.tsx        # Autenticación
│   │   ├── GroupSetup.tsx  # Setup de grupos
│   │   ├── Scorecard.tsx   # Tarjeta de puntuación
│   │   ├── Leaderboard.tsx # Tabla de clasificación
│   │   ├── Statistics.tsx  # Estadísticas
│   │   └── ...
│   ├── services/           # Lógica de negocio
│   │   ├── golfService.ts  # Servicio principal
│   │   └── supabaseClient.ts
│   ├── utils/              # Utilidades
│   │   ├── calculations.ts # Cálculos de golf
│   │   ├── storage.ts      # LocalStorage
│   │   └── ...
│   ├── data/               # Datos estáticos
│   ├── types.ts            # TypeScript types
│   └── App.tsx             # Componente principal
├── supabase/
│   └── migrations/         # 98 migraciones SQL
├── public/                 # Assets estáticos
├── docs/                   # Documentación
└── dist/                   # Build output (generado)
```

---

## 🌐 Despliegue

### Opción 1: Vercel (Recomendado)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Conecta tu repositorio GitHub
2. Configura variables de entorno
3. Deploy

[Guía detallada de Vercel →](./GUIA_MIGRACION_V1.md#opción-a---vercel-recomendado)

### Opción 2: Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start)

1. Conecta tu repositorio GitHub
2. Build command: `npm run build`
3. Publish directory: `dist`

[Guía detallada de Netlify →](./GUIA_MIGRACION_V1.md#opción-b---netlify)

### Variables de Entorno Requeridas

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anon
VITE_ADMIN_EMAIL=tu@email.com
VITE_ADMIN_PIN=2248
```

---

## 🔒 Seguridad

- ✅ Row Level Security (RLS) habilitado en Supabase
- ✅ Variables de entorno para secretos
- ✅ Validación de inputs en frontend
- ✅ Sanitización de datos
- ⚠️ V1 tiene políticas RLS permisivas (sin auth completa)
- 🔄 V2 endurecerá seguridad con autenticación completa

---

## 🧪 Testing

### Tests Manuales

Verifica estas funcionalidades después del despliegue:

- [ ] Crear Partideta Rápida
- [ ] Añadir jugadores con handicaps
- [ ] Ingresar puntuaciones por hoyo
- [ ] Ver leaderboard actualizado
- [ ] Unirse con código de acceso
- [ ] Ver estadísticas
- [ ] Panel de administración (con PIN)

---

## 📝 Notas de Versión

### V1 (Enero 2026) - MVP Actual

**Funcionalidades Activas:**
- ✅ Partidetas Rápidas completas
- ✅ Multipartidetas (unirse solamente)
- ✅ 5 campos de golf configurados
- ✅ Sistema de estadísticas avanzado
- ✅ Panel de administración

**Funcionalidades Bloqueadas:**
- ❌ Crear Multipartidetas (muestra modal)
- ❌ Iniciar sesión / Crear cuenta (muestra modal)
- ❌ Sincronización multi-dispositivo
- ❌ Notificaciones push

### Roadmap V2

- 🔄 Autenticación completa con Supabase Auth
- 🔄 Creación libre de Multipartidetas
- 🔄 Gestión de múltiples grupos por usuario
- 🔄 PWA con modo offline avanzado
- 🔄 Notificaciones en tiempo real

---

## 🤝 Contribución

Este es un proyecto privado. Si tienes acceso al código:

1. Crea una rama para tu feature: `git checkout -b feature/nueva-funcionalidad`
2. Commit tus cambios: `git commit -m 'feat: añade nueva funcionalidad'`
3. Push a la rama: `git push origin feature/nueva-funcionalidad`
4. Abre un Pull Request

---

## 📧 Contacto y Soporte

Para dudas o problemas:

1. Revisa la [Guía de Migración](./GUIA_MIGRACION_V1.md)
2. Consulta el [Quick Start](./QUICK_START.md)
3. Revisa issues existentes en GitHub

---

## 📄 Licencia

Copyright © 2026 La Partideta Golf. Todos los derechos reservados.

Este es un proyecto privado y el código no está disponible para uso público.

---

## 🙏 Agradecimientos

- Comunidad de React y Supabase
- Grupo DIVEND por el testing continuo
- Todos los jugadores beta testers

---

**¡Disfruta del golf! 🏌️⛳**

*Última actualización: Enero 2026*
