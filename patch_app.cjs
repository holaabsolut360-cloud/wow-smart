const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(/import Checkout from "\.\/pages\/Checkout";/, 'import Checkout from "./pages/Checkout";\nimport PrivacyPolicy from "./pages/PrivacyPolicy";');

code = code.replace(/<Route path="\/checkout" element=\{<Checkout \/>\} \/>/, '<Route path="/checkout" element={<Checkout />} />\n        <Route path="/privacidad" element={<PrivacyPolicy />} />');

fs.writeFileSync('src/App.tsx', code);
