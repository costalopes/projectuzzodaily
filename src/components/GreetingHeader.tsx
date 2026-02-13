import heroBanner from "@/assets/hero-banner.jpg";

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
};

const getDateString = () => {
  return new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
};

const GreetingHeader = () => {
  return (
    <div className="relative overflow-hidden rounded-2xl">
      <img
        src={heroBanner}
        alt="Banner decorativo"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="relative z-10 px-8 py-10 bg-gradient-to-r from-foreground/60 to-foreground/20">
        <p className="text-primary-foreground/80 text-sm font-medium capitalize">
          {getDateString()}
        </p>
        <h1 className="text-3xl md:text-4xl text-primary-foreground mt-1">
          {getGreeting()} ☀️
        </h1>
        <p className="text-primary-foreground/70 mt-2 text-sm">
          Organize seu dia com calma e intenção.
        </p>
      </div>
    </div>
  );
};

export default GreetingHeader;
