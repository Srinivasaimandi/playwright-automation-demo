import { test, request, expect, APIRequestContext } from "@playwright/test";
import * as CONSTANTS from "@pageobjects/Constants";

/**
 * @author: srinivasaimandi
 */

const ENDPOINT = CONSTANTS.USERS_API.BASE_URL;
const API_KEY = CONSTANTS.USERS_API.API_KEY;
const OPTIONS = {
    baseURL: ENDPOINT,
    extraHTTPHeaders: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
    },
};

// run-time variables
let httpRequestContext: APIRequestContext;

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
    "delete a user",
    {
        tag: "@api @users-api",
        annotation: {
            type: "test",
            description: "delete a user",
        },
    },
    async function () {

        const response = (await httpRequestContext.delete("users/2"));
        expect(response.status()).toBe(204);
    });