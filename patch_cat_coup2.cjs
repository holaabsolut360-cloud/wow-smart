const fs = require('fs');
let catCode = fs.readFileSync('src/components/dashboard/CategoriesTab.tsx', 'utf-8');
if (!catCode.includes("const updateCompanyMutation")) {
  catCode = catCode.replace(/export function CategoriesTab/g, `import { useMutation, useQueryClient } from '@tanstack/react-query';\nimport { apiClient } from '../../services/api';\n\nexport function CategoriesTab`);
  catCode = catCode.replace(/return \(/, `const queryClient = useQueryClient();
  const updateCompanyMutation = useMutation({
    mutationFn: (company: any) => apiClient.post('/api/companies/' + company.id, company),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['company'] })
  });
  return (`);
}
fs.writeFileSync('src/components/dashboard/CategoriesTab.tsx', catCode);

let coupCode = fs.readFileSync('src/components/dashboard/CouponsTab.tsx', 'utf-8');
if (!coupCode.includes("const updateCompanyMutation")) {
  coupCode = coupCode.replace(/export function CouponsTab/g, `import { useMutation, useQueryClient } from '@tanstack/react-query';\nimport { apiClient } from '../../services/api';\n\nexport function CouponsTab`);
  coupCode = coupCode.replace(/return \(/, `const queryClient = useQueryClient();
  const updateCompanyMutation = useMutation({
    mutationFn: (company: any) => apiClient.post('/api/companies/' + company.id, company),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['company'] })
  });
  return (`);
}
fs.writeFileSync('src/components/dashboard/CouponsTab.tsx', coupCode);
