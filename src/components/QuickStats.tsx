import { Target, Flame, Clock, TrendingUp } from "lucide-react";

const stats = [
  { label: "Tarefas hoje", value: "4", icon: Target, change: "+2 vs ontem" },
  { label: "Sequência", value: "7 dias", icon: Flame, change: "Recorde!" },
  { label: "Foco", value: "2h 30m", icon: Clock, change: "+45m" },
  { label: "Semana", value: "85%", icon: TrendingUp, change: "Ótimo ritmo" },
];

const QuickStats = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="bg-card border border-border/50 rounded-xl p-4 animate-fade-in"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                <Icon className="w-4 h-4 text-primary" />
              </div>
            </div>
            <p className="text-2xl font-serif">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            <p className="text-xs text-primary mt-1">{stat.change}</p>
          </div>
        );
      })}
    </div>
  );
};

export default QuickStats;
