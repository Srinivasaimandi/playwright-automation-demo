import test, { Page } from "@playwright/test";
import { LoginPage } from "../../pageobjects/LoginPage.pageobject";
import * as Constants from "../../pageobjects/Constants";

let page: Page;
let loginPage: LoginPage;

test("sauce demo global setup", { tag: "@sauce_demo @setup", annotation: { type: "setup", description: "sauce demo global setup" } }, async function ({ browser }) {
    page = await browser.newPage();
    loginPage = new LoginPage(page);
    loginPage.load();
    loginPage.login(Constants.web_ui_automation.sauce_labs.users["standard user"], Constants.web_ui_automation.sauce_labs.password);
    await page.waitForTimeout(5000);
    await loginPage.icoHamburger.click();
    await loginPage.hlResetAppState.click();
    await page.close();
})