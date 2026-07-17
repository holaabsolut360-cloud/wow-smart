const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');

const trialBlock = `        {company?.subscriptionStatus === 'Prueba Gratuita' && new Date(company.subscriptionEndsAt) < new Date() && (
          <div className="bg-amber-50 border-b border-amber-200 p-4 text-center">
            <h3 className="text-amber-800 font-bold flex justify-center items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              Tu prueba gratuita ha finalizado
            </h3>
            <p className="text-amber-600 text-sm mt-1">
              Para seguir utilizando todas las funcionalidades, por favor suscríbete al plan Emprendedor.
            </p>
            <Link to="/checkout/emprendedor" className="inline-block mt-3 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-lg transition-colors">
              Suscribirme ahora
            </Link>
          </div>
        )}

        {company?.subscriptionStatus === 'Prueba Gratuita' && new Date(company.subscriptionEndsAt) >= new Date() && (
          <div className="bg-indigo-50 border-b border-indigo-200 p-4 text-center">
            <h3 className="text-indigo-800 font-bold flex justify-center items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              Estás en el período de Prueba Gratuita (Vence: {new Date(company.subscriptionEndsAt).toLocaleDateString()})
            </h3>
            <Link to="/checkout/emprendedor" className="inline-block mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition-colors">
              Suscribirme ahora
            </Link>
          </div>
        )}`;

code = code.replace(/\{company\?\.subscriptionStatus === 'Suspendida' && \(/, trialBlock + "\n\n        {company?.subscriptionStatus === 'Suspendida' && (");

fs.writeFileSync('src/pages/Dashboard.tsx', code);
