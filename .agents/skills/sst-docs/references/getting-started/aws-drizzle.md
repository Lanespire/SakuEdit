# Drizzle with Amazon RDS and SST

> Source: https://sst.dev/docs/start/aws/drizzle/

## Overview

This guide demonstrates how to deploy an Amazon Postgres RDS database using SST and configure Drizzle ORM with Drizzle Kit for database management.

## Prerequisites

- Configure AWS credentials before starting.

---

## Step 1: Create a Project

Initialize a Node.js application:

```bash
mkdir aws-drizzle && cd aws-drizzle
npm init -y
```

### Initialize SST

```bash
npx sst@latest init
npm install
```

Select defaults and choose AWS. This creates `sst.config.ts`.

### Initialize Drizzle

Install required dependencies:

```bash
npm install pg @types/pg drizzle-orm drizzle-kit
```

Update `package.json` scripts:

```json
"scripts": {
  "db": "sst shell drizzle-kit"
}
```

Update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

---

## Step 2: Add a Postgres Database

Configure Amazon RDS in `sst.config.ts`:

```typescript
async run() {
  const vpc = new sst.aws.Vpc("MyVpc", { bastion: true, nat: "ec2" });
  const rds = new sst.aws.Postgres("MyPostgres", { vpc, proxy: true });
}
```

The `proxy` option configures RDS Proxy for serverless applications. The `bastion` option enables local VPC connections, while the NAT gateway allows Lambda functions to access the internet.

### Start Drizzle Studio

Add development command:

```typescript
new sst.x.DevCommand("Studio", {
  link: [rds],
  dev: {
    command: "npx drizzle-kit studio",
  },
});
```

### Add an API

Configure Lambda function:

```typescript
new sst.aws.Function("MyApi", {
  vpc,
  url: true,
  link: [rds],
  handler: "src/api.handler",
});
```

### Install Tunnel

Connect to the VPC from your local machine:

```bash
sudo npx sst tunnel install
```

This requires sudo and is a one-time setup.

### Start Development Mode

```bash
npx sst dev
```

The process takes several minutes to create the database.

---

## Step 3: Create a Schema

Configure Drizzle in `drizzle.config.ts`:

```typescript
import { Resource } from "sst";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: ["./src/**/*.sql.ts"],
  out: "./migrations",
  dbCredentials: {
    host: Resource.MyPostgres.host,
    port: Resource.MyPostgres.port,
    user: Resource.MyPostgres.username,
    password: Resource.MyPostgres.password,
    database: Resource.MyPostgres.database,
  },
});
```

Define the schema in `src/todo.sql.ts`:

```typescript
import { text, serial, pgTable } from "drizzle-orm/pg-core";

export const todo = pgTable("todo", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
});
```

---

## Step 4: Generate a Migration

Generate migration files:

```bash
npm run db generate
```

This creates a new migration in the `migrations/` directory.

### Apply the Migration

```bash
npm run db migrate
```

Requires an active tunnel connection.

---

## Step 5: Query the Database

Create `src/drizzle.ts`:

```typescript
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { Resource } from "sst";
import * as schema from "./todo.sql";

const pool = new Pool({
  host: Resource.MyPostgres.host,
  port: Resource.MyPostgres.port,
  user: Resource.MyPostgres.username,
  password: Resource.MyPostgres.password,
  database: Resource.MyPostgres.database,
});

export const db = drizzle(pool, { schema });
```

Create API handler in `src/api.ts`:

```typescript
import { db } from "./drizzle";
import { todo } from "./todo.sql";
import { APIGatewayProxyEventV2 } from "aws-lambda";

export const handler = async (evt: APIGatewayProxyEventV2) => {
  if (evt.requestContext.http.method === "GET") {
    const result = await db.select().from(todo).execute();
    return {
      statusCode: 200,
      body: JSON.stringify(result, null, 2),
    };
  }

  if (evt.requestContext.http.method === "POST") {
    const result = await db
      .insert(todo)
      .values({ title: "Todo", description: crypto.randomUUID() })
      .returning()
      .execute();

    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  }
};
```

### Test Your Application

Test with a POST request:

```bash
curl -X POST https://[your-api-url]
```

Visit the API URL in a browser to view stored todos.

---

## Step 6: Deploy Your App

Deploy to production:

```bash
npx sst deploy --stage production
```

---

## Connect the Console

Set up the SST Console for git-push deployment and monitoring by creating a free account at https://console.sst.dev.

---

## Related Examples

- Drizzle migrations in CI/CD pipelines
- Postgres in local Docker containers
- Next.js with Postgres and Drizzle (T3 Stack)
