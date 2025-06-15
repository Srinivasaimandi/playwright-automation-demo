import { BrowserContext, expect, Page, test } from "@playwright/test";

/**
 * @author: srinivasaimandi
 * @description: Click test demo for UI tests
 * @note: This test is a demo for click actions in UI tests.
 * It includes various click actions on different elements and validates the results.
 * It is not intended to be run as a standalone test, but rather as a reference for click actions in UI tests.
 */

let page: Page;
let context: BrowserContext;

test.beforeAll(async function ({ browser }) {
    context = await browser.newContext();
    page = await context.newPage();
});

test.afterAll(async function () {
    // Reset the page after each test
    await context.close();
});

test("simple form test", {
    tag: "@actions-test @reg",
    annotation: {
        type: "test",
        description: "click test on a simple demo form",
    }
}, async function () {
    let sample_message: string = "Hello, LambdaTest!";
    await page.goto("https://www.lambdatest.com/selenium-playground/simple-form-demo");
    await page.waitForURL("**/simple-form-demo");
    await page.locator("#user-message").first().fill(sample_message);
    await page.locator("#showInput").click();
    const message = await page.locator("#message").first().textContent();
    await expect(message).toBe(sample_message);
})

test("checkbox demo test", {
    tag: "@actions-test @reg",
    annotation: {
        type: "test",
        description: "click test on a checkbox",
    }
}, async function () {
    await page.goto("https://www.lambdatest.com/selenium-playground/checkbox-demo");
    await page.waitForURL("**/checkbox-demo");
    const chkbox = page.locator("xpath=.//h2[text()='Single Checkbox Demo']/following-sibling::label/input");
    await chkbox.check();
    await expect(chkbox).toBeChecked();
    const message = await page.locator("xpath=.//h2[text()='Single Checkbox Demo']/following-sibling::p").textContent();
    await expect(message).toBe("Checked!");
}
)

test("radio button demo test", {
    tag: "@actions-test @reg",
    annotation: {
        type: "test",
        description: "click test on a radio button",
    }
}, async function () {
    await page.goto("https://www.lambdatest.com/selenium-playground/radiobutton-demo");
    await page.waitForURL("**/radiobutton-demo");
    await page.waitForTimeout(5000);
    const radio = page.locator("xpath=.//label[text()='Male']/input").first();
    await radio.check();
    await expect(radio).toBeChecked();
    await page.locator("#buttoncheck").click();
    const message = await page.locator("xpath=.//label[text()='Male']/following::p").first().textContent();
    await expect(message).toBe("Radio button 'Male' is checked");
})

test("mouse hover test", {
    tag: "@actions-test @reg",
    annotation: {
        type: "test",
        description: "hover test on a button for change in color",
    }
}, async function () {
    await page.goto("https://www.lambdatest.com/selenium-playground/hover-demo");
    await page.waitForURL("**/hover-demo");
    const hoverElement = await page.locator("xpath=.//div[h2[text()='CSS Hover Effects on Button']]/div[1]/div[1]");
    const bgColorBeforeHover = await hoverElement.evaluate(el => window.getComputedStyle(el).getPropertyValue('background-color'));
    console.log("Background color before hover:", bgColorBeforeHover);
    expect(bgColorBeforeHover).toBe("rgb(40, 167, 69)");
    await hoverElement.hover();
    await page.waitForTimeout(2000);
    const bgColorAfterHover = await hoverElement.evaluate(el => window.getComputedStyle(el).getPropertyValue('background-color'));
    console.log("Background color after hover:", bgColorAfterHover);
    expect(bgColorAfterHover).toBe("rgb(255, 255, 255)");
})

/**
 * assertions pending
 */
test.skip("auto scrolling in playwright", {
    tag: "@actions-test @reg",
    annotation: {
        type: "test",
        description: "scroll to a specific element without using scroll utils"
    }
}, async function () {
    await page.goto("https://www.lambdatest.com/selenium-playground/hover-demo");
    await page.waitForURL("**/hover-demo");
    // await page.screenshot({path: "baseline.png"});
    await page.locator(".s__column3 img").hover();
    // await expect(page).not.toHaveScreenshot("baseline.png");
})

test("simple form test using co-ordinates", {
    tag: "@actions-test @reg",
    annotation: {
        type: "test",
        description: "click test using co-ordinates",
    }
}, async function () {
    let sample_message: string = "Hello, LambdaTest!";
    await page.goto("https://www.lambdatest.com/selenium-playground/simple-form-demo");
    await page.waitForURL("**/simple-form-demo");
    const element = page.locator("#user-message").first();
    const box = await element.boundingBox();

    if (box) {
        await page.mouse.click(box.x + 10, box.y + 10);
        await element.fill("Clicked using coordinates!");
        await page.locator("#showInput").click();
        const message = await page.locator("#message").first().textContent();
        await expect(message).toBe("Clicked using coordinates!");
    } else {
        throw new Error("Element bounding box not found");
    }
}
)

test("double click test", {
    tag: "@actions-test @reg",
    annotation: {
        type: "test",
        description: "double click test on a button",
    }
}, async function () {
    await page.goto("https://www.lambdatest.com/selenium-playground/checkbox-demo");
    await page.waitForURL("**/checkbox-demo");
    const chkbox = page.locator("xpath=.//h2[text()='Single Checkbox Demo']/following-sibling::label/input").first();
    await chkbox.dblclick();
    await expect(await page.locator("xpath=.//h2[text()='Single Checkbox Demo']/following-sibling::p")).not.toBeVisible();
}
)

test("click and drag test", {
    tag: "@actions-test @reg",
    annotation: {
        type: "test",
        description: "click and hold test on a button",
    }
}, async function () {
    await page.goto("https://www.lambdatest.com/selenium-playground/drag-drop-range-sliders-demo");
    await page.waitForURL("**/drag-drop-range-sliders-demo");
    const slider = page.locator("#slider1 input.sp__range");
    const dragItemBoundingBox = await slider.boundingBox();

    let dragItemCenterX, dragItemCenterY;
    if (!dragItemBoundingBox) {
        throw new Error("Could not find bounding box for the slider element.");
    } else {
        dragItemCenterX = dragItemBoundingBox.x + dragItemBoundingBox.width / 2;
        dragItemCenterY = dragItemBoundingBox.y + dragItemBoundingBox.height / 2;
    }
    await page.mouse.move(dragItemCenterX, dragItemCenterY);
    await page.mouse.down();
    await page.mouse.move(dragItemCenterX + 100, dragItemCenterY);
    await page.mouse.up();
    await expect(await page.locator("#range").textContent()).toBe("71");
}
)

test("drag and drop test", {
    tag: "@actions-test @reg",
    annotation: {
        type: "test",
        description: "drag and drop test on a draggable element",
    }
}, async function () {
    await page.goto("https://www.lambdatest.com/selenium-playground/drag-and-drop-demo");
    await page.waitForURL("**/drag-and-drop-demo");
    const source = page.locator("#todrag > span").first();
    const target = page.locator("#mydropzone").first();
    await source.dragTo(target);
    await expect(await page.locator("#droppedlist span").textContent()).toContain("Draggable 1");
}
)