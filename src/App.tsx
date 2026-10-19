import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

import Landing from "./pages/Landing";
import { lazy, Suspense } from "react";
import { useLocation } from "react-router-dom";
import { initAnalytics, trackPageView } from "./lib/analytics";
// Code splitting: solo la portada viaja en el paquete inicial; el resto se descarga al entrar.
const ProtectedRoute = lazy(() => import("./components/ProtectedRoute"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Catalog = lazy(() => import("./pages/Catalog"));
const SuperAdmin = lazy(() => import("./pages/SuperAdmin"));
const Auth = lazy(() => import("./pages/Auth"));
const Checkout = lazy(() => import("./pages/Checkout"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const LegalNotice = lazy(() => import("./pages/LegalNotice"));
const CookiesPolicy = lazy(() => import("./pages/CookiesPolicy"));
const ComplaintsBook = lazy(() => import("./pages/ComplaintsBook"));
const Terms = lazy(() => import("./pages/Terms"));
const NotFound = lazy(() => import("./pages/NotFound"));
const MisPuntos = lazy(() => import("./pages/MisPuntos"));
initAnalytics();
const PageViews = () => {
  const loc = useLocation();
  useEffect(() => { trackPageView(loc.pathname + loc.search); }, [loc.pathname, loc.search]);
  return null;
};
const Loading = () => <div className="min-h-screen flex items-center justify-center" role="status" aria-label="Cargando"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div></div>;
import WhatsAppButton from "./components/WhatsAppButton";

const queryClient = new QueryClient();
export default function App() {

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
      <PageViews />
      <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/checkout/:planId" element={<Checkout />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/terminos" element={<Terms />} />
        <Route path="/privacidad" element={<PrivacyPolicy />} />
        <Route path="/legal" element={<LegalNotice />} />
        <Route path="/cookies" element={<CookiesPolicy />} />
        <Route path="/reclamaciones" element={<ComplaintsBook />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/c/:slug" element={<Catalog />} />
        <Route path="/c/:slug/mis-puntos" element={<MisPuntos />} />
        <Route path="/superadmin" element={<ProtectedRoute><SuperAdmin /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
      <WhatsAppButton />
    </BrowserRouter>
    </QueryClientProvider>
  );
}
