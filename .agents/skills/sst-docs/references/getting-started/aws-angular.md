# Angular on AWS with SST

> Source: https://sst.dev/docs/start/aws/angular/

## Overview

This guide demonstrates how to build an Angular 18 single-page application (SPA), integrate an S3 Bucket for file uploads, and deploy the application to AWS using SST.

## Prerequisites

- Configure AWS credentials before starting (see IAM credentials documentation)

---

## Step 1: Create a Project

Initialize a new Angular project:

```bash
npm install -g @angular/cli
ng new aws-angular
cd aws-angular
```

**Configuration choices:** Select CSS for styling and decline server-side rendering (SSR).

### Initialize SST

Add SST to your project:

```bash
npx sst@latest init
```

This creates an `sst.config.ts` file in the project root.

---

## Step 2: Add an S3 Bucket

Update `sst.config.ts` to create a publicly accessible S3 bucket:

```typescript
const bucket = new sst.aws.Bucket("MyBucket", {
  access: "public"
});
```

Add this configuration before the `StaticSite` component. The bucket will support direct file uploads via pre-signed URLs.

---

## Step 3: Add an API

Create an API function to generate pre-signed URLs:

```typescript
const pre = new sst.aws.Function("MyFunction", {
  url: true,
  link: [bucket],
  handler: "functions/presigned.handler",
});
```

Add this below the bucket component. The function is linked to the bucket for access.

### Pass the API URL to Angular

Extend the `StaticSite` component configuration:

```typescript
environment: {
  NG_APP_PRESIGNED_API: pre.url
}
```

Install the environment builder package:

```bash
ng add @ngx-env/builder
```

### Start Development Mode

Launch the development environment:

```bash
npx sst dev
```

Access the Angular app at `http://localhost:4200`.

---

## Step 4: Create an Upload Form

Create `src/app/file-upload.component.ts`:

```typescript
import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [FormsModule],
  template: `
    <form (ngSubmit)="onSubmit($event)">
      <input type="file" name="file">
      <button type="submit">Upload</button>
    </form>
  `,
  styles: [`
  form {
    color: white;
    padding: 2rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: #23262d;
    background-image: none;
    background-size: 400%;
    border-radius: 0.6rem;
    background-position: 100%;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  }
  button {
    appearance: none;
    border: 0;
    font-weight: 500;
    border-radius: 5px;
    font-size: 0.875rem;
    padding: 0.5rem 0.75rem;
    background-color: white;
    color: black;
  }
  button:active:enabled {
    background-color: #EEE;
  }`]
})
export class FileUploadComponent {
  private http = inject(HttpClient);

  presignedApi = import.meta.env['NG_APP_PRESIGNED_API'];

  async onSubmit(event: Event): Promise<void> {
    const file = (event.target as HTMLFormElement)['file'].files?.[0]!;

    this.http.get(this.presignedApi, { responseType: 'text' }).subscribe({
      next: async (url: string) => {
        const image = await fetch(url, {
          body: file,
          method: "PUT",
          headers: {
            "Content-Type": file.type,
            "Content-Disposition": `attachment; filename="${file.name}"`,
          },
        });

        window.location.href = image.url.split("?")[0];
      },
    });
  }
}
```

Enable HTTP client in `src/app/app.config.ts`:

```typescript
import { provideHttpClient, withFetch } from '@angular/common/http';

// Add to providers array:
provideHttpClient(withFetch())
```

Update `src/app/app.component.ts`:

```typescript
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FileUploadComponent } from './file-upload.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, FileUploadComponent],
  template: `
    <main>
      <app-file-upload></app-file-upload>
    </main>
    <router-outlet></router-outlet>
  `,
  styles: [`
    main {
      margin: auto;
      padding: 1.5rem;
      max-width: 60ch;
    }
  `],
})
export class AppComponent { }
```

---

## Step 5: Generate a Pre-signed URL

Create `functions/presigned.ts`:

```typescript
import { Resource } from "sst";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export async function handler() {
  const command = new PutObjectCommand({
    Key: crypto.randomUUID(),
    Bucket: Resource.MyBucket.name,
  });

  return {
    statusCode: 200,
    body: await getSignedUrl(new S3Client({}), command),
  };
}
```

Install required packages:

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

**Note:** The function directly accesses the bucket using `Resource.MyBucket.name`.

Test the upload feature at `http://localhost:4200`.

---

## Step 6: Deploy Your App

Deploy to production:

```bash
npx sst deploy --stage production
```

Any stage name can be used; "production" is recommended for production deployments.

---

## Connect the Console

Set up the SST Console for automated deployments and monitoring:

1. Create a free account at https://console.sst.dev
2. Connect your AWS account
3. Enable git push-to-deploy functionality
