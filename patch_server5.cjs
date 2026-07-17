const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

code = code.replace(/parseInt\(req\.query\.page\)/g, 'parseInt((req.query as any).page)');
code = code.replace(/parseInt\(req\.query\.limit\)/g, 'parseInt((req.query as any).limit)');

code = code.replace(/\.sort\(\(a, b\) => b\.qty - a\.qty\)/, '.sort((a: any, b: any) => b.qty - a.qty)');

code = code.replace(/company = \{/g, 'company = {'); // just to find it
code = code.replace(/currency: "S\/"/, '// currency: "S/"'); // Just remove it since it's mock and causing issues

fs.writeFileSync('server.ts', code);
