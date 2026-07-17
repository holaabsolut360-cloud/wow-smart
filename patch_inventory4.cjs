const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/InventoryTab.tsx', 'utf-8');

code = code.replace(/exportToCSV\(inventoryMovements as any\[\]\);/g, 'exportToCSV(inventoryMovements as any[], "movimientos");');
code = code.replace(/exportToCSV\(inventoryMovements, "movimientos"\);/g, 'exportToCSV(inventoryMovements as any[], "movimientos");');

fs.writeFileSync('src/components/dashboard/InventoryTab.tsx', code);
