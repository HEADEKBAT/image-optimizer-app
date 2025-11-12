import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

export const convertImagesToWebp = async (inputPaths: string[], outputDir: string) => {
  // Нормализуем путь outputDir
  const normalizedOutputDir = path.normalize(outputDir);
  
  if (!fs.existsSync(normalizedOutputDir)) {
    fs.mkdirSync(normalizedOutputDir, { recursive: true });
  }

  const conversionPromises = inputPaths.map(async (inputPath) => {
    try {
      const fileName = path.basename(inputPath, path.extname(inputPath)) + '.webp';
      const outputPath = path.join(normalizedOutputDir, fileName);

      // Проверяем, что входной файл существует
      if (!fs.existsSync(inputPath)) {
        throw new Error(`Input file not found: ${inputPath}`);
      }

      // Конвертируем с качеством для webp
      await sharp(inputPath)
        .webp({ quality: 80 })
        .toFile(outputPath);

      // Проверяем, что выходной файл создан
      if (!fs.existsSync(outputPath)) {
        throw new Error(`Output file not created: ${outputPath}`);
      }

      console.log(`Converted: ${inputPath} -> ${outputPath}`);
      return outputPath;
    } catch (e) {
      console.error(`Conversion error for ${inputPath}:`, e);
      throw e;
    }
  });

  return Promise.all(conversionPromises);
};