const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/InventoryTab.tsx', 'utf-8');

code = code.replace(/exportToCSV\(products, 'Inventario'\)/, 'exportToCSV(products as any[], "Inventario")');

fs.writeFileSync('src/components/dashboard/InventoryTab.tsx', code);
