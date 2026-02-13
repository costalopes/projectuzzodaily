import { useState } from "react";
import { BarChart3, FileText, Link2, HardDrive, Users, Sparkles, Layers, CheckCircle, Zap, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "overview" | "notes" | "links" | "drive" | "members" | "ai";

const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "overview", label: "Visão Geral", icon: BarChart3 },
  { key: "notes", label: "Notas", icon: FileText },
  { key: "links", label: "Links", icon: Link2 },
  { key: "drive", label: "Drive", icon: HardDrive },
  { key: "members", label: "Membros", icon: Users },
  { key: "ai", label: "IA", icon: Sparkles },
];

const ProjectOverview = () => {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  return (
    <div className="bg-card rounded-xl border border-border flex flex-col h-full">
      {/* Tabs */}
      <div className="flex gap-1 px-5 py-3 border-b border-border overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap",
                activeTab === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 p-5 overflow-y-auto">
        {activeTab === "overview" && <OverviewContent />}
        {activeTab === "notes" && <PlaceholderContent icon={FileText} title="Notas" description="Suas anotações e documentos do projeto aparecerão aqui." />}
        {activeTab === "links" && <PlaceholderContent icon={Link2} title="Links" description="Links úteis e referências do projeto." />}
        {activeTab === "drive" && <PlaceholderContent icon={HardDrive} title="Drive" description="Arquivos e documentos compartilhados." />}
        {activeTab === "members" && <PlaceholderContent icon={Users} title="Membros" description="Gerencie os membros do workspace." />}
        {activeTab === "ai" && <PlaceholderContent icon={Sparkles} title="Assistente IA" description="Use IA para organizar e priorizar suas tarefas." />}
      </div>
    </div>
  );
};

const OverviewContent = () => {
  const stats = [
    { label: "Total", value: "12", icon: Layers, color: "text-primary" },
    { label: "Concluídas", value: "2", icon: CheckCircle, color: "text-success" },
    { label: "Em andamento", value: "1", icon: Zap, color: "text-warning" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Project banner */}
      <div className="rounded-xl bg-gradient-to-br from-primary to-primary/70 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary-foreground/20 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-8 h-8 text-primary-foreground" />
          </div>
          <h3 className="text-xl font-bold text-primary-foreground">Meu Workspace</h3>
        </div>
      </div>

      {/* Description */}
      <div>
        <h3 className="text-lg font-semibold">Meu Workspace</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Workspace pessoal para planejamento de rotina, organização de tarefas e acompanhamento de progresso.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={cn("w-4 h-4", stat.color)} />
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Details */}
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Detalhes
        </h4>
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Criado em</span>
            <span className="font-medium ml-auto">13/02/2026</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Membros</span>
            <span className="font-medium ml-auto">1</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const PlaceholderContent = ({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) => (
  <div className="flex flex-col items-center justify-center h-full text-center py-16 animate-fade-in">
    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4">
      <Icon className="w-6 h-6 text-muted-foreground" />
    </div>
    <h3 className="text-sm font-semibold mb-1">{title}</h3>
    <p className="text-xs text-muted-foreground max-w-xs">{description}</p>
  </div>
);

export default ProjectOverview;
