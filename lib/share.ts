import { getCommittee, type Race } from "./data";
import { money, raceTitle, titleCase } from "./format";

/** Named spenders, biggest first: the pooled no-ID filers aren't one group. */
export const namedSpenders = (race: Race) =>
  race.spenders
    .filter((s) => s.committeeId !== "OTHER")
    .map((s) => ({ ...s, displayName: titleCase(getCommittee(s.committeeId)?.name ?? s.name) }));

export const topSpenderName = (race: Race) => namedSpenders(race)[0]?.displayName ?? null;

export function shareLine(race: Race) {
  const title = raceTitle(race);
  if (race.outsideTotal <= 0) return `Who's funding the ${title} race? Here are the receipts.`;
  const topName = topSpenderName(race);
  return `${money(race.outsideTotal)} in outside money is pouring into the ${title} race${
    topName ? `, led by ${topName}` : ""
  }. See who's paying:`;
}
