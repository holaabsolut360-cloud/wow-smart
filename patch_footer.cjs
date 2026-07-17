const fs = require('fs');

let code = fs.readFileSync('src/pages/Landing.tsx', 'utf-8');

code = code.replace(/import \{ CheckCircle, LayoutDashboard, ShoppingBag, Zap, ShoppingCart, ChevronDown \} from "lucide-react";/, 'import { CheckCircle, LayoutDashboard, ShoppingBag, Zap, ShoppingCart, ChevronDown, Phone, Mail, MapPin } from "lucide-react";');

const oldFooter = `{/* Trust Footer */}
      <footer className="h-24 bg-white border-t border-slate-200 flex flex-wrap items-center justify-center gap-6 px-10 flex-shrink-0">
        <span className="text-sm font-bold tracking-widest uppercase opacity-40 grayscale">Trusted by:</span>
        <div className="flex gap-8 items-center opacity-40 grayscale">
          <span className="text-lg font-black italic">MODA_STARE</span>
          <span className="text-lg font-black">TECH-CORP</span>
          <span className="text-lg font-black tracking-tighter">HOME&GARDEN</span>
        </div>
      </footer>`;

const newFooter = `{/* Footer */}
      <footer className="bg-[#0b0014] text-slate-300 py-12 px-6 md:px-10 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-center md:justify-around gap-10">
          <div>
            <h3 className="text-fuchsia-500 font-bold text-lg mb-4">Enlaces Legales</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="#" className="hover:text-fuchsia-400 transition-colors">Política de Privacidad</Link></li>
              <li><Link to="#" className="hover:text-fuchsia-400 transition-colors">Aviso Legal</Link></li>
              <li><Link to="#" className="hover:text-fuchsia-400 transition-colors">Política de Cookies</Link></li>
              <li><Link to="#" className="hover:text-fuchsia-400 transition-colors">Libro de Reclamaciones</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-fuchsia-500 font-bold text-lg mb-4">Contacto</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400" /> 901 345 791
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" /> Comercial@absolut-360.com
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" /> Perú, Lima
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/10 text-center text-xs text-slate-500">
          Copyright © 2026 ABSOLUT360 WOW SACS | RUC: 20613616978
        </div>
      </footer>`;

code = code.replace(oldFooter, newFooter);

fs.writeFileSync('src/pages/Landing.tsx', code);
