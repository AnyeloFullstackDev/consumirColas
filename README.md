# 🐰 RabbitMQ RPC Queue Client (`rabbit-queue-client`)

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![RabbitMQ](https://img.shields.io/badge/RabbitMQ-RPC-orange.svg)](https://www.rabbitmq.com/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

Cliente RPC ligero y desacoplado para **Node.js** y **TypeScript** diseñado para publicar y consultar **cualquier tipo de colas en RabbitMQ** mediante el patrón Request-Reply (RPC).

Totalmente agnóstico, sin dependencias de servidores HTTP y listo para integrarse en cualquier proyecto (Next.js, NestJS, microservicios, lambdas, scripts o workers).

---

## ⚡ Características

- 🎯 **Método único y universal:** Toda consulta se realiza mediante `client.consultarEnCola(...)`.
- 🎛️ **Cualquier tipo de cola y payload:** Permite enviar a cualquier par de colas (`queueIn` y `queueOut`) con **cualquier estructura de payload** que requiera tu worker.
- 🔐 **Inyección de API Key:** Si configuras `RABBIT_API_KEY` en el entorno, se inyecta automáticamente en el payload del mensaje si este no la contiene.
- 🚀 **Cero dependencias pesadas:** Solo utiliza `amqplib` con sockets TCP nativos de Node.js.
- 📘 **Tipado estricto en TypeScript:** Definiciones `.d.ts` y autocompletado nativo.

---

## 📥 Instalación

> [!NOTE]
> La rama `main` contiene el código fuente en TypeScript. Para instalar el cliente en cualquier proyecto sin necesidad de compilar ni configurar permisos especiales en gestores de paquetes como **pnpm**, **npm** o **yarn**, instala siempre apuntando a la rama **`release`** (que contiene los archivos precompilados en `dist/`).

### Con pnpm (Recomendado)
```bash
pnpm add github:AnyeloFullstackDev/consumirColas#release
```
*O con URL completa:*
```bash
pnpm add git+https://github.com/AnyeloFullstackDev/consumirColas.git#release
```

### Con npm
```bash
npm install github:AnyeloFullstackDev/consumirColas#release
```
*O con URL completa:*
```bash
npm install git+https://github.com/AnyeloFullstackDev/consumirColas.git#release
```

### Con Yarn
```bash
yarn add github:AnyeloFullstackDev/consumirColas#release
```

### Si el repositorio es privado (Acceso por SSH)
```bash
pnpm add git+ssh://git@github.com/AnyeloFullstackDev/consumirColas.git#release
```

---

## ⚙️ Variables de Entorno (`.env`)

El cliente lee automáticamente las variables de entorno de tu proyecto:

```env
# RabbitMQ Broker
RABBIT_HOST=localhost
RABBIT_PORT=5672
RABBIT_USER=guest
RABBIT_PASSWORD=guest
RABBIT_VHOST=/

# API Key global opcional
RABBIT_API_KEY=mi-clave-secreta
```

---

## 🚀 Uso del Cliente

### 1. Consultar cualquier cola arbitraria

```typescript
import { RabbitQueueClient } from 'rabbit-queue-client';

const client = new RabbitQueueClient();

// Enviar solicitud a cualquier cola y esperar la respuesta RPC
const respuesta = await client.consultarEnCola({
  queueIn: 'ColaDeProcesamiento',
  queueOut: 'ColaDeResultados',
  payload: {
    accion: 'PROCESAR_ORDEN',
    ordenId: 12345,
    usuario: 'juan',
  },
});

console.log('Resultado del worker:', respuesta);
```

### 2. Opciones adicionales (Timeout y Correlation ID)

```typescript
const respuesta = await client.consultarEnCola({
  queueIn: 'ColaFacturacionIn',
  queueOut: 'ColaFacturacionOut',
  payload: { facturaId: 'F-900' },
  correlationId: 'req-custom-abc-123', // Opcional (se autogenera UUID si se omite)
  timeoutMs: 15000,                    // Opcional (por defecto 30000 ms)
});
```

### 3. Inicialización con credenciales en código

Si prefieres no usar `.env`, puedes pasar la configuración de conexión al instanciar el cliente:

```typescript
import { RabbitQueueClient } from 'rabbit-queue-client';

const client = new RabbitQueueClient({
  rabbit: {
    hostname: '192.168.1.100',
    port: 5672,
    username: 'myuser',
    password: 'mypassword',
    vhost: '/',
  },
  defaultTimeoutMs: 20000,
});
```

### 4. Cierre de conexiones

```typescript
// Al apagar tu servidor o proceso
await client.close();
```

---

## 📦 Estructura del Payload

El cliente es completamente agnóstico y **puede recibir cualquier tipo de payload** requerido por el worker o sistema de colas.

Por ejemplo, para consultas de documentos de identidad, se pueden utilizar estructuras como:

### A. Consulta por cédula
```json
{
  "letter": "x",
  "documentNumber": "xxxxxxxx",
  "apiKey": "<apiKey del cliente>"
}
```

```typescript
const data = await client.consultarEnCola({
  queueIn: 'ColaEntrada',
  queueOut: 'ColaRespuesta',
  payload: {
    letter: 'x',
    documentNumber: 'xxxxxxxx',
    apiKey: 'tu-api-key', // Opcional si ya la definiste en RABBIT_API_KEY
  },
});
```

### B. Consulta por otro documento (pasaporte, por ejemplo)
```json
{
  "otherDocument": {
    "status": true,
    "value": {
      "documentNumber": "xxxxxxxxx",
      "documentTypeId": "xxxxxxxx"
    }
  },
  "apiKey": "<apiKey del cliente>"
}
```

```typescript
const data = await client.consultarEnCola({
  queueIn: 'ColaEntrada',
  queueOut: 'ColaRespuesta',
  payload: {
    otherDocument: {
      status: true,
      value: {
        documentNumber: 'xxxxxxxxx',
        documentTypeId: 'xxxxxxxx',
      },
    },
    apiKey: 'tu-api-key',
  },
});
```

> [!NOTE]
> Estas estructuras son ejemplos de referencia. El cliente puede enviar cualquier objeto JSON o payload arbitrario que tus workers esperen procesar.

---

## 📄 Licencia

MIT
