# What is this Repository about?
This repo contains demo test automation code written using playwright for the following websites:
  - http://saucedemo.com
  - https://the-internet.herokuapp.com
  - http://thecatapi.com

**Summary of scenarios covered:**
- to be filled, in-progress

# How do I run these scripts
**Prerequisite**
- setup node [Windows][1] | [Ubuntu][2] | [macOS][3]

**Setup**
- open terminal in the repository path and run the below command
> npm install

**Running the scripts**
- run the below command by updating the SUITE_NAME with the respective values 
  - demo : to run all scripts
  - ui-demo : to run the ui scripts
  - api-demo : to run the api scripts
> npx playwright test --project SUITE_NAME --headed


[1]:https://www.geeksforgeeks.org/install-node-js-on-windows/
[2]:https://www.geeksforgeeks.org/installation-of-node-js-on-linux/
[3]:https://www.geeksforgeeks.org/how-to-install-nodejs-on-macos/