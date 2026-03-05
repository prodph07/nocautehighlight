const fs = require('fs');
try {
    const data = fs.readFileSync('eslint.json', 'utf8');
    // It might be utf16 depending on powershell redirection. Let's try parsing.
    let parsed;
    try {
        parsed = JSON.parse(data);
    } catch (e) {
        const data16 = fs.readFileSync('eslint.json', 'utf16le');
        parsed = JSON.parse(data16);
    }

    const issues = parsed.filter(f => f.errorCount > 0 || f.warningCount > 0);
    issues.forEach(f => {
        console.log(f.filePath);
        f.messages.forEach(m => console.log(`  Line ${m.line}: ${m.message} (${m.ruleId})`));
    });
} catch (e) {
    console.error(e);
}
