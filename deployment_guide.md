# Deploying SnowWindow to Google Cloud Run

This guide explains how to deploy your application to Google Cloud Run using the Dockerfile we just created.

## Prerequisites

1.  **Google Cloud Project**: You need an active project on [Google Cloud Console](https://console.cloud.google.com/).
2.  **GitHub Repository**: Ensure your code (including the new `Dockerfile` and `nginx.conf`) is pushed to GitHub.

## Step 1: Push Changes to GitHub

Commit and push the new files:

```bash
git add Dockerfile nginx.conf
git commit -m "Add Docker configuration for Cloud Run"
git push origin main
```

## Step 2: Deploy via Google Cloud Console

1.  Go to the **[Cloud Run Console](https://console.cloud.google.com/run)**.
2.  Click **CREATE SERVICE**.
3.  **Source**: Select **Continuously deploy new revisions from a source repository**.
4.  **Cloud Build**: Click **SET UP WITH CLOUD BUILD**.
    - **Repository Provider**: GitHub.
    - **Repository**: Select your `SnowWindow` repository.
    - **Branch**: `^main$` (or your default branch).
    - **Build Type**: Select **Dockerfile** (it should auto-detect the file in the root).
    - Click **SAVE**.
5.  **Service Name**: `snowwindow` (or your preferred name).
6.  **Region**: Select a region close to your users (e.g., `us-central1`).
7.  **Authentication**: Select **Allow unauthenticated invocations** (so your app is public).
8.  **Ingress**: Allow **All**.
9.  Click **CREATE**.

## Step 3: Verification

- Cloud Build will start building your container image. You can watch the logs.
- Once finished, Cloud Run will deploy the service and provide a **URL** (e.g., `https://snowwindow-xyz-uc.a.run.app`).
- Click the URL to verify your app is running.

## Optional: Verify Locally (Requires Docker)

If you have Docker running locally, you can test before deploying:

```bash
# Build the image
docker build -t snowwindow .

# Run the container
docker run -p 8080:80 snowwindow
```

Visit `http://localhost:8080` to see it in action.
