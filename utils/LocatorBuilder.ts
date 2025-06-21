import { Locator, Page } from "@playwright/test";

/**
 * @author: srinivasaimandi
 * @description: locator builder for all pageobjects
 */

export class LocatorBuilder {

    page: Page;

    constructor(page: Page) {
        this.page = page;
    }
    buildElement(elementLocator: any): Locator {
        // console.log(`Element locator type: ${elementLocator.locatorType}`)
        if (elementLocator.locatorType === "xpath" || elementLocator.locatorType === "css") {
            // console.log(`Returning locator for ${elementLocator.locator}`)
            return this.page.locator(elementLocator.locator);
        } else if (elementLocator.locatorType === "role") {
            // console.log(`Returning locator for ${elementLocator.locator}`)
            return this.page.getByRole(elementLocator.locator, elementLocator.locatorOptions);
        } else{
            // console.log("entererd final else block")
            return this.page.locator(elementLocator.locator);
        }
        
    }
}