import { Page, Locator } from "@playwright/test";

/**
 * @author: srinivasaimandi
 * @description: contains the locators and functions of ecommerce playground page
 */
export class EcommercePlaygroundPage {
    page: Page;
    lblMyAccount: Locator;
    lblLogin: Locator;
    lblDashboard: Locator;
    lblContinue: Locator;
    btnContinue: Locator;
    chkAgreeTerms: Locator;
    lblAgreeTerms: Locator;
    iptEmail: Locator;
    iptPassword: Locator;
    btnSubmit: Locator;

    constructor(page: Page) {
        this.page = page;
        this.lblMyAccount = page.locator("xpath=.//span[@class='title' and contains(text(),'My account')]");
        this.lblLogin = page.locator("xpath=.//span[@class='title' and contains(text(),'Login')]");
        this.lblDashboard = page.locator("xpath=.//span[@class='title' and contains(text(),'Dashboard')]");
        this.lblContinue = page.locator("xpath=.//a[@class='btn btn-primary' and text()='Continue']");
        this.btnContinue = page.locator("xpath=.//div[input[@id='input-agree']]/following::input");
        this.chkAgreeTerms = page.locator("#input-agree");
        this.lblAgreeTerms = page.locator("xpath=.//div[input[@id='input-agree']]/label");
        this.iptEmail = page.locator("#input-email");
        this.iptPassword = page.locator("#input-password");
        this.btnSubmit = page.locator("xpath=.//div[h2[text()='Returning Customer']]//input[@type='submit']");
    }

    async load(){
        await this.page.goto("https://ecommerce-playground.lambdatest.io/");
    }

    iptFormField = (labelName: string) => {
        return this.page.locator(`xpath=.//label/following::input[@placeholder='${labelName}']`);
    };
    radioBtnFormField = (radioBtnLabel: string) => {
        return this.page.locator(`#input-newsletter-${radioBtnLabel.toLowerCase()}`);
    };
}