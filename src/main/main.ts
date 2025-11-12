import { app, BrowserWindow } from 'electron';
import path from 'path';
import { setupIpcHandlers } from './ipc/handlers';

let mainWindow: BrowserWindow | null;

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            webSecurity: false // Добавьте это для production
        },
    });

    const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

    if (isDev) {
        mainWindow.loadURL('http://localhost:3000');
        mainWindow.webContents.openDevTools();
    } else {
        const indexPath = path.join(__dirname, '../renderer/index.html');
        console.log('🚀 Production - Loading from:', indexPath);
        
        // Для отладки открываем DevTools и в production
        mainWindow.webContents.openDevTools();
        
        mainWindow.loadFile(indexPath).catch(err => {
            console.error('❌ Failed to load index.html:', err);
        });
    }

    // Отслеживаем ошибки загрузки
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error('❌ Failed to load:', errorCode, errorDescription);
    });

    mainWindow.webContents.on('console-message', (event, level, message) => {
        console.log('📝 Renderer console:', message);
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
};

app.on('ready', () => {
    createWindow();
    setupIpcHandlers();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});