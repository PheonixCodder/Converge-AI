import { auth } from "@/lib/auth";
import { PropsWithChildren } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/modules/dashboard/ui/components/dashboard-sidebar";
import { DashboardNavbar } from "@/modules/dashboard/ui/components/dashboard-navbar";
import { Separator } from "@/components/ui/separator";

const DashboardLayout = async ({
  children,
}: Readonly<PropsWithChildren>) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <DashboardSidebar />
        <div className="flex bg-radial from-sidebar-accent to-sidebar items-center">
<Separator
  orientation="vertical"
  className="h-0!"
/>
</div>
        <main className="flex flex-1 flex-col bg-muted bg-radial from-sidebar-accent to-sidebar py-6 px-6">
          <DashboardNavbar />
          <div className="flex-1 overflow-auto p-4 bg-white rounded-2xl mt-4">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
