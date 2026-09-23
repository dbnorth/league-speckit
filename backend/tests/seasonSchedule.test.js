import { describe, it, expect } from "@jest/globals";
import { buildPairings, enumerateGameDates } from "../app/services/seasonSchedule.js";

describe("seasonSchedule", () => {
  it("builds a home-and-away pairing for every pair of teams", () => {
    const pairings = buildPairings([{ id: 1 }, { id: 2 }, { id: 3 }]);

    expect(pairings).toHaveLength(6);
    expect(pairings).toEqual(
      expect.arrayContaining([
        { homeTeamId: 1, visitingTeamId: 2 },
        { homeTeamId: 2, visitingTeamId: 1 },
        { homeTeamId: 1, visitingTeamId: 3 },
        { homeTeamId: 3, visitingTeamId: 1 },
        { homeTeamId: 2, visitingTeamId: 3 },
        { homeTeamId: 3, visitingTeamId: 2 },
      ])
    );
  });

  it("lists only the season's game days between start and end", () => {
    expect(enumerateGameDates("2026-08-15", "2026-09-05", ["saturday"])).toEqual([
      "2026-08-15",
      "2026-08-22",
      "2026-08-29",
      "2026-09-05",
    ]);
  });
});
