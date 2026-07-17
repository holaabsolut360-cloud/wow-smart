const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/CustomersTab.tsx', 'utf-8');
code = code.replace(/const queryClient = useQueryClient\(\);\n  const deleteCustomerMutation/g, 'const deleteCustomerMutation');
fs.writeFileSync('src/components/dashboard/CustomersTab.tsx', code);
