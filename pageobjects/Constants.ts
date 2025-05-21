export const TIMEOUT: number = 5000;
export const web_ui_automation = {
  sauce_labs: {
    base_url: "https://www.saucedemo.com",
    users: {
      "standard user": "standard_user",
      "locked out user": "locked_out_user",
      "problem user": "problem_user",
      "performance glitch user": "performance_glitch_user",
      "error user": "error_user",
      "visual user": "visual_user",
    },
    password: "secret_sauce",
    title: "Swag Labs",
    // headings of all pages
    heading: {
      products: "Products",
      checkoutInformationPage: "Checkout: Your Information",
      checkoutOverviewPage: "Checkout: Overview",
    },
    // labels of hamburger items
    nav_items: {
      allItems: "All Items",
      about: "About",
      logout: "Logout",
      resetAppState: "Reset App State",
    },
  },
};

export const api_automation = {
  cat_api: {
    base_url: "https://api.thecatapi.com/v1",
    api_key: "live_RZPyVEv0nGUdmKYxu3WAOzz9bnymqeGukgS8hUqTx4ArYH6tdugzOgdoGGbBPdR8",
  }
}