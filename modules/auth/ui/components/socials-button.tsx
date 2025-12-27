import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { FaGithub, FaGoogle } from "react-icons/fa";
import { useRouter } from "next/navigation";

type SocialsButtonsProps = {
  isLoading: boolean;
  setError: (error: string | null) => void;
  setIsLoading: (isLoading: boolean) => void;
};

export const SocialsButtons = ({
  isLoading,
  setError,
  setIsLoading,
}: SocialsButtonsProps) => {
  const router = useRouter();

  const handleSignInWithGithub = async () => {
    setError(null);
    setIsLoading(true);
    await authClient.signIn.social(
      {
        provider: "github",
        callbackURL: "/",
      },
      {
        onSuccess: () => {
          router.push("/");
          setIsLoading(false);
        },
        onError: ({ error }) => {
          setError(error.message);
          setIsLoading(false);
        },
      }
    );
  };
  const handleSignInWithGoggle = async () => {
    setError(null);
    setIsLoading(true);
    await authClient.signIn.social(
      {
        provider: "google",
        callbackURL: "/",
      },
      {
        onSuccess: () => {
          router.push("/");
          setIsLoading(false);
        },
        onError: ({ error }) => {
          setError(error.message);
          setIsLoading(false);
        },
      }
    );
  };

  return (
    <div className="flex w-full justify-between">
    <Button
      variant="outline"
      className="w-[48%] hover:cursor-pointer"
      type="button"
      disabled={isLoading}
      onClick={handleSignInWithGithub}
    >
      <FaGithub className="h-4 w-4" />
      Github
    </Button>
    <Button
      variant="outline"
      className="w-[48%] hover:cursor-pointer"
      type="button"
      disabled={isLoading}
      onClick={handleSignInWithGoggle}
    >
      <FaGoogle className="h-4 w-4" />
      Google
    </Button>
    </div>
  );
};