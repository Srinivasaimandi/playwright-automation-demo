import { Page, Locator } from "@playwright/test"
import * as homePageLocStrings from "@locators/users_app/HomePage.locStrings.json";
import { LocatorBuilder } from "@utils/LocatorBuilder";

/**
 * @author: srinivasaimandi
 * @description: contains the locators and functions of ausers-app home page
 */

export class UsersHomePage {
    hlUI!: Locator;
    hlSwaggerDocs!: Locator;
    hlGraphQl!: Locator;

    constructor(public page: Page) {
        Object.keys(homePageLocStrings).forEach(key => {
            const locatorConfig = homePageLocStrings[key as keyof typeof homePageLocStrings];
            const locator: Locator = new LocatorBuilder(page).buildElementWithAlternates(locatorConfig);
            (this as any)[key] = locator;
        })
    }
}