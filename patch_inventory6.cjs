const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/InventoryTab.tsx', 'utf-8');

code = code.replace(/exportToCSV\(products as any\[\], "Inventario"\)/g, 'exportToCSV("Inventario", products)');
code = code.replace(/exportToCSV\(inventoryMovements as any\[\], "movimientos"\)/g, 'exportToCSV("movimientos", inventoryMovements as any[])');

fs.writeFileSync('src/components/dashboard/InventoryTab.tsx', code);
