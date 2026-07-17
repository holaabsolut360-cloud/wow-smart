const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

// Fix initial company literal
code = code.replace(/storeSchedule: \{[^\}]+\}\s*\}/, match => match + ' as any');
// Fix queries
code = code.replace(/req\.query\.companyId/g, '(req.query.companyId as string)');
code = code.replace(/req\.query\.slug/g, '(req.query.slug as string)');
code = code.replace(/req\.query\.search/g, '(req.query.search as string)');
code = code.replace(/req\.query\.type/g, '(req.query.type as string)');
code = code.replace(/req\.query\.status/g, '(req.query.status as string)');

// Fix qty
code = code.replace(/p\.qty/g, '(p as any).qty');

fs.writeFileSync('server.ts', code);
