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

    buildElementWithAlternates(elementLocator: any): Locator {
        // Build the main locator
        let mainLocator = this._buildSingleLocator(elementLocator);

        // If alternates exist, combine them
        if (elementLocator.alternates && Array.isArray(elementLocator.alternates) && elementLocator.alternates.length > 0) {
            let alternateLocators = elementLocator.alternates.map((alt: any) => this._buildSingleLocator(alt));
            // Combine all locators using .or()
            return alternateLocators.reduce((acc: Locator, altLocator: Locator) => acc.or(altLocator), mainLocator);
        }
        return mainLocator;
    }

    private _buildSingleLocator(elementLocator: any): Locator {
        switch (elementLocator.locatorType) {
            case "xpath":
                return this.page.locator(`xpath=${elementLocator.locator}`);
            case "css":
                return this.page.locator(elementLocator.locator);
            case "role":
                return this.page.getByRole(elementLocator.locator, elementLocator.locatorOptions);
            case "text":
                return this.page.getByText(elementLocator.locator, elementLocator.locatorOptions);
            case "placeholder":
                return this.page.getByPlaceholder(elementLocator.locator, elementLocator.locatorOptions);
            case "label":
                return this.page.getByLabel(elementLocator.locator, elementLocator.locatorOptions);
            case "alt":
                return this.page.getByAltText(elementLocator.locator, elementLocator.locatorOptions);
            case "testId":
                return this.page.getByTestId(elementLocator.locator);
            default:
                return this.page.locator(elementLocator.locator);
        }
    }
}