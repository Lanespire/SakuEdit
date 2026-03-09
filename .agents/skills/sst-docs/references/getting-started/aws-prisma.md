# Prisma with Amazon RDS and SST

> Source: https://sst.dev/docs/start/aws/prisma/

## Overview

This guide demonstrates deploying a Prisma-based application with Amazon RDS Postgres and SST, running an Express app in a container.

## Prerequisites

- AWS credentials configured
- Docker Desktop (for deployment)

## Related Examples

- Prisma in Lambda function
- Run Postgres in local Docker container for dev

---

## Step 1: Create a Project

### Initialize Node.js Application

```bash
mkdir aws-prisma && cd aws-prisma
npm init -y
```

### Install Dependencies

```bash
npm install prisma typescript ts-node @types/node --save-dev
npm install express
```

### Initialize TypeScript and Prisma

```bash
npx tsc --init
npx prisma init
```

### Create Express App (`index.mjs`)

```javascript
import express from "express";
const PORT = 80;
const app = express();
app.get("/", (req, res) => {
  res.send("Hello World!")
});
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
```

### Initialize SST

```bash
npx sst@latest init
npm install
```

Select defaults and choose AWS.

---

## Step 2: Add a Postgres Database

Add the following to `sst.config.ts`:

```typescript
async run() {
  const vpc = new sst.aws.Vpc("MyVpc", { bastion: true });
  const rds = new sst.aws.Postgres("MyPostgres", { vpc });

  const DATABASE_URL = $interpolate`postgresql://${rds.username}:${rds.password}@${rds.host}:${rds.port}/${rds.database}`;
}
```

The `bastion` option enables local machine VPC connections.

---

## Step 3: Configure Prisma Studio

Add this to `sst.config.ts` below the `DATABASE_URL` variable:

```typescript
new sst.x.DevCommand("Prisma", {
  environment: { DATABASE_URL },
  dev: {
    autostart: false,
    command: "npx prisma studio",
  },
});
```

---

## Step 4: Add an ECS Cluster

Append to `sst.config.ts`:

```typescript
const cluster = new sst.aws.Cluster("MyCluster", { vpc });
new sst.aws.Service("MyService", {
  cluster,
  link: [rds],
  environment: { DATABASE_URL },
  loadBalancer: {
    ports: [{ listen: "80/http" }],
  },
  dev: {
    command: "node --watch index.mjs",
  },
});
```

### Install Tunnel

```bash
sudo npx sst tunnel install
```

This requires sudo for network interface creation (one-time setup).

### Start Development Mode

```bash
npx sst dev
```

This deploys infrastructure, starts a tunnel, runs Express locally, and prepares Prisma Studio.

---

## Step 5: Create Database Schema

Update `schema.prisma`:

```prisma
model User {
  id    Int     @id @default(autoincrement())
  name  String?
  email String  @unique
}
```

### Generate Migration

```bash
npx sst shell --target Prisma -- npx prisma migrate dev --name init
```

Alternatively, run tunnel separately:

```bash
npx sst tunnel
```

### Verify with Prisma Studio

Access the Studio tab in your `sst dev` session and press Enter to launch.

---

## Step 6: Query the Database

Replace the root route in `index.mjs`:

```javascript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
app.get("/", async (_req, res) => {
  const user = await prisma.user.create({
    data: {
      name: "Alice",
      email: `alice-${crypto.randomUUID()}@example.com`
    },
  });
  res.send(JSON.stringify(user));
});
```

Test at `http://localhost:80` in your browser.

---

## Step 7: Deploy Your App

Create `Dockerfile`:

```dockerfile
FROM node:18-bullseye-slim
WORKDIR /app/
COPY package.json index.mjs prisma /app/
RUN npm install
RUN npx prisma generate
ENTRYPOINT ["node", "index.mjs"]
```

Create `.dockerignore`:

```
node_modules
```

### Deploy to Production

```bash
npx sst deploy --stage production
```

Output includes your Fargate service URL.

---

## Connect SST Console

Set up the SST Console for git-push-to-deploy and monitoring capabilities at https://console.sst.dev.
