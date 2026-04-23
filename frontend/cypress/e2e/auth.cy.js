/**
 * Cypress E2E Tests — Authentication & Authorization (Member 4)
 */

describe("Login Page", () => {

  beforeEach(() => {
    cy.intercept("GET", "**/api/users/me", { statusCode: 401 }).as("getMe");
    cy.visit("/login");
  });

  it("should display the login page with Smart Campus branding", () => {
    cy.contains("Smart Campus Hub").should("be.visible");
  });

  it("should show Login and Register tabs", () => {
    cy.contains("Login").should("be.visible");
    cy.contains("Register").should("be.visible");
  });

  it("should show email and password fields", () => {
    cy.get("input[type='email']").should("be.visible");
    cy.get("input[type='password']").should("be.visible");
  });

  it("should show Google login button", () => {
    cy.contains("Continue with Google").should("be.visible");
  });

  it("should show Admin Login button", () => {
    cy.contains("Admin Login").should("be.visible");
  });

  it("should navigate to admin login when Admin Login is clicked", () => {
    cy.contains("Admin Login").click();
    cy.url().should("include", "/admin/login");
  });

  it("should show error for invalid credentials", () => {
    cy.intercept("POST", "**/api/auth/login", { statusCode: 401, body: { error: "Invalid email or password." } }).as("loginFail");
    cy.get("input[type='email']").type("wrong@test.com");
    cy.get("input[type='password']").type("wrongpassword");
    cy.get("button[type='submit']").click();
    cy.wait("@loginFail");
    cy.contains(/invalid|error/i).should("be.visible");
  });

  it("should toggle password visibility", () => {
    cy.get("input[type='password']").should("exist");
    cy.contains("Show").click();
    cy.get("input[type='text']").should("exist");
    cy.contains("Hide").click();
    cy.get("input[type='password']").should("exist");
  });

  it("should switch to Register mode", () => {
    cy.contains("Register").click();
    cy.contains("Create your account").should("be.visible");
  });
});

describe("Admin Login Page", () => {

  beforeEach(() => {
    cy.intercept("GET", "**/api/users/me", { statusCode: 401 }).as("getMe");
    cy.visit("/admin/login");
  });

  it("should display Administrator Access heading", () => {
    cy.contains("Administrator Access").should("be.visible");
  });

  it("should display Admin Portal badge", () => {
    cy.contains("Admin Portal").should("be.visible");
  });

  it("should have email and password fields", () => {
    cy.get("input[type='email']").should("be.visible");
    cy.get("input[type='password']").should("be.visible");
  });

  it("should have Sign In as Admin button", () => {
    cy.contains("Sign In as Admin").should("be.visible");
  });

  it("should navigate back to login when Back is clicked", () => {
    cy.contains("Back to Login").click();
    cy.url().should("include", "/login");
  });

  it("should show error for non-admin credentials", () => {
    cy.intercept("POST", "**/api/auth/login", { statusCode: 401, body: { error: "Invalid email or password." } }).as("loginFail");
    cy.get("input[type='email']").type("user@test.com");
    cy.get("input[type='password']").type("password123");
    cy.get("button[type='submit']").click();
    cy.wait("@loginFail");
    cy.contains(/invalid|error|denied/i).should("be.visible");
  });

  it("should toggle password visibility", () => {
    cy.contains("Show").click();
    cy.get("input[type='text']").should("exist");
  });

  it("should show footer security note", () => {
    cy.contains("Authorized administrators only").should("be.visible");
  });
});

describe("Protected Routes", () => {

  it("should redirect unauthenticated users from admin to login", () => {
    cy.intercept("GET", "**/api/users/me", { statusCode: 401 }).as("getMe");
    cy.clearLocalStorage();
    cy.visit("/admin/resources");
    cy.url().should("include", "/login");
  });
});
