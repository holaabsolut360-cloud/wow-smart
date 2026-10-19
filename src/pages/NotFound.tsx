import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-center px-6 font-sans">
      <Logo size="lg" className="mb-8" />
      <p className="text-7xl font-black bg-gradient-to-r from-indigo-600 to-fuchsia-500 bg-clip-text text-transparent">404</p>
      <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-4">Esta página no existe</h1>
      <p className="text-slate-500 mt-3 max-w-md">Puede que el enlace esté mal escrito o que la página se haya movido. Vuelve al inicio para seguir navegando.</p>
      <div className="flex flex-wrap gap-3 justify-center mt-8">
        <Link to="/" className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm">Ir al inicio</Link>
        <Link to="/auth" className="px-6 py-3 rounded-xl border-2 border-slate-200 text-slate-700 font-semibold hover:bg-white">Iniciar sesión</Link>
      </div>
    </div>
  );
}
