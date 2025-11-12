const fs = require('fs-extra');
const path = require('path');

async function clean() {
  console.log('🧹 Удаляю dist...');
  const distPath = path.join(__dirname, '..', 'dist');
  
  try {
    // Проверяем, существует ли папка
    if (await fs.pathExists(distPath)) {
      // Удаляем все содержимое, кроме заблокированных файлов
      const items = await fs.readdir(distPath);
      
      for (const item of items) {
        const itemPath = path.join(distPath, item);
        try {
          await fs.remove(itemPath);
          console.log(`✅ Удалено: ${item}`);
        } catch (error) {
          console.log(`⚠️ Не удалось удалить: ${item} - ${error.message}`);
        }
      }
      
      // Если папка пуста, удаляем её
      const remainingItems = await fs.readdir(distPath);
      if (remainingItems.length === 0) {
        await fs.remove(distPath);
      }
    }
  } catch (error) {
    console.log('⚠️ Ошибка при очистке:', error.message);
  }
  
  console.log('✅ Очистка завершена');
}

clean();