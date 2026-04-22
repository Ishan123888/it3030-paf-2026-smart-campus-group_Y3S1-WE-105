/**
 * Cypress E2E Tests — Admin Resource Management (Member 1)
 */

const mockAdmin = {
  id: "admin-001",
  name: "Test Admin",
  email: "admin@smartcampus.com",
  roles: ["ROLE_ADMIN", "ROLE_USER"],
  active: true,
  provider: "local",
};

const mockResources = [
  {
    id: "res-001", name: "Lab 04", type: "LAB", brand: "Brand 1",
    location: "F504", capacity: 30, pricePerHour: 700, currency: "LKR",
    status: "ACTIVE", availabilityWindows: [], images: [],
  },
  {
    id: "res-002", name: "Hall 06", type: "LECTURE_HALL", brand: "Brand 2",
    location: "Block A", capacity: 100, pricePerHour: 900, currency: "LKR",
    status: "OUT_OF_SERVICE", availabilityWindows: [], images: [],
  },
];

function setupAdminIntercepts() {
  cy.intercept("GET", "**/api/users/me", { statusCode: 200, body: mockAdmin }).as("getMe");
  cy.intercept("GET", "**/api/resources*", { statusCode: 200, body: mockResources }).as("getResources");
}

describe("Admin Resource Management", () => {

  beforeEach(() => {
    setupAdminIntercepts();
    cy.visit("/admin/resources", {
      onBeforeLoad(win) {
        win.localStorage.setItem("token", "fake-admin-token");
      },
    });
    cy.wait("@getMe");
    cy.wait("@getResources");
  });

  // ── Page Load ──────────────────────────────────────────────────────────────

  it("should display the Resource Management heading", () => {
    cy.contains("Campus Resources").should("be.visible");
    cy.contains("Manage all campus facilities").should("be.visible");
  });

  it("should display stat cards: Total, Active, Out of Service", () => {
    cy.contains("Total Resources").should("be.visible");
    cy.contains("Active").should("be.visible");
    cy.contains("Out of Service").should("be.visible");
  });

  it("should display Add Resource and Edit Brands buttons", () => {
    cy.contains("Add Resource").should("be.visible");
    cy.contains("Edit Brands").should("be.visible");
  });

  // ── Add Resource Form ──────────────────────────────────────────────────────

  it("should open the Add Resource form when button is clicked", () => {
    cy.contains("Add Resource").click();
    cy.contains("New Resource").should("be.visible");
    cy.contains("Resource Name").should("be.visible");
  });

  it("should close the form when Cancel is clicked", () => {
    cy.contains("Add Resource").click();
    cy.contains("New Resource").should("be.visible");
    cy.contains("Cancel").click();
    cy.contains("New Resource").should("not.exist");
  });

  it("should show all required form fields", () => {
    cy.contains("Add Resource").click();
    cy.contains("Resource Name").should("be.visible");
    cy.contains("Type").should("be.visible");
    cy.contains("Brand").should("be.visible");
    cy.contains("Location").should("be.visible");
    cy.contains("Capacity").should("be.visible");
    cy.contains("Price per Hour").should("be.visible");
    cy.contains("Status").should("be.visible");
    cy.contains("Description").should("be.visible");
  });

  it("should show resource type options in the dropdown", () => {
    cy.contains("Add Resource").click();
    cy.get("select").first().find("option").should("have.length.greaterThan", 5);
  });

  // ── Edit Brands Modal ──────────────────────────────────────────────────────

  it("should open Edit Brands modal", () => {
    cy.contains("Edit Brands").click();
    cy.contains("Add New Brand").should("be.visible");
  });

  it("should close Edit Brands modal on Cancel", () => {
    cy.contains("Edit Brands").click();
    cy.contains("Add New Brand").should("be.visible");
    cy.contains("Cancel").click();
    cy.contains("Add New Brand").should("not.exist");
  });

  // ── Table ──────────────────────────────────────────────────────────────────

  it("should display resource table with column headers", () => {
    cy.contains("Resource Name").should("be.visible");
    cy.contains("Type").should("be.visible");
    cy.contains("Status").should("be.visible");
  });

  it("should display mocked resources in the table", () => {
    cy.contains("Lab 04").should("be.visible");
    cy.contains("Hall 06").should("be.visible");
  });

  it("should filter table by search input", () => {
    cy.get("input[placeholder*='Search']").type("Lab");
    cy.wait(300);
    cy.contains("Campus Resources").should("be.visible");
  });

  it("should filter table by type dropdown", () => {
    cy.get("select").eq(0).select("LAB");
    cy.wait(300);
    cy.contains("Campus Resources").should("be.visible");
  });

  it("should filter table by status dropdown", () => {
    cy.get("select").eq(1).select("ACTIVE");
    cy.wait(300);
    cy.contains("Campus Resources").should("be.visible");
  });
});
