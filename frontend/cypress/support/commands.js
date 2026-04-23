/**
 * loginAsAdmin — sets a fake token in localStorage AND intercepts
 * GET /users/me so the AuthContext thinks a real admin is logged in.
 * This avoids needing a live backend token.
 */
Cypress.Commands.add("loginAsAdmin", () => {
  // 1. Intercept the profile fetch that AuthContext fires on load
  cy.intercept("GET", "**/api/users/me", {
    statusCode: 200,
    body: {
      id: "admin-test-001",
      name: "Test Admin",
      email: "admin@smartcampus.com",
      roles: ["ROLE_ADMIN", "ROLE_USER"],
      active: true,
      provider: "local",
    },
  }).as("getMe");

  // 2. Set a fake token so AuthContext doesn't skip the fetch
  cy.window().then((win) => {
    win.localStorage.setItem("token", "fake-admin-jwt-token");
  });
});
