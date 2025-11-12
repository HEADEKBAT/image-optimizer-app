import { ipcMain } from 'electron';

export const channels = {
    CONVERT_IMAGE: 'convert-image',
    OPTIMIZE_IMAGE: 'optimize-image',
    ORGANIZE_FILES: 'organize-files',
    UPDATE_PATHS: 'update-paths',
};

// Register IPC channels
export const registerChannels = () => {
    ipcMain.handle(channels.CONVERT_IMAGE, async (event, imagePath) => {
        // Handle image conversion
    });

    ipcMain.handle(channels.OPTIMIZE_IMAGE, async (event, imagePath) => {
        // Handle image optimization
    });

    ipcMain.handle(channels.ORGANIZE_FILES, async (event, filePaths) => {
        // Handle file organization
    });

    ipcMain.handle(channels.UPDATE_PATHS, async (event, newPaths) => {
        // Handle path updates
    });
};