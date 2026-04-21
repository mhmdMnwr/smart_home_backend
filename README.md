# Assistant Backend

Simple NestJS backend for smart-home features (auth, users, history, status, notifications, and MQTT control).

## Requirements

- Node.js 18+
- npm
- MongoDB

## Quick Start

```bash
npm install
npm run start:dev
```

Server runs on `PORT` from environment variables.

## Environment Variables

Create a `.env` file in the project root:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/assistant_backend
JWT_SECRET=your_jwt_secret

# Optional MQTT config
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_USERNAME=
MQTT_PASSWORD=
```

## Main Scripts

```bash
npm run start:dev   # development with watch
npm run build       # compile TypeScript
npm run start:prod  # run compiled app
npm run test        # unit tests
```

## API Notes

- Base URL: `http://localhost:3000`
- Most responses are wrapped as:

```json
{
  "statusCode": 200,
  "sucess": true,
  "data": {}
}
```

- Auth login endpoint:
  - `POST /auth/login`
  - body:

```json
{
  "email": "test@example.com",
  "password": "mysecretpassword"
}
```

## User Access Rules

- `PATCH /users/me`: authenticated user updates own profile
- `POST /users`: admin only
- `PATCH /users/:id`: admin only
- User role is included in JWT payload
- Role cannot be updated through update user DTO
