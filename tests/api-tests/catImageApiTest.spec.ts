import { faker } from "@faker-js/faker";
import { test, request, expect } from "@playwright/test";
import path from "path";
import * as fs from "fs";
import * as Constants from "../../pageobjects/Constants";

/**
 * @author: srinivasaimandi
 */

const ENDPOINT = Constants.api_automation.cat_api.base_url;
const API_KEY = Constants.api_automation.cat_api.api_key;
const OPTIONS = {
  baseURL: ENDPOINT,
  extraHTTPHeaders: {
    "Content-Type": "application/json",
    "x-api-key": API_KEY,
  },
};
const reponseStatus = {
  OK: "OK",
  BAD_REQUEST: "Bad Request",
};

// run-time variables
let catApiContext;
let catImageId;
let catImageUrl;

test.describe("cat api dependent tests", async function () {
  test.describe.configure({ mode: "serial" });

  /**
   * setting up cat api context
   */
  test.beforeAll(async function () {
    // creating a new context using options
    catApiContext = await request.newContext(OPTIONS);
  });

  /**
   * disposing the cat api context
   */
  test.afterAll(async ({ }) => {
    // dispose all responses
    await catApiContext.dispose();
  });

  test(
    "test 0",
    {
      tag: "@api @cat-api @independent",
      annotation: {
        type: "test",
        description: "fetch a random cat image, params as object",
      },
    },
    async function () {
      const catParams = {
        size: "med",
        mime_types: "jpg",
        format: "json",
        has_breeds: "true",
        order: "random",
        page: 0,
        limit: 1,
      };
      const fetchImageResponse = await catApiContext.get(`v1/images/search`, {
        params: catParams,
      });
      await expect(fetchImageResponse.ok()).toBeTruthy();
      await expect(await fetchImageResponse.statusText()).toEqual(
        reponseStatus.OK
      );
    }
  );

  test(
    "test 1",
    {
      tag: "@api @cat-api @dependent",
      annotation: {
        type: "test",
        description: "fetch a random cat image, params as URLSearchParams",
      },
    },
    async function () {
      const catParams = new URLSearchParams();
      catParams.set("size", "med");
      catParams.set("mime_types", "jpg");
      catParams.set("format", "json");
      catParams.set("has_breeds", "true");
      catParams.set("order", "random");
      catParams.set("page", "0");
      catParams.set("limit", "1");

      const fetchImageResponse = await catApiContext.get(`v1/images/search`, {
        params: catParams,
      });
      await expect(fetchImageResponse.ok()).toBeTruthy();
      await expect(await fetchImageResponse.statusText()).toEqual(
        reponseStatus.OK
      );
      let responseBody = await fetchImageResponse.json();
      catImageId = await responseBody[0].id;
      catImageUrl = await responseBody[0].url;
    }
  );

  test(
    "test 2",
    {
      tag: "@api @cat-api @dependent",
      annotation: {
        type: "test",
        description: "fetch a cat image using id",
      },
    },
    async function () {
      const fetchImageResponse = await catApiContext.get(
        `v1/images/${catImageId}`
      );
      await expect(fetchImageResponse.ok()).toBeTruthy();
      let responseBody = await fetchImageResponse.json();
      await expect(await responseBody.url).toEqual(catImageUrl);
      await expect(await fetchImageResponse.statusText()).toEqual(
        reponseStatus.OK
      );
    }
  );

  test(
    "test 3",
    {
      tag: "@api @cat @independent",
      annotation: {
        type: "test",
        description: "fetch a cat image using invalid image id",
      },
    },
    async function () {
      let fetchImageResponse = await catApiContext.get(
        `v1/images/${faker.string.alphanumeric(6)}`
      );
      await expect(await fetchImageResponse.status()).toBe(400);
      await expect(await fetchImageResponse.statusText()).toEqual(
        reponseStatus.BAD_REQUEST
      );
    }
  );

  test.skip(
    "test 4",
    {
      tag: "@api @cat @independent",
      annotation: {
        type: "test",
        description: "upload a cat image using the post request",
      },
    },
    async function () {
      await catApiContext.dispose();
      let imagePath = path.resolve(
        process.cwd(),
        "resources/test_files",
        "pw_upload_image.jpg"
      );

      let uploadImageOptions = OPTIONS;
      uploadImageOptions.extraHTTPHeaders["Content-Type"] =
        "multipart/form-data";
      catApiContext = await request.newContext(uploadImageOptions);
      let uploadImageResponse = await catApiContext.post("v1/images/upload", {
        data: {
          file: {
            name: imagePath,
            mimeType: "image/jpg",
            buffer: fs.readFileSync(imagePath),
          },
        },
      });
      await console.log((await uploadImageResponse.body()).toString());
    }
  );
});
