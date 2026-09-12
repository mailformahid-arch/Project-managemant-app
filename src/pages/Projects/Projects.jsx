import { useState } from "react";
import { Link } from "react-router-dom";
import useLocalStorage from "../../hooks/useLocalStorage";

function Projects() {
  const [projects, setProjects] = useLocalStorage("projects", []);

  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectColor, setProjectColor] = useState("#6366f1");

  const colors = [
    "#6366f1",
    "#8b5cf6",
    "#ec4899",
    "#ef4444",
    "#f97316",
    "#eab308",
    "#22c55e",
    "#14b8a6",
    "#06b6d4",
    "#3b82f6",
  ];

  function openCreateModal() {
    setEditingProject(null);
    setProjectName("");
    setProjectDescription("");
    setProjectColor("#6366f1");
    setShowModal(true);
  }

  function openEditModal(project) {
    setEditingProject(project);
    setProjectName(project.name);
    setProjectDescription(project.description || "");
    setProjectColor(project.color || "#6366f1");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingProject(null);
    setProjectName("");
    setProjectDescription("");
    setProjectColor("#6366f1");
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!projectName.trim()) {
      alert("Please enter project name.");
      return;
    }

    if (editingProject) {
      const updatedProjects = projects.map((project) =>
        project.id === editingProject.id
          ? {
              ...project,
              name: projectName.trim(),
              description: projectDescription.trim(),
              color: projectColor,
            }
          : project
      );

      setProjects(updatedProjects);
    } else {
      const newProject = {
        id: crypto.randomUUID(),
        name: projectName.trim(),
        description: projectDescription.trim(),
        color: projectColor,
        tasks: [],
        createdAt: new Date().toISOString(),
      };

      setProjects([...projects, newProject]);
    }

    closeModal();
  }

  function deleteProject(projectId) {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this project?"
    );

    if (!confirmDelete) {
      return;
    }

    const remainingProjects = projects.filter(
      (project) => project.id !== projectId
    );

    setProjects(remainingProjects);
  }

  function getProjectTaskCount(project) {
    const projectTasks = JSON.parse(
      localStorage.getItem("tasks") || "[]"
    );

    return projectTasks.filter(
      (task) => task.projectId === project.id
    ).length;
  }

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <p className="page-label">WORKSPACE</p>
          <h1>Projects</h1>
          <p className="page-description">
            Manage and organize all your projects in one place.
          </p>
        </div>

        <button className="primary-btn" onClick={openCreateModal}>
          <span>+</span>
          New Project
        </button>
      </div>

      {/* Project Stats */}
      <div className="project-stats">
        <div className="stat-card">
          <div className="stat-icon purple">📁</div>

          <div>
            <span>Total Projects</span>
            <strong>{projects.length}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue">📋</div>

          <div>
            <span>Total Tasks</span>
            <strong>
              {projects.reduce(
                (total, project) => total + getProjectTaskCount(project),
                0
              )}
            </strong>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📁</div>

          <h2>No projects yet</h2>

          <p>
            Create your first project to start organizing your tasks.
          </p>

          <button className="primary-btn" onClick={openCreateModal}>
            + Create Your First Project
          </button>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((project) => (
            <div className="project-card" key={project.id}>
              <div
                className="project-card-top"
                style={{ backgroundColor: project.color }}
              >
                <div className="project-icon">📁</div>

                <div className="project-menu">
                  <button
                    className="icon-btn"
                    onClick={() => openEditModal(project)}
                    title="Edit project"
                  >
                    ✏️
                  </button>

                  <button
                    className="icon-btn delete-icon"
                    onClick={() => deleteProject(project.id)}
                    title="Delete project"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div className="project-card-body">
                <h3>{project.name}</h3>

                <p>
                  {project.description || "No project description added."}
                </p>

                <div className="project-card-footer">
                  <span className="task-count">
                    📋 {getProjectTaskCount(project)} Tasks
                  </span>

                  <Link
                    to={`/projects/${project.id}`}
                    className="open-project-btn"
                  >
                    Open Project →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal-box"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <p className="page-label">
                  PROJECT MANAGEMENT
                </p>

                <h2>
                  {editingProject ? "Edit Project" : "Create New Project"}
                </h2>
              </div>

              <button className="close-btn" onClick={closeModal}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="projectName">Project Name</label>

                <input
                  id="projectName"
                  type="text"
                  placeholder="e.g. Website Redesign"
                  value={projectName}
                  onChange={(event) => setProjectName(event.target.value)}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="projectDescription">
                  Description
                </label>

                <textarea
                  id="projectDescription"
                  placeholder="Write a short project description..."
                  value={projectDescription}
                  onChange={(event) =>
                    setProjectDescription(event.target.value)
                  }
                  rows="4"
                />
              </div>

              <div className="form-group">
                <label>Project Color</label>

                <div className="color-picker">
                  {colors.map((color) => (
                    <button
                      type="button"
                      key={color}
                      className={
                        projectColor === color
                          ? "color-option selected"
                          : "color-option"
                      }
                      style={{ backgroundColor: color }}
                      onClick={() => setProjectColor(color)}
                      aria-label={`Choose color ${color}`}
                    >
                      {projectColor === color ? "✓" : ""}
                    </button>
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={closeModal}
                >
                  Cancel
                </button>

                <button type="submit" className="primary-btn">
                  {editingProject ? "Save Changes" : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Projects;