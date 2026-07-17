const fs = require('fs');
let code = fs.readFileSync('src/pages/Checkout.tsx', 'utf-8');

code = code.replace(/const handleGoogleRegister = \(\) => \{[\s\S]*?\}, 1500\);\n  \};/, `const handleGoogleRegister = async () => {
    setGoogleLoading(true);
    
    if (!formData.businessName) {
      alert("Por favor ingresa el nombre de tu negocio primero antes de usar Google.");
      setGoogleLoading(false);
      return;
    }
    
    const pendingPayments = JSON.parse(localStorage.getItem('pendingPayments') || '[]');
    pendingPayments.push({
      id: Date.now().toString(),
      businessName: formData.businessName,
      plan: selectedPlan.name,
      amount: selectedPlan.price,
      method: paymentMethod,
      date: new Date().toISOString()
    });
    localStorage.setItem('pendingPayments', JSON.stringify(pendingPayments));

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/dashboard'
        }
      });
      if (error) throw error;
    } catch (err: any) {
      alert(err.message || 'Error con Google Auth');
    } finally {
      setGoogleLoading(false);
    }
  };`);

fs.writeFileSync('src/pages/Checkout.tsx', code);
