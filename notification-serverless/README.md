# Notification Serverless Service

This project replaces the containerized, poll-based `notification-service` with a fully serverless, event-driven notification engine on AWS. 

It is triggered by the `NotificationQueue` (from `image-pipeline-app`) and uses:
- **AWS DynamoDB**: For lightweight subscription configuration and delivery logs.
- **AWS SES**: For verified email delivery.
- **AWS AppSync (GraphQL)**: For real-time processing updates to frontend clients over WebSockets.

---

## Architecture Overview

```
[SQS NotificationQueue] ──> [sqsConsumer Lambda]
                                  │
      ┌───────────────────────────┼───────────────────────────┐
      ▼                           ▼                           ▼
[AWS AppSync]              [AWS DynamoDB]                 [AWS SES]
 (WebSockets)            (Query subscriptions /          (Send Emails)
  Push real-time           Log histories)
  updates to frontend
```

### GraphQL API & Client Connection
AWS AppSync exposes a GraphQL schema that supports real-time WebSockets subscriptions.

#### 1. Mutation (Triggered by SQS Consumer)
```graphql
mutation PublishProgress(
  $jobId: String!,
  $imageId: String!,
  $userId: String!,
  $eventType: String!,
  $status: String!,
  $timestamp: String!,
  $metadata: String
) {
  publishProgress(
    jobId: $jobId,
    imageId: $imageId,
    userId: $userId,
    eventType: $eventType,
    status: $status,
    timestamp: $timestamp,
    metadata: $metadata
  ) {
    jobId
    imageId
    userId
    eventType
    status
  }
}
```

#### 2. Subscription (Subscribed by Frontend Web/Mobile Client)
Clients connect via WebSockets (using Apollo Client, AWS Amplify, or raw WS) to listen to updates for a specific user:
```graphql
subscription OnProgressUpdate($userId: String!) {
  onProgressUpdate(userId: $userId) {
    jobId
    imageId
    userId
    eventType
    status
    timestamp
    metadata
  }
}
```

---

## DynamoDB Table Structures

### 1. Subscriptions Table (`notification-serverless-dev-subscriptions`)
Stores user preferences on what events to receive and where.
- **Partition Key (`Hash Key`)**: `userId` (String)
- **Sort Key (`Range Key`)**: `id` (String)
- **Attributes**:
  - `channel`: `'email' | 'webhook'` (String)
  - `destination`: `'user@example.com' | 'https://webhook.site/...'` (String)
  - `events`: `['image.resized', 'image.completed', 'image.failed']` (List of Strings)
  - `isActive`: `true | false` (Boolean)

### 2. Notification History Table (`notification-serverless-dev-history`)
Stores execution history.
- **Partition Key (`Hash Key`)**: `jobId` (String)
- **Sort Key (`Range Key`)**: `id` (String)
- **Attributes**:
  - `subscriptionId`: (String)
  - `eventId`: (String)
  - `status`: `'pending' | 'success' | 'failed'` (String)
  - `sentAt`: (String)
  - `retryCount`: (Number)
  - `lastError`: (String, optional)

---

## Local Setup & Deployment

### 1. Installation
Install the Serverless Framework AppSync plugin and Lambda dependencies:
```bash
# In the notification-serverless directory:
serverless plugin install --name serverless-appsync-plugin

# Install sqs-consumer function dependencies
cd functions/sqs-consumer
npm install
cd -
```

### 2. Deployment
Deploy to AWS:
```bash
serverless deploy --stage dev
```
Upon completion, the Serverless output will print:
- The GraphQL API Endpoint URL (`https://xxxx.appsync-api.us-east-1.amazonaws.com/graphql`)
- The AppSync GraphQL API Key (`da2-xxxxxxxxxxxxxxxxxxxxxxxxxx`)

### 3. Verify SES Email (SES Sandbox)
If your AWS account is in the SES Sandbox:
- Go to the AWS Console -> SES -> Verified Identities.
- Verify the recipient email addresses and the sender email address (`EMAIL_FROM` configured in `serverless.yml`).

---

## Verification & Seeding

### Seeding a Subscription (AWS CLI Example)
To receive notifications, add a subscription to DynamoDB:
```bash
aws dynamodb put-item \
  --table-name notification-serverless-dev-subscriptions \
  --item '{
    "userId": {"S": "user-999"},
    "id": {"S": "sub-111"},
    "channel": {"S": "email"},
    "destination": {"S": "your-verified-email@example.com"},
    "events": {"L": [{"S": "image.completed"}, {"S": "image.failed"}]},
    "isActive": {"BOOL": true}
  }'
```
Once added, any `image.completed` event published by the pipeline for `userId: "user-999"` will trigger an email to `your-verified-email@example.com` and push WebSocket updates to any client listening to `onProgressUpdate(userId: "user-999")`!
