import { Link } from "react-router-dom";
import useLocalStorage from "../../hooks/useLocalStorage";

function Dashboard() {
  const [projects] = useLocalStorage("projects", []);
  const [tasks] = useLocalStorage("tasks", []);

  const totalProjects = projects.length;

  const totalTasks = tasks.length;

  const completedTasks = tasks.filter(
    (task) => task.status === "done"
  ).length;

  const inProgressTasks = tasks.filter(
    (task) => task.status === "in-progress"
  ).length;

  const todoTasks = tasks.filter(
    (task) => task.status === "todo"
  ).length;

  const completionPercentage =
    totalTasks === 0
      ? 0
      : Math.round((completedTasks / totalTasks) * 100);

  const recentProjects = [...projects]
    .sort(
      (a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
    )
    .slice(0, 4);

  function getProjectTasks(projectId) {
    return tasks.filter(
      (task) => task.projectId === projectId
    );
  }

  function getProjectProgress(projectId) {
    const projectTasks = getProjectTasks(projectId);

    if (projectTasks.length === 0) {
      return 0;
    }

    const completed = projectTasks.filter(
      (task) => task.status === "done"
    ).length;

    return Math.round(
      (completed / projectTasks.length) * 100
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <p className="page-label">OVERVIEW</p>

          <h1>Dashboard</h1>

          <p className="page-description">
            Welcome back! Here is what's happening in your workspace.
          </p>
        </div>

        <Link to="/projects" className="primary-btn">
          + Manage Projects
        </Link>
      </div>

      {/* Main Stats */}
      <div className="dashboard-stats">
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon purple">
            📁
          </div>

          <div>
            <span>Total Projects</span>
            <strong>{totalProjects}</strong>
            <small>All workspace projects</small>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon blue">
            📋
          </div>

          <div>
            <span>Total Tasks</span>
            <strong>{totalTasks}</strong>
            <small>Tasks across all projects</small>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon orange">
            ⏳
          </div>

          <div>
            <span>In Progress</span>
            <strong>{inProgressTasks}</strong>
            <small>Currently active tasks</small>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon green">
            ✓
          </div>

          <div>
            <span>Completed</span>
            <strong>{completedTasks}</strong>
            <small>Successfully finished</small>
          </div>
        </div>
      </div>

      {/* Progress Section */}
      <div className="dashboard-content-grid">
        <div className="dashboard-panel">
          <div className="panel-header">
            <div>
              <p className="page-label">PERFORMANCE</p>
              <h2>Task Progress</h2>
            </div>

            <span className="progress-percentage">
              {completionPercentage}%
            </span>
          </div>

          <div className="large-progress-bar">
            <div
              className="large-progress-fill"
              style={{
                width: `${completionPercentage}%`,
              }}
            ></div>
          </div>

          <div className="progress-breakdown">
            <div>
              <span className="progress-dot purple-dot"></span>
              To Do
              <strong>{todoTasks}</strong>
            </div>

            <div>
              <span className="progress-dot orange-dot"></span>
              In Progress
              <strong>{inProgressTasks}</strong>
            </div>

            <div>
              <span className="progress-dot green-dot"></span>
              Completed
              <strong>{completedTasks}</strong>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <div>
              <p className="page-label">SHORTCUTS</p>
              <h2>Quick Actions</h2>
            </div>
          </div>

          <div className="quick-actions">
            <Link to="/projects" className="quick-action">
              <span>📁</span>
              <div>
                <strong>View Projects</strong>
                <small>Manage your projects</small>
              </div>
              <b>→</b>
            </Link>

            <Link to="/projects" className="quick-action">
              <span>➕</span>
              <div>
                <strong>Create Project</strong>
                <small>Start something new</small>
              </div>
              <b>→</b>
            </Link>

            <Link to="/settings" className="quick-action">
              <span>⚙️</span>
              <div>
                <strong>Settings</strong>
                <small>Customize workspace</small>
              </div>
              <b>→</b>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="dashboard-panel recent-projects-panel">
        <div className="panel-header">
          <div>
            <p className="page-label">WORKSPACE</p>
            <h2>Recent Projects</h2>
          </div>

          <Link to="/projects" className="view-all-link">
            View All →
          </Link>
        </div>

        {recentProjects.length === 0 ? (
          <div className="dashboard-empty">
            <div>📁</div>

            <h3>No projects yet</h3>

            <p>Create your first project to see it here.</p>

            <Link to="/projects" className="primary-btn">
              Create Project
            </Link>
          </div>
        ) : (
          <div className="recent-projects-list">
            {recentProjects.map((project) => {
              const projectTasks = getProjectTasks(project.id);
              const progress = getProjectProgress(project.id);

              return (
                <div
                  className="recent-project-item"
                  key={project.id}
                >
                  <div
                    className="recent-project-icon"
                    style={{
                      backgroundColor: project.color,
                    }}
                  >
                    📁
                  </div>

                  <div className="recent-project-info">
                    <Link
                      to={`/projects/${project.id}`}
                      className="recent-project-name"
                    >
                      {project.name}
                    </Link>

                    <span>
                      {projectTasks.length} tasks
                    </span>
                  </div>

                  <div className="recent-project-progress">
                    <div className="mini-progress-bar">
                      <div
                        className="mini-progress-fill"
                        style={{
                          width: `${progress}%`,
                        }}
                      ></div>
                    </div>

                    <span>{progress}%</span>
                  </div>

                  <Link
                    to={`/projects/${project.id}`}
                    className="recent-project-open"
                  >
                    Open →
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;