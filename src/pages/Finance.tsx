import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, TrendingUp, TrendingDown, Wallet, DollarSign, Trash2, Pencil, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, startOfMonth, endOfMonth, subMonths, addMonths, eachDayOfInterval, isSameMonth, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useFinance } from "@/hooks/useFinance";
import { TransactionDialog, type Transaction } from "@/components/finance/TransactionDialog";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

type Tab = "overview" | "transactions";

const Finance = () => {
  const navigate = useNavigate();
  const { transactions, categories, loading, addTransaction, updateTransaction, deleteTransaction } = useFinance();
  const [tab, setTab] = useState<Tab>("overview");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const monthLabel = format(currentMonth, "MMMM yyyy", { locale: ptBR });

  // Filter transactions for current month
  const monthTxs = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return transactions.filter(t => {
      const d = parseISO(t.transaction_date);
      return d >= start && d <= end;
    });
  }, [transactions, currentMonth]);

  const receitas = monthTxs.filter(t => t.type === "receita").reduce((s, t) => s + t.amount, 0);
  const despesas = monthTxs.filter(t => t.type === "despesa").reduce((s, t) => s + t.amount, 0);
  const saldo = receitas - despesas;

  // Chart data: daily cumulative balance
  const chartData = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    let cumulative = 0;
    return days.map(day => {
      const dayStr = format(day, "yyyy-MM-dd");
      const dayTxs = monthTxs.filter(t => t.transaction_date === dayStr);
      dayTxs.forEach(t => { cumulative += t.type === "receita" ? t.amount : -t.amount; });
      return { date: format(day, "dd/MM"), saldo: cumulative };
    });
  }, [monthTxs, currentMonth]);

  // Pie chart: expenses by category
  const categoryData = useMemo(() => {
    const map: Record<string, { name: string; value: number; color: string }> = {};
    monthTxs.filter(t => t.type === "despesa").forEach(t => {
      const cat = categories.find(c => c.id === t.category_id);
      const key = cat?.id || "sem-categoria";
      if (!map[key]) map[key] = { name: cat?.name || "Sem categoria", value: 0, color: cat?.color || "#64748b" };
      map[key].value += t.amount;
    });
    return Object.values(map).sort((a, b) => b.value - a.value);
  }, [monthTxs, categories]);

  const formatCurrency = (val: number) =>
    val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const handleSave = (data: Omit<Transaction, "id" | "category_name">) => {
    if (editingTx) {
      updateTransaction(editingTx.id, data);
    } else {
      addTransaction(data);
    }
    setEditingTx(null);
  };

  const openNew = () => { setEditingTx(null); setDialogOpen(true); };
  const openEdit = (tx: Transaction) => { setEditingTx(tx); setDialogOpen(true); };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="font-mono text-muted-foreground text-sm animate-pulse">carregando...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-primary" />
              <span className="font-mono text-sm text-foreground">financeiro.tsx</span>
            </div>
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-mono hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Nova
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Tabs */}
        <div className="flex items-center gap-1 bg-card/50 rounded-xl p-1 w-fit border border-border/30">
          {[
            { id: "overview" as Tab, label: "Visão Geral" },
            { id: "transactions" as Tab, label: "Transações" },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-mono transition-all",
                tab === t.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Month nav */}
        <div className="flex items-center justify-center gap-4">
          <button onClick={() => setCurrentMonth(p => subMonths(p, 1))} className="text-muted-foreground hover:text-foreground transition-colors p-1">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="font-mono text-sm capitalize text-foreground">{monthLabel}</span>
          <button onClick={() => setCurrentMonth(p => addMonths(p, 1))} className="text-muted-foreground hover:text-foreground transition-colors p-1 rotate-180">
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        {tab === "overview" ? (
          <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border/30 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Saldo Total</span>
                  <Wallet className="w-4 h-4 text-primary" />
                </div>
                <span className={cn("text-2xl font-mono font-bold", saldo >= 0 ? "text-success" : "text-destructive")}>
                  {formatCurrency(saldo)}
                </span>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                className="bg-card border border-border/30 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono text-success uppercase tracking-wider">Receitas</span>
                  <ArrowUpRight className="w-4 h-4 text-success" />
                </div>
                <span className="text-2xl font-mono font-bold text-foreground">{formatCurrency(receitas)}</span>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="bg-card border border-border/30 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono text-destructive uppercase tracking-wider">Despesas</span>
                  <ArrowDownLeft className="w-4 h-4 text-destructive" />
                </div>
                <span className="text-2xl font-mono font-bold text-foreground">{formatCurrency(despesas)}</span>
              </motion.div>
            </div>

            {/* Balance evolution chart */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="bg-card border border-border/30 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-mono text-sm text-foreground font-medium">Evolução do Saldo</h3>
                  <p className="text-xs font-mono text-muted-foreground capitalize">{monthLabel}</p>
                </div>
                <span className={cn("text-lg font-mono font-bold", saldo >= 0 ? "text-success" : "text-destructive")}>
                  {formatCurrency(saldo)}
                </span>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="saldoGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} width={50} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontFamily: "JetBrains Mono", fontSize: 12 }}
                      formatter={(v: number) => [formatCurrency(v), "Saldo"]}
                    />
                    <Area type="monotone" dataKey="saldo" stroke="hsl(var(--success))" strokeWidth={2} fill="url(#saldoGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Bottom: Recent transactions + Category pie */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Recent transactions */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="bg-card border border-border/30 rounded-xl p-5">
                <h3 className="font-mono text-sm text-foreground font-medium mb-1">Transações Recentes</h3>
                <p className="text-xs font-mono text-muted-foreground mb-4 capitalize">{format(currentMonth, "MMMM", { locale: ptBR })}</p>
                <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-hidden">
                  {monthTxs.slice(0, 8).map(tx => (
                    <div key={tx.id} className="flex items-center gap-3">
                      <span className={cn("w-2 h-2 rounded-full shrink-0", tx.type === "receita" ? "bg-success" : "bg-destructive")} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-mono text-foreground truncate">{tx.description}</p>
                        <p className="text-[10px] font-mono text-muted-foreground">
                          {tx.category_name || "Sem categoria"} · {format(parseISO(tx.transaction_date), "dd 'de' MMM", { locale: ptBR })}
                        </p>
                      </div>
                      <span className={cn("text-xs font-mono font-medium shrink-0", tx.type === "receita" ? "text-success" : "text-destructive")}>
                        {tx.type === "receita" ? "+" : "-"} {formatCurrency(tx.amount)}
                      </span>
                    </div>
                  ))}
                  {monthTxs.length === 0 && (
                    <p className="text-xs font-mono text-muted-foreground text-center py-8">Nenhuma transação neste mês</p>
                  )}
                </div>
              </motion.div>

              {/* Category pie */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                className="bg-card border border-border/30 rounded-xl p-5">
                <h3 className="font-mono text-sm text-foreground font-medium mb-1">Despesas por Categoria</h3>
                <p className="text-xs font-mono text-muted-foreground mb-4 capitalize">{format(currentMonth, "MMMM", { locale: ptBR })}</p>
                {categoryData.length > 0 ? (
                  <div className="flex items-center gap-4">
                    <div className="w-32 h-32">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={categoryData} dataKey="value" cx="50%" cy="50%" innerRadius={30} outerRadius={55} paddingAngle={2}>
                            {categoryData.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 space-y-2">
                      {categoryData.map((c, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color }} />
                            <span className="text-xs font-mono text-muted-foreground">{c.name}</span>
                          </div>
                          <span className="text-xs font-mono text-foreground">{formatCurrency(c.value)}</span>
                        </div>
                      ))}
                      <div className="border-t border-border/30 pt-2 mt-2 flex items-center justify-between">
                        <span className="text-xs font-mono text-muted-foreground">Total</span>
                        <span className="text-xs font-mono font-medium text-destructive">{formatCurrency(despesas)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs font-mono text-muted-foreground text-center py-8">Sem despesas neste mês</p>
                )}
              </motion.div>
            </div>
          </div>
        ) : (
          /* Transactions tab */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-mono text-sm text-foreground">Transações</h2>
            </div>

            {/* Table */}
            <div className="bg-card border border-border/30 rounded-xl overflow-hidden">
              <div className="grid grid-cols-[100px_1fr_120px_100px_100px_60px] gap-2 px-4 py-3 border-b border-border/30 text-xs font-mono text-muted-foreground uppercase">
                <span>Data</span>
                <span>Descrição</span>
                <span>Categoria</span>
                <span>Pagamento</span>
                <span className="text-right">Valor</span>
                <span></span>
              </div>
              <div className="divide-y divide-border/20 max-h-[500px] overflow-y-auto scrollbar-hidden">
                {monthTxs.map(tx => (
                  <div key={tx.id} className="grid grid-cols-[100px_1fr_120px_100px_100px_60px] gap-2 px-4 py-3 items-center hover:bg-muted/20 transition-colors group">
                    <span className="text-xs font-mono text-muted-foreground">
                      {format(parseISO(tx.transaction_date), "dd/MM/yyyy")}
                    </span>
                    <span className="text-xs font-mono text-foreground truncate">{tx.description}</span>
                    <div className="flex items-center gap-1.5">
                      {tx.category_id && (
                        <span className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: categories.find(c => c.id === tx.category_id)?.color }} />
                      )}
                      <span className="text-xs font-mono text-muted-foreground truncate">{tx.category_name || "—"}</span>
                    </div>
                    <span className="text-xs font-mono text-muted-foreground capitalize">{tx.payment_method}</span>
                    <span className={cn("text-xs font-mono font-medium text-right",
                      tx.type === "receita" ? "text-success" : "text-destructive")}>
                      {tx.type === "receita" ? "+" : "-"} {formatCurrency(tx.amount)}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(tx)} className="p-1 hover:bg-muted/30 rounded">
                        <Pencil className="w-3 h-3 text-muted-foreground" />
                      </button>
                      <button onClick={() => deleteTransaction(tx.id)} className="p-1 hover:bg-destructive/10 rounded">
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </button>
                    </div>
                  </div>
                ))}
                {monthTxs.length === 0 && (
                  <div className="py-16 text-center">
                    <DollarSign className="w-8 h-8 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-sm font-mono text-muted-foreground">Nenhuma transação</p>
                    <p className="text-xs font-mono text-muted-foreground/50">Registre sua primeira receita ou despesa.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <TransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        transaction={editingTx}
        categories={categories}
        onSave={handleSave}
      />
    </div>
  );
};

export default Finance;
