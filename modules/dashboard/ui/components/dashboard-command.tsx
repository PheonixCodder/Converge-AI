import {
  CommandInput,
  CommandItem,
  CommandList,
  CommandResponsiveDialog,
} from "@/components/ui/command";

type DashboardCommandProps = {
  open: boolean;
  setOpen: () => void;
};

export const DashboardCommand = ({ open, setOpen }: DashboardCommandProps) => (
  <CommandResponsiveDialog open={open} onOpenChange={setOpen}>
    <CommandInput placeholder="Find a Meeting or Agent" />
    <CommandList>
      <CommandItem>Test</CommandItem>
    </CommandList>
  </CommandResponsiveDialog>
);