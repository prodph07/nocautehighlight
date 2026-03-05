import fs from 'fs';
try {
    let data;
    try {
        data = fs.readFileSync('eslint.json', 'utf16le');
        JSON.parse(data);
    } catch (e) {
        data = fs.readFileSync('eslint.json', 'utf8');
    }

    const parsed = JSON.parse(data);
    const issues = parsed.filter(f => f.errorCount > 0 || f.warningCount > 0);
    issues.forEach(f => {
        console.log(`\n\n--- FILE: ${f.filePath} ---`);
        f.messages.forEach(m => console.log(`  Line ${m.line}: ${m.message} (${m.ruleId})`));
    });
} catch (e) {
    console.error("Parse fail:", e.message);
}
