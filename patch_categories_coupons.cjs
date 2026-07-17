const fs = require('fs');

let settingsCode = fs.readFileSync('src/components/dashboard/SettingsTab.tsx', 'utf-8');
settingsCode = settingsCode.replace(/onSubmit=\{handleSaveSettings\}/g, "onSubmit={() => {}}");
fs.writeFileSync('src/components/dashboard/SettingsTab.tsx', settingsCode);

let catCode = fs.readFileSync('src/components/dashboard/CategoriesTab.tsx', 'utf-8');
catCode = catCode.replace(/onClick=\{handleSaveSettings\}/g, "onClick={() => updateCompanyMutation.mutate(company)}");
fs.writeFileSync('src/components/dashboard/CategoriesTab.tsx', catCode);

let coupCode = fs.readFileSync('src/components/dashboard/CouponsTab.tsx', 'utf-8');
coupCode = coupCode.replace(/onClick=\{handleSaveSettings\}/g, "onClick={() => updateCompanyMutation.mutate(company)}");
fs.writeFileSync('src/components/dashboard/CouponsTab.tsx', coupCode);
