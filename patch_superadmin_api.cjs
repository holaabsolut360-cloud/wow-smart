const fs = require('fs');
let code = fs.readFileSync('src/pages/SuperAdmin.tsx', 'utf-8');

const regex = /const handleApprovePayment = \(id: string, payment: any\) => {([\s\S]*?alert\('Pago aprobado\. La suscripción se ha activado y se ha notificado al cliente\.'\);)\n  };/m;

const newFunc = `const handleApprovePayment = async (id: string, payment: any) => {
    const payments = pendingPayments.filter(p => p.id !== id);
    setPendingPayments(payments);
    localStorage.setItem('pendingPayments', JSON.stringify(payments));
    
    const nuevaEmpresa = {
      id: Date.now().toString(),
      nombre: payment.businessName,
      plan: payment.plan,
      estado: 'Activa',
      registro: new Date().toISOString().split('T')[0]
    };
    
    setEmpresas(prev => [nuevaEmpresa, ...prev]);
    
    const vencimiento = new Date();
    vencimiento.setDate(vencimiento.getDate() + 30);
    
    const nuevaSuscripcion = {
      id: Date.now().toString(),
      empresa: payment.businessName,
      plan: payment.plan,
      estado: 'Activa',
      vencimiento: vencimiento.toISOString().split('T')[0],
      precio: payment.amount
    };
    
    setSuscripciones(prev => [nuevaSuscripcion, ...prev]);

    // Llama a la API para enviar correo
    try {
      await fetch('/api/approve-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: payment.email || 'cliente@ejemplo.com',
          businessName: payment.businessName,
          plan: payment.plan,
          amount: payment.amount
        })
      });
    } catch (e) {
      console.error('Error enviando correo', e);
    }
    
    alert('Pago aprobado. La suscripción se ha activado y se ha enviado el comprobante por correo.');
  };`;
  
code = code.replace(regex, newFunc);
fs.writeFileSync('src/pages/SuperAdmin.tsx', code);
