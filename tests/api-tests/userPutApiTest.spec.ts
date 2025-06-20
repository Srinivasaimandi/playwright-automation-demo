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
    "update a user",
    {
        tag: "@api @users-api",
        annotation: {
            type: "test",
            description: "update a user",
        },
    },
    async function () {

        const userPayLoad = {
            "email": "johndoe@xyz.com"
        }

        const response = (await httpRequestContext.put("users/1", {data: userPayLoad}));
        const responseBody = await response.json();
        
        expect(response.status()).toBe(200);
        expect(responseBody).toHaveProperty("email", userPayLoad.email);
    });