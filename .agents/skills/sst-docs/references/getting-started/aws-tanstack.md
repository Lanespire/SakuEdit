# TanStack Start on AWS with SST

> Source: https://sst.dev/docs/start/aws/tanstack/

## Overview

This guide demonstrates how to create a TanStack Start application, integrate an S3 Bucket for file uploads, and deploy it using the `TanStackStart` component on AWS.

## Prerequisites

- Configure your AWS credentials before starting.

---

## Step 1: Create a Project

Initialize a new TanStack Start application:

```bash
npx gitpick TanStack/router/tree/main/examples/react/start-bare aws-tanstack-start
cd aws-tanstack-start
```

### Initialize SST

Set up SST within your application:

```bash
npx sst@latest init
npm install
```

Select default options and choose AWS. This generates an `sst.config.ts` file.

### Update Configuration

Modify `app.config.ts` with the following settings:

```typescript
export default defineConfig({
  server: {
    preset: "aws-lambda",
    awsLambda: {
      streaming: true
    }
  }
});
```

### Start Development Mode

Launch SST and your TanStack Start application:

```bash
npx sst dev
```

Navigate to **MyWeb** in the sidebar to access your app in the browser.

---

## Step 2: Add an S3 Bucket

Configure an S3 Bucket with public access for file uploads in `sst.config.ts`:

```typescript
const bucket = new sst.aws.Bucket("MyBucket", {
  access: "public"
});
```

Place this configuration above the `TanStackStart` component.

### Link the Bucket

Connect the bucket to your TanStack Start application:

```typescript
new sst.aws.TanStackStart("MyWeb", {
  link: [bucket]
});
```

---

## Step 3: Create an Upload Form

Create a form component at `src/components/Form.tsx`:

```typescript
import './Form.css'
export default function Form({ url }: { url: string }) {
  return (
    <form
      className='form'
      onSubmit={async (e) => {
        e.preventDefault()

        const file = (e.target as HTMLFormElement).file.files?.[0] ?? null
        const image = await fetch(url, {
          body: file,
          method: 'PUT',
          headers: {
            'Content-Type': file.type,
            'Content-Disposition': `attachment filename='${file.name}'`,
          },
        })

        window.location.href = image.url.split('?')[0]
      }}
    >
      <input name='file' type='file' accept='image/png, image/jpeg' />
      <button type='submit'>Upload</button>
    </form>
  )
}
```

Add styling in `src/components/Form.css`:

```css
.form {
  padding: 2rem;
}

.form input {
  margin-right: 1rem;
}

.form button {
  appearance: none;
  padding: 0.5rem 0.75rem;
  font-weight: 500;
  font-size: 0.875rem;
  border-radius: 0.375rem;
  border: 1px solid rgba(68, 107, 158, 0);
  background-color: rgba(68, 107, 158, 0.1);
}

.form button:active:enabled {
  background-color: rgba(68, 107, 158, 0.2);
}
```

---

## Step 4: Generate a Pre-Signed URL

Implement server-side URL generation and route loading in `src/routes/index.tsx`:

```typescript
export const getPresignedUrl = createServerFn().handler(async () => {
  const command = new PutObjectCommand({
    Key: crypto.randomUUID(),
    Bucket: Resource.MyBucket.name
  })
  return await getSignedUrl(new S3Client({}), command)
})

export const Route = createFileRoute('/')({
  component: RouteComponent,
  loader: async () => {
    return { url: await getPresignedUrl() }
  }
})

function RouteComponent() {
  const { url } = Route.useLoaderData()
  return (
    <main>
      <Form url={url} />
    </main>
  )
}
```

Add necessary imports:

```typescript
import { Resource } from 'sst'
import Form from '~/components/Form'
import { createServerFn } from '@tanstack/react-start'
import { createFileRoute } from '@tanstack/react-router'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
```

Install required packages:

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

**Note:** We are directly accessing our S3 bucket with `Resource.MyBucket.name`.

Test the upload functionality at `http://localhost:3000` by uploading an image.

---

## Step 5: Deploy Your App

Deploy to AWS production:

```bash
npx sst deploy --stage production
```

---

## Connect the Console

Set up the SST Console for automated git-push deployments and log viewing. Create a free account at `console.sst.dev` and connect it to your AWS account.
