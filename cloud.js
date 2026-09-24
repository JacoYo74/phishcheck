// cloud.js - accounts, saved checks and saved quiz progress (uses Supabase).
// The site still works with no account. This only switches on when config.js is filled in.
// We store the sender, subject, score and reasons of a check. We do NOT store the email text.

const cloudReady = SUPABASEURL.indexOf("https://") === 0;
let db = null;
let cloudUser = null;

/**
 * Starts the cloud connection and watches for sign in and sign out.
 */
function startCloud() {
  if (!cloudReady || typeof supabase === "undefined") {
    updateAccountUI();
    return;
  }
  db = supabase.createClient(SUPABASEURL, SUPABASEKEY);
  db.auth.onAuthStateChange(function (event, session) {
    cloudUser = session ? session.user : null;
    // Wait a moment so we never call Supabase from inside its own callback.
    setTimeout(function () { onAccountChange(cloudUser); }, 0);
  });
}

/**
 * Creates an account.
 *
 * Args:
 *   email: the email address.
 *   password: the password (at least 6 characters).
 *
 * Returns:
 *   An object with ok (true or false) and a message to show.
 */
async function cloudSignUp(email, password) {
  const result = await db.auth.signUp({ email: email, password: password });
  if (result.error) {
    return { ok: false, message: result.error.message };
  }
  if (!result.data.session) {
    return { ok: true, message: "Almost there! Check your email for a confirmation link, then come back and sign in." };
  }
  return { ok: true, message: "Account created. You are signed in." };
}

/**
 * Signs in.
 *
 * Args:
 *   email: the email address.
 *   password: the password.
 *
 * Returns:
 *   An object with ok and a message.
 */
async function cloudSignIn(email, password) {
  const result = await db.auth.signInWithPassword({ email: email, password: password });
  if (result.error) {
    return { ok: false, message: result.error.message };
  }
  return { ok: true, message: "Signed in." };
}

/**
 * Signs out.
 */
async function cloudSignOut() {
  await db.auth.signOut();
}

/**
 * Saves one checked email (without its text) to the account.
 *
 * Args:
 *   message: the email that was checked.
 *   result: the result from analyse.
 *
 * Returns:
 *   An error message, or "" if it worked.
 */
async function cloudSaveCheck(message, result) {
  const row = {
    sender: (message.from || "").slice(0, 200),
    subject: (message.subject || "").slice(0, 200),
    score: result.score,
    findings: result.findings.map(function (f) {
      return { title: f.title, points: f.points, detail: f.detail, source: f.source };
    })
  };
  const answer = await db.from("checks").insert(row);
  return answer.error ? answer.error.message : "";
}

/**
 * Gets the saved checks, newest first.
 *
 * Returns:
 *   A list of saved rows (empty if none).
 */
async function cloudLoadChecks() {
  const answer = await db.from("checks").select("*").order("created_at", { ascending: false }).limit(100);
  return answer.error ? [] : answer.data;
}

/**
 * Deletes one saved check.
 *
 * Args:
 *   id: the row id.
 */
async function cloudDeleteCheck(id) {
  await db.from("checks").delete().eq("id", id);
}

/**
 * Saves quiz progress to the account (does nothing if signed out).
 *
 * Args:
 *   data: the progress object.
 */
async function cloudSaveProgress(data) {
  if (!db || !cloudUser) {
    return;
  }
  await db.from("progress").upsert({ user_id: cloudUser.id, data: data, updated_at: new Date().toISOString() });
}

/**
 * Loads quiz progress from the account.
 *
 * Returns:
 *   The progress object, or null if none is saved.
 */
async function cloudLoadProgress() {
  const answer = await db.from("progress").select("data").maybeSingle();
  if (answer.error || !answer.data) {
    return null;
  }
  return answer.data.data;
}
