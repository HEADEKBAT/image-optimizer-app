import path from 'path';
import sharp from 'sharp';
import fs from 'fs/promises';

// Вспомогательная функция для задержки
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const optimizeImages = async (imagePaths: string[], outputDir: string) => {
  const optimizedImages: string[] = [];

  for (const imagePath of imagePaths) {
    try {
      const fileName = path.basename(imagePath);
      
      // Проверяем, что файл существует
      await fs.access(imagePath);

      // Создаём временный файл для оптимизации
      const tempFilePath = imagePath + '.tmp.webp';

      // Оптимизируем в временный файл
      await sharp(imagePath)
        .webp({ quality: 80, effort: 6 })
        .toFile(tempFilePath);

      // Даём время Sharp отпустить файловый дескриптор
      await delay(100);

      // Удаляем оригинальный файл и переименовываем временный
      await fs.unlink(imagePath);
      await fs.rename(tempFilePath, imagePath);

      optimizedImages.push(imagePath);
    } catch (e) {
      console.error(`Error optimizing ${imagePath}:`, e);
      
      // Пытаемся удалить временный файл если он существует
      try {
        await delay(50);
        await fs.unlink(imagePath + '.tmp.webp');
      } catch (tmpError) {
        // Игнорируем ошибку если временного файла нет
      }
      
      // Не прерываем процесс — продолжаем дальше
    }
  }

  return optimizedImages;
};