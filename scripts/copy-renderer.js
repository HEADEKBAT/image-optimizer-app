const fs = require('fs-extra');
const path = require('path');

async function copyRenderer() {
  const source = path.join(__dirname, '..', 'build');
  const destination = path.join(__dirname, '..', 'dist', 'renderer');
  
  console.log('📁 Copying renderer files...');
  
  try {
    await fs.ensureDir(destination);
    await fs.copy(source, destination);
    
    // Исправляем пути в index.html
    const indexPath = path.join(destination, 'index.html');
    let indexContent = await fs.readFile(indexPath, 'utf8');
    
    // Удаляем ссылку на несуществующий styles/index.css
    indexContent = indexContent.replace('<link rel="stylesheet" href="styles/index.css">', '');
    
    await fs.writeFile(indexPath, indexContent);
    console.log('✅ Renderer files copied and index.html fixed!');
  } catch (error) {
    console.error('❌ Error copying renderer files:', error);
  }
}

copyRenderer();