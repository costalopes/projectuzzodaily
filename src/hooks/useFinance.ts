import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Transaction, FinanceCategory } from "@/components/finance/TransactionDialog";

const DEFAULT_CATEGORIES: Omit<FinanceCategory, "id">[] = [
  { name: "Salário", type: "receita", color: "#22c55e" },
  { name: "Freelance", type: "receita", color: "#10b981" },
  { name: "Investimentos", type: "receita", color: "#06b6d4" },
  { name: "Outros (Receita)", type: "receita", color: "#8b5cf6" },
  { name: "Alimentação", type: "despesa", color: "#f97316" },
  { name: "Transporte", type: "despesa", color: "#eab308" },
  { name: "Moradia", type: "despesa", color: "#ef4444" },
  { name: "Lazer", type: "despesa", color: "#a855f7" },
  { name: "Saúde", type: "despesa", color: "#ec4899" },
  { name: "Educação", type: "despesa", color: "#3b82f6" },
  { name: "Assinaturas", type: "despesa", color: "#6366f1" },
  { name: "Outros (Despesa)", type: "despesa", color: "#64748b" },
];

export function useFinance() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Load categories, seed defaults if empty
    let { data: cats } = await supabase
      .from("finance_categories")
      .select("*")
      .eq("user_id", user.id);

    if (!cats || cats.length === 0) {
      const toInsert = DEFAULT_CATEGORIES.map(c => ({ ...c, user_id: user.id }));
      const { data: inserted } = await supabase
        .from("finance_categories")
        .insert(toInsert)
        .select();
      cats = inserted || [];
    }

    setCategories(cats.map(c => ({ id: c.id, name: c.name, type: c.type, color: c.color })));

    // Load transactions
    const { data: txs } = await supabase
      .from("transactions")
      .select("*, finance_categories(name)")
      .eq("user_id", user.id)
      .order("transaction_date", { ascending: false });

    if (txs) {
      setTransactions(txs.map((t: any) => ({
        id: t.id,
        description: t.description,
        amount: Number(t.amount),
        type: t.type as "receita" | "despesa",
        category_id: t.category_id,
        category_name: t.finance_categories?.name || "",
        payment_method: t.payment_method || "pix",
        transaction_date: t.transaction_date,
        is_recurring: t.is_recurring,
        notes: t.notes || "",
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const addTransaction = async (data: Omit<Transaction, "id" | "category_name">) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: inserted, error } = await supabase
      .from("transactions")
      .insert({ ...data, user_id: user.id })
      .select("*, finance_categories(name)")
      .single();
    if (inserted && !error) {
      const tx: Transaction = {
        id: inserted.id,
        description: inserted.description,
        amount: Number(inserted.amount),
        type: inserted.type as "receita" | "despesa",
        category_id: inserted.category_id,
        category_name: (inserted as any).finance_categories?.name || "",
        payment_method: inserted.payment_method || "pix",
        transaction_date: inserted.transaction_date,
        is_recurring: inserted.is_recurring,
        notes: inserted.notes || "",
      };
      setTransactions(p => [tx, ...p]);
    }
  };

  const updateTransaction = async (id: string, data: Omit<Transaction, "id" | "category_name">) => {
    const { data: updated } = await supabase
      .from("transactions")
      .update(data)
      .eq("id", id)
      .select("*, finance_categories(name)")
      .single();
    if (updated) {
      setTransactions(p => p.map(t => t.id === id ? {
        ...t,
        ...data,
        category_name: (updated as any).finance_categories?.name || "",
      } : t));
    }
  };

  const deleteTransaction = async (id: string) => {
    await supabase.from("transactions").delete().eq("id", id);
    setTransactions(p => p.filter(t => t.id !== id));
  };

  return { transactions, categories, loading, addTransaction, updateTransaction, deleteTransaction, reload: loadData };
}
