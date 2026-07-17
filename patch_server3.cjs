const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

// replace the onboarding object
code = code.replace(/const company = \{/, 'const company: any = {');
code = code.replace(/db\.companies\.push\(company\);/g, 'db.companies.push(company);');

code = code.replace(/req\.body\.qty/g, '(req.body as any).qty');
code = code.replace(/req\.params\.id/g, '(req.params as any).id');
code = code.replace(/req\.query\.search as string/g, '(req.query as any).search');
code = code.replace(/req\.query\.status/g, '(req.query as any).status');
code = code.replace(/req\.query\.type/g, '(req.query as any).type');

fs.writeFileSync('server.ts', code);
