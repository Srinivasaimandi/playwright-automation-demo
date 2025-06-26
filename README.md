# Playwright Automation Demo
## ❓What is this Repository about?
This repository contains demo test automation scripts built with Playwright for the following websites
  - http://saucedemo.com
  - http://thecatapi.com
  - https://dequeuniversity.com/demo/
  - https://www.lambdatest.com/selenium-playground
  - http://github.com/Srinivasaimandi/express-api-demo

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

## ☑️ Scenarios Covered(in-progress)

| #  | Endpoint                     | Method | Input / Query / Body                                                                  | Scenario / Condition                                      | Expected Result                                               | Status Code |
|----|------------------------------|--------|----------------------------------------------------------------------------------------|------------------------------------------------------------|----------------------------------------------------------------|-------------|
| 1  | `/users`                    | GET    | –                                                                                      | Users present in data                                       | List of users returned                                         | 200         |
| 2  | `/users`                    | GET    | –                                                                                      | No users present                                            | Empty list                                                     | 204         |
| 3  | `/users/search`            | GET    | `?name=John`                                                                           | Name matches existing user                                  | List of users with "John" in name                             | 200         |
| 4  | `/users/search`            | GET    | `?email=test@example.com`                                                              | Email matches existing user                                 | User(s) with matching email                                   | 200         |
| 5  | `/users/search`            | GET    | `?name=Unknown`                                                                         | No match                                                    | Empty list                                                     | 204         |
| 6  | `/users/search`            | GET    | `?name=` (empty query)                                                                 | No filters applied                                          | All users                                                      | 200         |
| 7  | `/users/:id`               | GET    | `id = 1`                                                                               | Valid ID                                                    | Specific user object                                           | 200         |
| 8  | `/users/:id`               | GET    | `id = 999`                                                                             | Invalid/non-existing ID                                     | User not found message                                         | 404         |
| 9  | `/users`                   | POST   | Valid user object                                                                      | All fields valid                                            | New user created                                               | 201         |
| 10 | `/users`                   | POST   | Missing one or more fields                                                             | Validation failure                                          | Error: All fields required                                     | 400         |
| 11 | `/users`                   | POST   | Duplicate email                                                                        | Conflict with existing email                                | Error: Email already exists                                    | 400         |
| 12 | `/users`                   | POST   | Duplicate username                                                                     | Conflict with existing username                             | Error: Username already exists                                 | 400         |
| 13 | `/users`                   | POST   | Invalid email format                                                                   | Email without @ or domain                                   | Error or validation failure (if enforced)                      | 400         |
| 14 | `/users`                   | POST   | Password too short (e.g., 2 chars)                                                     | Password policy violated                                    | Validation error (if implemented)                              | 400         |
| 15 | `/users/bulk`              | POST   | Valid array of users                                                                   | No duplicates                                               | All users created                                              | 201         |
| 16 | `/users/bulk`              | POST   | One user missing fields                                                                | Partial invalid input                                       | Error: All fields required                                     | 400         |
| 17 | `/users/bulk`              | POST   | One user has duplicate username                                                        | Conflict with existing user                                 | Error: Username already exists                                 | 400         |
| 18 | `/users/bulk`              | POST   | Empty array                                                                            | No users to add                                             | No action, error or 201 depending on logic                     | 400 / 201   |
| 19 | `/users/:id`               | PUT    | Valid ID, valid partial update `{name: "New Name"}`                                   | Update some fields                                          | Updated user object                                            | 200         |
| 20 | `/users/:id`               | PUT    | Valid ID, full update                                                                  | Update all fields                                           | Updated user                                                   | 200         |
| 21 | `/users/:id`               | PUT    | Invalid ID                                                                             | User not found                                              | Error: User not found                                          | 404         |
| 22 | `/users/:id`               | PUT    | ID valid, but body empty                                                               | No update data                                              | Original data preserved or updated with no-op                  | 200         |
| 23 | `/users/:id`               | PUT    | Invalid email in body                                                                  | Email format invalid                                        | Validation error (if enforced)                                 | 400         |
| 24 | `/users/:id`               | PUT    | Email/username already used by another user                                            | Duplicate conflict                                           | Error: already exists                                          | 400         |
| 25 | `/users/:id`               | DELETE | Valid user ID                                                                          | User exists                                                 | User deleted                                                   | 204         |
| 26 | `/users/:id`               | DELETE | Non-existent user ID                                                                   | User not found                                              | Error: User not found                                          | 404         |
| 27 | `/users/count`             | GET    | –                                                                                      | Users present                                               | JSON `{count: N}`                                              | 200         |
| 28 | `/users/count`             | GET    | No users                                                                               | Empty list                                                  | `{count: 0}`                                                   | 200         |
| 29 | `/reset`                   | POST   | –                                                                                      | Valid backup file                                           | Data reset                                                     | 200         |
| 30 | `/reset`                   | POST   | Backup file corrupted                                                                  | Error reading file                                          | Internal Server Error                                          | 500         |
| 31 | `/reset`                   | POST   | Backup file missing                                                                    | File not found                                              | Internal Server Error                                          | 500         |
| 32 | `/users/:id`               | GET    | `id = "abc"` (non-numeric)                                                             | Invalid ID format                                           | Error or 404 (depending on parse logic)                        | 404         |
| 33 | `/users`                   | POST   | Script tags in `name` field (e.g. `<script>alert(1)</script>`)                         | XSS injection attempt                                       | Input sanitized or stored safely                               | 201 (or filtered) |
| 34 | `/users/:id`               | DELETE | Already deleted ID                                                                     | User no longer exists                                       | 404 Not Found                                                  | 404         |
| 35 | `/users`                   | POST   | Very large payload (10MB+)                                                             | Test backend limits                                         | Request rejected or accepted based on backend size config      | 413 / 201   |


[1]:https://www.geeksforgeeks.org/install-node-js-on-windows/
[2]:https://www.geeksforgeeks.org/installation-of-node-js-on-linux/
[3]:https://www.geeksforgeeks.org/how-to-install-nodejs-on-macos/
