import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { formSchema, FormValues } from "../schema/signUp.schema";



export const useSignUp = () => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleSubmit = (data: FormValues) => {
    setError(null);
    setIsLoading(true);

    authClient.signUp.email(
      {
        name: data.name,
        email: data.email,
        password: data.password,
        callbackURL: "/",
      },
      {
        onSuccess: () => {
          router.push("/");
          setIsLoading(false);
        },
        onError: ({ error }) => {
          console.error("Sign up error:", error);
          setError(error.message);
          setIsLoading(false);
        },
      }
    );
  };

  return {
    form,
    error,
    isLoading,
    setError,
    setIsLoading,
    handleSubmit,
  };
};