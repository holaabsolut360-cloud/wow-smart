const fs = require('fs');

function replaceFile(path, search, replace) {
  if (!fs.existsSync(path)) return;
  let code = fs.readFileSync(path, 'utf-8');
  code = code.replace(search, replace);
  fs.writeFileSync(path, code);
}

replaceFile('src/pages/Landing.tsx', 
  /<div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">\s*<ShoppingCart className="w-6 h-6 text-white" \/>\s*<\/div>\s*<span className="text-xl font-bold tracking-tight text-slate-800"><img src="\/logo.png" alt="WowSmart" className="h-8 object-contain" \/><\/span>/, 
  '<img src="/logo.png" alt="WowSmart" className="h-10 object-contain" />'
);

replaceFile('src/pages/Auth.tsx', 
  /<div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-600\/20">\s*<ShoppingCart className="w-6 h-6 text-white" \/>\s*<\/div>\s*<span className="text-2xl font-bold tracking-tight text-white"><img src="\/logo.png" alt="WowSmart" className="h-8 object-contain brightness-0 invert" \/><\/span>/, 
  '<img src="/logo.png" alt="WowSmart" className="h-12 object-contain" />'
);

replaceFile('src/pages/Auth.tsx', 
  /<div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">\s*<ShoppingCart className="w-5 h-5 text-white" \/>\s*<\/div>\s*<span className="text-xl font-bold tracking-tight text-slate-800"><img src="\/logo.png" alt="WowSmart" className="h-8 object-contain" \/><\/span>/, 
  '<img src="/logo.png" alt="WowSmart" className="h-8 object-contain" />'
);

replaceFile('src/pages/Dashboard.tsx', 
  /<div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">\s*<Package className="w-4 h-4 text-white" \/>\s*<\/div>\s*<span className="text-xl font-bold tracking-tight text-slate-800"><img src="\/logo.png" alt="WowSmart" className="h-8 object-contain" \/><\/span>/, 
  '<img src="/logo.png" alt="WowSmart" className="h-10 object-contain" />'
);

