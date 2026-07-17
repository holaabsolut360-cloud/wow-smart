const fs = require('fs');
let code = fs.readFileSync('src/pages/Landing.tsx', 'utf-8');
code = code.replace(/<Link to="\/checkout\/emprendedor" className="bg-indigo-600 text-white px-5 py-2.5 rounded-full hover:bg-indigo-700 transition-colors shadow-sm">/, '<Link to="/auth?mode=register&trial=true" className="bg-indigo-600 text-white px-5 py-2.5 rounded-full hover:bg-indigo-700 transition-colors shadow-sm">');
fs.writeFileSync('src/pages/Landing.tsx', code);
