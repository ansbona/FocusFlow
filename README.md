# FocusFlow – Smart Focus Monitoring Dashboard

FocusFlow is a **real-time focus monitoring dashboard** designed to help users stay productive during digital learning sessions.

It analyzes simulated sensor data such as:

* Blink Rate
* Movement Activity
* Focus Streak Duration

The dashboard provides **visual feedback, alerts, and session analytics** to help users maintain optimal focus.

---

# Features

## Real-Time Focus Monitoring

* Detects **Flow, Focus, Fatigue, and Break states**
* Tracks **focus streak duration**

## Sensor Monitoring

Displays simulated sensor metrics:

* Blink Rate (BPM)
* Movement Activity (%)

Includes historical charts for trend analysis.

## Alerts & Suggestions

The system generates alerts such as:

* High blink rate warnings
* Movement suggestions
* Break reminders

## Session Control

Start or stop focus sessions using the dashboard controls.

## Timeline Visualization

Shows a visual timeline of:

* Focus states
* Session durations
* Sensor averages

## Custom Controls

Adjust device feedback settings:

* Light color
* Light brightness
* Vibration

## Configurable Thresholds

Users can customize:

* Blink rate thresholds
* Movement thresholds

---

# Tech Stack

Frontend Framework:

* React
* TypeScript

Build Tool:

* Vite

UI Styling:

* TailwindCSS

Icons:

* Lucide React

---

# Project Structure

```
src
 ├── app
 │   ├── components
 │   │   ├── ui
 │   │   ├── AlertNotification.tsx
 │   │   ├── FlowStateMeter.tsx
 │   │   ├── FlowTimeline.tsx
 │   │   ├── PhysicalControls.tsx
 │   │   ├── SensorWidget.tsx
 │   │   └── SettingsPanel.tsx
 │   └── App.tsx
 │
 ├── styles
 │   ├── index.css
 │   ├── tailwind.css
 │   └── theme.css
 │
package.json
vite.config.ts
```

---

# Installation

## 1. Clone Repository

```
git clone https://github.com/YOUR_USERNAME/focusflow.git
```

```
cd focusflow
```

---

## 2. Install Dependencies

```
npm install
```

Install UI dependencies:

```
npm install lucide-react clsx tailwind-merge class-variance-authority
```

---

## 3. Run Development Server

```
npm run dev
```

Open browser:

```
http://localhost:5173
```

---

# Build Production Version

```
npm run build
```

Preview production build:

```
npm run preview
```

---

# Privacy

FocusFlow is designed with privacy in mind.

All sensor data in this prototype is **simulated and processed locally**.

---

# Future Improvements

* Integration with real eye-tracking sensors
* AI focus prediction
* Study analytics dashboard
* Smart break scheduling
* Hardware integration (wearables)

---

# License

MIT License
