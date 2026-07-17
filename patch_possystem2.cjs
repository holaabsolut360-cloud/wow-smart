const fs = require('fs');
let code = fs.readFileSync('src/components/PosSystem.tsx', 'utf-8');

// move selectedCategory up
code = code.replace(/const \[selectedCategory, setSelectedCategory\] = useState<string>\(''\);/, '');
code = code.replace(/const queryClient = useQueryClient\(\);/, 'const queryClient = useQueryClient();\n  const [selectedCategory, setSelectedCategory] = useState<string>(\'\');');

// replace setOrders
code = code.replace(/setOrders\(prev => \[savedOrder, \.\.\.prev\]\);/g, "queryClient.invalidateQueries({ queryKey: ['orders'] });");
code = code.replace(/setProducts\(\[...updatedProducts\]\);/g, "queryClient.invalidateQueries({ queryKey: ['products'] });");
code = code.replace(/setCustomers\(prev => \[savedCustomer, \.\.\.prev\]\);/g, "queryClient.invalidateQueries({ queryKey: ['customers'] });");

fs.writeFileSync('src/components/PosSystem.tsx', code);
