# OpenAuth with SST and Next.js

> Source: https://sst.dev/docs/start/aws/auth/

## Overview

This guide demonstrates creating a Next.js application with authentication using OpenAuth, then deploying it via OpenNext and SST.

## Prerequisites

- Configure your AWS credentials before starting.

## Related Examples

- Full-stack React SPA with an API

---

## Step 1: Create a Project

### Initialize Next.js Application

```bash
npx create-next-app@latest aws-auth-nextjs
cd aws-auth-nextjs
```

Select **TypeScript** and decline **ESLint** during setup.

### Initialize SST

```bash
npx sst@latest init
```

Choose default options and select **AWS**. This generates an `sst.config.ts` file in your project root.

---

## Step 2: Add OpenAuth Server

### Create Auth Directory

```bash
mkdir auth
```

### Create OpenAuth Server (`auth/index.ts`)

```typescript
import { handle } from "hono/aws-lambda";
import { issuer } from "@openauthjs/openauth";
import { CodeUI } from "@openauthjs/openauth/ui/code";
import { CodeProvider } from "@openauthjs/openauth/provider/code";
import { subjects } from "./subjects";

async function getUser(email: string) {
  // Get user from database and return user ID
  return "123";
}

const app = issuer({
  subjects,
  // Remove after setting custom domain
  allow: async () => true,
  providers: {
    code: CodeProvider(
      CodeUI({
        sendCode: async (email, code) => {
          console.log(email, code);
        },
      }),
    ),
  },
  success: async (ctx, value) => {
    if (value.provider === "code") {
      return ctx.subject("user", {
        id: await getUser(value.claims.email),
      });
    }
    throw new Error("Invalid provider");
  },
});

export const handler = handle(app);
```

### Define Subjects (`auth/subjects.ts`)

```typescript
import { object, string } from "valibot";
import { createSubjects } from "@openauthjs/openauth/subject";

export const subjects = createSubjects({
  user: object({
    id: string(),
  }),
});
```

### Install Dependencies

```bash
npm install @openauthjs/openauth valibot hono
```

### Add Auth Component to SST Config

Update the `run` function in `sst.config.ts`:

```typescript
const auth = new sst.aws.Auth("MyAuth", {
  issuer: "auth/index.handler",
});

new sst.aws.Nextjs("MyWeb", {
  link: [auth],
});
```

### Start Development Mode

```bash
npx sst dev
```

This starts SST, Next.js, and your OpenAuth server. The output displays the OpenAuth server URL and Next.js app runs at `http://localhost:3000`.

---

## Step 3: Add OpenAuth Client

### Create Client Configuration (`app/auth.ts`)

```typescript
import { Resource } from "sst";
import { createClient } from "@openauthjs/openauth/client";
import { cookies as getCookies } from "next/headers";

export const client = createClient({
  clientID: "nextjs",
  issuer: Resource.MyAuth.url,
});

export async function setTokens(access: string, refresh: string) {
  const cookies = await getCookies();

  cookies.set({
    name: "access_token",
    value: access,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 34560000,
  });
  cookies.set({
    name: "refresh_token",
    value: refresh,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 34560000,
  });
}
```

This configuration links to your auth server and stores tokens as HTTP-only cookies.

### Add Auth Actions (`app/actions.ts`)

```typescript
"use server";

import { redirect } from "next/navigation";
import { headers as getHeaders, cookies as getCookies } from "next/headers";
import { subjects } from "../auth/subjects";
import { client, setTokens } from "./auth";

export async function auth() {
  const cookies = await getCookies();
  const accessToken = cookies.get("access_token");
  const refreshToken = cookies.get("refresh_token");

  if (!accessToken) {
    return false;
  }

  const verified = await client.verify(subjects, accessToken.value, {
    refresh: refreshToken?.value,
  });

  if (verified.err) {
    return false;
  }
  if (verified.tokens) {
    await setTokens(verified.tokens.access, verified.tokens.refresh);
  }

  return verified.subject;
}

export async function login() {
  const cookies = await getCookies();
  const accessToken = cookies.get("access_token");
  const refreshToken = cookies.get("refresh_token");

  if (accessToken) {
    const verified = await client.verify(subjects, accessToken.value, {
      refresh: refreshToken?.value,
    });
    if (!verified.err && verified.tokens) {
      await setTokens(verified.tokens.access, verified.tokens.refresh);
      redirect("/");
    }
  }

  const headers = await getHeaders();
  const host = headers.get("host");
  const protocol = host?.includes("localhost") ? "http" : "https";
  const { url } = await client.authorize(
    `${protocol}://${host}/api/callback`,
    "code",
  );
  redirect(url);
}

export async function logout() {
  const cookies = await getCookies();
  cookies.delete("access_token");
  cookies.delete("refresh_token");

  redirect("/");
}
```

The `auth` function validates user sessions, `login` initiates the OAuth flow, and `logout` terminates sessions.

### Add Callback Route (`app/api/callback/route.ts`)

```typescript
import { client, setTokens } from "../../auth";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  const exchanged = await client.exchange(code!, `${url.origin}/api/callback`);

  if (exchanged.err) return NextResponse.json(exchanged.err, { status: 400 });

  await setTokens(exchanged.tokens.access, exchanged.tokens.refresh);

  return NextResponse.redirect(`${url.origin}/`);
}
```

This handles the OAuth callback and redirects authenticated users to the home page.

---

## Step 4: Add Auth to App

### Update Home Page (`app/page.tsx`)

```typescript
import { auth, login, logout } from "./actions";

export default async function Home() {
  const subject = await auth();

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <Image
          className={styles.logo}
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <ol>
          {subject ? (
            <>
              <li>
                Logged in as <code>{subject.properties.id}</code>.
              </li>
              <li>
                And then check out <code>app/page.tsx</code>.
              </li>
            </>
          ) : (
            <>
              <li>Login with your email and password.</li>
              <li>
                And then check out <code>app/page.tsx</code>.
              </li>
            </>
          )}
        </ol>

        <div className={styles.ctas}>
          {subject ? (
            <form action={logout}>
              <button className={styles.secondary}>Logout</button>
            </form>
          ) : (
            <form action={login}>
              <button className={styles.primary}>Login with OpenAuth</button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
```

### Add Styles (`app/page.module.css`)

```css
.ctas button {
  appearance: none;
  background: transparent;
  border-radius: 128px;
  height: 48px;
  padding: 0 20px;
  border: none;
  border: 1px solid transparent;
  transition:
    background 0.2s,
    color 0.2s,
    border-color 0.2s;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  line-height: 20px;
  font-weight: 500;
}

button.primary {
  background: var(--foreground);
  color: var(--background);
  gap: 8px;
}

button.secondary {
  border-color: var(--gray-alpha-200);
  min-width: 180px;
}
```

### Test the Application

Navigate to `http://localhost:3000` and click the login button. The interface redirects you to the OpenAuth server requesting email input. Check the **Functions** tab in your SST session to see the code being logged. Use this code to complete authentication and view your user ID.

---

## Step 5: Deploy Your App

### Deploy to Production

```bash
npx sst deploy --stage production
```

Use any stage name (production is recommended for final deployments). The output provides your live OpenAuth server and Next.js URLs.

---

## Connect the Console

Set up the SST Console to enable git-based deployments and log viewing. Create a free account at https://console.sst.dev and connect it to your AWS account for automated deployments and monitoring.
