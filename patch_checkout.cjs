const fs = require('fs');
let code = fs.readFileSync('src/pages/Checkout.tsx', 'utf-8');

code = code.replace(/const handlePaymentSubmit = \(\) => \{\s*setIsLoading\(true\);\s*setTimeout\(\(\) => \{\s*setIsLoading\(false\);\s*setStep\('register'\);\s*\}, 1500\);\s*\};/, `
  const handlePaymentSubmit = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    setTimeout(() => {
      setIsLoading(false);
      if (user) {
        // Save pending payment for SuperAdmin
        const pendingPayments = JSON.parse(localStorage.getItem('pendingPayments') || '[]');
        pendingPayments.push({
          id: Date.now().toString(),
          businessName: "Tu Empresa",
          email: user.email || "cliente@ejemplo.com",
          plan: selectedPlan.name,
          amount: selectedPlan.price,
          method: paymentMethod,
          date: new Date().toISOString()
        });
        localStorage.setItem('pendingPayments', JSON.stringify(pendingPayments));
        setStep('success');
      } else {
        setStep('register');
      }
    }, 1500);
  };
`);

fs.writeFileSync('src/pages/Checkout.tsx', code);
