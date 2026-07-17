const fs = require('fs');
let code = fs.readFileSync('src/components/PosSystem.tsx', 'utf-8');

code = code.replace(/setProducts\([^;]+;/g, "queryClient.invalidateQueries({ queryKey: ['products'] });");
code = code.replace(/setCustomers\([^;]+;/g, "queryClient.invalidateQueries({ queryKey: ['customers'] });");
code = code.replace(/setOrders\([^;]+;/g, "queryClient.invalidateQueries({ queryKey: ['orders'] });");

fs.writeFileSync('src/components/PosSystem.tsx', code);
