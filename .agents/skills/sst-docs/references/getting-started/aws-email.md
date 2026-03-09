# Send Emails in AWS with SST

> Source: https://sst.dev/docs/start/aws/email/

## Overview

This guide demonstrates building a serverless application in AWS using SST that sends emails through Amazon SES.

## Prerequisites

- Configure your AWS credentials before starting.

---

## Step 1: Create a Project

Initialize a new Node.js project:

```bash
mkdir my-email-app && cd my-email-app
npm init -y
```

### Initialize SST

Set up SST in your application:

```bash
npx sst@latest init
npm install
```

Select default options and choose **AWS** as your cloud provider. This creates an `sst.config.ts` file.

---

## Step 2: Add Email

Configure the Email component in `sst.config.ts` using Amazon SES as the backend:

```typescript
// sst.config.ts
async run() {
  const email = new sst.aws.Email("MyEmail", {
    sender: "email@example.com",
  });
}
```

**Note:** Use a valid email address for the `sender` property. SES requires verification of the sender email before sending.

---

## Step 3: Add an API

Create a serverless function that sends emails when called. Update `sst.config.ts`:

```typescript
// sst.config.ts
const api = new sst.aws.Function("MyApi", {
  handler: "sender.handler",
  link: [email],
  url: true,
});

return {
  api: api.url,
};
```

The `link` parameter connects the email component to your API function.

### Start Dev Mode

Launch your application in development mode with live reloading:

```bash
npx sst dev
```

This outputs your API endpoint URL and triggers a verification email.

**Action required:** Check your inbox for a verification email from AWS and complete the verification process.

---

## Step 4: Send an Email

Create a new file `sender.ts` to handle email sending:

```typescript
// sender.ts
import { Resource } from "sst";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

const client = new SESv2Client();

export const handler = async () => {
  await client.send(
    new SendEmailCommand({
      FromEmailAddress: Resource.MyEmail.sender,
      Destination: {
        ToAddresses: [Resource.MyEmail.sender],
      },
      Content: {
        Simple: {
          Subject: {
            Data: "Hello World!",
          },
          Body: {
            Text: {
              Data: "Sent from my SST app.",
            },
          },
        },
      },
    })
  );

  return {
    statusCode: 200,
    body: "Sent!"
  };
};
```

Install the required AWS SDK package:

```bash
npm install @aws-sdk/client-sesv2
```

**Important:** Emails are sent to the verified sender address because sandbox-mode SES accounts can only reach verified addresses. Production access removes this limitation.

### Test Your App

Invoke the API to send a test email:

```bash
curl https://[your-api-url].lambda-url.us-east-1.on.aws
```

Expected response: `Sent!`

Check your inbox for the email (verify spam folder if needed).

---

## Step 5: Deploy Your App

Deploy to production using a new stage:

```bash
npx sst deploy --stage production
```

For production email sending:

1. Request production SES access from AWS
2. Configure domain-based sending

This enables sending to any email address from your domain.

---

## Connect the Console

Set up the SST Console for automated deployments and monitoring:

1. Create a free account at https://console.sst.dev
2. Connect your AWS account
3. Enable git-push-to-deploy functionality
