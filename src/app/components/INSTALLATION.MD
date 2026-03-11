# FocusFlow - Installation & Setup Guide

This guide helps you set up the FocusFlow React app locally using VS Code.

---

## 1. Prerequisites

Make sure you have these installed:

- **Node.js (v18 or higher)**  
  Download: https://nodejs.org  
  Verify installation:
  ```bash
  node -v
  npm -v

Git (optional, for cloning the repo)
Download: https://git-scm.com/downloads

2. Clone the Repository
git clone https://github.com/YOUR_USERNAME/focusflow.git
cd focusflow

Or download and unzip the project folder manually.

3. Open the Project in VS Code

Open the project folder (focusflow) in Visual Studio Code.

4. Fix Windows PowerShell Script Execution Policy (Windows Only)

If you get an error when running npm install like:

npm.ps1 cannot be loaded because running scripts is disabled

Open PowerShell as Administrator and run:

Set-ExecutionPolicy RemoteSigned -Scope CurrentUser

Type Y to confirm and restart VS Code.

5. Install Project Dependencies

Open the integrated terminal in VS Code:

Terminal → New Terminal

Run:

npm install

This will install all dependencies listed in package.json.

6. Additional UI Dependencies

Make sure the following libraries are installed (if not installed by npm install):

npm install lucide-react clsx tailwind-merge class-variance-authority

Also install Tailwind CSS developer dependencies:

npm install -D tailwindcss postcss autoprefixer
7. Project File Structure (Important)

Make sure the following files exist:

index.html in the project root with:

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>FocusFlow</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>

src/main.tsx with:

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

src/App.tsx imports components like:

import { FlowStateMeter } from "./app/components/FlowStateMeter";
import { SensorWidget } from "./app/components/SensorWidget";
import { PhysicalControls } from "./app/components/PhysicalControls";
import { FlowTimeline } from "./app/components/FlowTimeline";
import { SettingsPanel } from "./app/components/SettingsPanel";
import { AlertNotification } from "./app/components/AlertNotification";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./app/components/ui/tabs";
import { Button } from "./app/components/ui/button";
import { Clock, Play, Square } from "lucide-react";

Create missing UI components under:

src/app/components/ui/

For example, create tabs.tsx and button.tsx as placeholders if missing (ask the team lead for the files if needed).

8. Run the Development Server

Start the app with:

npm run dev

You should see in the terminal something like:

Local: http://localhost:5173

Open that URL in your browser.

9. Troubleshooting

If you see a white screen on localhost, check the browser console (F12 → Console) for errors about missing components or imports.

If you see errors like:

ReferenceError: Square is not defined

Make sure lucide-react is installed and the import line in App.tsx includes Square:

import { Clock, Play, Square } from "lucide-react";

If you get npm permission errors, follow step 4 to fix PowerShell execution policy.

10. Useful VS Code Extensions

ESLint

Prettier

Tailwind CSS IntelliSense

React/TypeScript snippets

11. Build for Production

To build the production version:

npm run build

To preview the production build locally:

npm run preview
12. Summary of Useful Commands
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
License

MIT License
