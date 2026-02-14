import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast font-mono !bg-[hsl(225,15%,11%)] !border !border-[hsl(var(--border))]/60 !shadow-2xl !shadow-black/30 !backdrop-blur-xl !rounded-lg !text-[hsl(var(--foreground))] !text-sm",
          title: "!font-mono !text-sm",
          description: "!font-mono !text-xs !text-[hsl(var(--muted-foreground))]",
          actionButton: "!bg-[hsl(var(--primary))] !text-[hsl(var(--primary-foreground))] !font-mono !text-xs",
          cancelButton: "!bg-[hsl(var(--muted))] !text-[hsl(var(--muted-foreground))] !font-mono !text-xs",
          success: "!border-l-[3px] !border-l-[hsl(var(--success))]",
          error: "!border-l-[3px] !border-l-[hsl(var(--destructive))]",
          info: "!border-l-[3px] !border-l-[hsl(var(--warning))]",
          warning: "!border-l-[3px] !border-l-[hsl(var(--warning))]",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
