const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  /import PrivacyPolicy from "\.\/pages\/PrivacyPolicy";/,
  'import PrivacyPolicy from "./pages/PrivacyPolicy";\nimport LegalNotice from "./pages/LegalNotice";\nimport CookiesPolicy from "./pages/CookiesPolicy";\nimport ComplaintsBook from "./pages/ComplaintsBook";'
);

code = code.replace(
  /<Route path="\/privacidad" element=\{<PrivacyPolicy \/>\} \/>/,
  '<Route path="/privacidad" element={<PrivacyPolicy />} />\n        <Route path="/legal" element={<LegalNotice />} />\n        <Route path="/cookies" element={<CookiesPolicy />} />\n        <Route path="/reclamaciones" element={<ComplaintsBook />} />'
);

fs.writeFileSync('src/App.tsx', code);
