const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

code = code.replace(/company = \{[\s\S]*?\/\/ currency\n\s*\};/, match => match + ' as any;');

fs.writeFileSync('server.ts', code);
