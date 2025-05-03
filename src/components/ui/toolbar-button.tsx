import { cn } from "@/lib/utils";

const ToolbarButton = ({
  isActive,
  onClick,
  children,
  label,
  disabled = false,
}: {
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
  label: string;
  disabled?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "p-2 rounded hover:bg-muted transition-colors",
      isActive ? "bg-muted text-primary" : "text-muted-foreground",
      disabled ? "opacity-50 cursor-not-allowed" : "",
    )}
    aria-label={label}
    title={label}
    tabIndex={0}
    disabled={disabled}
  >
    {children}
  </button>
);

export default ToolbarButton;
