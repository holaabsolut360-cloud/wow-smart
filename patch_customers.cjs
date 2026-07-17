const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/CustomersTab.tsx', 'utf-8');
code = code.replace(/customersList/g, 'customers');
code = code.replace(/handleDeleteCustomer/g, 'deleteCustomerMutation.mutate');
if (!code.includes("import { PlusCircle")) {
  code = code.replace(/import \{ Company, Customer/g, "import { PlusCircle, Trash2 } from 'lucide-react';\nimport { Company, Customer");
}
fs.writeFileSync('src/components/dashboard/CustomersTab.tsx', code);
