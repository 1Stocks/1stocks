import { cn as cnBase } from "cn";

export function cn(...inputs: Parameters<typeof cnBase>) {
  return cnBase(...inputs);
}
