const fs = require('fs');
let code = fs.readFileSync('src/pages/Checkout.tsx', 'utf-8');

const hookToAdd = `  const [googleLoading, setGoogleLoading] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState({ companyName: "CatalogPro SAC", accountNumber: "999 888 777" });

  React.useEffect(() => {
    const saved = localStorage.getItem('paymentSettings');
    if (saved) {
      try {
        setPaymentSettings(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);`;
  
code = code.replace(/  const \[googleLoading, setGoogleLoading\] = useState\(false\);/, hookToAdd);

const textToReplace = `A nombre de: CatalogPro SAC<br/>Número: 999 888 777`;
const newText = `A nombre de: {paymentSettings.companyName}<br/>Número: {paymentSettings.accountNumber}`;

code = code.replace(textToReplace, newText);

fs.writeFileSync('src/pages/Checkout.tsx', code);
