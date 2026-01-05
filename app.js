diff --git a/app.js b/app.js
new file mode 100644
index 0000000000000000000000000000000000000000..5c79dd154b38ff091136ced0333e3bd53cb8e766
--- /dev/null
+++ b/app.js
@@ -0,0 +1,129 @@
+const authPanel = document.getElementById("auth-panel");
+const dashboard = document.getElementById("dashboard");
+const welcome = document.getElementById("welcome");
+const chipName = document.getElementById("chip-name");
+const avatar = document.getElementById("avatar");
+const userChip = document.getElementById("user-chip");
+const loginForm = document.getElementById("login-form");
+const logoutBtn = document.getElementById("logout-btn");
+const taskList = document.getElementById("task-list");
+const taskForm = document.getElementById("task-form");
+const refreshBtn = document.getElementById("refresh-btn");
+
+const tasks = [
+  { id: crypto.randomUUID(), label: "Prepare Q3 governance review", state: "Awaiting notes" },
+  { id: crypto.randomUUID(), label: "QA billing anomaly alerts", state: "Scheduled" },
+  { id: crypto.randomUUID(), label: "Approve rollout playbook", state: "Due today" },
+];
+
+function persistSession(email) {
+  localStorage.setItem("gg-session", JSON.stringify({ email }));
+}
+
+function clearSession() {
+  localStorage.removeItem("gg-session");
+}
+
+function getSession() {
+  const session = localStorage.getItem("gg-session");
+  if (!session) return null;
+  try {
+    return JSON.parse(session);
+  } catch (err) {
+    return null;
+  }
+}
+
+function initialsFromEmail(email) {
+  if (!email) return "GG";
+  return email
+    .split("@")[0]
+    .split(/[\.\-_]/)
+    .filter(Boolean)
+    .slice(0, 2)
+    .map((chunk) => chunk[0]?.toUpperCase())
+    .join("") || "GG";
+}
+
+function renderDashboard(email) {
+  const initials = initialsFromEmail(email);
+  avatar.textContent = initials;
+  chipName.textContent = email;
+  welcome.textContent = `Welcome back, ${email.split("@")[0]}`;
+  authPanel.hidden = true;
+  dashboard.hidden = false;
+  dashboard.scrollIntoView({ behavior: "smooth" });
+}
+
+function renderTasks() {
+  taskList.innerHTML = "";
+  tasks.forEach((task) => {
+    const item = document.createElement("div");
+    item.className = "task";
+    item.innerHTML = `
+      <div class="left">
+        <span class="badge"></span>
+        <div>
+          <p class="title">${task.label}</p>
+          <p class="muted small">${task.state}</p>
+        </div>
+      </div>
+      <button aria-label="Remove task">×</button>
+    `;
+    item.querySelector("button").addEventListener("click", () => removeTask(task.id));
+    taskList.appendChild(item);
+  });
+}
+
+function removeTask(id) {
+  const index = tasks.findIndex((task) => task.id === id);
+  if (index >= 0) {
+    tasks.splice(index, 1);
+    renderTasks();
+  }
+}
+
+loginForm?.addEventListener("submit", (event) => {
+  event.preventDefault();
+  const formData = new FormData(loginForm);
+  const email = formData.get("email");
+  if (typeof email === "string" && email.trim()) {
+    persistSession(email.trim());
+    renderDashboard(email.trim());
+  }
+});
+
+logoutBtn?.addEventListener("click", () => {
+  clearSession();
+  dashboard.hidden = true;
+  authPanel.hidden = false;
+});
+
+taskForm?.addEventListener("submit", (event) => {
+  event.preventDefault();
+  const data = new FormData(taskForm);
+  const value = (data.get("task") || "").toString().trim();
+  if (!value) return;
+  tasks.unshift({ id: crypto.randomUUID(), label: value, state: "New" });
+  taskForm.reset();
+  renderTasks();
+});
+
+refreshBtn?.addEventListener("click", () => {
+  refreshBtn.textContent = "Refreshing…";
+  refreshBtn.disabled = true;
+  setTimeout(() => {
+    refreshBtn.textContent = "Refresh";
+    refreshBtn.disabled = false;
+  }, 800);
+});
+
+const session = getSession();
+if (session?.email) {
+  renderDashboard(session.email);
+} else {
+  authPanel.hidden = false;
+  dashboard.hidden = true;
+}
+
+renderTasks();
