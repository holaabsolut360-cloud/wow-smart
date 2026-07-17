const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');

const additionalTabs = `        ) : activeTab === 'crm' ? (
          <CrmTab />
        ) : activeTab === 'debts' ? (
          <DebtsTab company={company} />
        ) : activeTab === 'categories' ? (
          <CategoriesTab company={company} setCompany={setCompany as any} />
        ) : activeTab === 'coupons' ? (
          <CouponsTab company={company} setCompany={setCompany as any} />
        ) : activeTab === 'suppliers' ? (
          <SuppliersTab />`;

code = code.replace(/\) : activeTab === 'security' \? \(/, additionalTabs + "\n        ) : activeTab === 'security' ? (");

// we need to make sure the imports exist
if (!code.includes("import { CategoriesTab }")) code = code.replace(/import \{ SettingsTab \}/, "import { CategoriesTab } from '../components/dashboard/CategoriesTab';\nimport { CouponsTab } from '../components/dashboard/CouponsTab';\nimport { SettingsTab }");
if (!code.includes("import { SuppliersTab }")) code = code.replace(/import \{ SettingsTab \}/, "import { SuppliersTab } from '../components/dashboard/SuppliersTab';\nimport { SettingsTab }");
if (!code.includes("import { DebtsTab }")) code = code.replace(/import \{ SettingsTab \}/, "import { DebtsTab } from '../components/dashboard/DebtsTab';\nimport { SettingsTab }");
if (!code.includes("import { CrmTab }")) code = code.replace(/import \{ SettingsTab \}/, "import { CrmTab } from '../components/dashboard/CrmTab';\nimport { SettingsTab }");

fs.writeFileSync('src/pages/Dashboard.tsx', code);
