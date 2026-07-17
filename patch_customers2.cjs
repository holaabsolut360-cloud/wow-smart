const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/CustomersTab.tsx', 'utf-8');
if (!code.includes("const deleteCustomerMutation")) {
  code = code.replace(/const customers = customersData/g, `const queryClient = useQueryClient();
  const deleteCustomerMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete('/api/customers/' + id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customers'] })
  });
  const customers = customersData`);
}
fs.writeFileSync('src/components/dashboard/CustomersTab.tsx', code);
