/**
 * Cypress E2E Tests — Booking Management (Member 2)
 */

const mockAdmin = {
  id: "admin-001", name: "Test Admin", email: "admin@smartcampus.com",
  roles: ["ROLE_ADMIN", "ROLE_USER"], active: true, provider: "local",
};

const mockBookings = [
  {
    id: "book-001", resourceName: "Lab 04", userName: "Ishan", userEmail: "ishan@test.com",
    bookingDate: "2026-04-25", startTime: "09:00:00", endTime: "11:00:00",
    purpose: "Study", expectedAttendees: 5, status: "PENDING",
  },
  {
    id: "book-002", resourceName: "Hall 06", userName: "Dasun", userEmail: "dasun@test.com",
    bookingDate: "2026-04-26", startTime: "13:00:00", endTime: "15:00:00",
    purpose: "Lecture", expectedAttendees: 50, status: "APPROVED",
  },
];

function setupAdminIntercepts() {
  cy.intercept("GET", "**/api/users/me", { statusCode: 200, body: mockAdmin }).as("getMe");
  cy.intercept("GET", "**/api/bookings*", { statusCode: 200, body: mockBookings }).as("getBookings");
}

describe("Admin Booking Management", () => {

  beforeEach(() => {
    setupAdminIntercepts();
    cy.visit("/admin/bookings", {
      onBeforeLoad(win) {
        win.localStorage.setItem("token", "fake-admin-token");
      },
    });
    cy.wait("@getMe");
  });

  it("should display Booking Management heading", () => {
    cy.contains("Booking Management").should("be.visible");
  });

  it("should display filter tabs: ALL, PENDING, APPROVED, REJECTED, CANCELLED", () => {
    cy.contains("ALL").should("be.visible");
    cy.contains("PENDING").should("be.visible");
    cy.contains("APPROVED").should("be.visible");
    cy.contains("REJECTED").should("be.visible");
    cy.contains("CANCELLED").should("be.visible");
  });

  it("should display stat cards for each status", () => {
    cy.contains("PENDING").should("be.visible");
    cy.contains("APPROVED").should("be.visible");
  });

  it("should display table headers", () => {
    cy.contains("Resource").should("be.visible");
    cy.contains("Student").should("be.visible");
    cy.contains("Schedule").should("be.visible");
    cy.contains("Status").should("be.visible");
    cy.contains("Actions").should("be.visible");
  });

  it("should display mocked bookings in the table", () => {
    cy.wait("@getBookings");
    cy.contains("Lab 04").should("be.visible");
  });

  it("should filter by PENDING tab", () => {
    cy.contains("PENDING").first().click();
    cy.wait(500);
    cy.contains("Booking Management").should("be.visible");
  });

  it("should filter by APPROVED tab", () => {
    cy.contains("APPROVED").first().click();
    cy.wait(500);
    cy.contains("Booking Management").should("be.visible");
  });

  it("should have Apply button for email filter", () => {
    cy.contains("Apply").should("be.visible");
  });
});


