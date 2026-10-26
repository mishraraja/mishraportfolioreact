import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import * as firebaseAuth from "firebase/auth";

jest.mock("firebase/app", () => ({ getApps: () => [], initializeApp: jest.fn(() => ({})) }));
jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(), onAuthStateChanged: jest.fn(), setPersistence: jest.fn(),
  browserSessionPersistence: "session", GoogleAuthProvider: jest.fn(),
  signInWithPopup: jest.fn(), signOut: jest.fn(), deleteUser: jest.fn(),
}));

// Load the component after injecting public test configuration. No network or
// real Firebase account is used by this test.
process.env.REACT_APP_FIREBASE_API_KEY = "test-public-key";
process.env.REACT_APP_FIREBASE_AUTH_DOMAIN = "test.firebaseapp.com";
process.env.REACT_APP_FIREBASE_PROJECT_ID = "test";
process.env.REACT_APP_FIREBASE_APP_ID = "test-app";
const GoogleAccount = require("./GoogleAccount").default;
const instance = { currentUser: null };
const setCustomParameters = jest.fn();
let observer;

beforeEach(() => {
  instance.currentUser = null;
  firebaseAuth.getAuth.mockReturnValue(instance);
  firebaseAuth.onAuthStateChanged.mockImplementation((auth, callback) => { observer = callback; callback(instance.currentUser); return jest.fn(); });
  firebaseAuth.GoogleAuthProvider.mockImplementation(() => ({ setCustomParameters }));
  firebaseAuth.setPersistence.mockResolvedValue();
  firebaseAuth.signInWithPopup.mockImplementation(async () => {
    instance.currentUser = { displayName: "Test visitor" };
    observer(instance.currentUser);
  });
  firebaseAuth.signOut.mockImplementation(async () => { instance.currentUser = null; observer(null); });
});

test("Google login uses session persistence and sign-out keeps learning data", async () => {
  localStorage.setItem("rm.dsa.progress.v1", "saved-progress");
  render(<GoogleAccount />);
  const button = screen.getByRole("button", { name: "Sign in with Google" });
  await waitFor(() => expect(button).toBeEnabled());
  fireEvent.click(button);
  await screen.findByText("Signed in as Test visitor.");
  expect(firebaseAuth.setPersistence).toHaveBeenCalledWith(instance, "session");
  expect(setCustomParameters).toHaveBeenCalledWith({ prompt: "select_account" });
  fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
  await screen.findByText(/Signed out\./);
  expect(localStorage.getItem("rm.dsa.progress.v1")).toBe("saved-progress");
});

test("a cancelled popup leaves the visitor able to continue", async () => {
  firebaseAuth.signInWithPopup.mockRejectedValue({ code: "auth/popup-closed-by-user" });
  render(<GoogleAccount />);
  const button = screen.getByRole("button", { name: "Sign in with Google" });
  await waitFor(() => expect(button).toBeEnabled());
  fireEvent.click(button);
  await screen.findByText("Sign-in cancelled. You can continue without an account.");
  expect(button).toBeEnabled();
});

test("account deletion explains when fresh authentication is required", async () => {
  instance.currentUser = { displayName: "Test visitor" };
  firebaseAuth.deleteUser.mockRejectedValue({ code: "auth/requires-recent-login" });
  render(<GoogleAccount />);
  await screen.findByText("Signed in as Test visitor.");
  fireEvent.click(screen.getByText("Delete sign-in account"));
  fireEvent.click(screen.getByRole("button", { name: "Confirm account deletion" }));
  await screen.findByText("Sign out, sign in again, then retry deleting your account.");
});
