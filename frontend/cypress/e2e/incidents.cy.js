/**
 * Cypress E2E Tests — Incident Management (Member 3)
 */

const mockAdmin = {
  id: "admin-001", name: "Test Admin", email: "admin@smartcampus.com",
  roles: ["ROLE_ADMIN", "ROLE_USER"], active: true, provider: "local",
};

const mockIncidents = [
  { id: "inc-001", ticketNumber: "INC-20260101-1234", category: "EQUIPMENT", description: "Projector broken", priority: "HIGH", status: "OPEN", location: "Room 101", createdByEmail: "user@test.com", createdByName: "Test User", comments: [], auditLogs: [] },
  { id: "inc-002", ticketNumber: "INC-20260101-5678", category: "IT", description: "Network down", priority: "CRITICAL", status: "IN_PROGRESS", location: "Lab 02", createdByEmail: "user2@test.com", createdByName: "User 2", comments: [], auditLogs: [] },
];

describe("Admin Incidents Page", () => {

  beforeEach(() => {
    cy.intercept("GET", "**/api/users/me", { statusCode: 200, body: mockAdmin }).as("getMe");
    cy.intercept("GET", "**/api/incidents*", { statusCode: 200, body: mockIncidents }).as("getIncidents");
    cy.intercept("GET", "**/api/incidents/assignees*", { statusCode: 200, body: [] }).as("getAssignees");
    cy.visit("/admin/incidents", {
      onBeforeLoad(win) {
        win.localStorage.setItem("token", "fake-admin-token");
      },
    });
    cy.wait("@getMe");
  });

  it("should display Incidents heading", () => {
    cy.contains("Incidents").should("be.visible");
  });

  it("should display incident tickets in the list", () => {
    cy.wait("@getIncidents");
    cy.contains("INC-20260101-1234").should("be.visible");
  });

  it("should display priority badges", () => {
    cy.wait("@getIncidents");
    cy.contains("HIGH").should("be.visible");
  });

  it("should display status badges", () => {
    cy.wait("@getIncidents");
    cy.contains("OPEN").should("be.visible");
    cy.contains("IN").should("be.visible");
  });

  it("should display filter options", () => {
    cy.contains("OPEN").should("be.visible");
  });
});
