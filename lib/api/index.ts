/**
 * The adapter registry. The whole demo runs in the browser on mock adapters; a real backend replaces them by calling
 * `setAdapters` with live implementations. Nothing else in the app knows which is in use.
 */
import { createMockNbfc, type NbfcPort, type NbfcScenario } from "./nbfc-port";
import { createMockNotifications, type NotificationPort } from "./notification-port";
import type { ScoreProvider } from "./score-provider";
import { createMockVerification, type KycOutcome, type PennyDropOutcome, type VerificationProvider } from "./verification-provider";

export type { NbfcPort, NotificationPort, ScoreProvider, VerificationProvider };

export interface Adapters {
  nbfc: NbfcPort;
  verification: VerificationProvider;
  notifications: NotificationPort;
  /** Set by the world store, which owns the engine's inputs. */
  score?: ScoreProvider;
}

/** What the presenter can switch in the Demo Director. Read lazily by the mocks, so a change applies to the next call. */
export interface Scenarios {
  nbfc: NbfcScenario;
  pennyDrop: PennyDropOutcome;
  kyc: KycOutcome;
  /** Fail the next pay once with a network error, to show the idempotent retry. */
  failNextPay: boolean;
}

export const defaultScenarios = (): Scenarios => ({ nbfc: "paid", pennyDrop: "success", kyc: "verified", failNextPay: false });

export function createMockAdapters(scenarios: () => Scenarios, opts: { delayMs?: number } = {}): Adapters {
  return {
    nbfc: createMockNbfc({ scenario: () => scenarios().nbfc, delayMs: opts.delayMs }),
    verification: createMockVerification({ kyc: () => scenarios().kyc, pennyDrop: () => scenarios().pennyDrop }),
    notifications: createMockNotifications(),
  };
}

let current: Adapters = createMockAdapters(defaultScenarios);

export const getAdapters = (): Adapters => current;
export const setAdapters = (a: Adapters): void => {
  current = a;
};
