import { toast } from "react-hot-toast";

export function useToast() {
  return {
    toast, // gives access to toast.success, toast.error, etc.
    success: (message: string) => toast.success(message),
    error: (message: string) => toast.error(message),
    info: (message: string) => toast(message),
  };
}
