import type { KidModBridge } from "@kidmodstudio/ipc-contracts";

declare global {
  interface Window {
    kidmod: KidModBridge;
  }
}

export {};
