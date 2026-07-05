# 🏠 Smart Life Switcher (`smart-life-switcher`)

A sleek, responsive, and beautiful smart home dashboard designed for controlling Tuya-compatible devices (switches, sockets, lights, and curtains) directly from your web browser.

It leverages a serverless architecture designed to run locally, on a Node.js production server, or deployed serverless to Cloudflare Workers.

---

## ✨ Features

- **Device Support:** Switch and toggle Tuya-compatible smart sockets, light switches, multi-gang switch boxes, smart curtains, and lamps.
- **Secure Signing Proxy:** Features a server-side signing proxy for the Tuya Open API. All requests are securely hashed and signed (`HMAC-SHA256`) on the backend (Vite plugin in dev, Express in Node prod, and Cloudflare Worker in serverless prod) to prevent credential exposure.
- **Client-Side Persistence:** Configuration credentials (Tuya Access ID, Access Secret, and Region), cached device lists, and customized switch names are saved securely in your browser's `localStorage`.
- **Customizable Dashboard:** Easily hide/show active switches and rename them directly within the UI to fit your home layout.

---

## 🚀 Getting Started

### 📋 Prerequisites
You will need a Tuya Developer Account and Cloud Credentials:
1. Sign up at the [Tuya Developer Platform](https://iot.tuya.com/).
2. Create a **Cloud Project** and link your devices using the **Tuya Smart** or **Smart Life** app.
3. Under **Cloud > Authorization**, obtain your:
   - **Access ID (Client ID)**
   - **Access Secret (Client Secret)**
   - **Endpoint Region URL** (e.g., `https://openapi.tuyacn.com` for China, `https://openapi.tuyaus.com` for America, etc.)

---

## 🛠️ Local Development

### 1. Install Dependencies
Clone the repository and install the dependencies:
```bash
npm install
```

### 2. Run the Development Server
Start the Vite development server:
```bash
npm run dev
```
> [!NOTE]
> Vite config has a built-in `tuya-proxy` plugin. When you make requests to `/api/tuya*`, Vite automatically intercepts them, signs them with your local credentials, and proxies them directly to Tuya. You do not need to run a separate backend server in development!

### 3. Build & Preview
To compile the TypeScript project and bundle the frontend into static assets:
```bash
npm run build
```
To run a local server previewing the production build:
```bash
npm run preview
```

---

## 🌐 Production Server Environments

You can run `smart-life-switcher` in two production environments:

### Option A: Local Node.js Production Server (Express)
If you want to host the app on a local home server (e.g., Raspberry Pi):
1. Build the frontend assets:
   ```bash
   npm run build
   ```
2. Start the Express server:
   ```bash
   npm start
   ```
   This starts the proxy server on port `5173` (or configured `PORT` env variable) and serves the `dist/` directory.

### Option B: Cloudflare Workers (Serverless)
The project is configured for Cloudflare Workers (using Wrangler and Workers Assets).
- **Run Wrangler Dev locally:**
  ```bash
  npx wrangler dev
  ```
- **Manual deployment:**
  ```bash
  npm run deploy
  ```

---

## 🤖 CI/CD: Automated GitHub Deployment

We have configured a GitHub Actions workflow to automatically deploy pushes to the `main` branch to Cloudflare.

The workflow configuration is located in [./.github/workflows/deploy.yml](./.github/workflows/deploy.yml).

### Secrets Required in GitHub
To activate the automatic deployment, add the following to your GitHub repository secrets:
1. `CLOUDFLARE_API_TOKEN` (API Token with edit access to Workers)
2. `CLOUDFLARE_ACCOUNT_ID` (Your Cloudflare account ID)

---

## 📂 Project Structure

- **[./.github/workflows/](./.github/workflows/)**: GitHub Action deployment workflows.
- **[./src/](./src/)**: Frontend React codebase.
  - **[./src/App.tsx](./src/App.tsx)**: Main dashboard page layout, config panels, and state management.
  - **[./src/components/DashboardTile.tsx](./src/components/DashboardTile.tsx)**: Reusable switch controller card component.
  - **[./src/tuyaApi.ts](./src/tuyaApi.ts)**: Local storage helpers, command parsing, and request helpers.
- **[./server.js](./server.js)**: Local Node Express proxy.
- **[./worker.ts](./worker.ts)**: Production Cloudflare Workers fetch handler.
- **[./wrangler.toml](./wrangler.toml)**: Cloudflare Wrangler config file.
- **[./vite.config.ts](./vite.config.ts)**: Custom Vite setup containing the development API proxy plugin.

---

## 🤝 Contributing

Contributions to improve `smart-life-switcher` are welcome! Please follow these guidelines:

1. **Fork** the repository and create your feature branch:
   ```bash
   git checkout -b feature/amazing-feature
   ```
2. **Lint and Type Check** your changes:
   ```bash
   npm run lint
   # Or manually compile TS
   npm run build
   ```
   The repository uses `oxlint` for lightning-fast JavaScript/TypeScript linting.
3. **Commit** your changes using descriptive commit messages.
4. **Push** to the branch and open a Pull Request.

---

## 📝 License
This project is private and intended for personal home automation dashboard use.
