import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

type ProcessOptions = {
  sourceDir: string;
  outputDir?: string;
  preserveStructure?: boolean;
  rewritePaths?: boolean;
  deleteOriginals?: boolean;
  optimize?: boolean;
};

const CHANNELS = {
  SELECT_FOLDER: 'select-folder',
  PROCESS_FOLDER: 'process-folder',
  PROCESS_LOG: 'process-log',
} as const;

contextBridge.exposeInMainWorld('api', {
  selectFolder: async (): Promise<string | null> => {
    return ipcRenderer.invoke(CHANNELS.SELECT_FOLDER) as Promise<string | null>;
  },
  processFolder: async (options: ProcessOptions) => {
    return ipcRenderer.invoke(CHANNELS.PROCESS_FOLDER, options);
  },
  onLog: (cb: (msg: string) => void) => {
    const listener = (_: IpcRendererEvent, msg: string) => cb(msg);
    ipcRenderer.on(CHANNELS.PROCESS_LOG, listener);
    return () => ipcRenderer.removeListener(CHANNELS.PROCESS_LOG, listener);
  },
});