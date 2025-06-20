import { faker } from "@faker-js/faker";
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
let userDetails: any = {}
let createUserPayLoad: any = {}

test.describe("users api tests", async function () {
    test.describe.configure({ mode: "serial" });

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
        "test 1",
        {
            tag: "@api @users-api",
            annotation: {
                type: "test",
                description: "fetch all users",
            },
        },
        async function () {
            const response = await httpRequestContext.get("users");
            expect(response.status()).toBe(200);
            const responseBody = await response.json();

            // assigning the count of returned users
            let count = responseBody.length;
            userDetails["count"] = count;

            // fetching random user and storing it in userDetails variable
            let randomIndex = getRandomIndex(count);
            userDetails = responseBody[randomIndex];

            // validating the response body details
            expect(responseBody).toBeDefined();
            expect(responseBody.length).toBeGreaterThan(0);
        });

    test("test 2",
        {
            tag: "@api @users-api",
            annotation: {
                type: "test",
                description: "get the count of users"
            },
        },
        async function () {
            const response = await httpRequestContext.get("users/count");
            expect(response.status()).toBe(200);
            const responseBody = await response.json();
            expect(responseBody.count).toBeGreaterThan(2);
        });

    test("test 3",
        {
            tag: "@api @users-api",
            annotation: {
                type: "test",
                description: "fetch user by name"
            },
        },
        async function () {
            const response = await httpRequestContext.get("users/search", { params: { "name": userDetails.name } });
            expect(response.status()).toBe(200);
            const responseBody = await response.json();
            expect(responseBody[0].name).toEqual(userDetails.name);
            expect(responseBody[0].username).toEqual(userDetails.username);
            expect(responseBody[0].password).toEqual(userDetails.password);
            expect(responseBody[0].email).toEqual(userDetails.email);
        });

    test("test 4",
        {
            tag: "@api @users-api",
            annotation: {
                type: "test",
                description: "fetch user by id"
            },
        },
        async function () {
            await console.log(userDetails.id);
            const response = await httpRequestContext.get(`users/${userDetails.id}`);
            const responseBody = await response.json();
            expect(responseBody.name).toEqual(userDetails.name);
            expect(responseBody.username).toEqual(userDetails.username);
            expect(responseBody.password).toEqual(userDetails.password);
            expect(responseBody.email).toEqual(userDetails.email);
        });

    test("test 5",
        {
            tag: "@api @users-api",
            annotation: {
                type: "test",
                description: "create a user"
            },
        },
        async function () {
            let firstName = await faker.person.firstName();
            let lastName = await faker.person.lastName();
            createUserPayLoad = {
                "name": `${firstName} ${lastName}`,
                "username": `${firstName}${lastName}`.toLowerCase(),
                "password": "$test123#",
                "email": `${firstName}${lastName}`.toLowerCase() + "@example.com",
            }

            const response = (await httpRequestContext.post("users", { data: createUserPayLoad }));

            const responseBody = await response.json();
            createUserPayLoad["id"] = responseBody.id;
            expect(responseBody).toHaveProperty("name", createUserPayLoad.name);
            expect(responseBody).toHaveProperty("username", createUserPayLoad.username);
            expect(responseBody).toHaveProperty("password", createUserPayLoad.password);
            expect(responseBody).toHaveProperty("email", createUserPayLoad.email);
            expect(response.status()).toBe(201);
        });

    test("test 6",
        {
            tag: "@api @users-api",
            annotation: {
                type: "test",
                description: "update a user"
            },
        },
        async function () {
            const updateUserPayload = {
                "email": createUserPayLoad.username + "@xyz.com"
            }

            const response = (await httpRequestContext.put(`users/${createUserPayLoad.id}`, { data: updateUserPayload }));
            const responseBody = await response.json();

            expect(responseBody).toHaveProperty("email", updateUserPayload.email);
            expect(response.status()).toBe(200);
        });

    test(
        "test 7",
        {
            tag: "@api @users-api",
            annotation: {
                type: "test",
                description: "delete a user",
            },
        },
        async function () {
            const response = (await httpRequestContext.delete(`users/${createUserPayLoad.id}`));
            expect(response.status()).toBe(204);
        });
});

function getRandomIndex(length: number): number {
    // Generate a random number between 0 (inclusive) and length (exclusive)
    const randomIndex = Math.floor(Math.random() * length);
    return randomIndex;
}