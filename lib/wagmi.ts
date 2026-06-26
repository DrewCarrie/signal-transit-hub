"use client";

import { QueryClient } from "@tanstack/react-query";
import { base } from "wagmi/chains";
import { createConfig, http } from "wagmi";
import { coinbaseWallet, injected } from "wagmi/connectors";
import { erc8021DataSuffix } from "./contract";

export const queryClient = new QueryClient();

export const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    injected({ shimDisconnect: true }),
    coinbaseWallet({
      appName: "Signal Transit Hub",
      appLogoUrl: "/icon.svg",
      preference: "all",
    }),
  ],
  transports: {
    [base.id]: http(),
  },
});

export { erc8021DataSuffix };
