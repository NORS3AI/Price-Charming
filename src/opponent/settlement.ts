import { ActionState } from "../action/types";
import { resolveCustomer } from "../customers/state";
import { CustomerState, Resolution } from "../customers/types";

/** Aggregate outcome of an action round for scoring / UI. */
export interface RoundResult {
  /** Player's cumulative gold at end of round. */
  gold: number;
  /** Reputation delta accumulated across the round. */
  reputation: number;
  /** Customers that resolved for the player. */
  customersWon: number;
  /** Customers that resolved for the opponent. */
  customersLost: number;
  /** Customers that walked away without buying. */
  customersNoSale: number;
  /** Customers still unresolved — should be 0 after finalizeRound. */
  customersUnresolved: number;
  /** True when the player won more customers than the opponent. */
  playerWonRound: boolean;
}

/**
 * Force-resolve every unresolved customer using its current axis state.
 * Customers with no side leading collapse to `"no-sale"` via
 * `resolveCustomer`. Typically called at the end of the action phase
 * right before settlement.
 */
export function finalizeRound(state: ActionState): ActionState {
  const customers: CustomerState[] = state.customers.map((cs) =>
    cs.resolvedFor === null ? resolveCustomer(cs) : cs
  );
  return { ...state, customers };
}

/** Count customers by resolution kind. */
function tally(customers: readonly CustomerState[]): {
  won: number;
  lost: number;
  noSale: number;
  unresolved: number;
} {
  let won = 0;
  let lost = 0;
  let noSale = 0;
  let unresolved = 0;
  for (const cs of customers) {
    switch (cs.resolvedFor as Resolution | null) {
      case "player":
        won++;
        break;
      case "opponent":
        lost++;
        break;
      case "no-sale":
        noSale++;
        break;
      case null:
        unresolved++;
        break;
    }
  }
  return { won, lost, noSale, unresolved };
}

/**
 * Roll up the ActionState into a RoundResult. `finalizeRound` should
 * already have been called (or enough time passed for every customer
 * to resolve); any stragglers show up as `customersUnresolved`.
 */
export function settleRound(state: ActionState): RoundResult {
  const counts = tally(state.customers);
  return {
    gold: state.gold,
    reputation: state.reputation,
    customersWon: counts.won,
    customersLost: counts.lost,
    customersNoSale: counts.noSale,
    customersUnresolved: counts.unresolved,
    playerWonRound: counts.won > counts.lost,
  };
}
