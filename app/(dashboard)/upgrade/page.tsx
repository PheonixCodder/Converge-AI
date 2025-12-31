import { SuspenseErrorBoundary } from "@/components/suspense-error-boundary";
import { auth } from "@/lib/auth";
import { UpgradeView } from "@/modules/upgrade/ui/views/upgrade-view";
import { getQueryClient, trpc } from "@/trpc/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
const UpgradePage = async () => {
    const session = await auth.api.getSession({
        headers : await headers()
    })
    if(!session){
        redirect("/sign-in")
    }

    const queryClient = getQueryClient();
    queryClient.prefetchQuery(trpc.premium.getCurrentSubscription.queryOptions());
    queryClient.prefetchQuery(trpc.premium.getProducts.queryOptions());

  return (
    <>
      <SuspenseErrorBoundary queryClient={queryClient} title="Upgrade">
        <UpgradeView />
      </SuspenseErrorBoundary>
    </>
  );
};

export default UpgradePage;