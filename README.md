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
- ⚙️ **Colas por defecto en el constructor:** Defines `queues.in` y `queues.out` al crear el cliente; si no especificas colas en la llamada, se usan esas.
- 🔐 **Inyección de API Key:** Si configuras `RABBIT_API_KEY` en el entorno o en el constructor, se inyecta automáticamente en el payload del mensaje si este no la contiene.
- 🚀 **Cero dependencias pesadas:** Solo utiliza `amqplib` con sockets TCP nativos de Node.js.
- 📘 **Tipado estricto en TypeScript:** Definiciones `.d.ts` y autocompletado nativo.

---

## 📥 Instalación

Instálalo en tu proyecto directamente desde Git o registro npm:

```bash
# Con npm:
npm install git+https://github.com/<tu-usuario-o-org>/rabbit-queue-client.git#main

# Con pnpm:
pnpm add git+https://github.com/<tu-usuario-o-org>/rabbit-queue-client.git#main
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

const client = new RabbitQueueClient({
  queues: {
    in: 'ColaPrincipalIn',
    out: 'ColaPrincipalOut',
  },
});

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

### 2. Usando las colas configuradas por defecto

Si omites `queueIn` y `queueOut`, se usan las colas definidas en `queues` al crear el cliente:

```typescript
const respuesta = await client.consultarEnCola({
  payload: {
    documento: '12345678',
  },
});
```

### 3. Opciones adicionales (Timeout y Correlation ID)

```typescript
const respuesta = await client.consultarEnCola({
  queueIn: 'ColaFacturacionIn',
  queueOut: 'ColaFacturacionOut',
  payload: { facturaId: 'F-900' },
  correlationId: 'req-custom-abc-123', // Opcional (se autogenera UUID si se omite)
  timeoutMs: 15000,                    // Opcional (por defecto 30000 ms)
});
```

### 4. Inicialización con credenciales en código

Si prefieres no usar `.env`, puedes pasar toda la configuración al instanciar el cliente:

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
  defaultApiKey: 'clave-global-opcional',
  defaultTimeoutMs: 20000,
  queues: {
    in: 'ColaPrincipalIn',
    out: 'ColaPrincipalOut',
  },
});
```

### 5. Cierre de conexiones

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
  "letter": "V",
  "documentNumber": "10577440",
  "apiKey": "<apiKey del cliente>"
}
```

```typescript
const data = await client.consultarEnCola({
  queueIn: 'ColaEntrada',
  queueOut: 'ColaRespuesta',
  payload: {
    letter: 'V',
    documentNumber: '10577440',
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
      "documentNumber": "980085638",
      "documentTypeId": "431b50e5"
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
        documentNumber: '980085638',
        documentTypeId: '431b50e5',
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
