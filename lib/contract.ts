export const signalArcadeAddress =
  "0x0000000000000000000000000000000000000000" as `0x${string}`;

export const erc8021DataSuffix = "0x" as `0x${string}`;

export const appConfigStatus = {
  hasContract:
    signalArcadeAddress !== "0x0000000000000000000000000000000000000000",
  hasAttribution: erc8021DataSuffix !== "0x",
};
