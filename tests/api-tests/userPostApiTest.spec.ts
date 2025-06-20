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
    "create a user",
    {
        tag: "@api @users-api",
        annotation: {
            type: "test",
            description: "create a user",
        },
    },
    async function () {

        const userPayLoad = {
            "name": "Samuel David",
            "username": "samueldavid",
            "password": "$test123#",
            "email": "samueldavid@xyz.com"
        }

        const response = (await httpRequestContext.post("users", {data: userPayLoad}));

        const responseBody = await response.json();
        expect(responseBody).toHaveProperty("name", userPayLoad.name);
        expect(responseBody).toHaveProperty("username", userPayLoad.username);
        expect(responseBody).toHaveProperty("password", userPayLoad.password);
        expect(responseBody).toHaveProperty("email", userPayLoad.email);
        expect(response.status()).toBe(201);
    });