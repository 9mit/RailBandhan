import { z } from "zod";
const id = z.string().trim().min(1).max(100);
const text = z.string().trim().min(1).max(5000);
const handle = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9_]{3,24}$/);
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (s) =>
      Number.isFinite(Date.parse(s + "T12:00:00Z")) &&
      new Date(s + "T12:00:00Z").toISOString().slice(0, 10) === s,
    { message: "Invalid calendar date" },
  );
const station = z.string().trim().min(1).max(80);
const train = z
  .string()
  .trim()
  .regex(/^\d{5}$/);
const policy = z.enum(["nobody", "same_journey", "eligible"]);
const visibility = z.enum(["never", "coach", "coach_berth"]);
const kind = z.enum([
  "tic_tac_toe",
  "connect_four",
  "ludo",
  "tictactoe",
  "connectfour",
]);
const move = z
  .object({
    cell: z.number().int().min(0).max(8).optional(),
    index: z.number().int().min(0).max(8).optional(),
    column: z.number().int().min(0).max(6).optional(),
    action: z.enum(["roll", "move"]).optional(),
    roll: z.boolean().optional(),
    tokenId: z.number().int().min(0).max(3).optional(),
  })
  .strict();
const status = z.enum(["open", "reviewing", "resolved", "dismissed"]);
const schemas: [RegExp, z.ZodTypeAny][] = [
  [/\/account$/, z.object({ password: z.string().min(8).max(128) }).strict()],
  [
    /\/auth\/(login|signup)$/,
    z
      .object({
        email: z.string().trim().toLowerCase().email().max(254),
        password: z.string().min(8).max(128),
      })
      .strict(),
  ],
  [
    /\/journeys\/manual$/,
    z
      .object({
        train_number: train.optional(),
        trainNumber: train.optional(),
        journey_date: date.optional(),
        journeyDate: date.optional(),
        boarding_station_code: station.optional(),
        boardingStationCode: station.optional(),
        fromCode: station.optional(),
        destination_station_code: station.optional(),
        destinationStationCode: station.optional(),
        toCode: station.optional(),
        train_name: z.string().max(120).optional(),
        coach: z.string().max(8).optional(),
      })
      .strict(),
  ],
  [
    /\/profiles\/onboarding$/,
    z
      .object({
        real_name: z.string().trim().max(100).optional(),
        realName: z.string().trim().max(100).optional(),
        age: z.number().int().min(13).max(120).nullable().optional(),
        gender: z.string().max(40).nullable().optional(),
        bio: z.string().max(500).nullable().optional(),
        public_handle: handle.optional(),
        publicHandle: handle.optional(),
        discovery_visible: z.boolean().optional(),
        discoveryVisible: z.boolean().optional(),
        messaging_policy: policy.optional(),
        coach_visibility: visibility.optional(),
      })
      .strict(),
  ],
  [
    /\/profiles\/anonymous$/,
    z
      .object({
        bio: z.string().max(500).nullable().optional(),
        avatar_url: z
          .string()
          .regex(/^\/images\/[A-Za-z0-9_-]+\.(webp|png|jpg)$/)
          .nullable()
          .optional(),
        public_handle: handle.optional(),
      })
      .strict(),
  ],
  [
    /\/profiles\/privacy$/,
    z
      .object({
        discovery_visible: z.boolean().optional(),
        allow_discovery: z.boolean().optional(),
        messaging_policy: policy.optional(),
        coach_visibility: visibility.optional(),
      })
      .strict(),
  ],
  [
    /\/tickets\/extractions\/[^/]+\/confirm$/,
    z
      .object({
        train_number: train.optional(),
        journey_date: date.optional(),
        boarding_station_code: station.optional(),
        destination_station_code: station.optional(),
        coach: z.string().max(8).optional(),
        berth: z
          .union([z.string().max(4), z.number().int().min(1).max(200)])
          .optional(),
        travel_class: z.string().max(8).optional(),
        pnr: z
          .string()
          .regex(/^\d{10}$/)
          .optional(),
        coach_visibility: visibility.optional(),
      })
      .strict(),
  ],
  [
    /\/conversations$/,
    z
      .object({
        recipient_handle: handle.optional(),
        recipientHandle: handle.optional(),
        journey_id: id.optional(),
        journeyId: id.optional(),
        body: text.optional(),
      })
      .strict(),
  ],
  [/\/games\/[^/]+\/move$/, move.extend({ move: move.optional() }).strict()],
  [/\/journeys\/[^/]+\/games$/, z.object({ kind }).strict()],
  [
    /\/games$/,
    z
      .object({
        journey_id: id.optional(),
        journeyId: id.optional(),
        game_type: kind.optional(),
        kind: kind.optional(),
      })
      .strict(),
  ],
  [/\/polls\/[^/]+\/vote$/, z.object({ option_id: id }).strict()],
  [
    /\/journeys\/[^/]+\/polls$/,
    z
      .object({
        question: z.string().trim().min(1).max(300),
        options: z.array(z.string().trim().min(1).max(100)).min(2).max(6),
      })
      .strict(),
  ],
  [
    /\/journeys\/[^/]+\/posts$/,
    z
      .object({
        title: z.string().max(200).optional(),
        body: text,
        post_type: z
          .enum([
            "discussion",
            "update",
            "question",
            "photo",
            "help",
            "poll",
            "general",
            "alert",
            "food",
            "story",
          ])
          .optional(),
      })
      .strict(),
  ],
  [
    /\/posts\/[^/]+\/comments$/,
    z.object({ body: text, parent_id: id.optional() }).strict(),
  ],
  [
    /\/posts\/[^/]+\/reactions$/,
    z.object({ reaction: z.literal("like").optional() }).strict(),
  ],
  [/\/messages$/, z.object({ body: text }).strict()],
  [
    /\/blocks$/,
    z
      .object({ blocked_user_id: id.optional(), handle: handle.optional() })
      .strict(),
  ],
  [
    /\/moderation\/reports\/[^/]+$/,
    z
      .object({
        action: z.enum(["resolve", "dismiss"]).optional(),
        status: status.optional(),
        resolution: z.string().max(2000).optional(),
      })
      .strict(),
  ],
  [
    /\/moderation\/reports$/,
    z
      .object({
        report_id: id,
        status,
        resolution: z.string().max(2000).optional(),
      })
      .strict(),
  ],
  [
    /\/reports$/,
    z
      .object({
        target_type: z.enum(["message", "post", "comment", "user", "dm"]),
        target_id: id,
        reason: z.string().trim().min(1).max(1000),
      })
      .strict(),
  ],
];
export function validateRequestBody(path: string, body: unknown): unknown {
  const schema = schemas.find(([re]) => re.test(path))?.[1];
  return (schema ?? z.record(z.string(), z.unknown())).parse(body);
}
