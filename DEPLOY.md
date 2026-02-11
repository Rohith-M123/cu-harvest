# Deployment Guide

## Running Locally

To run the application on your machine during development:

```bash
npm run dev
```
This starts the Vite development server (usually at `http://localhost:5173`).

## Building for Production

To create a production-ready build:

```bash
npm run build
```
This will compile your TypeScript and React code into static files in the `dist/` folder.

## Deploying to Firebase Hosting

Since `firebase.json` is not yet set up, follow these steps to deploy:

1.  **Install Firebase CLI** (if not already installed):
    ```bash
    npm install -g firebase-tools
    ```

2.  **Login to Firebase**:
    ```bash
    firebase login
    ```

3.  **Initialize Firebase in your project**:
    ```bash
    firebase init hosting
    ```
    - Select your project (`cu-harvest`).
    - **Public directory**: Type `dist` (Vite's default output).
    - **Configure as a single-page app**: Type `Yes` (Important for React Router).
    - **Set up automatic builds and deploys with GitHub?**: Type `No` (for now).
    - **Overwrite index.html?**: Type `No` (if asked).

4.  **Deploy**:
    After initialization, you can deploy anytime with:
    ```bash
    npm run build
    firebase deploy
    ```

### Summary of Commands

| Command | Description |
| :--- | :--- |
| `npm run dev` | Start local development server |
| `npm run build` | Build the project for production |
| `firebase deploy` | Deploy the `dist` folder to Firebase Hosting |
