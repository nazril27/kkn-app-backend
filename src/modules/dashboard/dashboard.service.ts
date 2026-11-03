import { count, eq, inArray, sql } from "drizzle-orm";
import { db } from "../../db/connection";
import { houses, users, wastes } from "../../db/schema";

function toCount(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toWeightKg(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.round(parsed * 1000) / 1000;
}

function toPercent(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 1000) / 10;
}

const familyMembersSum = sql<string>`coalesce(sum(case when ${houses.numberOfFamilyMembers} ~ '^[0-9]+$' then ${houses.numberOfFamilyMembers}::int else 0 end), 0)`;
const wasteWeightSum = sql<string>`coalesce(sum(${wastes.weight}::numeric), 0)`;

export class DashboardService {
  static async getSummary(rt?: string) {
    const rtFilter = rt ? eq(houses.rt, rt) : sql`true`;

    const [
      [studentCount],
      houseOverview,
      wasteOverview,
      housesByRt,
      housesBySorting,
      wastesByType,
      wastesByRt,
      collectorsFromHouses,
      collectorsFromWastes,
    ] = await Promise.all([
      db.select({ count: count(users.id) }).from(users),
      db
        .select({
          totalHouses: count(houses.id),
          totalFamilyMembers: familyMembersSum,
        })
        .from(houses)
        .where(rtFilter),
      db
        .select({
          totalWasteRecords: count(wastes.id),
          totalWasteWeightKg: wasteWeightSum,
        })
        .from(wastes)
        .leftJoin(houses, eq(wastes.houseId, houses.id))
        .where(rtFilter),
      db
        .select({
          rt: houses.rt,
          houses: count(houses.id),
          familyMembers: familyMembersSum,
        })
        .from(houses)
        .where(rtFilter)
        .groupBy(houses.rt)
        .orderBy(houses.rt),
      db
        .select({
          isSortingWaste: houses.isSortingWaste,
          houses: count(houses.id),
        })
        .from(houses)
        .where(rtFilter)
        .groupBy(houses.isSortingWaste),
      db
        .select({
          typesOfWaste: wastes.typesOfWaste,
          records: count(wastes.id),
          totalWeightKg: wasteWeightSum,
        })
        .from(wastes)
        .leftJoin(houses, eq(wastes.houseId, houses.id))
        .where(rtFilter)
        .groupBy(wastes.typesOfWaste)
        .orderBy(wastes.typesOfWaste),
      db
        .select({
          rt: houses.rt,
          records: count(wastes.id),
          totalWeightKg: wasteWeightSum,
        })
        .from(wastes)
        .leftJoin(houses, eq(wastes.houseId, houses.id))
        .where(rtFilter)
        .groupBy(houses.rt)
        .orderBy(houses.rt),
      db
        .select({
          userId: houses.userId,
          houses: count(houses.id),
        })
        .from(houses)
        .where(rtFilter)
        .groupBy(houses.userId),
      db
        .select({
          userId: wastes.userId,
          records: count(wastes.id),
          totalWeightKg: wasteWeightSum,
        })
        .from(wastes)
        .leftJoin(houses, eq(wastes.houseId, houses.id))
        .where(rtFilter)
        .groupBy(wastes.userId),
    ]);

    const totalHouses = toCount(houseOverview[0]?.totalHouses);
    const totalFamilyMembers = toCount(houseOverview[0]?.totalFamilyMembers);
    const totalWasteRecords = toCount(wasteOverview[0]?.totalWasteRecords);
    const totalWasteWeightKg = toWeightKg(wasteOverview[0]?.totalWasteWeightKg);
    const totalStudents = toCount(studentCount?.count);

    const sortingMap = new Map(
      housesBySorting.map((row) => [row.isSortingWaste ?? "tidak diketahui", toCount(row.houses)])
    );
    const sortingKeys = ["ya", "tidak", "sebagian"] as const;
    const housesBySortingWaste = sortingKeys.map((key) => {
      const housesCount = sortingMap.get(key) ?? 0;
      return {
        isSortingWaste: key,
        houses: housesCount,
        percent: toPercent(housesCount, totalHouses),
      };
    });

    const unknownSorting = [...sortingMap.entries()]
      .filter(([key]) => !sortingKeys.includes(key as (typeof sortingKeys)[number]))
      .map(([isSortingWaste, housesCount]) => ({
        isSortingWaste,
        houses: housesCount,
        percent: toPercent(housesCount, totalHouses),
      }));

    const houseCountByRt = new Map<string | null, number>(
      housesByRt.map((row) => [row.rt, toCount(row.houses)])
    );
    const familyByRt = new Map<string | null, number>(
      housesByRt.map((row) => [row.rt, toCount(row.familyMembers)])
    );
    const wasteByRt = new Map<string | null, { records: number; totalWeightKg: number }>(
      wastesByRt.map((row) => [
        row.rt,
        {
          records: toCount(row.records),
          totalWeightKg: toWeightKg(row.totalWeightKg),
        },
      ])
    );

    const rtKeys = [...new Set([...houseCountByRt.keys(), ...wasteByRt.keys()])].sort(
      (a, b) => {
        if (a == null && b == null) return 0;
        if (a == null) return 1;
        if (b == null) return -1;
        return a.localeCompare(b, "id");
      }
    );

    const byRt = rtKeys.map((rtKey) => ({
      rt: rtKey,
      houses: houseCountByRt.get(rtKey) ?? 0,
      familyMembers: familyByRt.get(rtKey) ?? 0,
      wasteRecords: wasteByRt.get(rtKey)?.records ?? 0,
      totalWasteWeightKg: wasteByRt.get(rtKey)?.totalWeightKg ?? 0,
    }));

    const collectorIds = [
      ...new Set(
        [...collectorsFromHouses, ...collectorsFromWastes]
          .map((row) => row.userId)
          .filter((id): id is number => id != null)
      ),
    ];

    const collectorUsers =
      collectorIds.length > 0
        ? await db
            .select({
              id: users.id,
              name: users.name,
              nim: users.nim,
            })
            .from(users)
            .where(inArray(users.id, collectorIds))
        : [];

    const housesByUser = new Map<number | null, number>(
      collectorsFromHouses.map((row) => [row.userId, toCount(row.houses)])
    );
    const wastesByUser = new Map<number | null, { records: number; totalWeightKg: number }>(
      collectorsFromWastes.map((row) => [
        row.userId,
        {
          records: toCount(row.records),
          totalWeightKg: toWeightKg(row.totalWeightKg),
        },
      ])
    );

    const collectors = collectorUsers
      .map((user) => ({
        userId: user.id,
        name: user.name,
        nim: user.nim,
        houses: housesByUser.get(user.id) ?? 0,
        wasteRecords: wastesByUser.get(user.id)?.records ?? 0,
        totalWasteWeightKg: wastesByUser.get(user.id)?.totalWeightKg ?? 0,
      }))
      .sort((a, b) => b.houses + b.wasteRecords - (a.houses + a.wasteRecords));

    const unassignedHouses = housesByUser.get(null) ?? 0;
    const unassignedWaste = wastesByUser.get(null);

    return {
      generatedAt: new Date().toISOString(),
      filter: {
        rt: rt ?? null,
      },
      overview: {
        totalStudents,
        totalHouses,
        totalFamilyMembers,
        totalWasteRecords,
        totalWasteWeightKg,
        unassignedHouses: toCount(unassignedHouses),
        unassignedWasteRecords: unassignedWaste?.records ?? 0,
      },
      housesBySortingWaste: [...housesBySortingWaste, ...unknownSorting],
      wastesByType: wastesByType.map((row) => ({
        typesOfWaste: row.typesOfWaste,
        records: toCount(row.records),
        totalWeightKg: toWeightKg(row.totalWeightKg),
      })),
      byRt,
      collectors,
    };
  }
}
