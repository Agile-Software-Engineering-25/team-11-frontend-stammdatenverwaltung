/// <reference types="cypress" />
/* eslint-env mocha */
/* eslint-disable no-undef */

describe('Dummy smoke test', () => {
  it('app loads (smoke)', () => {
    // baseUrl ist in cypress.config.ts auf http://localhost:5173 gesetzt
    cy.request({ url: '/', failOnStatusCode: false }).then(() => {
      cy.visit('/', { timeout: 20000 });
      cy.get('body', { timeout: 20000 }).should('exist');
    });
  });
});