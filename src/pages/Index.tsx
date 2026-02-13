import GreetingHeader from "@/components/GreetingHeader";
import TaskSection from "@/components/TaskSection";
import HabitTracker from "@/components/HabitTracker";
import QuickStats from "@/components/QuickStats";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-6 md:py-10 space-y-8">
        <GreetingHeader />
        <QuickStats />
        <div className="grid md:grid-cols-1 gap-8">
          <TaskSection />
          <HabitTracker />
        </div>
      </div>
    </div>
  );
};

export default Index;
