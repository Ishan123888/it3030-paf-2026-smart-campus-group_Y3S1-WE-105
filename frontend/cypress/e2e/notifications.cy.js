/**
 * Cypress E2E Tests — Notifications (Member 4)
 */

const mockUser = {
  id: "user-001", name: "Test User", email: "user@test.com",
  roles: ["ROLE_USER"], active: true, provider: "local",
};

const mockNotifications = [
  { id: "notif-001", userId: "user@test.com", type: "BOOKING_APPROVED", title: "Booking Approved", message: "Your booking for Lab 04 has been approved.", referenceId: "book-001", referenceType: "BOOKING", read: false },
  { id: "notif-002", userId: "user@test.com", type: "BOOKING_REJECTED", title: "Booking Rejected", message: "Your booking was rejected.", referenceId: "book-002", referenceType: "BOOKING", read: true },
];

describe("Notification System", () => {

  beforeEach(() => {
    cy.intercept("GET", "**/api/users/me", { statusCode: 200, body: mockUser }).as("getMe");
    cy.intercept("GET", "**/api/notifications", { statusCode: 200, body: mockNotifications }).as("getNotifications");
    cy.intercept("GET", "**/api/notifications/count", { statusCode: 200, body: { unreadCount: 1 } }).as("getCount");
    cy.intercept("GET", "**/api/resources*", { statusCode: 200, body: [] }).as("getResources");
    cy.visit("/dashboard", {
      onBeforeLoad(win) {
        win.localStorage.setItem("token", "fake-user-token");
      },
    });
    cy.wait("@getMe");
    cy.wait("@getNotifications");
  });

  it("should load the dashboard without errors", () => {
    cy.contains("Dashboard").should("be.visible");
  });

  it("should show unread notification count badge", () => {
    // unreadCount is derived from the notifications list (1 unread)
    cy.get("span").contains("1").should("exist");
  });

  it("should open notification panel when bell is clicked", () => {
    // The bell button contains an SVG — find it by its aria or by the unread badge sibling
    cy.get("button").filter(":has(svg)").filter(":visible").each(($btn) => {
      if ($btn.find("span").length > 0 || $btn.text().trim() === "") {
        cy.wrap($btn).click({ force: true });
        return false;
      }
    });
    cy.contains("Notifications").should("be.visible");
  });

  it("should display notification titles after opening panel", () => {
    cy.get("button").filter(":has(svg)").filter(":visible").each(($btn) => {
      if ($btn.find("span").length > 0 || $btn.text().trim() === "") {
        cy.wrap($btn).click({ force: true });
        return false;
      }
    });
    cy.contains("Booking Approved", { timeout: 5000 }).should("be.visible");
  });
});
