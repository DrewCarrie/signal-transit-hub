"use client";

import {
  Activity,
  BadgeCheck,
  Cable,
  CircleOff,
  Clock3,
  RadioTower,
  Route,
  ScanLine,
  ShieldCheck,
  Signal,
  TicketCheck,
  ToggleLeft,
  Wallet,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Connector,
  useAccount,
  useConnect,
  useDisconnect,
  useReadContracts,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { base } from "wagmi/chains";
import { signalArcadeAbi } from "@/lib/abi";
import {
  appConfigStatus,
  erc8021DataSuffix,
  signalArcadeAddress,
} from "@/lib/contract";

type ActionKey = "pulseSignal" | "flipSwitch" | "stampPass";

const actionDetails: Record<
  ActionKey,
  {
    label: string;
    short: string;
    icon: typeof RadioTower;
    color: string;
    gate: string;
  }
> = {
  pulseSignal: {
    label: "Pulse Signal",
    short: "Signal lane",
    icon: RadioTower,
    color: "from-[#0052ff] to-[#35e0ff]",
    gate: "GATE 01",
  },
  flipSwitch: {
    label: "Flip Switch",
    short: "Route relay",
    icon: ToggleLeft,
    color: "from-[#20e391] to-[#f59e0b]",
    gate: "GATE 02",
  },
  stampPass: {
    label: "Stamp Pass",
    short: "Ticket seal",
    icon: TicketCheck,
    color: "from-[#a855f7] to-[#ffffff]",
    gate: "GATE 03",
  },
};

const readContractCalls = (address?: `0x${string}`) =>
  [
    {
      address: signalArcadeAddress,
      abi: signalArcadeAbi,
      functionName: "userPulses",
      args: [address ?? "0x0000000000000000000000000000000000000000"],
    },
    {
      address: signalArcadeAddress,
      abi: signalArcadeAbi,
      functionName: "userSwitches",
      args: [address ?? "0x0000000000000000000000000000000000000000"],
    },
    {
      address: signalArcadeAddress,
      abi: signalArcadeAbi,
      functionName: "userStamps",
      args: [address ?? "0x0000000000000000000000000000000000000000"],
    },
    {
      address: signalArcadeAddress,
      abi: signalArcadeAbi,
      functionName: "totalPulses",
    },
    {
      address: signalArcadeAddress,
      abi: signalArcadeAbi,
      functionName: "totalSwitches",
    },
    {
      address: signalArcadeAddress,
      abi: signalArcadeAbi,
      functionName: "totalStamps",
    },
  ] as const;

function formatAddress(address?: string) {
  if (!address) return "Not connected";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function friendlyConnectorName(connector: Connector) {
  if (connector.id === "injected") return "Browser Wallet";
  if (connector.id.includes("coinbase")) return "Coinbase Wallet";
  return connector.name;
}

function toDisplayCount(value: unknown) {
  return typeof value === "bigint" ? value.toString() : "0";
}

function safeErrorMessage(error: Error | null) {
  if (!error) return "Ready";
  if (error.message.toLowerCase().includes("reject")) return "Request rejected.";
  return "Transaction failed. Please try again.";
}

export default function Home() {
  const { address, isConnected, chainId } = useAccount();
  const { connectors, connect, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChainAsync } = useSwitchChain();
  const [walletPanelOpen, setWalletPanelOpen] = useState(false);
  const [lastAction, setLastAction] = useState<ActionKey | null>(null);
  const [friendlyStatus, setFriendlyStatus] = useState("Ready for dispatch.");

  const { data, refetch, isFetching } = useReadContracts({
    contracts: readContractCalls(address),
    query: {
      enabled: appConfigStatus.hasContract,
      refetchInterval: 15000,
    },
  });

  const {
    data: hash,
    error,
    isPending,
    writeContractAsync,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
      query: {
        enabled: Boolean(hash),
      },
    });

  const counts = useMemo(
    () => ({
      myPulses: toDisplayCount(data?.[0]?.result),
      mySwitches: toDisplayCount(data?.[1]?.result),
      myStamps: toDisplayCount(data?.[2]?.result),
      totalPulses: toDisplayCount(data?.[3]?.result),
      totalSwitches: toDisplayCount(data?.[4]?.result),
      totalStamps: toDisplayCount(data?.[5]?.result),
    }),
    [data],
  );

  const transactionStatus = isPending
    ? "Pending wallet approval"
    : isConfirming
      ? "Pending confirmation"
      : isConfirmed
        ? "Confirmed"
        : safeErrorMessage(error);

  async function dispatchAction(functionName: ActionKey) {
    setLastAction(functionName);
    setFriendlyStatus("Preparing transaction.");

    if (!isConnected) {
      setFriendlyStatus("Connect a wallet to continue.");
      setWalletPanelOpen(true);
      return;
    }

    if (!appConfigStatus.hasContract) {
      setFriendlyStatus("Contract route is not configured yet.");
      return;
    }

    try {
      if (chainId !== base.id) {
        await switchChainAsync({ chainId: base.id });
      }

      const txHash = await writeContractAsync({
        address: signalArcadeAddress,
        abi: signalArcadeAbi,
        functionName,
        chainId: base.id,
        dataSuffix: erc8021DataSuffix,
      });

      setFriendlyStatus("Transaction submitted.");
      if (txHash) {
        await refetch();
      }
    } catch (caughtError) {
      console.error(caughtError);
      const message =
        caughtError instanceof Error ? safeErrorMessage(caughtError) : "Network busy. Try again soon.";
      setFriendlyStatus(message);
    }
  }

  const displayedStatus = error ? safeErrorMessage(error) : friendlyStatus;

  return (
    <main className="min-h-screen overflow-hidden bg-[#080c12] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,82,255,0.22),transparent_28%),radial-gradient(circle_at_82%_12%,rgba(45,243,163,0.16),transparent_24%),linear-gradient(135deg,rgba(168,85,247,0.12),transparent_48%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#35e0ff]">
              <Signal size={16} />
              Base Mini App
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal sm:text-4xl">
              Signal Transit Hub
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/78 sm:flex">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  isConnected ? "bg-[#20e391]" : "bg-[#f59e0b]"
                }`}
              />
              {formatAddress(address)}
            </div>
            <button
              type="button"
              onClick={() => setWalletPanelOpen(true)}
              className="inline-flex h-11 items-center gap-2 rounded border border-[#35e0ff]/45 bg-[#0052ff]/20 px-4 text-sm font-semibold text-white transition hover:border-[#35e0ff] hover:bg-[#0052ff]/30"
            >
              <Wallet size={18} />
              Wallet
            </button>
          </div>
        </header>

        <section className="grid gap-4 py-4 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="relative overflow-hidden rounded border border-white/12 bg-[#0d1420]/92 p-4 shadow-2xl shadow-black/30">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#0052ff] via-[#20e391] to-[#f59e0b]" />
            <div className="grid gap-4 sm:grid-cols-[0.9fr_1.1fr]">
              <div className="space-y-4">
                <div className="rounded border border-white/10 bg-black/22 p-3">
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-white/55">
                    <span>Terminal Route</span>
                    <span>BASE MAINNET</span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {["NORTH", "CORE", "EAST"].map((label, index) => (
                      <div
                        key={label}
                        className="rounded border border-white/10 bg-white/[0.04] p-2 text-center"
                      >
                        <div
                          className={`mx-auto mb-2 h-2 w-10 rounded-full ${
                            index === 0
                              ? "bg-[#0052ff]"
                              : index === 1
                                ? "bg-[#20e391]"
                                : "bg-[#f59e0b]"
                          }`}
                        />
                        <div className="text-[11px] font-semibold text-white/80">
                          {label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded border border-white/10 bg-[#111827] p-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <Route size={18} className="text-[#20e391]" />
                    Timetable Rail
                  </div>
                  <div className="mt-3 space-y-2 text-xs text-white/62">
                    {["Pulse lane open", "Switch relay armed", "Stamp gate clear"].map(
                      (item) => (
                        <div
                          key={item}
                          className="flex items-center justify-between border-b border-dashed border-white/10 pb-2 last:border-0 last:pb-0"
                        >
                          <span>{item}</span>
                          <span className="font-mono text-[#35e0ff]">ON TIME</span>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-between rounded border border-white/10 bg-[linear-gradient(145deg,rgba(0,82,255,0.16),rgba(13,20,32,0.8)_45%,rgba(32,227,145,0.08))] p-4">
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                        Dispatch Console
                      </p>
                      <h2 className="mt-1 text-2xl font-semibold">
                        Three Action Control
                      </h2>
                    </div>
                    <ScanLine className="text-[#f59e0b]" size={28} />
                  </div>
                  <div className="mt-5 grid gap-3">
                    {(Object.keys(actionDetails) as ActionKey[]).map((key) => {
                      const detail = actionDetails[key];
                      const Icon = detail.icon;
                      return (
                        <button
                          key={key}
                          type="button"
                          disabled={isPending || isConfirming}
                          onClick={() => dispatchAction(key)}
                          className="group flex min-h-20 items-center justify-between rounded border border-white/12 bg-black/20 p-3 text-left transition hover:border-white/32 hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <span className="flex items-center gap-3">
                            <span
                              className={`grid h-12 w-12 place-items-center rounded bg-gradient-to-br ${detail.color} text-[#081019]`}
                            >
                              <Icon size={22} />
                            </span>
                            <span>
                              <span className="block text-base font-semibold text-white">
                                {detail.label}
                              </span>
                              <span className="text-xs uppercase tracking-[0.16em] text-white/46">
                                {detail.gate} / {detail.short}
                              </span>
                            </span>
                          </span>
                          <Cable
                            size={18}
                            className="text-white/38 transition group-hover:text-[#35e0ff]"
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="mt-4 rounded border border-[#20e391]/24 bg-[#20e391]/8 p-3 text-sm text-[#d7fff0]">
                  {displayedStatus}
                </div>
              </div>
            </div>
          </div>

          <aside className="grid gap-4">
            <StatusPanel
              icon={ShieldCheck}
              label="Wallet Status"
              value={isConnected ? "Connected" : "Disconnected"}
              detail={formatAddress(address)}
            />
            <StatusPanel
              icon={Clock3}
              label="Last Transaction"
              value={lastAction ? actionDetails[lastAction].label : "No activity"}
              detail={transactionStatus}
            />
            <StatusPanel
              icon={Activity}
              label="Route Sync"
              value={isFetching ? "Refreshing" : "Live Readout"}
              detail={
                appConfigStatus.hasAttribution
                  ? "Attribution ready"
                  : "Attribution pending"
              }
            />
          </aside>
        </section>

        <section className="grid gap-3 pb-6 md:grid-cols-3">
          <CounterPanel
            label="Pulses"
            mine={counts.myPulses}
            total={counts.totalPulses}
            accent="#35e0ff"
          />
          <CounterPanel
            label="Switches"
            mine={counts.mySwitches}
            total={counts.totalSwitches}
            accent="#20e391"
          />
          <CounterPanel
            label="Stamps"
            mine={counts.myStamps}
            total={counts.totalStamps}
            accent="#f59e0b"
          />
        </section>

        <section className="mb-6 rounded border border-white/10 bg-white/[0.04] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-white/66">
              Recent Activity
            </h2>
            <BadgeCheck size={18} className="text-[#20e391]" />
          </div>
          <div className="grid gap-2 text-sm text-white/68 sm:grid-cols-3">
            <ActivityLine label="Pulse Signal" active={lastAction === "pulseSignal"} />
            <ActivityLine label="Flip Switch" active={lastAction === "flipSwitch"} />
            <ActivityLine label="Stamp Pass" active={lastAction === "stampPass"} />
          </div>
        </section>
      </div>

      {walletPanelOpen && (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/62 p-3 backdrop-blur-sm sm:place-items-center">
          <div className="w-full max-w-md rounded border border-white/12 bg-[#0d1420] p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Connect Wallet</h2>
                <p className="mt-1 text-sm text-white/58">
                  Choose a wallet route for Base.
                </p>
              </div>
              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded border border-white/10 bg-white/5"
                onClick={() => setWalletPanelOpen(false)}
                aria-label="Close wallet panel"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 grid gap-2">
              {connectors.map((connector) => (
                <button
                  key={connector.uid}
                  type="button"
                  disabled={isConnecting}
                  onClick={() => {
                    connect(
                      { connector, chainId: base.id },
                      {
                        onSuccess: () => {
                          setWalletPanelOpen(false);
                          setFriendlyStatus("Wallet connected.");
                        },
                        onError: (connectError) => {
                          console.error(connectError);
                          setFriendlyStatus(safeErrorMessage(connectError));
                        },
                      },
                    );
                  }}
                  className="flex h-12 items-center justify-between rounded border border-white/10 bg-white/[0.04] px-3 text-left transition hover:border-[#35e0ff]/55 hover:bg-white/[0.08] disabled:opacity-60"
                >
                  <span className="font-semibold">{friendlyConnectorName(connector)}</span>
                  <Wallet size={18} className="text-[#35e0ff]" />
                </button>
              ))}
            </div>

            {isConnected && (
              <button
                type="button"
                onClick={() => {
                  disconnect();
                  setWalletPanelOpen(false);
                  setFriendlyStatus("Wallet disconnected.");
                }}
                className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded border border-[#f59e0b]/40 bg-[#f59e0b]/10 text-sm font-semibold text-[#ffdca4]"
              >
                <CircleOff size={17} />
                Disconnect
              </button>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

function StatusPanel({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof ShieldCheck;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded border border-white/10 bg-white/[0.045] p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/48">
        <Icon size={16} className="text-[#35e0ff]" />
        {label}
      </div>
      <div className="mt-3 text-xl font-semibold">{value}</div>
      <div className="mt-1 text-sm text-white/58">{detail}</div>
    </div>
  );
}

function CounterPanel({
  label,
  mine,
  total,
  accent,
}: {
  label: string;
  mine: string;
  total: string;
  accent: string;
}) {
  return (
    <div className="rounded border border-white/10 bg-[#0d1420]/88 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-white/58">
          {label}
        </h2>
        <span
          className="h-2.5 w-10 rounded-full"
          style={{ backgroundColor: accent }}
        />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-white/38">My</p>
          <p className="mt-1 font-mono text-3xl font-semibold">{mine}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-white/38">Total</p>
          <p className="mt-1 font-mono text-3xl font-semibold">{total}</p>
        </div>
      </div>
    </div>
  );
}

function ActivityLine({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="flex items-center justify-between rounded border border-white/10 bg-black/16 px-3 py-2">
      <span>{label}</span>
      <span className={active ? "text-[#20e391]" : "text-white/38"}>
        {active ? "Latest" : "Standby"}
      </span>
    </div>
  );
}
