import { test, request, expect, APIRequestContext } from "@playwright/test";
import Ajv from "ajv";

/**
 * @author: srinivasaimandi
 */

const ENDPOINT = "http://localhost:9899/api/";
const OPTIONS = {
    baseURL: ENDPOINT,
    extraHTTPHeaders: {
        "Content-Type": "application/json",
        "x-api-key": "b7f2e1a4-9c3d-4e8a-8f2e-2c1a7d6b5e9c",
    },
};
const RESPONSE_STATUS = {
    OK: "OK",
    BAD_REQUEST: "Bad Request",
};

const responseJsonSchema = {
  "type": "object",
  "properties": {
    "id": {
      "type": "number"
    },
    "name": {
      "type": "string"
    },
    "email": {
      "type": "string"
    },
    "username": {
      "type": "string"
    },
    "password": {
      "type": "string"
    }
  }
};

// run-time variables
let httpRequestContext: APIRequestContext;
const ajv = new Ajv();

/**
 * setting up users api context
 */
test.beforeAll(async function () {
    // creating a new context using options
    httpRequestContext = await request.newContext(OPTIONS);
});

/**
 * disposing the users api context
 */
test.afterAll(async ({ }) => {
    // dispose all responses
    await httpRequestContext.dispose();
});

test(
    "fetch a user by id",
    {
        tag: "@api @users-api",
        annotation: {
            type: "test",
            description: "fetch a user by id",
        },
    },
    async function () {
        const response = await httpRequestContext.get("users/3");
        expect(response.status()).toBe(200);
        const responseBody = await response.json();

        // assertions
        expect(responseBody).toHaveProperty("id", 3);
        expect(responseBody).toHaveProperty("name", "Srinivasa Rao Imandi");
        expect(responseBody).toHaveProperty("username", "srinivasaimandi");
        expect(responseBody).toHaveProperty("password", "$test123#");
        expect(responseBody).toHaveProperty("email", "srinivasaimandi@example.com");
        
        // validate response body against JSON schema   
        const validate = ajv.compile(responseJsonSchema);
        const valid = validate(responseBody);
        expect(valid).toBe(true);
        
        await console.log("User fetched successfully:", responseBody);
    });