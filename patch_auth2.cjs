const fs = require('fs');
let code = fs.readFileSync('src/pages/Auth.tsx', 'utf-8');

code = code.replace(/const \[view, setView\] = useState<AuthView>\('login'\);/, `  const [view, setView] = useState<AuthView>(
    new URLSearchParams(window.location.search).get('mode') === 'register' ? 'register' : 'login'
  );`);

fs.writeFileSync('src/pages/Auth.tsx', code);
