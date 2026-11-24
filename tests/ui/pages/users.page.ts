import type { Locator, Page } from '@playwright/test';
import type { NewUserData } from '../../data/users.ts';

/** Locators and actions for the users list and add-user dialog. */
export class UsersPage {
  private readonly page: Page;
  readonly heading: Locator;
  readonly searchInput: Locator;
  readonly addUserButton: Locator;
  readonly refreshUsersButton: Locator;
  readonly resetDataButton: Locator;
  readonly logoutLink: Locator;
  readonly usersTable: Locator;
  readonly columnHeaders: Locator;
  readonly userRows: Locator;
  readonly fetchFailedMessage: Locator;
  readonly unauthorizedMessage: Locator;
  readonly noUsersMessage: Locator;
  readonly addUserDialog: Locator;
  readonly addUserValidationMessage: Locator;
  readonly addUserNameInput: Locator;
  readonly addUserEmailInput: Locator;
  readonly addUserUsernameInput: Locator;
  readonly addUserPasswordInput: Locator;
  readonly saveUserButton: Locator;
  readonly cancelAddUserButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Users List', level: 1 });
    this.searchInput = page.getByRole('textbox', { name: 'Search by name or email...' });
    this.addUserButton = page.getByRole('button', { name: 'Add user' });
    this.refreshUsersButton = page.getByRole('button', { name: 'Refresh users' });
    this.resetDataButton = page.getByRole('button', { name: 'Reset data' });
    this.logoutLink = page.getByRole('link', { name: 'Logout' });
    this.usersTable = page.getByRole('table');
    this.columnHeaders = this.usersTable.getByRole('columnheader');
    this.userRows = this.usersTable.getByRole('rowgroup').nth(1).getByRole('row');
    // The page's status banner has no accessible role, so each message is located by its text.
    this.fetchFailedMessage = page.getByText('Failed to fetch users.', { exact: true });
    this.unauthorizedMessage = page.getByText('Unauthorized. Please login again.', { exact: true });
    this.noUsersMessage = page.getByText('No users found.', { exact: true });
    this.addUserDialog = page.getByRole('dialog', { name: 'Add User' });
    this.addUserValidationMessage = this.addUserDialog.getByText('Please fill out all fields.', {
      exact: true,
    });
    this.addUserNameInput = this.addUserDialog.getByRole('textbox', { name: 'Name', exact: true });
    this.addUserEmailInput = this.addUserDialog.getByRole('textbox', { name: 'Email' });
    this.addUserUsernameInput = this.addUserDialog.getByRole('textbox', { name: 'Username' });
    this.addUserPasswordInput = this.addUserDialog.getByRole('textbox', { name: 'Password' });
    this.saveUserButton = this.addUserDialog.getByRole('button', { name: 'Save' });
    this.cancelAddUserButton = this.addUserDialog.getByRole('button', { name: 'Cancel' });
  }

  /** Filters the visible users by a name or email query. */
  async searchFor(query: string) {
    await this.searchInput.fill(query);
  }

  /** Opens the add-user dialog. */
  async openAddUserDialog() {
    await this.addUserButton.click();
  }

  /** Enters a complete user payload into the add-user dialog. */
  async fillAddUserForm(user: NewUserData) {
    await this.addUserNameInput.fill(user.name);
    await this.addUserEmailInput.fill(user.email);
    await this.addUserUsernameInput.fill(user.username);
    await this.addUserPasswordInput.fill(user.password);
  }

  /** Locates a message in the page's status banner, which has no accessible role. */
  getStatusMessage(message: string) {
    return this.page.getByText(message, { exact: true });
  }

  /** Locates one of a row's action buttons by its accessible name. */
  getRowButton(row: Locator, name: 'Edit row' | 'Delete row' | 'Save changes') {
    return row.getByRole('button', { name });
  }

  /** Locates a row's inline-edit textboxes, in column order: name, email, username. */
  getRowEditFields(row: Locator) {
    return row.getByRole('textbox');
  }

  /** Locates an error message shown inside the add-user dialog. */
  getAddUserError(message: string) {
    return this.addUserDialog.getByText(message, { exact: true });
  }

  /** Reads the login token the page stores for API calls, or null when signed out. */
  async getStoredApiToken() {
    return this.page.evaluate(() => localStorage.getItem('x-api-token'));
  }

  /** Closes the add-user dialog without saving its draft. */
  async cancelAddUser() {
    await this.cancelAddUserButton.click();
  }

  /** Ends the current session through the page's logout link. */
  async logout() {
    await this.logoutLink.click();
  }

  /**
   * Locates every body cell under the column with the given header text.
   * Cells expose no column-specific accessible name, so the header's position is resolved at runtime
   * to keep lookups correct if columns are reordered.
   */
  async getColumnCells(header: string) {
    await this.columnHeaders.first().waitFor();
    const headers = (await this.columnHeaders.allInnerTexts()).map((text) => text.trim());
    const index = headers.indexOf(header);
    if (index === -1) {
      throw new Error(`Users table has no "${header}" column. Found: ${headers.join(', ')}`);
    }
    return this.userRows.locator(`td:nth-child(${index + 1})`);
  }

  /** Locates a table row containing the supplied user name. */
  getUserRow(name: string) {
    return this.usersTable.getByRole('row').filter({ hasText: name });
  }

  /** Locates a table row by its stable, server-assigned user ID. */
  getUserRowById(id: number) {
    return this.usersTable.getByRole('row').filter({
      has: this.page.getByRole('cell', { name: String(id), exact: true }),
    });
  }
}
