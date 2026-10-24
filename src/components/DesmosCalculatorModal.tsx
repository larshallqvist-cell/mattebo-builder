import { ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const DESMOS_URL = "https://www.desmos.com/scientific?lang=sv-SE";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DesmosCalculatorModal = ({ open, onOpenChange }: Props) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="flex h-[92dvh] w-[96vw] max-w-3xl flex-col gap-2 p-3 sm:p-4">
      <div className="flex items-center gap-3 pr-8">
        <DialogTitle className="font-sora text-lg">Miniräknare</DialogTitle>
        <button
          type="button"
          onClick={() => window.open(DESMOS_URL, "_blank", "noopener,noreferrer")}
          className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ExternalLink className="h-4 w-4" /> Ny flik
        </button>
      </div>
      {open && (
        <iframe
          src={`${DESMOS_URL}&embed`}
          title="Desmos vetenskaplig räknare"
          className="w-full flex-1 rounded-lg border border-border bg-background"
        />
      )}
    </DialogContent>
  </Dialog>
);

export default DesmosCalculatorModal;
