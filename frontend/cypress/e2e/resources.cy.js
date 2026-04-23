/**
 * Cypress E2E Tests — Campus Resources Page (Member 1)
 */

const mockResources = [
  { id: "res-001", name: "Lab 04", type: "LAB", brand: "Brand 1", location: "F504", capacity: 30, pricePerHour: 700, currency: "LKR", status: "ACTIVE", availabilityWindows: ["09:00-17:00"], images: [] },
  { id: "res-002", name: "Hall 06", type: "LECTURE_HALL", brand: "Brand 2", location: "Block A", capacity: 100, pricePerHour: 900, currency: "LKR", status: "OUT_OF_SERVICE", availabilityWindows: [], images: [] },
  { id: "res-003", name: "Lab 02", type: "LAB", brand: "Brand 1", location: "BookA", capacity: 20, pricePerHour: 600, currency: "LKR", status: "ACTIVE", availabilityWindows: [], images: [] },
];

function setupPublicIntercepts() {
  cy.intercept("GET", "**/api/users/me", { statusCode: 401, body: {} }).as("getMe");
  cy.intercept("GET", "**/api/resources*", { statusCode: 200, body: mockResources }).as("getResources");
}

describe("Campus Resources Page", () => {

  beforeEach(() => {
    setupPublicIntercepts();
    cy.visit("/dashboard/resources");
    cy.wait("@getResources", { timeout: 10000 });
  });

  // ── Page Load ──────────────────────────────────────────────────────────────

  it("should display the page title and hero section", () => {
    cy.contains("Campus Resources").should("be.visible");
    cy.contains("Browse and discover available facilities").should("be.visible");
  });

  it("should display resource count stats in the hero", () => {
    cy.contains("Available").should("be.visible");
    cy.contains("Out of Service").should("be.visible");
    cy.contains("Total").should("be.visible");
  });

  it("should display resource cards", () => {
    cy.contains("Lab 04").should("be.visible");
    cy.contains("Hall 06").should("be.visible");
  });

  it("should show brand, location and price on cards", () => {
    cy.contains("Brand").should("be.visible");
    cy.contains("Location").should("be.visible");
    cy.contains("Price").should("be.visible");
  });

  it("should show correct resource count", () => {
    cy.contains("3 resources found").should("be.visible");
  });

  // ── Search ─────────────────────────────────────────────────────────────────

  it("should filter resources by search term", () => {
    cy.intercept("GET", "**/api/resources*", { statusCode: 200, body: [mockResources[0], mockResources[2]] }).as("searchResources");
    cy.get("input[placeholder*='Search']").type("Lab");
    cy.contains("resources found", { timeout: 6000 }).should("be.visible");
  });

  it("should show empty state when search has no results", () => {
    cy.intercept("GET", "**/api/resources*", { statusCode: 200, body: [] }).as("emptySearch");
    cy.get("input[placeholder*='Search']").type("xyznonexistent");
    cy.contains("No resources found", { timeout: 6000 }).should("be.visible");
  });

  // ── Type Filter ────────────────────────────────────────────────────────────

  it("should filter resources by type", () => {
    cy.intercept("GET", "**/api/resources*", { statusCode: 200, body: [mockResources[0], mockResources[2]] }).as("typeFilter");
    cy.get("select").first().select("LAB");
    cy.contains("resources found", { timeout: 6000 }).should("be.visible");
  });

  // ── Detail Modal ───────────────────────────────────────────────────────────

  it("should open detail modal when clicking View details", () => {
    cy.contains("View details").first().click();
    cy.contains("Brand").should("be.visible");
    cy.contains("Location").should("be.visible");
    cy.contains("Capacity").should("be.visible");
    cy.contains("Price/Hour").should("be.visible");
  });

  it("should close detail modal when clicking Close", () => {
    cy.contains("View details").first().click();
    cy.contains("Close").click();
    cy.contains("Price/Hour").should("not.exist");
  });

  it("should show availability windows in modal when present", () => {
    cy.contains("View details").first().click();
    cy.contains("Availability Windows").should("be.visible");
    cy.contains("09:00-17:00").should("be.visible");
  });

  it("should show Brand Info section in modal", () => {
    cy.contains("View details").first().click();
    cy.contains("Brand Info").should("be.visible");
  });
});
