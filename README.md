# DocuHub Backend

Este es el backend de DocuHub, construido con [NestJS](https://nestjs.com/) y [PostgreSQL](https://www.postgresql.org/).

## Requisitos previos

- Node.js (v20+)
- pnpm
- Docker y Docker Compose (para levantar la base de datos)

## Instalación y Configuración

1. Instala las dependencias:
```bash
pnpm install
```

2. Copia el archivo `.env.example` a `.env` y ajusta las variables si es necesario:
```bash
cp .env.example .env
```

3. Levanta la base de datos PostgreSQL usando Docker Compose:
```bash
docker compose up -d
```

## Ejecución de la aplicación

```bash
# Desarrollo
pnpm run start

# Modo "watch" (recomendado para desarrollo)
pnpm run start:dev

# Producción
pnpm run build
pnpm run start:prod
```

## Estructura Principal

- **Autenticación (`/src/auth`)**: JWT con Passport, RBAC (Role-Based Access Control).
- **Usuarios (`/src/users`)**: Gestión de cuentas y contraseñas seguras con `bcrypt`.
- **JavaDocs (`/src/javadocs`)**: CRUD de documentación. Admite subida de archivos `.zip` que se extraen automáticamente de forma segura (prevención de path traversal) y se sirven de forma estática.
- **Configuración (`/src/settings`)**: Configuraciones globales ajustables por el administrador.

## Base de datos y Datos Iniciales (Seed)

Para poblar la base de datos con las configuraciones por defecto (como `MAX_UPLOAD_SIZE` en 80MB) y generar un usuario administrador inicial con contraseña aleatoria, ejecuta:

```bash
pnpm run seed
```

La consola imprimirá la contraseña generada para el usuario `admin`.
