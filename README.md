# Playwright Automation Demo
## ❓What is this Repository about?
This repository contains demo test automation scripts built with Playwright for the following websites
  - [Swag Labs: Sauce Demo](http://saucedemo.com)
  - [Cat API](http://thecatapi.com)
  - [Deque Demo Website](https://dequeuniversity.com/demo/)
  - [Lambda Test: Selenium Playground](https://www.lambdatest.com/selenium-playground)
  - [Users App](http://github.com/Srinivasaimandi/users-app-demo)

## ⌘ Getting Started
**Prerequisite**
- setup node: [Windows][1] | [Ubuntu][2] | [macOS][3]
- download [Users API](http://github.com/Srinivasaimandi/express-api-demo) and run it as documented

**Setup**
- download the repository
- open a terminal in the root of the repository and install the dependencies

    **```npm install```**

**Running the scripts**
- run the below command by updating the **SUITE_NAME** param with the below mentioned values  

  **```npx playwright test --project SUITE_NAME --headed```**  
  <br>
  - **demo** : to run all scripts
  - **ui-demo** : to run the ui scripts
  - **api-demo** : to run the api scripts
    

[1]:https://www.geeksforgeeks.org/install-node-js-on-windows/
[2]:https://www.geeksforgeeks.org/installation-of-node-js-on-linux/
[3]:https://www.geeksforgeeks.org/how-to-install-nodejs-on-macos/
