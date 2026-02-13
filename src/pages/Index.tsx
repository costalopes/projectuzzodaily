import { ChevronLeft } from "lucide-react";
import TaskPanel from "@/components/TaskPanel";
import ProjectOverview from "@/components/ProjectOverview";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b border-border bg-card px-6 py-3 flex items-center gap-3">
        <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-4 h-4" />
          Voltar
        </button>
        <div className="w-2.5 h-2.5 rounded-full bg-primary" />
        <h1 className="text-sm font-semibold">Meu Workspace</h1>
      </header>

      {/* Main layout */}
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-5 min-h-[calc(100vh-80px)]">
          <TaskPanel />
          <ProjectOverview />
        </div>
      </div>
    </div>
  );
};

export default Index;
