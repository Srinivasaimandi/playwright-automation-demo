import { z } from 'zod';

/** Validates the API key returned by the login endpoint. */
export const ApiKeySchema = z.object({
  apiKey: z.string().min(1),
});

/** Validates the message returned for API errors. */
export const ApiErrorSchema = z.object({
  message: z.string().min(1),
  error: z.string().optional(),
});

/** Validates user fields consumed by tests; unmodeled response fields are stripped. */
export const ApiUserSchema = z.object({
  id: z.number().int().nonnegative(),
  name: z.string().min(1),
  email: z.string().email(),
  username: z.string().min(1),
});

/** Validates list responses from user endpoints. */
export const ApiUsersSchema = z.array(ApiUserSchema);

/** Validates the count response returned by the users API. */
export const ApiUserCountSchema = z.object({
  count: z.number().int().nonnegative(),
});

/** Public user shape inferred from the runtime response schema. */
export type ApiUser = z.infer<typeof ApiUserSchema>;

/** Validates endpoints that answer with only a confirmation message, such as data reset. */
export const ApiMessageSchema = z.object({
  message: z.string().min(1),
});

/** Validates one entry of a GraphQL `errors` array. */
export const GraphqlErrorSchema = z.object({
  message: z.string().min(1),
  extensions: z.object({ code: z.string().min(1) }).optional(),
});

/** Validates the GraphQL response envelope returned for every operation. */
export const GraphqlResponseSchema = z.object({
  data: z.record(z.string(), z.unknown()).nullable().optional(),
  errors: z.array(GraphqlErrorSchema).optional(),
});

/** Public GraphQL error shape inferred from the runtime response schema. */
export type GraphqlError = z.infer<typeof GraphqlErrorSchema>;
