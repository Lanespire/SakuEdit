# React Router on AWS with SST

> Source: https://sst.dev/docs/start/aws/react/

## Overview

This guide demonstrates how to create a React Router v7 app in Framework mode, add S3 Bucket functionality for file uploads, and deploy it using the React component.

## Prerequisites
- AWS credentials configured for your account

## Step-by-Step Instructions

### 1. Create a Project

Initialize a new React Router application:

```bash
npx create-react-router@latest aws-react-router
cd aws-react-router
```

Select all default options during setup.

#### Initialize SST

Set up SST in your application:

```bash
npx sst@latest init
npm install
```

Choose default settings and select AWS as your cloud provider. This creates an `sst.config.ts` file.

**sst.config.ts:**
```typescript
async run() {
  new sst.aws.React("MyWeb");
}
```

#### Start Development Mode

Launch the development environment:

```bash
npx sst dev
```

This starts both SST and your React Router application. Access your app by clicking MyWeb in the sidebar.

---

### 2. Add an S3 Bucket

Configure a publicly accessible S3 Bucket for file uploads by modifying `sst.config.ts`:

```typescript
const bucket = new sst.aws.Bucket("MyBucket", {
  access: "public"
});
```

#### Link the Bucket

Connect the bucket to your React Router application:

```typescript
new sst.aws.React("MyWeb", {
  link: [bucket],
});
```

---

### 3. Create an Upload Form

Replace the `Home` component in `app/routes/home.tsx`:

```typescript
export default function Home({
  loaderData,
}: Route.ComponentProps) {
  const { url } = loaderData;

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-8">
        <h1 className="leading text-2xl font-bold text-gray-800 dark:text-gray-100">
          Welcome to React Router!
        </h1>
        <form
          className="flex flex-row gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const file = (e.target as HTMLFormElement).file.files?.[0]!;
            const image = await fetch(url, {
              body: file,
              method: "PUT",
              headers: {
                "Content-Type": file.type,
                "Content-Disposition": `attachment; filename="${file.name}"`,
              },
            });
            window.location.href = image.url.split("?")[0];
          }}
        >
          <input
            name="file"
            type="file"
            accept="image/png, image/jpeg"
            className="block w-full text-sm text-slate-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-violet-50 file:text-violet-700
              hover:file:bg-violet-100"
          />
          <button className="bg-violet-500 hover:bg-violet-700 text-white text-sm
            font-semibold py-2 px-4 rounded-full">
            Upload
          </button>
        </form>
      </div>
    </div>
  );
}
```

---

### 4. Generate a Pre-signed URL

Add a loader function above the `Home` component in `app/routes/home.tsx`:

```typescript
export async function loader() {
  const command = new PutObjectCommand({
    Key: crypto.randomUUID(),
    Bucket: Resource.MyBucket.name,
  });
  const url = await getSignedUrl(new S3Client({}), command);

  return { url };
}
```

**Note:** We are directly accessing our S3 bucket with `Resource.MyBucket.name`.

Add imports to `app/routes/home.tsx`:

```typescript
import { Resource } from "sst";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
```

Install required dependencies:

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

Test the functionality by navigating to `http://localhost:5173` and uploading an image.

---

### 5. Deploy Your App

Deploy to AWS:

```bash
npx sst deploy --stage production
```

You may use any stage name; "production" is recommended for production deployments.

---

## Connect the Console

Set up the SST Console for automated deployments and log monitoring by creating a free account at https://console.sst.dev and connecting it to your AWS account.
