const { app, BrowserWindow, Tray, ipcMain, Notification, screen } = require("electron");
const path = require("path");

let tray = null;
let window = null;
let currentMode = "dashboard"; // "dashboard" | "reminder"
let reminderTimeout = null;

const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

function getWindowPosition(width, height) {
  if (!tray) return { x: 0, y: 30 };
  const trayBounds = tray.getBounds();

  let x = Math.round(trayBounds.x + trayBounds.width / 2 - width / 2);
  let y = Math.round(trayBounds.y + trayBounds.height + 4);

  // If tray bounds are not yet populated on macOS, position near top-right
  if (trayBounds.x === 0 && trayBounds.y === 0) {
    const primaryDisplay = screen.getPrimaryDisplay();
    x = primaryDisplay.bounds.width - width - 32;
    y = 30;
  }

  return { x, y };
}

function showDashboard() {
  if (!window) return;
  if (reminderTimeout) clearTimeout(reminderTimeout);

  currentMode = "dashboard";
  window.setSize(360, 540, false);
  const pos = getWindowPosition(360, 540);
  window.setPosition(pos.x, pos.y, false);
  window.setAlwaysOnTop(true, "floating");
  window.webContents.send("set-mode", "dashboard");
  window.show();
  window.focus();

  if (process.platform === "darwin" && app.dock) {
    app.dock.hide();
  }
}

function showReminderPopup() {
  if (!window) return;
  if (reminderTimeout) clearTimeout(reminderTimeout);

  currentMode = "reminder";
  window.setSize(280, 180, false);
  const pos = getWindowPosition(280, 180);
  window.setPosition(pos.x, pos.y, false);
  window.setAlwaysOnTop(true, "floating");
  window.setVisibleOnAllWorkspaces(true);
  window.webContents.send("set-mode", "reminder");
  window.showInactive();

  if (process.platform === "darwin" && app.dock) {
    app.dock.hide();
  }

  // Auto-dismiss after 25 seconds if ignored
  reminderTimeout = setTimeout(() => {
    if (currentMode === "reminder" && window && window.isVisible()) {
      window.hide();
      currentMode = "dashboard";
      if (process.platform === "darwin" && app.dock) {
        app.dock.hide();
      }
    }
  }, 25000);
}

function toggleWindow() {
  if (!window) return;
  if (window.isVisible() && currentMode === "dashboard") {
    window.hide();
  } else {
    showDashboard();
  }
}

function createWindow() {
  window = new BrowserWindow({
    width: 360,
    height: 540,
    show: false,
    frame: false,
    type: "panel",
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    vibrancy: "under-window", // macOS native blur
    visualEffectState: "active",
    backgroundColor: "#00000000",
    transparent: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    window.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    window.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  // Hide window when clicking outside, but only in full dashboard mode
  window.on("blur", () => {
    if (window.webContents.isDevToolsOpened()) return;
    if (currentMode === "dashboard") {
      window.hide();
      if (process.platform === "darwin" && app.dock) {
        app.dock.hide();
      }
    }
  });
}

function createTray() {
  const iconPath = path.join(__dirname, "../assets/trayIcon.png");
  tray = new Tray(iconPath);
  tray.setToolTip("Sipzen - Hydration Tracker");

  tray.on("click", () => {
    toggleWindow();
  });

  tray.on("right-click", () => {
    toggleWindow();
  });
}

app.whenReady().then(() => {
  // Hide from macOS Dock and Cmd+Tab app switcher completely
  if (process.platform === "darwin") {
    if (typeof app.setActivationPolicy === "function") {
      app.setActivationPolicy("accessory");
    }
    if (app.dock) {
      app.dock.hide();
    }
  }

  createWindow();
  createTray();

  // If in dev mode, open window after short delay so user sees it right away
  if (isDev) {
    setTimeout(() => {
      showDashboard();
    }, 1200);
  }
});

// IPC handlers
ipcMain.on("update-tray-title", (event, title) => {
  if (tray && typeof tray.setTitle === "function") {
    tray.setTitle(title);
  }
});

ipcMain.on("send-notification", (event, { title, body }) => {
  if (Notification.isSupported()) {
    new Notification({
      title: title || "Sipzen Reminder",
      body: body || "Time to take a sip! Stay hydrated.",
      icon: path.join(__dirname, "../assets/icon.png"),
      silent: false,
    }).show();
  }
});

ipcMain.on("trigger-reminder-popup", () => {
  showReminderPopup();
});

ipcMain.on("expand-to-dashboard", () => {
  showDashboard();
});

ipcMain.on("hide-window", () => {
  if (window) {
    window.hide();
    currentMode = "dashboard";
    if (process.platform === "darwin" && app.dock) {
      app.dock.hide();
    }
  }
});

ipcMain.on("quit-app", () => {
  app.quit();
});

app.on("window-all-closed", () => {
  // Don't quit on window close; keep running in tray
});
