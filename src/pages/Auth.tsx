import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LogIn, UserPlus, Hash, User, Lock, Terminal, ChevronRight } from "lucide-react";
import { PixelIndieCharacter } from "@/components/PixelIndieCharacter";

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");

  // Login
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupUsername, setSignupUsername] = useState("");
  const [signupDiscordId, setSignupDiscordId] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername.trim()) return;
    setLoading(true);
    try {
      // Lookup email by username from profiles
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("email")
        .eq("username", loginUsername.trim())
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile?.email) {
        toast.error("Usuário não encontrado");
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: loginPassword,
      });
      if (error) throw error;
      setLoginSuccess(true);
      toast.success("Login realizado!");
      setTimeout(() => navigate("/"), 1500);
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupUsername.trim()) {
      toast.error("Username é obrigatório");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            username: signupUsername,
            discord_id: signupDiscordId || undefined,
          },
        },
      });
      if (error) throw error;
      toast.success("Conta criada! Verifique seu email para confirmar.");
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Ambient glow effects */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-5xl mx-auto px-4 flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
        {/* Left side — character + branding */}
        <div className="flex-1 flex flex-col items-center lg:items-end text-center lg:text-right">
          <PixelIndieCharacter onLogin={loginSuccess} />
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground font-['Space_Grotesk'] mt-4">
            Layla<span className="text-primary">.dev</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-2 font-['JetBrains_Mono'] max-w-xs">
            <span className="text-primary/70">$</span> seu painel de produtividade
          </p>
        </div>

        {/* Right side — terminal-style login */}
        <div className="flex-1 w-full max-w-md">
          {/* Terminal window chrome */}
          <div className="rounded-xl border border-border/60 bg-card/90 backdrop-blur-md shadow-2xl shadow-primary/5 overflow-hidden">
            {/* Title bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 bg-secondary/30">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-destructive/70" />
                <div className="w-3 h-3 rounded-full bg-primary/50" />
                <div className="w-3 h-3 rounded-full bg-success/50" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="flex bg-muted/50 rounded-md overflow-hidden text-xs font-['JetBrains_Mono']">
                  <button
                    onClick={() => setMode("login")}
                    className={`px-4 py-1.5 transition-colors ${
                      mode === "login"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    login.ts
                  </button>
                  <button
                    onClick={() => setMode("signup")}
                    className={`px-4 py-1.5 transition-colors ${
                      mode === "signup"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    signup.ts
                  </button>
                </div>
              </div>
              <Terminal className="h-4 w-4 text-muted-foreground" />
            </div>

            {/* Form body */}
            <div className="p-6">
              {mode === "login" ? (
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="text-xs font-['JetBrains_Mono'] text-muted-foreground mb-4">
                    <span className="text-primary/60">// </span>entre com suas credenciais
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-['JetBrains_Mono'] text-muted-foreground">
                      <span className="text-accent">const</span> username
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="seu_username"
                        value={loginUsername}
                        onChange={(e) => setLoginUsername(e.target.value)}
                        className="pl-10 bg-muted/30 border-border/40 font-['JetBrains_Mono'] text-sm focus:border-primary focus:ring-primary/20"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-['JetBrains_Mono'] text-muted-foreground">
                      <span className="text-accent">const</span> password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="pl-10 bg-muted/30 border-border/40 font-['JetBrains_Mono'] text-sm focus:border-primary focus:ring-primary/20"
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full gap-2 font-['JetBrains_Mono'] text-sm" disabled={loading}>
                    {loading ? (
                      <span className="animate-pulse">autenticando...</span>
                    ) : (
                      <>
                        <ChevronRight className="h-4 w-4" />
                        auth.login()
                      </>
                    )}
                  </Button>

                  <p className="text-center text-xs text-muted-foreground font-['JetBrains_Mono']">
                    <span className="text-primary/50">// </span>
                    não tem conta?{" "}
                    <button type="button" onClick={() => setMode("signup")} className="text-primary hover:underline">
                      criar conta
                    </button>
                  </p>
                </form>
              ) : (
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="text-xs font-['JetBrains_Mono'] text-muted-foreground mb-4">
                    <span className="text-primary/60">// </span>crie sua conta
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-['JetBrains_Mono'] text-muted-foreground">
                      <span className="text-accent">const</span> username <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="seu_username"
                        value={signupUsername}
                        onChange={(e) => setSignupUsername(e.target.value)}
                        className="pl-10 bg-muted/30 border-border/40 font-['JetBrains_Mono'] text-sm focus:border-primary"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-['JetBrains_Mono'] text-muted-foreground">
                      <span className="text-accent">const</span> discordId
                    </Label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="123456789012345678"
                        value={signupDiscordId}
                        onChange={(e) => setSignupDiscordId(e.target.value)}
                        className="pl-10 bg-muted/30 border-border/40 font-['JetBrains_Mono'] text-sm focus:border-primary"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground/60 font-['JetBrains_Mono'] pl-1">
                      Discord → Modo Dev → Copiar ID
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-['JetBrains_Mono'] text-muted-foreground">
                      <span className="text-accent">const</span> email <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">@</span>
                      <Input
                        type="email"
                        placeholder="seu@email.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        className="pl-10 bg-muted/30 border-border/40 font-['JetBrains_Mono'] text-sm focus:border-primary"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-['JetBrains_Mono'] text-muted-foreground">
                      <span className="text-accent">const</span> password <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="password"
                        placeholder="min. 6 caracteres"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        className="pl-10 bg-muted/30 border-border/40 font-['JetBrains_Mono'] text-sm focus:border-primary"
                        minLength={6}
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full gap-2 font-['JetBrains_Mono'] text-sm" disabled={loading}>
                    {loading ? (
                      <span className="animate-pulse">criando...</span>
                    ) : (
                      <>
                        <ChevronRight className="h-4 w-4" />
                        auth.signUp()
                      </>
                    )}
                  </Button>

                  <p className="text-center text-xs text-muted-foreground font-['JetBrains_Mono']">
                    <span className="text-primary/50">// </span>
                    já tem conta?{" "}
                    <button type="button" onClick={() => setMode("login")} className="text-primary hover:underline">
                      fazer login
                    </button>
                  </p>
                </form>
              )}
            </div>

            {/* Status bar */}
            <div className="flex items-center justify-between px-4 py-1.5 border-t border-border/30 bg-secondary/20 text-[10px] font-['JetBrains_Mono'] text-muted-foreground/50">
              <span>UTF-8</span>
              <span>TypeScript</span>
              <span>Ln 1, Col 1</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
