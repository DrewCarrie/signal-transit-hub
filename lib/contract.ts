export const signalTransitHubAddress =
  "0xd524df55d891962d839866a932f2ef9e17564595" as `0x${string}`;

export const erc8021DataSuffix =
  "0x62635f7473646f367a72670b0080218021802180218021802180218021" as `0x${string}`;

export const appConfigStatus = {
  hasContract:
    signalTransitHubAddress !== "0x0000000000000000000000000000000000000000",
  hasAttribution: erc8021DataSuffix !== "0x",
};
