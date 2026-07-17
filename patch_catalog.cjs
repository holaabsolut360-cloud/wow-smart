const fs = require('fs');
let code = fs.readFileSync('src/pages/Catalog.tsx', 'utf-8');
code = code.replace(/queryFn: async \(\{ pageParam = 1 \}\) => \{/, "initialPageParam: 1,\n    queryFn: async ({ pageParam = 1 }) => {");
code = code.replace(/if \(lastPage\.page < lastPage\.totalPages\)/, "if (lastPage && lastPage.page < lastPage.totalPages)");
code = code.replace(/return productsData\.pages\.flatMap\(page => page\.data\);/, "return productsData.pages.flatMap((page: any) => page.data);");
fs.writeFileSync('src/pages/Catalog.tsx', code);
