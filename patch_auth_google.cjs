const fs = require('fs');
let code = fs.readFileSync('src/pages/Auth.tsx', 'utf-8');

code = code.replace(/const handleGoogleLogin = \(\) => \{[\s\S]*?\}, 1500\);\n  \};/, `const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/dashboard'
        }
      });
      if (error) throw error;
    } catch (error: any) {
      alert(error.message || 'Error de autenticación con Google');
    } finally {
      setIsLoading(false);
    }
  };`);

fs.writeFileSync('src/pages/Auth.tsx', code);
