const fs = require('fs');

let code = fs.readFileSync('src/pages/Landing.tsx', 'utf-8');

code = code.replace(
  /<li><Link to="#" className="hover:text-fuchsia-400 transition-colors">Aviso Legal<\/Link><\/li>/,
  '<li><Link to="/legal" className="hover:text-fuchsia-400 transition-colors">Aviso Legal</Link></li>'
);

code = code.replace(
  /<li><Link to="#" className="hover:text-fuchsia-400 transition-colors">Política de Cookies<\/Link><\/li>/,
  '<li><Link to="/cookies" className="hover:text-fuchsia-400 transition-colors">Política de Cookies</Link></li>'
);

code = code.replace(
  /<li><Link to="#" className="hover:text-fuchsia-400 transition-colors">Libro de Reclamaciones<\/Link><\/li>/,
  '<li><Link to="/reclamaciones" className="hover:text-fuchsia-400 transition-colors">Libro de Reclamaciones</Link></li>'
);

fs.writeFileSync('src/pages/Landing.tsx', code);
