import { AgentGetByIdOutput } from "@/modules/agents/types";
import {
  createAgentSchema,
  type CreateAgentSchema,
} from "@/modules/agents/schema/schemas";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type UseAgentFormProps = {
  initialValues?: AgentGetByIdOutput;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export const useAgentForm = ({
  initialValues,
  onSuccess,
}: UseAgentFormProps) => {
  const router = useRouter()
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const isEdit = !!initialValues;

  const createAgentMutation = useMutation(
    trpc.agents.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.agents.getMany.queryOptions({})
        );
        await queryClient.invalidateQueries(
          trpc.premium.getFreeUsage.queryOptions()
        );

        onSuccess?.();
        toast.success("Agent created successfully");
      },
      onError: (error) => {
        toast.error(error.message);
        if(error.data?.code === "FORBIDDEN"){
          router.push("/upgrade")
        }
      },
    })
  );

  const updateAgentMutation = useMutation(
    trpc.agents.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.agents.getMany.queryOptions({})
        );

        if (initialValues?.id) {
          await queryClient.invalidateQueries(
            trpc.agents.getById.queryOptions({ id: initialValues.id })
          );
        }

        onSuccess?.();
        toast.success("Agent updated successfully");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const form = useForm({
    resolver: zodResolver(createAgentSchema),
    defaultValues: {
      name: initialValues?.name ?? "",
      instructions: initialValues?.instructions ?? "",
    },
  });

  const onSubmit = (data: CreateAgentSchema) => {
    if (isEdit) {
      updateAgentMutation.mutate({ id: initialValues.id, ...data });
    } else {
      createAgentMutation.mutate(data);
    }
  };

  const { isPending } = isEdit ? updateAgentMutation : createAgentMutation;

  return { form, onSubmit, isEdit, isPending };
};