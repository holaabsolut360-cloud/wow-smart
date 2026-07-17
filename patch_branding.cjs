const fs = require('fs');

function replaceFile(path, replacements) {
  if (!fs.existsSync(path)) return;
  let code = fs.readFileSync(path, 'utf-8');
  for (const [search, replace] of replacements) {
    code = code.replaceAll(search, replace);
  }
  fs.writeFileSync(path, code);
}

// Checkout.tsx
replaceFile('src/pages/Checkout.tsx', [
  ['Catalog<span className="text-indigo-600">Pro</span>', '<img src="/logo.png" alt="WowSmart" className="h-8 object-contain" />'],
  ['CatalogPro SAC', 'WowSmart SAC'],
  ['CatalogPro', 'WowSmart']
]);

// Auth.tsx
replaceFile('src/pages/Auth.tsx', [
  ['Catalog<span className="text-indigo-600">Pro</span>', '<img src="/logo.png" alt="WowSmart" className="h-8 object-contain" />'],
  ['Catalog<span className="text-indigo-400">Pro</span>', '<img src="/logo.png" alt="WowSmart" className="h-8 object-contain brightness-0 invert" />']
]);

// Dashboard.tsx
replaceFile('src/pages/Dashboard.tsx', [
  ['Catalog<span className="text-indigo-600">Pro</span>', '<img src="/logo.png" alt="WowSmart" className="h-8 object-contain" />']
]);

// Landing.tsx
replaceFile('src/pages/Landing.tsx', [
  ['Catalog<span className="text-indigo-600">Pro</span>', '<img src="/logo.png" alt="WowSmart" className="h-8 object-contain" />']
]);

// SuperAdmin.tsx
replaceFile('src/pages/SuperAdmin.tsx', [
  ['CatalogPro SAC', 'WowSmart SAC']
]);

// server.ts
replaceFile('server.ts', [
  ['CatalogPro <onboarding@resend.dev>', 'WowSmart <onboarding@resend.dev>'],
  ['CatalogPro', 'WowSmart']
]);

