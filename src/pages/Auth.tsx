import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User, Lock, Terminal, ChevronRight, Hash, Zap, Layout, BarChart3, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TYPING_LINES = [
  '> initializing pixel_planner...',
  '> loading modules: [pomodoro, tasks, habits]',
  '> connecting to cloud...',
  '> status: ready ✓',
];

const TypingTerminal = () => {
  const [lines, setLines] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState(0);
  const [currentChar, setCurrentChar] = useState(0);

  useEffect(() => {
    if (currentLine >= TYPING_LINES.length) return;
    const line = TYPING_LINES[currentLine];
    if (currentChar < line.length) {
      const timeout = setTimeout(() => setCurrentChar((c) => c + 1), 30 + Math.random() * 40);
      return () => clearTimeout(timeout);
    } else {
      const timeout = setTimeout(() => {
        setLines((prev) => [...prev, line]);
        setCurrentLine((l) => l + 1);
        setCurrentChar(0);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [currentLine, currentChar]);

  return (
    <div className="font-mono text-xs text-muted-foreground/70 space-y-1">
      {lines.map((line, i) => (
        <div key={i} className={line.includes('✓') ? 'text-primary' : ''}>{line}</div>
      ))}
      {currentLine < TYPING_LINES.length && (
        <div>
          {TYPING_LINES[currentLine].slice(0, currentChar)}
          <span className="animate-cursor text-primary">▌</span>
        </div>
      )}
    </div>
  );
};

const features = [
  { icon: Zap, label: "Pomodoro Timer", desc: "foco em sprints" },
  { icon: Layout, label: "Task Board", desc: "organize seus projetos" },
  { icon: BarChart3, label: "Habit Tracker", desc: "construa rotinas" },
  { icon: Calendar, label: "Daily Planner", desc: "planeje seu dia" },
];

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");

  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [signupPassword, setSignupPassword] = useState("");
  const [signupUsername, setSignupUsername] = useState("");
  const [signupDiscordId, setSignupDiscordId] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername.trim()) return;
    setLoading(true);
    try {
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
      const generatedEmail = `${signupUsername.trim().toLowerCase().replace(/[^a-z0-9]/g, "")}@pixelplanner.app`;
      const { error } = await supabase.auth.signUp({
        email: generatedEmail,
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
      toast.success("Conta criada com sucesso!");
      setMode("login");
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background relative overflow-hidden">
      {/* Ambient glow effects */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/[0.03] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent/[0.04] rounded-full blur-[100px] pointer-events-none" />

      {/* Left side — Branding */}
      <div className="hidden lg:flex flex-1 flex-col justify-center px-16 xl:px-24 relative">
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

        <div className="relative z-10 max-w-lg">
          {/* Version badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-mono mb-8"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            v2.0 — agora com cloud sync
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl xl:text-6xl font-bold font-display tracking-tight"
          >
            Pixel<span className="text-primary">Planner</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-muted-foreground text-lg mt-4 leading-relaxed"
          >
            Seu painel de produtividade com estética dev.
            <br />
            <span className="text-foreground/70">Organize tarefas, crie hábitos e foque no que importa.</span>
          </motion.p>

          {/* Feature grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="grid grid-cols-2 gap-3 mt-10"
          >
            {features.map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.08 }}
                className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border/40 bg-card/40 backdrop-blur-sm group hover:border-primary/30 transition-colors"
              >
                <div className="p-2 rounded-md bg-primary/10 text-primary group-hover:bg-primary/15 transition-colors">
                  <f.icon className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-sm font-medium text-foreground">{f.label}</span>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Mini terminal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-10 p-4 rounded-lg border border-border/30 bg-secondary/20 backdrop-blur-sm"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-destructive/50" />
                <div className="w-2 h-2 rounded-full bg-primary/40" />
                <div className="w-2 h-2 rounded-full bg-accent/40" />
              </div>
              <span className="text-[10px] font-mono text-muted-foreground/40">terminal</span>
            </div>
            <TypingTerminal />
          </motion.div>
        </div>
      </div>

      {/* Right side — Auth card */}
      <div className="flex-1 flex items-center justify-center px-4 lg:px-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* Mobile branding */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-3xl font-bold font-display">
              Pixel<span className="text-primary">Planner</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-2 font-mono">
              <span className="text-primary/70">$</span> seu painel de produtividade
            </p>
          </div>

          {/* Terminal card */}
          <div className="rounded-xl border border-border/60 bg-card/80 backdrop-blur-xl shadow-2xl shadow-primary/5 overflow-hidden animate-glow">
            {/* Title bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 bg-secondary/30">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-destructive/70" />
                <div className="w-3 h-3 rounded-full bg-primary/50" />
                <div className="w-3 h-3 rounded-full bg-accent/50" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="flex bg-muted/50 rounded-md overflow-hidden text-xs font-mono">
                  <button
                    onClick={() => setMode("login")}
                    className={`px-4 py-1.5 transition-all duration-200 ${
                      mode === "login"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    login.ts
                  </button>
                  <button
                    onClick={() => setMode("signup")}
                    className={`px-4 py-1.5 transition-all duration-200 ${
                      mode === "signup"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    signup.ts
                  </button>
                </div>
              </div>
              <Terminal className="h-4 w-4 text-muted-foreground/50" />
            </div>

            {/* Form body */}
            <div className="p-6">
              <AnimatePresence mode="wait">
                {mode === "login" ? (
                  <motion.form
                    key="login"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                    onSubmit={handleLogin}
                    className="space-y-5"
                  >
                    <div className="text-xs font-mono text-muted-foreground mb-4">
                      <span className="text-primary/60">// </span>entre com suas credenciais
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-mono text-muted-foreground">
                        <span className="text-accent">const</span> username
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="seu_username"
                          value={loginUsername}
                          onChange={(e) => setLoginUsername(e.target.value)}
                          className="pl-10 bg-muted/30 border-border/40 font-mono text-sm focus:border-primary focus:ring-primary/20 transition-colors"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-mono text-muted-foreground">
                        <span className="text-accent">const</span> password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="password"
                          placeholder="••••••••"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="pl-10 bg-muted/30 border-border/40 font-mono text-sm focus:border-primary focus:ring-primary/20 transition-colors"
                          required
                        />
                      </div>
                    </div>

                    <Button type="submit" className="w-full gap-2 font-mono text-sm group" disabled={loading}>
                      {loading ? (
                        <span className="animate-pulse">autenticando...</span>
                      ) : (
                        <>
                          <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                          auth.login()
                        </>
                      )}
                    </Button>

                    <p className="text-center text-xs text-muted-foreground font-mono">
                      <span className="text-primary/50">// </span>
                      não tem conta?{" "}
                      <button type="button" onClick={() => setMode("signup")} className="text-primary hover:underline underline-offset-2">
                        criar conta
                      </button>
                    </p>
                  </motion.form>
                ) : (
                  <motion.form
                    key="signup"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    onSubmit={handleSignup}
                    className="space-y-4"
                  >
                    <div className="text-xs font-mono text-muted-foreground mb-4">
                      <span className="text-primary/60">// </span>crie sua conta
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-mono text-muted-foreground">
                        <span className="text-accent">const</span> username <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="seu_username"
                          value={signupUsername}
                          onChange={(e) => setSignupUsername(e.target.value)}
                          className="pl-10 bg-muted/30 border-border/40 font-mono text-sm focus:border-primary transition-colors"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-mono text-muted-foreground">
                        <span className="text-accent">const</span> discordId
                      </Label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="123456789012345678"
                          value={signupDiscordId}
                          onChange={(e) => setSignupDiscordId(e.target.value)}
                          className="pl-10 bg-muted/30 border-border/40 font-mono text-sm focus:border-primary transition-colors"
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground/60 font-mono pl-1">
                        Discord → Modo Dev → Copiar ID
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-mono text-muted-foreground">
                        <span className="text-accent">const</span> password <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="password"
                          placeholder="min. 6 caracteres"
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          className="pl-10 bg-muted/30 border-border/40 font-mono text-sm focus:border-primary transition-colors"
                          minLength={6}
                          required
                        />
                      </div>
                    </div>

                    <Button type="submit" className="w-full gap-2 font-mono text-sm group" disabled={loading}>
                      {loading ? (
                        <span className="animate-pulse">criando...</span>
                      ) : (
                        <>
                          <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                          auth.signUp()
                        </>
                      )}
                    </Button>

                    <p className="text-center text-xs text-muted-foreground font-mono">
                      <span className="text-primary/50">// </span>
                      já tem conta?{" "}
                      <button type="button" onClick={() => setMode("login")} className="text-primary hover:underline underline-offset-2">
                        fazer login
                      </button>
                    </p>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>

            {/* Status bar */}
            <div className="flex items-center justify-between px-4 py-1.5 border-t border-border/30 bg-secondary/20 text-[10px] font-mono text-muted-foreground/40">
              <span>UTF-8</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                  connected
                </span>
                <span>TypeScript</span>
              </div>
              <span>Ln 1, Col 1</span>
            </div>
          </div>

          {/* Bottom text */}
          <p className="text-center text-[10px] text-muted-foreground/30 font-mono mt-4">
            pixel_planner © 2025 — feito com ☕ e código
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
