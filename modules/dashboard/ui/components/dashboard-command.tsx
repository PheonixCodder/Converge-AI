import {
  CommandInput,
  CommandItem,
  CommandList,
  CommandDialog,
} from "@/components/ui/command";

type DashboardCommandProps = {
  open: boolean;
  setOpen: () => void;
};

export const DashboardCommand = ({ open, setOpen }: DashboardCommandProps) => (
  <CommandDialog open={open} onOpenChange={setOpen}>
    <CommandInput placeholder="Find a Meeting or Agent" />
    <CommandList>
      <CommandItem>Test</CommandItem>
    </CommandList>
  </CommandDialog>
);