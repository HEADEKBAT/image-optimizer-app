import fs from 'fs';
import { promises as fsPromises } from 'fs';
import path from 'path';

const textFileExts = new Set([
  '.html', '.htm', '.css', '.js', '.jsx', '.ts', '.tsx', 
  '.php', '.php5', '.php7', '.phtml',
  '.xml', '.json', '.svg', '.vue', '.astro'
]);

const imageExts = new Set(['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff', '.webp', '.svg']);

/**
 * Заменяет пути конкретной картинки на её оптимизированную версию в текстовых файлах проекта.
 */
export const updatePathsForImage = async (
  projectDir: string,
  originalImagePath: string,
  optimizedImagePath: string,
  preserveStructure: boolean = true
) => {
  const imgName = path.basename(originalImagePath, path.extname(originalImagePath));
  const originalExt = path.extname(originalImagePath).toLowerCase();
  const newExt = path.extname(optimizedImagePath).toLowerCase();

  const walk = async (dir: string) => {
    const entries = await fsPromises.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        if (['.git', 'node_modules', '.next', 'dist', 'build', 'out', 'backup', 'img'].includes(entry.name)) {
          continue;
        }
        if (entry.name.match(/^backup\d*$/)) {
          continue;
        }
        await walk(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        
        if (imageExts.has(ext)) continue;
        if (!textFileExts.has(ext)) continue;
        
        try {
          let content = await fsPromises.readFile(fullPath, 'utf8');
          let modified = false;
          
          // Ищем ссылки на оригинальное изображение (с оригинальным расширением)
          const patterns = [
            new RegExp(`url\\s*\\(\\s*['\`"]?\\s*([^'"\`\)\\s]*\\/${imgName}\\.${originalExt.substring(1)})\\s*['\`"]?\\s*\\)`, 'gi'),
            new RegExp(`(?:src|href|data-src)\\s*=\\s*['\`"]([^'"\`>\\s]*\\/${imgName}\\.${originalExt.substring(1)})['"\`]`, 'gi'),
            new RegExp(`['\`"]([^'"\`\\s]*${imgName}\\.${originalExt.substring(1)})['"\`]`, 'gi'),
          ];
          
          for (const pattern of patterns) {
            content = content.replace(pattern, (match, foundPath) => {
              if (!foundPath) return match;

              const currentFileDir = path.dirname(fullPath);
              const relativeNewPath = path.relative(currentFileDir, optimizedImagePath);
              const normalizedPath = relativeNewPath.replace(/\\/g, '/');

              modified = true;

              if (match.includes('url(')) {
                const quote = match.includes("'") ? "'" : match.includes('"') ? '"' : '';
                return `url(${quote}${normalizedPath}${quote})`;
              } else if (match.includes('=')) {
                const quote = match.includes("'") ? "'" : '"';
                const attr = match.split('=')[0].trim();
                return `${attr}=${quote}${normalizedPath}${quote}`;
              } else {
                const quote = match[0];
                return `${quote}${normalizedPath}${quote}`;
              }
            });
          }
          
          if (modified) {
            await fsPromises.writeFile(fullPath, content, 'utf8');
          }
        } catch (e) {
          console.error(`Error processing ${fullPath}:`, e);
        }
      }
    }
  };
  
  await walk(projectDir);
};

export const updatePaths = async (projectDir: string, sourceDir: string, outputDir: string) => {
  console.log('updatePaths deprecated — use updatePathsForImage');
};