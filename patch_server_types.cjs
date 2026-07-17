const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

// Fix currency in db.companies
code = code.replace(/storeSchedule: \{[^\}]+\}\s*\}/, match => match.replace(/\}\s*\}$/, '} as any}'));
code = code.replace(/req\.body\.qty/g, '(req.body as any).qty');

// Fix type errors in server.ts
code = code.replace(/req\.query\.search\.toLowerCase/g, '(req.query.search as string).toLowerCase');

fs.writeFileSync('server.ts', code);
