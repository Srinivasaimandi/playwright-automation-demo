import { test, request, expect, APIRequestContext } from "@playwright/test";
import * as CONSTANTS from "@pageobjects/Constants";

/**
 * @author: srinivasaimandi
 */

test.skip("graphql test 1", 
    {
        tag: "@api @graphql-query @users-graphql",
        annotation: {
            type: "test",
            description: "fetch the username and password for all existing users using graphql query"
        }
    },
    async function ({ request }) {
    const response = await request.post(CONSTANTS.USERS_API.GRAPHQL_URL, {
        data: {
            query: `
                query Users {
                        users {
                            username
                            password
                        }
                    }
        ` }
    });
    const responseBody = await response.json();
    let usersArray = responseBody.data.users;
    usersArray.forEach(async function (element: any) {
        await console.log(element);
    });
});