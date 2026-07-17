const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/CrmTab.tsx', 'utf-8');
code = code.replace(/addDealMutation\.mutate\(newDeal\);\s*\};\)/, 'addDealMutation.mutate(newDeal);');
code = code.replace(/addDealMutation\.mutate\(newDeal\);\s*\};\s*\}\}/, 'addDealMutation.mutate(newDeal);\n                }}');
fs.writeFileSync('src/components/dashboard/CrmTab.tsx', code);
