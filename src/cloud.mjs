import { createClient } from "@supabase/supabase-js";
import { captureProject, openCloudProject } from "./app.mjs";
import {
  BUCKET,
  saveProject,
  listProjects,
  loadProject,
} from "./cloud-store.mjs";
import "./cloud.css";
const $ = (id) => document.getElementById(id);
const button = document.createElement("button");
button.id = "cloudLibrary";
button.textContent = "☁ Cloud library";
$("open").before(button);
const dialog = document.createElement("dialog");
dialog.id = "cloudDialog";
dialog.innerHTML = `<div class="cloud-heading"><div><small>YOUR PRIVATE WORKSPACE</small><h2>Cloud library</h2></div><button id="cloudClose" aria-label="Close cloud library">×</button></div><p class="cloud-intro">Keep originals, dithered images, and settings together. Open your work on another device.</p><p id="cloudStatus" role="status">Connecting…</p><form id="cloudAuth" hidden><label for="cloudEmail">Email</label><input id="cloudEmail" type="email" autocomplete="email" required placeholder="you@example.com"><label for="cloudPassword">Password</label><input id="cloudPassword" type="password" autocomplete="current-password" minlength="8" required placeholder="At least 8 characters"><div class="cloud-actions"><button type="submit" class="accent">Sign in</button><button type="button" id="cloudSignup">Create account</button></div><p class="hint">New accounts receive an email confirmation. Editing and downloading work without an account.</p></form><div id="cloudLibraryBody" hidden><div class="cloud-account"><span id="cloudAccount"></span><button id="cloudSignOut">Sign out</button></div><div class="cloud-actions"><button id="cloudSave" class="accent">Save current image to cloud</button><button id="cloudRefresh">Refresh library</button></div><p class="hint">Saves the original, full-resolution result, and current settings. PNGs up to 20 MB each. Each save creates a new version.</p><div id="cloudProjects"></div></div>`;
document.body.append(dialog);
let client,
  user,
  working = false,
  listing = 0,
  urls = [];
function status(message) {
  $("cloudStatus").textContent = message;
}
function revoke() {
  urls.forEach(URL.revokeObjectURL);
  urls = [];
}
async function task(fn) {
  if (working) return;
  working = true;
  dialog
    .querySelectorAll("button:not(#cloudClose),input")
    .forEach((el) => (el.disabled = true));
  try {
    await fn();
  } catch (e) {
    status(e.message || "Cloud request failed. Try again.");
  } finally {
    working = false;
    dialog
      .querySelectorAll("button,input")
      .forEach((el) => (el.disabled = false));
  }
}
function account() {
  const active = !!user;
  $("cloudAuth").hidden = active || !client;
  $("cloudLibraryBody").hidden = !active;
  $("cloudAccount").textContent = user?.email || "";
  button.textContent = active ? "☁ My library" : "☁ Cloud library";
}
async function refresh() {
  const generation = ++listing;
  revoke();
  $("cloudProjects").replaceChildren();
  if (!user) return;
  status("Loading saved images…");
  const projects = await listProjects(client);
  if (generation !== listing || !user) return;
  status(
    projects.length
      ? `${projects.length} saved image${projects.length === 1 ? "" : "s"}`
      : "Your library is empty. Save your first image.",
  );
  for (const project of projects) {
    const card = document.createElement("article"),
      image = document.createElement("img"),
      heading = document.createElement("h3"),
      info = document.createElement("p"),
      open = document.createElement("button");
    image.alt = project.name;
    heading.textContent = project.name;
    info.textContent = `${project.width} × ${project.height} · ${new Date(project.created_at).toLocaleDateString()}`;
    open.textContent = "Open in editor";
    open.onclick = () =>
      task(async () => {
        status("Opening original and settings…");
        await openCloudProject(await loadProject(client, project));
        dialog.close();
      });
    card.append(image, heading, info, open);
    $("cloudProjects").append(card);
    const { data, error } = await client.storage
      .from(BUCKET)
      .createSignedUrl(project.output_path, 300);
    if (!error && generation === listing && user) image.src = data.signedUrl;
  }
}
button.onclick = () => {
  dialog.showModal();
  if (client && user) task(refresh);
};
$("cloudClose").onclick = () => dialog.close();
$("cloudAuth").onsubmit = (e) => {
  e.preventDefault();
  task(async () => {
    status("Signing in…");
    const { data, error } = await client.auth.signInWithPassword({
      email: $("cloudEmail").value.trim(),
      password: $("cloudPassword").value,
    });
    if (error) throw error;
    user = data.user;
    $("cloudPassword").value = "";
    account();
    await refresh();
  });
};
$("cloudSignup").onclick = () => {
  if (!$("cloudAuth").reportValidity()) return;
  task(async () => {
    status("Creating account…");
    const { data, error } = await client.auth.signUp({
      email: $("cloudEmail").value.trim(),
      password: $("cloudPassword").value,
      options: { emailRedirectTo: location.origin },
    });
    if (error) throw error;
    $("cloudPassword").value = "";
    if (data.session) {
      user = data.user;
      account();
      await refresh();
    } else
      status("Check your email to confirm your account, then sign in here.");
  });
};
$("cloudSignOut").onclick = () =>
  task(async () => {
    const { error } = await client.auth.signOut();
    if (error) throw error;
    user = null;
    ++listing;
    revoke();
    $("cloudProjects").replaceChildren();
    account();
    status("Signed out. Your saved images remain private.");
  });
$("cloudSave").onclick = () =>
  task(async () => {
    status("Rendering and uploading your image…");
    await saveProject(client, user, await captureProject());
    await refresh();
    status("Saved original, result, and settings to your private library.");
  });
$("cloudRefresh").onclick = () => task(refresh);
try {
  const response = await fetch("/api/config", { cache: "no-store" });
  if (!response.ok) throw Error("Cloud configuration could not be loaded.");
  const config = await response.json();
  if (!config.enabled) {
    status(
      "Cloud storage is not configured yet. You can still edit images and export locally.",
    );
  } else {
    client = createClient(config.url, config.key);
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    user = data.session?.user;
    account();
    status(
      user
        ? "Signed in. Open your library or save the current image."
        : "Sign in to save images privately across devices.",
    );
    client.auth.onAuthStateChange((_event, session) => {
      user = session?.user;
      account();
      if (!user) {
        ++listing;
        revoke();
        $("cloudProjects").replaceChildren();
      }
    });
  }
} catch (e) {
  status(e.message);
}
