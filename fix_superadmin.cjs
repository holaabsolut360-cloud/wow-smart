const fs = require('fs');
let code = fs.readFileSync('src/pages/SuperAdmin.tsx', 'utf-8');
code = code.replace(/\$\$REPLACED_MARKER\$\$/, '<td className="p-4 flex gap-2 justify-end">');
fs.writeFileSync('src/pages/SuperAdmin.tsx', code);
