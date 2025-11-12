import { ipcMain, app, dialog } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { convertImagesToWebp } from '../services/imageConverter';
import { optimizeImages } from '../services/imageOptimizer';
import { optimizeSvg } from '../services/svgOptimizer';
import { updatePathsForImage } from '../services/pathUpdater';

type ProcessOptions = {
  sourceDir: string;
  outputDir?: string;
  preserveStructure?: boolean;
  rewritePaths?: boolean;
  deleteOriginals?: boolean;
  backupOriginals?: boolean;
  optimize?: boolean;
};

const imageExts = new Set(['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff', '.webp']);
const svgExts = new Set(['.svg']);
const allImageExts = new Set([...imageExts, ...svgExts]);

async function walkDir(dir: string, files: string[] = [], excludeDirs = new Set<string>()) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!excludeDirs.has(full)) {
        await walkDir(full, files, excludeDirs);
      }
    } else {
      if (allImageExts.has(path.extname(e.name).toLowerCase())) files.push(full);
    }
  }
  return files;
}

/**
 * Найти уникальное имя для папки backup (backup, backup1, backup2...)
 * Ищет папку в sourceDir, а не в outDir!
 */
async function findUniqueBackupDir(sourceDir: string): Promise<string> {
  let backupDir = path.join(sourceDir, 'backup');
  let counter = 0;

  while (true) {
    try {
      const stat = await fs.stat(backupDir);
      if (!stat.isDirectory()) {
        return backupDir;
      }
    } catch (e) {
      // Директория не существует — используем это имя
      return backupDir;
    }

    counter++;
    backupDir = path.join(sourceDir, `backup${counter}`);
  }
}

export function setupIpcHandlers() {
  ipcMain.handle('select-folder', async () => {
    const res = await dialog.showOpenDialog({ properties: ['openDirectory'] });
    if (res.canceled || res.filePaths.length === 0) return null;
    return res.filePaths[0];
  });

  ipcMain.handle('process-folder', async (event, opts: ProcessOptions) => {
    if (!opts || !opts.sourceDir) throw new Error('sourceDir required');

    const outDir = opts.outputDir
      ? path.isAbsolute(opts.outputDir)
        ? opts.outputDir
        : path.join(opts.sourceDir, opts.outputDir)
      : path.join(opts.sourceDir, 'img');

    await fs.mkdir(outDir, { recursive: true });

    // Найти уникальную папку для backup ТОЛЬКО если включена опция
    let backupDir: string | null = null;
    if (opts.backupOriginals) {
      backupDir = await findUniqueBackupDir(opts.sourceDir);
      await fs.mkdir(backupDir, { recursive: true });
      event.sender.send('process-log', `📁 Backup dir: ${path.basename(backupDir)}`);
    }

    // Исключаем из сканирования папки backup и img
    const excludeDirs = new Set([outDir]);
    if (backupDir) {
      excludeDirs.add(backupDir);
    }
    try {
      const entries = await fs.readdir(opts.sourceDir, { withFileTypes: true });
      for (const e of entries) {
        if (e.isDirectory() && e.name.match(/^backup\d*$/)) {
          excludeDirs.add(path.join(opts.sourceDir, e.name));
        }
      }
    } catch (e) {
      // noop
    }

    const images = await walkDir(opts.sourceDir, [], excludeDirs);
    event.sender.send('process-log', `Found ${images.length} images`);

    const converted: string[] = [];

    // ОБРАБОТКА КАЖДОЙ КАРТИНКИ ОТДЕЛЬНО
    for (const imgPath of images) {
      const imgName = path.basename(imgPath);
      const imgExt = path.extname(imgPath).toLowerCase();
      const imgNameWithoutExt = path.basename(imgPath, imgExt);
      const imgDir = path.dirname(imgPath);
      const relImgDir = path.relative(opts.sourceDir, imgDir);
      const isSvg = svgExts.has(imgExt);

      try {
        // ШАГ 1: Перемещение в backup (ТОЛЬКО если backupOriginals включен)
        let processImagePath = imgPath;
        if (opts.backupOriginals && backupDir) {
          if (opts.preserveStructure && relImgDir !== '.') {
            const backupSubDir = path.join(backupDir, relImgDir);
            await fs.mkdir(backupSubDir, { recursive: true });
            processImagePath = path.join(backupSubDir, imgName);
          } else {
            processImagePath = path.join(backupDir, imgName);
          }

          await fs.rename(imgPath, processImagePath);
          event.sender.send('process-log', `📦 Backed up: ${imgName}`);
        } else if (opts.deleteOriginals) {
          await fs.unlink(imgPath);
          event.sender.send('process-log', `🗑️ Deleted: ${imgName}`);
          processImagePath = '';
        }

        if (!processImagePath || !(await fs.stat(processImagePath).catch(() => null))) {
          continue;
        }

        // ШАГ 2: Обработка в зависимости от типа
        const targetDir = opts.preserveStructure ? path.join(outDir, relImgDir) : outDir;
        await fs.mkdir(targetDir, { recursive: true });

        let convPath = '';

        if (isSvg) {
          // SVG обработка
          event.sender.send('process-log', `🎨 Optimizing SVG: ${imgName}`);
          const svgOutputPath = path.join(targetDir, imgNameWithoutExt + '.svg');
          await optimizeSvg(processImagePath, svgOutputPath);
          convPath = svgOutputPath;
          event.sender.send('process-log', `✨ SVG optimized: ${imgName}`);
        } else {
          // Обычная конвертация в WebP
          event.sender.send('process-log', `🔄 Converting: ${imgName}`);
          const conv = await convertImagesToWebp([processImagePath], targetDir);
          convPath = conv[0];

          if (!convPath) {
            event.sender.send('process-log', `❌ Failed to convert: ${imgName}`);
            continue;
          }

          // ШАГ 3: Оптимизация WebP
          if (opts.optimize) {
            event.sender.send('process-log', `⚡ Optimizing: ${imgName}`);
            try {
              await optimizeImages([convPath], targetDir);
              event.sender.send('process-log', `✅ Optimized: ${imgName}`);
            } catch (e) {
              event.sender.send('process-log', `ℹ️ Optimization skipped for ${imgName}`);
            }
          }
        }

        if (!convPath) {
          continue;
        }

        converted.push(convPath);

        // ШАГ 4: Переписание путей в проекте
        if (opts.rewritePaths) {
          event.sender.send('process-log', `🔗 Rewriting paths: ${imgName}`);
          await updatePathsForImage(opts.sourceDir, imgPath, convPath, opts.preserveStructure);
        }

        event.sender.send('process-log', `✨ Done: ${imgName}`);

      } catch (e) {
        event.sender.send('process-log', `⚠️ Error: ${path.basename(imgPath)} - ${String(e)}`);
      }
    }

    event.sender.send('process-log', `✅ Complete! Processed: ${converted.length}/${images.length}`);
    return { convertedCount: converted.length, outDir, converted };
  });
}