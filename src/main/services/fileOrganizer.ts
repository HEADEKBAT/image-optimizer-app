import fs from 'fs';
import path from 'path';

const organizeFiles = (sourceDir: string, targetDir: string) => {
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    fs.readdir(sourceDir, (err, files) => {
        if (err) {
            console.error('Error reading source directory:', err);
            return;
        }

        files.forEach(file => {
            const sourceFilePath = path.join(sourceDir, file);
            const targetFilePath = path.join(targetDir, file);

            fs.rename(sourceFilePath, targetFilePath, (err) => {
                if (err) {
                    console.error(`Error moving file ${file}:`, err);
                } else {
                    console.log(`Moved file ${file} to ${targetDir}`);
                }
            });
        });
    });
};

export { organizeFiles };