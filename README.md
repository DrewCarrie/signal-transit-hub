# Signal Transit Hub

Signal Transit Hub is a Base Mini App built with Next.js, TypeScript, App Router, Wagmi, Viem, and Tailwind CSS.

The app exposes exactly three onchain write actions:

- Pulse Signal -> `pulseSignal()`
- Flip Switch -> `flipSwitch()`
- Stamp Pass -> `stampPass()`

There are no tokens, points, invitation flows, paid app fees, or extra onchain write actions. Users only pay Base gas.

## Required Production Values

Before the final Base dashboard verification and production deployment, replace these placeholders:

- `app/layout.tsx`: `PASTE_BASE_DEV_VERIFY_TOKEN_HERE`
- `lib/contract.ts`: `signalTransitHubAddress`
- `lib/contract.ts`: `erc8021DataSuffix`

The `<meta name="base:app_id" ...>` tag is hardcoded inside `app/layout.tsx` as required for offchain attribution. Every write uses `dataSuffix` explicitly for onchain attribution.

## Contract

The Solidity source is in `contracts/SignalTransitHub.sol`, and the frontend ABI is in `lib/abi.ts`.

## Local Development

```bash
npm install
npm run dev
```

## Verification

```bash
npm run lint
npm run build
```

## Deployment Notes

`vercel.json` allows iframe embedding for Base App access. Disable Vercel Deployment Protection for the production deployment before registering or testing in base.dev.
