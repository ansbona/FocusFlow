# FocusFlow - Installation & Setup Guide

This guide explains how to set up the **FocusFlow React application** locally using **Visual Studio Code**.

---

# 1. Prerequisites

Make sure the following are installed on your system.

### Node.js (v18 or higher)

Download: https://nodejs.org

Verify installation:

```bash
node -v
npm -v
```

### Git (Optional)

Download: https://git-scm.com/downloads

---

# 2. Clone the Repository

Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/focusflow.git
cd focusflow
```

Or **download and unzip** the project folder manually.

---

# 3. Open the Project in VS Code

Open the **focusflow** project folder in **Visual Studio Code**.

---

# 4. Fix Windows PowerShell Script Execution Policy (Windows Only)

If you encounter this error when running `npm install`:

```
npm.ps1 cannot be loaded because running scripts is disabled
```

Open **PowerShell as Administrator** and run:

```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Type **Y** to confirm and **restart VS Code**.

---

# 5. Install Project Dependencies

Open the **VS Code integrated terminal**.

```
Terminal → New Terminal
```

Run:

```bash
npm install
```

This installs all dependencies listed in **package.json**.

---

# 6. Additional UI Dependencies

If the following libraries are not installed automatically, install them manually:

```bash
npm install lucide-react clsx tailwind-merge class-variance-authority
```

Install **Tailwind CSS developer dependencies**:

```bash
npm install -D tailwindcss postcss autoprefixer
```

---

# 7. Project File Structure (Important)

Make sure these files exist.

### Root

`index.html`

```html
<title>FocusFlow</title>
<script type="module" src="/src/main.tsx"></script>
```

---

### src/main.tsx

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

---

### src/App.tsx

Imports application components:

```tsx
import { FlowStateMeter } from "./app/components/FlowStateMeter";
import { SensorWidget } from "./app/components/SensorWidget";
import { PhysicalControls } from "./app/components/PhysicalControls";
import { FlowTimeline } from "./app/components/FlowTimeline";
import { SettingsPanel } from "./app/components/SettingsPanel";
import { AlertNotification } from "./app/components/AlertNotification";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./app/components/ui/tabs";
import { Button } from "./app/components/ui/button";
import { Clock, Play, Square } from "lucide-react";
```

---

### UI Components

Create missing UI components inside:

```
src/app/components/ui/
```

Example placeholder files:

```
tabs.tsx
button.tsx
```

If these files are missing, request them from the **team lead**.

---

# 8. Run the Development Server

Start the development server:

```bash
npm run dev
```

You should see:

```
Local: http://localhost:5173
```

Open the URL in your browser.

---

# 9. Troubleshooting

### White Screen on Localhost

Check the browser console:

```
F12 → Console
```

Look for **missing component** or **import errors**.

---

### Error: `ReferenceError: Square is not defined`

Make sure **lucide-react** is installed and imported correctly.

```tsx
import { Clock, Play, Square } from "lucide-react";
```

---

### npm Permission Errors

Follow **Step 4** to fix the **PowerShell execution policy**.

---

# 10. Useful VS Code Extensions

Recommended extensions:

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- React/TypeScript Snippets

---

# 11. Build for Production

Build the production version:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

---

# 12. Summary of Useful Commands

| Command | Description |
|------|------|
| `npm install` | Install dependencies |
| `npm run dev` | Run development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

---

# License

MIT License
