const fs = require('fs');

let productsCode = fs.readFileSync('src/components/dashboard/ProductsTab.tsx', 'utf-8');
productsCode = productsCode.replace(/setProducts\(/g, "queryClient.invalidateQueries({ queryKey: ['products'] }); //");
fs.writeFileSync('src/components/dashboard/ProductsTab.tsx', productsCode);

let ordersCode = fs.readFileSync('src/components/dashboard/OrdersTab.tsx', 'utf-8');
ordersCode = ordersCode.replace(/setOrders\(orders.map\(o => o.id === order.id \? \{\.\.\.o, status: newStatus\} : o\)\);/g, "queryClient.invalidateQueries({ queryKey: ['orders'] });");
fs.writeFileSync('src/components/dashboard/OrdersTab.tsx', ordersCode);
