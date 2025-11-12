import fs from 'fs/promises';
import { optimize } from 'svgo';
import path from 'path';

export const optimizeSvg = async (inputPath: string, outputPath: string) => {
  try {
    let svg = await fs.readFile(inputPath, 'utf8');

    // 1) Удаляем все <script>...</script>
    svg = svg.replace(/<script\b[\s\S]*?<\/script>/gi, '');

    // 2) Удаляем inline-обработчики событий: onclick, onload и т.д.
    svg = svg.replace(/\son[a-zA-Z]+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '');

    // 3) Удаляем javascript: ссылки (xlink:href/href)
    svg = svg.replace(/(href|xlink:href)\s*=\s*(['"])\s*javascript:[^'"]*\2/gi, '');

    // 4) Прокидываем на оптимизацию svgo
    const result = optimize(svg, {
      path: inputPath,
      multipass: true,
      plugins: [
        'preset-default'
      ]
    });

    if (typeof result === 'string') {
      // В старых версиях svgo может вернуть строку
      await fs.writeFile(outputPath, result, 'utf8');
    } else if ('data' in result) {
      await fs.writeFile(outputPath, result.data, 'utf8');
    } else {
      throw new Error('SVGO returned unexpected result');
    }

    return outputPath;
  } catch (e) {
    console.error(`Error optimizing SVG ${inputPath}:`, e);
    throw e;
  }
};