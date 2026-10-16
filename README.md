# Sipzen 💧

A minimal, elegant macOS menu bar hydration tracker and reminder built with Electron, React, and TypeScript.

> Built with [REA](https://github.com/morluto/rea) — the entire app was built from a single prompt.

## Features

- 🕒 **Menu Bar Resident**: Lives quietly in your macOS status bar without cluttering the Dock or Cmd+Tab switcher.
- 💧 **Hydration Tracking**: Track your daily water intake with intuitive quick-add buttons.
- 🔔 **Subtle Reminders**: Non-intrusive floating popup reminders to keep you hydrated throughout your workday.
- 📊 **Daily History & Stats**: Monitor streaks and past consumption history.
- 🎨 **macOS Native Aesthetics**: Smooth vibrancy, dark mode aesthetics, and micro-interactions.

## Installation

1. Download `Sipzen-1.0.0-arm64.dmg` from the **[Releases](../../releases/latest)** tab.
2. Open the downloaded `.dmg` and drag **Sipzen** into your **Applications** folder.
3. Open **Sipzen** from Applications or Spotlight.

> **Note for macOS Gatekeeper:**
> If macOS displays a message saying the developer cannot be verified, simply Right-Click (Control-Click) `Sipzen.app` → click **Open** → then click **Open**.

## Development

```bash
# Install dependencies
npm install

# Start Vite dev server & Electron app
npm run electron:start

# Build production bundle and macOS DMG/ZIP
npm run dist
```

## License

MIT
