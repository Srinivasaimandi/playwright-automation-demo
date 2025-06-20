import { test, request, expect, APIRequestContext } from "@playwright/test";

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

        const response = (await httpRequestContext.post("users, {data: userPayLoad}"));

        expect(response.status()).toBe(200);
        const responseBody = await response.json();
        await expect(response.status()).toBe(200);
        expect(responseBody).toHaveProperty("name", userPayLoad.name);
        expect(responseBody).toHaveProperty("username", userPayLoad.username);
        expect(responseBody).toHaveProperty("password", userPayLoad.password);
        expect(responseBody).toHaveProperty("email", userPayLoad.email);
        expect(response.status).toBe(201);
    });