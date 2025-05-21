import fs from "fs";
import * as path from "path";
import excelJs from "exceljs";

import { UploadDownloadFiles } from "../../pageobjects/tutorials/ActionsPage.pageobject";

let filePath = path.join(process.cwd(), "resources/test_files/");

/**
 * reading text file
 */
fs.readFile(filePath + UploadDownloadFiles.text, "utf8", function (err, data) {
  if (err) return console.error("error reading file");
  console.log(data);
});

const wb = new excelJs.Workbook();
await wb.xlsx.readFile(filePath + UploadDownloadFiles.xlsx);
