const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) walk(dirPath, callback);
        else callback(dirPath);
    });
}

function processFile(filePath) {
    if (!filePath.match(/\.(ts|tsx)$/)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    // Replace imports like 'sonner@2.0.3' with 'sonner'
    let newContent = content.replace(/from\s+['"]([@a-zA-Z0-9_-]+)@[0-9\.]+['"]/g, "from '$1'");
    if (content !== newContent) {
        fs.writeFileSync(filePath, newContent);
        console.log('Fixed imports in', filePath);
    }
}

walk('./src', processFile);
