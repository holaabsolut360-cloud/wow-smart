const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');
code = code.replace(/<SuppliersTab \/>/g, '<SuppliersTab company={company} />');
if (!code.includes("import { SecurityTab }")) {
  code = code.replace(/import \{ SuppliersTab/g, "import { SecurityTab } from '../components/dashboard/SecurityTab';\nimport { SuppliersTab");
}
fs.writeFileSync('src/pages/Dashboard.tsx', code);
