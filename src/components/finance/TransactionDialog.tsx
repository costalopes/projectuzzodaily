import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "receita" | "despesa";
  category_id: string | null;
  category_name?: string;
  payment_method: string;
  transaction_date: string;
  is_recurring: boolean;
  notes: string;
}

export interface FinanceCategory {
  id: string;
  name: string;
  type: string;
  color: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: Transaction | null;
  categories: FinanceCategory[];
  onSave: (data: Omit<Transaction, "id" | "category_name">) => void;
}

const PAYMENT_METHODS = [
  { value: "pix", label: "Pix" },
  { value: "credito", label: "Cartão de Crédito" },
  { value: "debito", label: "Cartão de Débito" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "boleto", label: "Boleto" },
  { value: "transferencia", label: "Transferência" },
];

export function TransactionDialog({ open, onOpenChange, transaction, categories, onSave }: Props) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"receita" | "despesa">("despesa");
  const [categoryId, setCategoryId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [date, setDate] = useState<Date>(new Date());
  const [isRecurring, setIsRecurring] = useState(false);

  useEffect(() => {
    if (transaction) {
      setDescription(transaction.description);
      setAmount(String(transaction.amount));
      setType(transaction.type);
      setCategoryId(transaction.category_id || "");
      setPaymentMethod(transaction.payment_method);
      setDate(new Date(transaction.transaction_date));
      setIsRecurring(transaction.is_recurring);
    } else {
      setDescription("");
      setAmount("");
      setType("despesa");
      setCategoryId("");
      setPaymentMethod("pix");
      setDate(new Date());
      setIsRecurring(false);
    }
  }, [transaction, open]);

  const filteredCategories = categories.filter(c => c.type === type);

  const handleSave = () => {
    if (!description.trim() || !amount) return;
    onSave({
      description: description.trim(),
      amount: parseFloat(amount),
      type,
      category_id: categoryId || null,
      payment_method: paymentMethod,
      transaction_date: format(date, "yyyy-MM-dd"),
      is_recurring: isRecurring,
      notes: "",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border font-mono">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm text-foreground">
            {transaction ? "> editar transação" : "> nova transação"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          {/* Type toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setType("receita")}
              className={cn(
                "flex-1 py-2 rounded-lg text-xs font-mono border transition-all",
                type === "receita"
                  ? "bg-success/20 border-success/40 text-success"
                  : "border-border text-muted-foreground hover:border-success/30"
              )}
            >
              + Receita
            </button>
            <button
              onClick={() => setType("despesa")}
              className={cn(
                "flex-1 py-2 rounded-lg text-xs font-mono border transition-all",
                type === "despesa"
                  ? "bg-destructive/20 border-destructive/40 text-destructive"
                  : "border-border text-muted-foreground hover:border-destructive/30"
              )}
            >
              − Despesa
            </button>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-mono text-muted-foreground">Descrição</Label>
            <Input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ex: Salário, Aluguel..."
              className="font-mono text-sm bg-secondary/50 border-border"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-mono text-muted-foreground">Valor (R$)</Label>
            <Input
              type="number"
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0,00"
              className="font-mono text-sm bg-secondary/50 border-border"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-mono text-muted-foreground">Categoria</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="font-mono text-xs bg-secondary/50 border-border">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="font-mono">
                  {filteredCategories.map(c => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                        {c.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-mono text-muted-foreground">Pagamento</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="font-mono text-xs bg-secondary/50 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="font-mono">
                  {PAYMENT_METHODS.map(m => (
                    <SelectItem key={m.value} value={m.value} className="text-xs">{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-mono text-muted-foreground">Data</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start font-mono text-xs bg-secondary/50 border-border">
                  <CalendarIcon className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                  {format(date, "dd/MM/yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={d => d && setDate(d)}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={e => setIsRecurring(e.target.checked)}
              className="rounded border-border"
            />
            <span className="text-xs font-mono text-muted-foreground">Transação recorrente</span>
          </label>

          <Button onClick={handleSave} className="w-full font-mono text-xs">
            {transaction ? "> salvar alterações" : "> registrar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
