import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div></div>;
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Catalog from "./pages/Catalog";
import SuperAdmin from "./pages/SuperAdmin";
import Auth from "./pages/Auth";
import Checkout from "./pages/Checkout";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import LegalNotice from "./pages/LegalNotice";
import CookiesPolicy from "./pages/CookiesPolicy";
import ComplaintsBook from "./pages/ComplaintsBook";

const queryClient = new QueryClient();
export default function App() {

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/checkout/:planId" element={<Checkout />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/privacidad" element={<PrivacyPolicy />} />
        <Route path="/legal" element={<LegalNotice />} />
        <Route path="/cookies" element={<CookiesPolicy />} />
        <Route path="/reclamaciones" element={<ComplaintsBook />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/c/:slug" element={<Catalog />} />
        <Route path="/superadmin" element={<ProtectedRoute><SuperAdmin /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
    </QueryClientProvider>
  );
}
