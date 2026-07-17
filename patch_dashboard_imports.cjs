const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');
if (!code.includes("SecurityTab")) {
  code = code.replace(/import \{ SettingsTab \} from "\.\.\/components\/dashboard\/SettingsTab";/, 
    'import { SettingsTab } from "../components/dashboard/SettingsTab";\nimport { SecurityTab } from "../components/dashboard/SecurityTab";');
}
fs.writeFileSync('src/pages/Dashboard.tsx', code);
