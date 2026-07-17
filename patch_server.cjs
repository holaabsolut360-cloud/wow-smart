const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const onboardingEndpoint = `
  app.post("/api/onboarding", (req, res) => {
    let user = req.user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    
    const { name, isTrial } = req.body;
    
    const trialDays = 15;
    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + trialDays);
    
    const company = {
      id: Date.now().toString(),
      userId: user.id,
      name: name || "Mi Nueva Empresa",
      slug: (name || "mi-empresa").toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now(),
      plan: isTrial ? "Emprendedor" : "pro",
      subscriptionStatus: isTrial ? "Prueba Gratuita" : "Activa",
      subscriptionEndsAt: isTrial ? endsAt.toISOString().split('T')[0] : "2026-08-15",
      businessType: "Restaurante",
      color: "#8b5cf6",
      whatsapp: "",
      logo: "",
      banner: "",
      instagram: "",
      facebook: "",
      currency: "S/"
    };
    db.companies.push(company);
    res.json(company);
  });

  // Get dashboard data for user`;

code = code.replace(/\/\/ Get dashboard data for user/, onboardingEndpoint);
fs.writeFileSync('server.ts', code);
