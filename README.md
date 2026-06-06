# Comprehensive Academic Report: Smart Home IoT API Gateway & Orchestration Backend

## 1. Abstract
The proliferation of Internet of Things (IoT) devices in domestic environments has necessitated the development of robust, scalable, and highly responsive backend infrastructures. This technical report provides an exhaustive analysis of the architecture, design patterns, and implementation details of a NestJS-based API gateway and orchestration server designed for a comprehensive Smart Home system. This backend acts as the central nervous system of the platform, seamlessly bridging the gap between distributed hardware edge nodes (ESP32 microcontrollers, environmental sensors, actuators) and cross-platform mobile client applications (Flutter). By purposefully decoupling the mobile client from direct hardware communication protocols (such as MQTT) and leveraging Server-Sent Events (SSE) for unidirectional real-time telemetry, the system achieves sub-second latency, fortified security boundaries, and significant improvements in mobile device battery preservation.

---

## 2. Introduction & Problem Statement

### 2.1 Context and Background
Traditional Smart Home architectures often employ a direct-communication paradigm where mobile client applications subscribe directly to message brokers (e.g., Mosquitto MQTT) to receive real-time sensor data. While functional in localized, controlled environments, this architecture presents several critical flaws when deployed at scale or over public cellular networks:
1. **Battery Consumption:** Maintaining persistent, bi-directional TCP connections required by MQTT significantly degrades mobile device battery life. The mobile OS must keep the radio active to maintain the heartbeat, preventing deep sleep states.
2. **Security Vulnerabilities:** Exposing the raw MQTT broker to the public internet dramatically increases the attack surface, potentially allowing malicious actors to sniff telemetry, perform man-in-the-middle attacks, or spoof actuator commands if TLS/SSL is improperly configured.
3. **Data Formatting Overhead:** Edge nodes often transmit raw, uncalibrated, or minimally formatted byte payloads. Forcing the mobile client to parse, sanitize, and aggregate this data violates the separation of concerns principle and bloats the client application size.

### 2.2 Proposed Solution & Objectives
To resolve these architectural anti-patterns, this project introduces a highly opinionated, modular backend layer built upon the NestJS framework (Node.js/TypeScript). This backend serves as an intermediary API Gateway and Orchestration Hub. The primary objectives of this implementation are:
- **Centralized Orchestration:** Route all telemetry, command execution, and access control through a singular, heavily authenticated RESTful API gateway.
- **Asynchronous Telemetry Delivery:** Abstract the MQTT protocol from the mobile client entirely. Deliver live sensor and weather data utilizing standard HTTP Server-Sent Events (SSE).
- **Physical Security Integration:** Integrate an RFID-based authentication workflow for physical door access, managed dynamically via the backend database and API.
- **Persistent Auditability:** Maintain comprehensive, paginated historical records, audit logs, and hardware lifecycle states utilizing a NoSQL document database (MongoDB).

---

## 3. Architectural Philosophy & Paradigms

### 3.1 SOLID Principles & Clean Architecture
The NestJS framework inherently promotes the adoption of SOLID design principles. This backend strictly adheres to these rules:
- **Single Responsibility Principle (SRP):** Controllers handle only HTTP routing and DTO validation. Services handle pure business logic. Repositories (Mongoose Models) handle database interactions.
- **Dependency Inversion Principle (DIP):** The `@Injectable()` decorator allows NestJS's IoC (Inversion of Control) container to inject dependencies at runtime, heavily decoupling classes and making them highly testable.

### 3.2 The Modular Monolith Approach
The backend is designed utilizing a **Modular Monolith** architecture. The application is strictly partitioned into domain-specific feature modules (`AuthModule`, `UsersModule`, `MqttModule`, etc.). This structure enforces high cohesion within business domains and loose coupling across the application, making the codebase highly maintainable and preparing it for a potential future transition to a microservices architecture if horizontal scaling demands it.

---

## 4. System Components & High-Level Architecture

The backend sits directly between the Flutter client application and the Data & Communication Layer (MongoDB and Mosquitto MQTT Broker).

![System Architecture](/home/mnwr/.gemini/antigravity/brain/43b7f6c9-484c-4106-a88b-369937e3d61c/artifacts/system_architecture.png)

### 4.1 Database Architecture & Schema Design
Data persistence is managed by a MongoDB NoSQL database, interfaced via the Mongoose Object Data Modeling (ODM) library. NoSQL was chosen due to its flexible schema design, which is highly advantageous when dealing with the variable, unstructured payloads often generated by heterogeneous IoT devices.

![Database Schema](/home/mnwr/.gemini/antigravity/brain/43b7f6c9-484c-4106-a88b-369937e3d61c/artifacts/database_schema.png)

**Schema Highlights:**
- **User Schema:** Maintains system identities. Fields include `name`, `email` (unique index), `password` (bcrypt hashed), and an enum `role` defining `ADMIN` or `USER` privileges. The unique, sparse `cardTag` index is critical for resolving O(1) lookups during physical RFID swiping.
- **History Schema:** A time-series collection for telemetry data. By indexing the `type` and automatically generating Mongoose `createdAt` timestamps, the system achieves highly performant temporal queries.
- **DeviceStatus Schema:** Tracks hardware lifecycle. It utilizes a compound constraint based on a unique `device` string, allowing the backend to perform highly efficient Upsert operations.

---

## 5. In-Depth Module Analysis & Implementation

The backend application follows a strictly modular architecture. Below is the UML Class Diagram illustrating the core modules, controllers, and services that drive the business logic.

![UML Class Diagram](/home/mnwr/.gemini/antigravity/brain/43b7f6c9-484c-4106-a88b-369937e3d61c/artifacts/backend_class_diagram.png)

### 5.1 Authentication & Security (`AuthModule`)
The `AuthModule` is the frontline defense of the API gateway. It prevents unauthorized access and issues cryptographic proofs of identity.
- **Authentication Flow:** When a client issues a `POST /auth/login` request with an email and password, the `AuthController` routes the DTO to the `AuthService`. The service retrieves the user record and utilizes `bcrypt.compare()` to securely validate the hashed password against the plaintext input.
- **Dual JWT Strategy:** Upon successful validation, the system does not rely on stateful server sessions. Instead, it utilizes `@nestjs/jwt` to sign two distinct JSON Web Tokens:
  - **Access Token:** Valid for 7 days. Used for authorization in the `Authorization: Bearer` header.
  - **Refresh Token:** Valid for 30 days. Used strictly to request new Access Tokens.
- **Cryptographic Reset:** The module supports secure password resets (`POST /auth/reset-password`), ensuring the old password matches the hash before applying the new bcrypt hash.

![Authentication Sequence](/home/mnwr/.gemini/antigravity/brain/43b7f6c9-484c-4106-a88b-369937e3d61c/artifacts/auth_sequence.png)

### 5.2 User & Access Management (`UsersModule`)
This module provides complete lifecycle management for user accounts and bridges digital authentication with physical hardware access.
- **Identity Verification & RBAC:** The `UsersController` relies heavily on `req.user` attached by the `JwtMiddleware`. Endpoints like `PATCH /users/me` guarantee that users can only mutate their own records. Administrative routes (`POST /users`, `DELETE /users/:id`) are gated by the custom `AdminMiddleware`.
- **RFID Provisioning Workflow:** A unique feature of this system is its integration with physical NFC/RFID tags (MIFARE Classic/Ultralight). 
  - An Administrator uses the mobile app to scan a raw NFC MAC address.
  - The app issues a `POST /users/assign-tag` request with the `userId` and `cardTag`.
  - The `UsersService` securely binds this tag to the user document, ensuring no duplicate tags exist (`ConflictException`).
- **Physical Access Execution:** 
  1. A user swipes their card at the smart door reader (ESP32).
  2. The hardware publishes the tag via MQTT to a validation topic.
  3. The broker routes this to the NestJS backend, which triggers `POST /users/verify-tag` via an internal microservice mechanism.
  4. If verified, the backend publishes a grant payload back to the door's relay topic.

### 5.3 Hardware Communication & Translation (`MqttModule`)
The `MqttModule` serves as the outbound translation layer, converting RESTful HTTP commands into asynchronous MQTT payloads intended for physical edge nodes.
- **Persistent Connection Pool:** On application bootstrap, the `MqttService` constructs an MQTT client. It utilizes `reconnectPeriod` and `connectTimeout` configurations to guarantee resilience if the Mosquitto broker temporarily fails.
- **Command Routing & DTO Validation:** The `MqttController` exposes semantic endpoints (`/mqtt/setLed/lamp1`). Incoming requests are strictly validated using `class-validator` decorators within the `SetCommandDto` to ensure only 'on' or 'off' values are accepted, preventing injection vulnerabilities.
- **Payload Construction:** Validated REST commands are wrapped into JSON payloads (e.g., `{"set": "on"}`) and published to designated hardware topics with Quality of Service (QoS) Level 1 to guarantee at-least-once delivery to the broker.

![MQTT Topology](/home/mnwr/.gemini/antigravity/brain/43b7f6c9-484c-4106-a88b-369937e3d61c/artifacts/mqtt_topology.png)

### 5.4 Real-Time Telemetry Streaming (`SseModule`)
The `SseModule` represents a critical architectural optimization for mobile device performance and network efficiency.
- **Unified Proxy Subscription:** The `SseService` extracts the active MQTT client from the `MqttModule` and acts as a singular master subscriber to *all* known sensor and weather topics.
- **RxJS Stream Categorization:** As highly asynchronous MQTT messages arrive as raw byte buffers, the `SseService` attempts a `try/catch` JSON parse (`safeParse`). Based on predefined topic arrays (e.g., `ACTUATOR_TOPICS`, `SENSOR_TOPICS`), the data is mapped and piped into three dedicated RxJS `Subject<SseMessage>` streams.
- **Server-Sent Events (SSE):** The `SseController` utilizes NestJS's `@Sse()` decorator to expose these RxJS Observables as standard HTTP/1.1 SSE endpoints (`GET /sse/sensors`). When the mobile app connects via `EventSource`, it opens a long-lived, unidirectional HTTP stream. Network overhead is minimized as data frames are pushed instantly without requiring a new TLS handshake.

### 5.5 Environmental History Analytics (`HistoryModule`)
This module enables the client application to render granular time-series charts of historical telemetry data.
- **Optimized Paging Algorithms:** To prevent V8 engine memory exhaustion when parsing millions of sensor readings, the `HistoryService` leverages aggressive Mongoose `.skip()` and `.limit()` chaining.
- **Temporal Query Constraints:** Clients can request specific historical windows (e.g., `GET /history/type/temperature/date/2026-06-01`). The backend calculates the 00:00:00 and 23:59:59 UTC bounds for the given date, applying MongoDB `$gte` and `$lte` operators against the indexed `createdAt` timestamp.

### 5.6 Device Lifecycle Tracking (`StatusModule`)
Monitoring hardware health is critical in an IoT ecosystem. The `StatusModule` maintains a real-time ledger of device availability.
- **Upsert Mechanics:** Edge nodes frequently emit "heartbeat" or status payloads. To prevent the database from ballooning with redundant rows, the `StatusService` utilizes MongoDB's `findOneAndUpdate` method with the `{ upsert: true }` and `{ new: true }` flags. This executes an atomic operation that creates a record if it does not exist, or updates the `status` enum (`online`/`offline`) and refreshes the `updatedAt` timestamp if it does.

### 5.7 Alert & Notification Engine (`NotificationsModule`)
The `NotificationsModule` manages asynchronous human-in-the-loop alerts generated by the system (e.g., security breaches, gas detection).
- **State Management:** It tracks the acknowledgment state of alerts using an `isread` boolean.
- **Utility Endpoints:** Exposes performant aggregate queries to retrieve the unread count (`GET /notifications/unread-number` utilizing `countDocuments`), paginated notification arrays, and multi-document mutation routes (`updateMany`) to mark all notifications as read simultaneously.

### 5.8 System Audit Logging (`LogsModule`)
Distinct from the high-frequency sensor telemetry, the `LogsModule` provides an immutable audit trail of systemic events and user interactions.
- **Security Auditing:** This ledger ensures observability over manual overrides, access control grants, and administrative modifications. The `LogService` ensures records are strictly append-only, providing a mathematically sound and reliable source of truth for post-incident analysis and system debugging.

---

## 6. Cross-Cutting Concerns & Middleware Interception

The NestJS framework is heavily augmented with custom interceptors, filters, and middleware to enforce a standardized, predictable API contract across the entire monolithic codebase.

### 6.1 Unified Response Transformation Interceptor
To drastically simplify JSON deserialization on the Flutter client, the backend implements a global **`ResponseTransformInterceptor`**. This RxJS-based interceptor catches all successful return values from controllers (`next.handle().pipe(map(...))`) and wraps them in a highly consistent schema:
```json
{
  "statusCode": 200,
  "sucess": true,
  "data": {
    "key": "value"
  }
}
```

### 6.2 Global Exception Sanitization Filter
To prevent sensitive Node.js stack traces from leaking to the client during an internal crash or DTO validation failure, the **`AllExceptionsFilter`** implements the `ExceptionFilter` interface. It normalizes all HTTP exceptions (400, 401, 404) and generic errors (500) into a sanitized JSON output, ensuring structural consistency even during failures:
```json
{
  "statusCode": 400,
  "sucess": false,
  "data": null
}
```

### 6.3 Security & Role-Based Middlewares
- **`JwtMiddleware`:** Intercepts incoming requests, extracts the `Authorization: Bearer <token>` header, verifies the cryptographic signature utilizing the symmetric `JWT_SECRET`, and attaches the decoded user payload to the Express `req.user` object for downstream Controller consumption.
- **`AdminMiddleware`:** Acts as a secondary gatekeeper. It evaluates the `req.user.role` property. If the role is strictly not `ADMIN`, it synchronously throws a `ForbiddenException` (HTTP 403), instantly halting request execution before it reaches the core business logic.

### 6.4 Infrastructure Logging
The **`LoggerMiddleware`** intercepts all inbound HTTP traffic. By tying into the Express `response.on('finish')` event loop, it utilizes the native NestJS `Logger` class to print the HTTP Method, Original URL, Status Code, Content Length, User-Agent, and Client IP to the `stdout`. This is a vital architectural requirement for Docker container log aggregation and debugging.

---

## 7. Comprehensive API Documentation Reference

The backend exposes a multitude of endpoints. Below is an architectural overview of the expected API contracts for the core workflows.

### 7.1 Authentication Endpoints
**`POST /auth/login`**
- **Request Body:** `{ "email": "test@example.com", "password": "pass" }`
- **Response:** `{ "access_token": "...", "refresh_token": "..." }`

### 7.2 User Management Endpoints
**`GET /users/me`**
- **Headers:** `Authorization: Bearer <access_token>`
- **Response:** `{ "_id": "...", "name": "User", "email": "...", "role": "user" }`

**`POST /users/assign-tag` (Admin Only)**
- **Request Body:** `{ "userId": "abc...", "cardTag": "A1:B2:C3:D4" }`
- **Response:** `{ "status": "success", "user": { ... } }`

### 7.3 Telemetry & SSE Endpoints
**`GET /sse/sensors`**
- **Connection Type:** `text/event-stream`
- **Payload Stream Frame:** 
```json
id: 1
data: {"topic": "smartHome/devices/dht11/temperature/state", "payload": {"value": 24.5}, "timestamp": "2026-06-06T12:00:00Z"}
```

### 7.4 Device Control (REST to MQTT) Endpoints
**`POST /mqtt/setLed/lamp1`**
- **Request Body:** `{ "set": "on" }`
- **Response:** HTTP 200 OK (Payload successfully delegated to MQTT broker queue).

### 7.5 History Analytics Endpoints
**`GET /history?type=temperature&page=1&limit=10`**
- **Response:**
```json
{
  "data": [ { "value": 22.5, "createdAt": "2026-04-22T10:00:00.000Z" } ],
  "total": 150,
  "page": 1,
  "limit": 10,
  "totalPages": 15
}
```

---

## 8. Development & Deployment Procedures

### 8.1 Environmental Variables
The application requires a `.env` file at the root directory to properly initialize the NestJS `ConfigModule`:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/assistant_backend
JWT_SECRET=production_grade_cryptographic_secret
MQTT_BROKER_URL=mqtt://mosquitto_broker_ip:1883
MQTT_USERNAME=admin
MQTT_PASSWORD=password
```

### 8.2 Database Seeding
To initialize the system with an administrative user, a specialized seed script is provided. Running `npx ts-node seed.ts` bypasses the HTTP server, instantiates the Mongoose models directly via the NestJS Application Context, and securely hashes and injects a root user into the MongoDB instance.

### 8.3 Startup Scripts
```bash
npm install           # Install Node modules
npm run format        # Enforce Prettier styling rules
npm run start:dev     # Boot with nodemon hot-reloading
npm run build         # Transpile TypeScript to highly optimized JavaScript
npm run start:prod    # Execute the production dist/main.js bundle
```

### 8.4 Docker Containerization
The backend includes a highly optimized `Dockerfile` utilizing the `node:20-alpine` multi-stage build pattern. This ensures the resulting image is extremely lightweight, containing only the compiled `dist` directory and production `node_modules`, ready to be orchestrated via Docker Compose alongside the MongoDB and Mosquitto images.

---

## 9. Conclusion and Future Architectural Enhancements

### 9.1 Summary
The development and deployment of this NestJS backend successfully resolve the inherent challenges of mobile-to-IoT communication. By acting as a secure, highly scalable orchestration layer, the backend effectively isolates the mobile client from raw, asynchronous MQTT traffic, translating it into efficient HTTP Server-Sent Events. The integration of robust JWT authentication, strict Role-Based Access Control, and a unified API response contract ensures that the smart home ecosystem remains secure against unauthorized access and injection attacks. Furthermore, the extensive implementation of historical logging and lifecycle tracking provides total system observability over the hardware layer.

### 9.2 Future Enhancements
While the current modular monolith architecture is incredibly robust, several avenues for future enterprise enhancement exist:
- **Rule Engine Integration:** Developing a dynamic, AST-based rules engine within the NestJS backend to allow users to define complex automations (e.g., "If MQ2 Gas > 400 AND Time > 22:00, Trigger Alarm and Execute Door Unlocks").
- **Push Notification Migration:** Currently, notifications are stored in MongoDB and polled by the client dashboard. Integrating Firebase Cloud Messaging (FCM) into the `NotificationsModule` would allow the backend to push critical alerts directly to the device's OS-level notification tray, even when the Flutter app is completely suspended in memory.
- **Horizontal Scaling & Microservices:** As the number of IoT edge devices increases exponentially, the `MqttModule` and `SseModule` could be refactored utilizing Redis Pub/Sub. This would allow the NestJS backend to scale horizontally across multiple Docker containers behind an NGINX load balancer, providing extreme fault tolerance.
- **GraphQL Migration:** Transitioning the analytical endpoints (`HistoryModule`, `LogsModule`) from strict REST to GraphQL to allow the mobile client to request exact data shapes, further optimizing network payloads.

---
*Developed as an academic capstone project in advanced IoT systems engineering, backend micro-architecture, and highly concurrent networking.*
