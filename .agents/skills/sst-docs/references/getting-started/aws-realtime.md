# Realtime Apps in AWS with SST

> Source: https://sst.dev/docs/start/aws/realtime/

## Overview

This guide demonstrates building a real-time chat application deployed to AWS using SST with Next.js and MQTT over WebSockets.

## Prerequisites

- Node.js environment
- AWS credentials configured properly

---

## Step 1: Create a Project

Initialize a Next.js application:

```bash
npx create-next-app@latest my-realtime-app
cd my-realtime-app
```

### Initialize SST

```bash
npx sst@latest init
npm install
```

Select defaults and choose AWS. This creates `sst.config.ts` in your project root.

### Start Development Mode

```bash
npx sst dev
```

This starts SST and your Next.js app. Access the app via the **MyWeb** sidebar link.

---

## Step 2: Add Realtime

Update `sst.config.ts` to include the Realtime component:

```typescript
// sst.config.ts
async run() {
  const realtime = new sst.aws.Realtime("MyRealtime", {
    authorizer: "authorizer.handler",
  });

  new sst.aws.Nextjs("MyWeb", {
    link: [realtime],
  });
}
```

### Add an Authorizer

Create `authorizer.ts`:

```typescript
// authorizer.ts
import { Resource } from "sst";
import { realtime } from "sst/aws/realtime";

export const handler = realtime.authorizer(async (token) => {
  const prefix = `${Resource.App.name}/${Resource.App.stage}`;

  const isValid = token === "PLACEHOLDER_TOKEN";
  return isValid
    ? {
        publish: [`${prefix}/*`],
        subscribe: [`${prefix}/*`],
      }
    : {
        publish: [],
        subscribe: [],
      };
});
```

This grants access to publish and subscribe to topics namespaced under app and stage name. In production, validate tokens against databases or auth providers.

---

## Step 3: Create the Chat UI

Create `components/chat.tsx`:

```typescript
// components/chat.tsx
"use client";
import mqtt from "mqtt";
import { useState, useEffect } from "react";
import styles from "./chat.module.css";

export default function Chat(
  { topic, endpoint, authorizer }: { topic: string, endpoint: string, authorizer: string }) {
  const [messages, setMessages] = useState<string[]>([]);
  const [connection, setConnection] = useState<mqtt.MqttClient | null>(null);

  return (
    <div className={styles.chat}>
      {connection && messages.length > 0 &&
        <div className={styles.messages}>
          {messages.map((msg, i) => (
            <div key={i}>{JSON.parse(msg).message}</div>
          ))}
        </div>
      }
      <form
        className={styles.form}
        onSubmit={async (e) => {
          e.preventDefault();

          const input = (e.target as HTMLFormElement).message;

          connection!.publish(
            topic,
            JSON.stringify({ message: input.value }),
            { qos: 1 }
          );
          input.value = "";
        }}
      >
        <input
          required
          autoFocus
          type="text"
          name="message"
          placeholder={
            connection ? "Ready! Say hello..." : "Connecting..."
          }
        />
        <button type="submit" disabled={connection === null}>Send</button>
      </form>
    </div>
  );
}
```

Add styles in `components/chat.module.css`:

```css
/* components/chat.module.css */
.chat {
  gap: 1rem;
  width: 30rem;
  display: flex;
  padding: 1rem;
  flex-direction: column;
  border-radius: var(--border-radius);
  background-color: rgba(var(--callout-rgb), 0.5);
  border: 1px solid rgba(var(--callout-border-rgb), 0.3);
}

.messages {
  padding-bottom: 0.125rem;
  border-bottom: 1px solid rgba(var(--callout-border-rgb), 0.3);
}

.messages > div {
  line-height: 1.1;
  padding-bottom: 0.625rem;
}

.form {
  display: flex;
  gap: 0.625rem;
}

.form input {
  flex: 1;
  font-size: 0.875rem;
  padding: 0.5rem 0.75rem;
  border-radius: calc(1rem - var(--border-radius));
  border: 1px solid rgba(var(--callout-border-rgb), 1);
}

.form button {
  font-weight: 500;
  font-size: 0.875rem;
  padding: 0.5rem 0.75rem;
  border-radius: calc(1rem - var(--border-radius));
  background: linear-gradient(
    to bottom right,
    rgba(var(--tile-start-rgb), 1),
    rgba(var(--tile-end-rgb), 1)
  );
  border: 1px solid rgba(var(--callout-border-rgb), 1);
}

.form button:active:enabled {
  background: linear-gradient(
    to top left,
    rgba(var(--tile-start-rgb), 1),
    rgba(var(--tile-end-rgb), 1)
  );
}
```

Install the MQTT package:

```bash
npm install mqtt
```

### Add to Page

Update `app/page.tsx`:

```typescript
// app/page.tsx
import { Resource } from "sst";
import Chat from "@/components/chat";

const topic = "sst-chat";

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.center}>
        <Image
          className={styles.logo}
          src="/next.svg"
          alt="Next.js Logo"
          width={180}
          height={37}
          priority
        />
      </div>

      <div>
        <Chat
          endpoint={Resource.MyRealtime.endpoint}
          authorizer={Resource.MyRealtime.authorizer}
          topic={`${Resource.App.name}/${Resource.App.stage}/${topic}`}
        />
      </div>
    </main>
  );
}
```

You can access the Realtime component directly using `Resource.MyRealtime.*`.

---

## Step 4: Create a Connection

Add connection function to `components/chat.tsx`:

```typescript
function createConnection(endpoint: string, authorizer: string) {
  return mqtt.connect(
    `wss://${endpoint}/mqtt?x-amz-customauthorizer-name=${authorizer}`,
    {
      protocolVersion: 5,
      manualConnect: true,
      username: "", // Must be empty for the authorizer
      password: "PLACEHOLDER_TOKEN", // Passed as the token to the authorizer
      clientId: `client_${window.crypto.randomUUID()}`,
    }
  );
}
```

The placeholder token works for development. Production systems should use session tokens.

Add subscription and message handling to the Chat component:

```typescript
useEffect(() => {
  const connection = createConnection(endpoint, authorizer);

  connection.on("connect", async () => {
    try {
      await connection.subscribeAsync(topic, { qos: 1 });
      setConnection(connection);
    } catch (e) { }
  });

  connection.on("message", (_fullTopic, payload) => {
    const message = new TextDecoder("utf8").decode(new Uint8Array(payload));
    setMessages((prev) => [...prev, message]);
  });

  connection.on("error", console.error);

  connection.connect();

  return () => {
    connection.end();
    setConnection(null);
  };
}, [topic, endpoint, authorizer]);
```

Test locally at `http://localhost:3000`. Messages appear instantly and sync across browser windows. New AWS accounts may need a few minutes for the realtime service to initialize.

---

## Step 5: Deploy Your App

Deploy to production:

```bash
npx sst deploy --stage production
```

Any stage name works; production is recommended for production deployments.

---

## Next Steps

Enhancement opportunities include:
- Creating multiple chat rooms for users
- Persisting messages to a database
- Filtering messages by chat room

---

## Connect the Console

Set up the SST Console for git-to-deployment and monitoring capabilities. Create a free account at https://console.sst.dev and connect it to your AWS account.
