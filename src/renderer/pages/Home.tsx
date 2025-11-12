import React, { useState, useEffect } from "react";

declare global {
  interface Window {
    api?: {
      selectFolder: () => Promise<string | null>;
      processFolder: (opts: any) => Promise<any>;
      onLog: (cb: (msg: string) => void) => () => void;
    };
  }
}

const Home: React.FC = () => {
  const isElectron = typeof window !== "undefined" && !!window.api;

  const [sourceDir, setSourceDir] = useState<string>("");
  const [outputDir, setOutputDir] = useState<string>("");
  const [preserveStructure, setPreserveStructure] = useState<boolean>(true);
  const [rewritePaths, setRewritePaths] = useState<boolean>(false);
  const [deleteOriginals, setDeleteOriginals] = useState<boolean>(false);
  const [backupOriginals, setBackupOriginals] = useState<boolean>(true); // новая опция
  const [optimize, setOptimize] = useState<boolean>(true);
  const [logs, setLogs] = useState<string[]>([]);
  const [running, setRunning] = useState<boolean>(false);

  useEffect(() => {
    if (!isElectron) {
      setLogs((s) => [...s, "Запущено в браузере — некоторые функции недоступны."]);
      return;
    }
    const off = window.api!.onLog((m) => setLogs((s) => [...s, m]));
    return () => off();
  }, [isElectron]);

  const pickFolder = async () => {
    if (!isElectron) {
      setLogs((s) => [...s, "Выбор папки доступен только в Electron."]);
      return;
    }
    const dir = await window.api!.selectFolder();
    if (dir) setSourceDir(dir);
  };

  const start = async () => {
    if (!sourceDir) {
      setLogs((s) => [...s, "Select source folder first"]);
      return;
    }
    if (!isElectron) {
      setLogs((s) => [...s, "Запуск обработки доступен только в Electron."]);
      return;
    }
    setRunning(true);
    setLogs((s) => [...s, `Start processing ${sourceDir}`]);
    try {
      const res = await window.api!.processFolder({
        sourceDir,
        outputDir: outputDir && outputDir.trim() ? outputDir.trim() : undefined, // исправлено
        preserveStructure,
        rewritePaths,
        deleteOriginals: deleteOriginals && !backupOriginals,
        backupOriginals,
        optimize,
      });
      setLogs((s) => [...s, `Finished: ${JSON.stringify(res)}`]);
    } catch (e) {
      setLogs((s) => [...s, `Error: ${String(e)}`]);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Image Optimizer — Folder mode</h2>

      <div>
        <button onClick={pickFolder}>Выбрать папку проекта</button>
        <span style={{ marginLeft: 8 }}>{sourceDir}</span>
      </div>

      <div style={{ marginTop: 8 }}>
        <label>Куда сохранять .webp (папка): </label>
        <input
          value={outputDir}
          onChange={(e) => setOutputDir(e.target.value)}
          placeholder="по умолчанию — sourceDir/img"
          style={{ width: 400 }}
        />
      </div>

      <div style={{ marginTop: 8 }}>
        <label>
          <input type="checkbox" checked={preserveStructure} onChange={(e) => setPreserveStructure(e.target.checked)} />{" "}
          Сохранять структуру папок
        </label>
        <br />
        <label>
          <input type="checkbox" checked={rewritePaths} onChange={(e) => setRewritePaths(e.target.checked)} />{" "}
          Переписать пути в HTML/CSS/JS
        </label>
        <br />
        <label>
          <input type="checkbox" checked={backupOriginals} onChange={(e) => setBackupOriginals(e.target.checked)} />{" "}
          Переместить оригиналы в backup
        </label>
        <br />
        <label>
          <input
            type="checkbox"
            checked={deleteOriginals}
            disabled={backupOriginals}
            onChange={(e) => setDeleteOriginals(e.target.checked)}
          />{" "}
          Удалять оригиналы {backupOriginals && "(отключено, используется backup)"}
        </label>
        <br />
        <label>
          <input type="checkbox" checked={optimize} onChange={(e) => setOptimize(e.target.checked)} /> Запускать
          оптимизацию
        </label>
      </div>

      <div style={{ marginTop: 12 }}>
        <button onClick={start} disabled={running}>
          {running ? "Обработка..." : "Запустить"}
        </button>
      </div>

      <div style={{ marginTop: 12 }}>
        <h3>Лог</h3>
        <div
          style={{
            maxHeight: 300,
            overflow: "auto",
            background: "#111",
            color: "#eee",
            padding: 8,
            fontFamily: "monospace",
            fontSize: 12,
          }}
        >
          {logs.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
