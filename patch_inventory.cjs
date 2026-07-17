const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/InventoryTab.tsx', 'utf-8');
code = code.replace(/setInventoryMovements\(\[newMovement, \.\.\.inventoryMovements\]\);/g, "queryClient.invalidateQueries({ queryKey: ['inventory'] }); queryClient.invalidateQueries({ queryKey: ['products'] });");
code = code.replace(/addMovementMutation\.mutate\(newMovement\);/g, "addMovementMutation.mutate(newMovement as any);");
fs.writeFileSync('src/components/dashboard/InventoryTab.tsx', code);
