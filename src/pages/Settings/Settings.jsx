import { useState } from "react";
import "../../App.css";

const defaultSettings = {
  name: "Project Manager User",
  email: "user@example.com",
  theme: "light",
  defaultTaskView: "kanban",
  defaultSort: "newest",
  showCompletedTasks: true,
};

function Settings() {
  const [settings, setSettings] = useState(() => {
    const savedSettings = localStorage.getItem("settings");

    return savedSettings
      ? JSON.parse(savedSettings)
      : defaultSettings;
  });

  const [savedMessage, setSavedMessage] = useState("");

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setSettings((previousSettings) => ({
      ...previousSettings,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function saveSettings(event) {
    event.preventDefault();

    localStorage.setItem("settings", JSON.stringify(settings));
    setSavedMessage("Settings saved successfully.");

    setTimeout(() => {
      setSavedMessage("");
    }, 2500);
  }

  function exportWorkspaceData() {
    const workspaceData = {
      projects: JSON.parse(localStorage.getItem("projects") || "[]"),
      tasks: JSON.parse(localStorage.getItem("tasks") || "[]"),
      settings: JSON.parse(localStorage.getItem("settings") || "{}"),
      exportedAt: new Date().toISOString(),
    };

    const dataString = JSON.stringify(workspaceData, null, 2);

    const blob = new Blob([dataString], {
      type: "application/json",
    });

    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = downloadUrl;
    link.download = `project-manager-backup-${Date.now()}.json`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(downloadUrl);
  }

  function resetWorkspace() {
    const isConfirmed = window.confirm(
      "Are you sure you want to reset the complete workspace?"
    );

    if (!isConfirmed) return;

    localStorage.removeItem("projects");
    localStorage.removeItem("tasks");
    localStorage.removeItem("settings");
    localStorage.removeItem("recentProjects");

    setSettings(defaultSettings);
    setSavedMessage("Workspace reset successfully.");

    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <p className="page-eyebrow">Preferences</p>
          <h1>Settings</h1>
          <p className="page-subtitle">
            Manage your profile and application preferences.
          </p>
        </div>
      </div>

      {savedMessage && (
        <div className="success-message">
          {savedMessage}
        </div>
      )}

      <form onSubmit={saveSettings}>
        <div className="settings-card">
          <div className="settings-card-header">
            <div>
              <h2>Profile Information</h2>
              <p>Update your basic profile details.</p>
            </div>
          </div>

          <div className="settings-form-grid">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>

              <input
                id="name"
                name="name"
                type="text"
                value={settings.name}
                onChange={handleChange}
                placeholder="Enter your name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>

              <input
                id="email"
                name="email"
                type="email"
                value={settings.email}
                onChange={handleChange}
                placeholder="Enter your email"
              />
            </div>
          </div>
        </div>

        <div className="settings-card">
          <div className="settings-card-header">
            <div>
              <h2>Application Preferences</h2>
              <p>Customize how your project manager works.</p>
            </div>
          </div>

          <div className="settings-form-grid">
            <div className="form-group">
              <label htmlFor="theme">Theme</label>

              <select
                id="theme"
                name="theme"
                value={settings.theme}
                onChange={handleChange}
              >
                <option value="light">Light Mode</option>
                <option value="dark">Dark Mode</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="defaultTaskView">
                Default Task View
              </label>

              <select
                id="defaultTaskView"
                name="defaultTaskView"
                value={settings.defaultTaskView}
                onChange={handleChange}
              >
                <option value="kanban">Kanban Board</option>
                <option value="list">List View</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="defaultSort">
                Default Task Sort
              </label>

              <select
                id="defaultSort"
                name="defaultSort"
                value={settings.defaultSort}
                onChange={handleChange}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="dueDate">Due Date</option>
                <option value="priority">Priority</option>
                <option value="alphabetical">Alphabetical</option>
              </select>
            </div>
          </div>

          <label className="checkbox-setting">
            <input
              type="checkbox"
              name="showCompletedTasks"
              checked={settings.showCompletedTasks}
              onChange={handleChange}
            />

            <span>
              <strong>Show completed tasks</strong>
              <small>
                Display completed tasks inside your project boards.
              </small>
            </span>
          </label>

          <button type="submit" className="primary-btn">
            Save Settings
          </button>
        </div>
      </form>

      <div className="settings-card">
        <div className="settings-card-header">
          <div>
            <h2>Workspace Backup</h2>
            <p>
              Download your projects, tasks and settings as a JSON file.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="primary-btn"
          onClick={exportWorkspaceData}
        >
          Export Workspace
        </button>
      </div>

      <div className="settings-card danger-card">
        <div className="settings-card-header">
          <div>
            <h2>Danger Zone</h2>
            <p>
              This action will remove all projects, tasks and settings.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="danger-btn"
          onClick={resetWorkspace}
        >
          Reset Workspace
        </button>
      </div>
    </div>
  );
}

export default Settings;