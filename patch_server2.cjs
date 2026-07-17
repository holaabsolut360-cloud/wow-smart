const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

code = code.replace(/req\.user;/g, '(req as any).user;');
code = code.replace(/db\.companies\.push\(company\);/g, 'db.companies.push(company as any);');
code = code.replace(/req\.query\.type/g, '(req.query as any).type');
code = code.replace(/req\.query\.status/g, '(req.query as any).status');
code = code.replace(/req\.query\.companyId/g, '(req.query as any).companyId');
code = code.replace(/req\.query\.search/g, '(req.query as any).search');

fs.writeFileSync('server.ts', code);
