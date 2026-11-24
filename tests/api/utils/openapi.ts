import type { APIRequestContext } from '@playwright/test';
import { z } from 'zod';
import { assertApiStatus } from './parse-response.ts';

/** The subset of a JSON Schema object that the contract checks compare. */
export type JsonSchemaObject = {
  type?: string;
  properties?: Record<string, JsonSchemaObject>;
  required?: string[];
  items?: JsonSchemaObject;
};

const JsonSchemaObjectSchema: z.ZodType<JsonSchemaObject> = z.lazy(() =>
  z.object({
    type: z.string().optional(),
    properties: z.record(z.string(), JsonSchemaObjectSchema).optional(),
    required: z.array(z.string()).optional(),
    items: JsonSchemaObjectSchema.optional(),
  }),
);

const OpenApiResponseSchema = z.object({
  description: z.string().optional(),
  content: z.record(z.string(), z.object({ schema: JsonSchemaObjectSchema.optional() })).optional(),
});

const OpenApiOperationSchema = z.object({
  responses: z.record(z.string(), OpenApiResponseSchema),
  security: z.array(z.record(z.string(), z.array(z.string()))).optional(),
});

/** Validates the parts of the app's OpenAPI 3 document that the contract tests read. */
export const OpenApiDocumentSchema = z.object({
  openapi: z.string().startsWith('3.'),
  paths: z.record(z.string(), z.record(z.string(), OpenApiOperationSchema)),
  components: z.object({
    securitySchemes: z.record(
      z.string(),
      z.object({ type: z.string(), in: z.string(), name: z.string() }),
    ),
  }),
  security: z.array(z.record(z.string(), z.array(z.string()))).optional(),
});

export type OpenApiDocument = z.infer<typeof OpenApiDocumentSchema>;

/** HTTP methods that can appear as keys under an OpenAPI path item. */
const httpMethods = new Set(['get', 'put', 'post', 'delete', 'patch', 'head', 'options']);

/**
 * Fetches the OpenAPI document the app publishes through Swagger UI.
 * The app has no raw JSON endpoint; Swagger UI embeds the document in `swagger-ui-init.js`
 * as `var options = { "swaggerDoc": { ... } }`, so it is read from there.
 */
export async function fetchOpenApiDocument(request: APIRequestContext): Promise<OpenApiDocument> {
  const response = await request.get('/api-docs/swagger-ui-init.js');
  assertApiStatus(response, 200);
  const script = await response.text();

  // The object's own lines are indented, so the first unindented closing brace ends it.
  const match = /var options = (\{[\s\S]*?\n\});?\n/.exec(script);
  if (!match) {
    throw new Error('Could not find the embedded Swagger options in /api-docs/swagger-ui-init.js');
  }
  const options = z.object({ swaggerDoc: z.unknown() }).parse(JSON.parse(match[1]));
  return OpenApiDocumentSchema.parse(options.swaggerDoc);
}

/** Lists every documented operation as `METHOD /path`. */
export function listOperations(document: OpenApiDocument): string[] {
  return Object.entries(document.paths).flatMap(([path, item]) =>
    Object.keys(item)
      .filter((method) => httpMethods.has(method))
      .map((method) => `${method.toUpperCase()} ${path}`),
  );
}

/** Looks up a documented operation by its `METHOD /path` key. */
export function getOperation(document: OpenApiDocument, operation: string) {
  const [method, path] = operation.split(' ');
  const found = document.paths[path]?.[method.toLowerCase()];
  if (!found) {
    throw new Error(`The OpenAPI document has no ${operation} operation`);
  }
  return found;
}

/**
 * Compares a documented JSON response schema with the Zod schema the tests validate against.
 * Returns readable differences; an empty list means the two agree.
 * Every documented property must exist in the Zod schema with the same type, and every property
 * the Zod schema requires must be documented.
 */
export function compareWithZodSchema(documented: JsonSchemaObject, schema: z.ZodType): string[] {
  const expected = JsonSchemaObjectSchema.parse(z.toJSONSchema(schema));
  const differences: string[] = [];

  if (documented.type !== expected.type) {
    differences.push(
      `type is "${documented.type}" in the document, "${expected.type}" in the test`,
    );
  }

  const documentedProperties = documented.properties ?? {};
  const expectedProperties = expected.properties ?? {};

  for (const [name, property] of Object.entries(documentedProperties)) {
    const testProperty = expectedProperties[name];
    if (!testProperty) {
      differences.push(`documented property "${name}" is not in the test schema`);
    } else if (property.type !== testProperty.type) {
      differences.push(
        `property "${name}" is "${property.type}" in the document, "${testProperty.type}" in the test`,
      );
    }
  }

  for (const name of expected.required ?? []) {
    if (!(name in documentedProperties)) {
      differences.push(`required test property "${name}" is not documented`);
    }
  }

  return differences;
}
