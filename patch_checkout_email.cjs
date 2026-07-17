const fs = require('fs');
let code = fs.readFileSync('src/pages/Checkout.tsx', 'utf-8');

code = code.replace(/businessName: formData.businessName,/g, 'businessName: formData.businessName,\n        email: formData.email || "cliente@ejemplo.com",');

fs.writeFileSync('src/pages/Checkout.tsx', code);
