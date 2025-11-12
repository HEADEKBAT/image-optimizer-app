const fs = require('fs-extra');
const { exec } = require('child_process');
const path = require('path');

function executeCommand(command) {
  return new Promise((resolve) => {
    exec(command, (error) => {
      if (error) {
        console.log(`ℹ️ ${error.message}`);
      }
      resolve();
    });
  });
}

async function cleanForce() {
  console.log('🧹 Принудительная очистка...');
  
  // Закрываем процессы
  await executeCommand('taskkill /f /im electron.exe');
  await executeCommand('taskkill /f /im node.exe');
  
  // Ждем
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const pathsToClean = ['./dist', './release', './build'];
  
  for (const dirPath of pathsToClean) {
    try {
      if (await fs.pathExists(dirPath)) {
        console.log(`🗑️ Удаляю ${dirPath}...`);
        await fs.remove(dirPath);
        console.log(`✅ ${dirPath} удален`);
      }
    } catch (error) {
      console.log(`⚠️ Не удалось удалить ${dirPath}: ${error.message}`);
    }
  }
  
  console.log('✅ Очистка завершена!');
}

cleanForce();