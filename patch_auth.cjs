const fs = require('fs');
let code = fs.readFileSync('src/pages/Auth.tsx', 'utf-8');

const onboardingForm = `                <form onSubmit={async (e) => {
                  e.preventDefault();
                  setIsLoading(true);
                  try {
                    const isTrial = new URLSearchParams(window.location.search).get('trial') === 'true';
                    const session = await supabase.auth.getSession();
                    if (session.data.session) {
                      await fetch('/api/onboarding', {
                        method: 'POST',
                        headers: { 
                          'Content-Type': 'application/json',
                          'Authorization': 'Bearer ' + session.data.session.access_token
                        },
                        body: JSON.stringify({ name: companyName, isTrial })
                      });
                    }
                    navigate('/dashboard');
                  } catch(e) {
                    alert('Error creating company');
                  } finally {
                    setIsLoading(false);
                  }
                }} className="space-y-6">`;

code = code.replace(/<form onSubmit=\{\(e\) => \{\s*e\.preventDefault\(\);\s*setIsLoading\(true\);\s*setTimeout\(\(\) => \{\s*setIsLoading\(false\);\s*navigate\('\/dashboard'\);\s*\}, 1000\);\s*\}\} className="space-y-6">/, onboardingForm);
fs.writeFileSync('src/pages/Auth.tsx', code);
