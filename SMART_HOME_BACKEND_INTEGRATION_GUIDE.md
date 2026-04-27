# Smart Home Backend Integration Guide

Audit date: 2026-04-22

This document is a complete handoff specification for integrating this backend with an n8n workflow and a voice-controlled LLM agent.

## 1. Project Purpose

This backend is a NestJS + MongoDB application that provides:

1. Authentication (login, refresh token, password reset)
2. User management (admin create/update and user self-update)
3. Device/sensor history logging and querying
4. Device availability status updates
5. Notification creation and listing
6. MQTT command endpoints for smart-home hardware control (implemented, but currently disabled by module wiring)

## 2. Tech Stack and Runtime

- Framework: NestJS 11
- Language: TypeScript
- Database: MongoDB via Mongoose
- Auth: JWT + bcrypt
- Messaging: MQTT (mqtt package)
- Validation: class-validator + global ValidationPipe

Main runtime entry is src/main.ts.

## 3. Required Environment Variables

Create a .env file in the root folder with at least:

- PORT=3000
- MONGODB_URI=mongodb://localhost:27017/assistant_backend
- JWT_SECRET=your_strong_secret_here

Optional for MQTT:

- MQTT_BROKER_URL=mqtt://localhost:1883
- MQTT_USERNAME=
- MQTT_PASSWORD=

Important:

- If JWT_SECRET is missing, code falls back to fallback_secret (not safe for production).
- PORT has no actual fallback value in code. It should always be set.

## 4. Startup and Global Pipeline

Application setup in src/main.ts:

1. Global ValidationPipe enabled.
2. Global exception filter enabled.
3. Global response transform interceptor enabled.
4. DB connection health is logged at startup.

Global logging middleware logs all HTTP requests.

## 5. Global API Response Format

All successful responses are wrapped as:

```json
{
  "statusCode": 200,
  "sucess": true,
  "data": {}
}
```

All errors are wrapped as:

```json
{
  "statusCode": 400,
  "sucess": false,
  "data": null
}
```

Important behavior details:

1. The key is spelled sucess (typo), not success.
2. Error message details are not returned to clients.
3. If a service returns only { "message": "..." }, interceptor transforms it to data: null.

Your n8n agent should parse data and statusCode, and not expect backend error text.

## 6. Module Wiring Status

AppModule imports these modules:

- UserModule
- AuthModule
- HistoryModule
- StatusModule
- NotificationsModule

MqttModule exists but is currently commented out in src/app.module.ts.

Consequence:

- All /mqtt/\* routes are unavailable (404) unless MqttModule is re-enabled.

## 7. Authentication and Authorization Model

### 7.1 JWT Payload

On login, JWT payload contains:

- email
- sub (user id as string)
- role

Token lifetimes:

- access token: 7 days
- refresh token: 30 days

### 7.2 Route Protection

- JwtMiddleware is applied to all users controller routes.
- AdminMiddleware is additionally applied to:
  - POST /users
  - PATCH /users/:id

That means:

- PATCH /users/me requires valid Bearer token.
- POST /users and PATCH /users/:id require valid Bearer token with role=admin.

Other modules (auth, history, status, notifications, mqtt) are currently public unless explicitly changed.

## 8. Data Models

### 8.1 User

Fields:

- name: string, required
- email: string, required, unique
- role: enum [admin, user], default user
- phoneNumber: string, optional
- password: string, required (stored hashed)

### 8.2 History

Fields:

- device: string, required
- type: string, required
- value: number, required
- timestamps enabled (createdAt, updatedAt)

### 8.3 Device Status

Fields:

- device: string, required, unique
- status: enum [online, offline], required
- timestamps enabled

### 8.4 Notification

Fields:

- message: string, required
- type: string, required
- isread: boolean, default false
- timestamps enabled

## 9. Complete Active Route Catalog (Current Runtime)

Base URL example: http://localhost:3000

### 9.1 Health/Root

#### GET /

- Auth: none
- Request body: none
- Response data: "Hello World!"

### 9.2 Auth Routes

#### POST /auth/login

- Auth: none
- Body:
  - email: valid email, required
  - password: string, min length 6, required
- Response data:
  - access_token: string
  - refresh_token: string

Example body:

```json
{
  "email": "test@example.com",
  "password": "mysecretpassword"
}
```

#### POST /auth/refresh

- Auth: none
- Body:
  - refreshToken: string, required
- Response data:
  - access_token: string
  - refresh_token: string

Example body:

```json
{
  "refreshToken": "<refresh_token_here>"
}
```

#### POST /auth/reset-password

- Auth: none
- Body:
  - email: valid email, required
  - previousPassword: string, required
  - newPassword: string, min length 6, required
- Response data: null (service message is removed by interceptor)

Example body:

```json
{
  "email": "test@example.com",
  "previousPassword": "oldpassword",
  "newPassword": "newpassword"
}
```

### 9.3 Users Routes

All routes under /users require Bearer token.

#### POST /users

- Auth: Bearer token + admin role required
- Body:
  - name: string, required
  - email: valid email, required
  - password: string, min length 6, required
  - phoneNumber: string, optional
  - role: enum [admin, user], optional
- Response data: created user object without password

#### PATCH /users/me

- Auth: Bearer token required
- Uses token sub as target user id
- Body (all optional):
  - name: string
  - email: valid email
  - phoneNumber: string
  - password: string, min length 6
  - role: forbidden (validation error if provided)
- Response data: updated user object without password

#### PATCH /users/:id

- Auth: Bearer token + admin role required
- Path param:
  - id: user document id
- Body: same as PATCH /users/me
- Response data: updated user object without password

### 9.4 History Routes

#### POST /history

- Auth: none
- Body:
  - device: string, required
  - type: string, required
  - value: number, required
- Response data: null (message dropped by interceptor)

#### GET /history/type/:type

- Auth: none
- Path params:
  - type: string
- Query params:
  - page: string -> parsed to number, default "1"
  - limit: string -> parsed to number, default "10"
- Response data object:
  - data: history records array
  - total: number
  - page: number
  - limit: number
  - totalPages: number

#### GET /history/type/:type/date/:date

- Auth: none
- Path params:
  - type: string
  - date: expected format YYYY-MM-DD
- Query params:
  - page: default "1"
  - limit: default "10"
- Behavior:
  - Date is interpreted as UTC day range 00:00:00.000 to 23:59:59.999
- Response data object:
  - data, total, page, limit, totalPages

#### GET /history/:id

- Auth: none
- Path params:
  - id: history document id
- Response data:
  - matching document or null

### 9.5 Status Routes

#### POST /status/update

- Auth: none
- Body:
  - device: string, required
  - status: enum [online, offline], required
- Behavior:
  - Upsert by device field (creates or updates)
- Response data:
  - device
  - status
  - updatedAt

### 9.6 Notifications Routes

#### POST /notifications

- Auth: none
- Body:
  - message: string, required
  - type: string, required
  - isread: boolean, optional (default false)
- Response data:
  - id
  - message
  - type
  - isread
  - createdAt

#### GET /notifications

- Auth: none
- Query params:
  - page: string default "1"
  - limit: string default "10"
- Behavior:
  - Sorted newest first by createdAt descending
  - Invalid/non-positive page/limit are normalized to 1 and 10 in service logic
- Response data object:
  - data: notification array
  - total
  - page
  - limit
  - totalPages

## 10. MQTT Routes (Implemented but Inactive Until Module Enabled)

To activate these routes, import MqttModule in src/app.module.ts.

All below endpoints are POST under /mqtt and return status 200 on success.

### 10.1 Device Command Endpoints

#### POST /mqtt/setLed/lamp1

- Body:
  - set: enum [on, off]
- Publishes to topic:
  - smartHome/devices/lamp/lamp1/set
- Payload:

```json
{ "set": "on" }
```

#### POST /mqtt/setLed/lamp2

- Body:
  - set: enum [on, off]
- Topic:
  - smartHome/devices/lamp/lamp2/set

#### POST /mqtt/setfan/fan1

- Body:
  - set: enum [on, off]
- Topic:
  - smartHome/devices/fan/fan1/set

#### POST /mqtt/setfan/fan2

- Body:
  - set: enum [on, off]
- Topic:
  - smartHome/devices/fan/fan2/set

#### POST /mqtt/setAlarm

- Body:
  - set: enum [on, off]
- Topic:
  - smartHome/devices/alarm/set

### 10.2 Door and Password Endpoints

#### POST /mqtt/opendoor

- Body:
  - password: string, required
- Topic:
  - smartHome/devices/door/opendoor
- Payload:

```json
{ "password": "secret" }
```

#### POST /mqtt/changePassword

- Body fields read directly:
  - oldPassword: string
  - newPassword: string
- Topic:
  - smartHome/devices/door/changePassword
- Note:
  - No DTO validation is currently applied in controller for this endpoint.

### 10.3 Temperature Threshold Endpoint

#### POST /mqtt/setTempTreshold

- Body field read directly:
  - value: number
- Topic:
  - smartHome/devices/dht11/temperature/set
- Note:
  - Path contains typo Treshold (not Threshold).
  - No DTO validation is currently applied in controller for this endpoint.

## 11. n8n and Voice LLM Tool Design

Create one tool per endpoint for deterministic routing. Suggested tool names:

1. auth_login
2. auth_refresh
3. auth_reset_password
4. users_create
5. users_update_me
6. users_update_by_id
7. history_create
8. history_get_by_type
9. history_get_by_type_and_date
10. history_get_by_id
11. status_update
12. notifications_create
13. notifications_list
14. mqtt_set_lamp1
15. mqtt_set_lamp2
16. mqtt_set_fan1
17. mqtt_set_fan2
18. mqtt_open_door
19. mqtt_change_password
20. mqtt_set_alarm
21. mqtt_set_temp_treshold

### 11.1 Agent Behavior Rules

1. Always parse backend envelope fields: statusCode, sucess, data.
2. Use data as the real payload.
3. Treat sucess=false or HTTP 4xx/5xx as failure.
4. For users routes, always send Authorization: Bearer <access_token>.
5. If 401 on protected route, run auth_refresh then retry.
6. If refresh fails, run auth_login with stored credentials.
7. Validate all fields in n8n before request, especially endpoints with weak backend DTO validation.
8. Enforce enums in n8n for:
   - set: on/off
   - device status: online/offline

## 12. Operational Setup Checklist (End-to-End)

1. Ensure MongoDB is running and reachable.
2. Set .env values (PORT, MONGODB_URI, JWT_SECRET).
3. npm install
4. npm run start:dev
5. Optional seed user:
   - npx ts-node seed.ts
6. Create at least one admin user (manual DB insert or promote existing user role).
7. If MQTT features are needed:
   - Uncomment MqttModule import in AppModule
   - Provide MQTT_BROKER_URL and optional credentials
   - Restart service
8. Configure n8n credentials/storage for login and token refresh lifecycle.

## 13. Known Limitations and Risks

1. MQTT module is disabled by default.
2. Many non-user routes are public (history/status/notifications and mqtt when enabled).
3. Error details are hidden by global exception filter.
4. Success-only message responses become data: null.
5. Response key typo sucess may break generic clients expecting success.
6. JWT fallback secret is insecure if env not set.
7. Some request examples in test.http are outdated/wrong:
   - /mqtt/publish does not exist
   - /mqtt/subscribe does not exist
   - fan2 test URL mistakenly points to fan1 path

## 14. Example Request/Response Pair for n8n Parsing

Request:

POST /auth/login

```json
{
  "email": "test@example.com",
  "password": "mysecretpassword"
}
```

Response:

```json
{
  "statusCode": 201,
  "sucess": true,
  "data": {
    "access_token": "...",
    "refresh_token": "..."
  }
}
```

## 15. Suggested Improvements Before Production

1. Enable proper auth guards for history/status/notifications/mqtt as needed.
2. Return structured error messages to help orchestration.
3. Rename sucess to success (or handle both temporarily for backward compatibility).
4. Preserve service success messages in response envelope.
5. Add DTO validation for mqtt changePassword and setTempTreshold.
6. Add a true admin bootstrap path.
7. Add route-level OpenAPI/Swagger docs for automatic tool generation.

---

This guide is intended to be consumed by another AI system to build full smart-home orchestration and tool-calling behavior against this backend.
