const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/ExpensesTab.tsx', 'utf-8');
code = code.replace(/description:/g, 'concept:');
code = code.replace(/\.description/g, '.concept');
fs.writeFileSync('src/components/dashboard/ExpensesTab.tsx', code);
