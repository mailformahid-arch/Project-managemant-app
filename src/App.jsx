import { useEffect, useMemo, useState } from "react";
import { supabase } from "./utils/supabaseClient";
import "./App.css";

const PROJECTS_KEY = "projectflow_projects_v2";
const TASKS_KEY = "projectflow_tasks_v2";
const THEME_KEY = "projectflow_dark_mode_v2";

const WORKSPACE_ID =
  import.meta.env.VITE_SUPABASE_WORKSPACE_ID || null;

const STATUSES = ["To Do", "In Progress", "Completed"];
const PRIORITIES = ["Low", "Medium", "High"];

const COLORS = [
  "#6c5ce7",
  "#00b894",
  "#0984e3",
  "#e84393",
  "#fdcb6e",
  "#d63031",
  "#00cec9",
  "#a29bfe",
];

const initialProjects = [
  {
    id: "website",
    name: "Website Redesign",
    color: "#6c5ce7",
    description: "Redesign the company website and improve user experience.",
    createdAt: "2026-09-01",
  },
  {
    id: "mobile",
    name: "Mobile App",
    color: "#00b894",
    description: "Build and launch the next mobile application.",
    createdAt: "2026-09-02",
  },
  {
    id: "marketing",
    name: "Marketing Campaign",
    color: "#fdcb6e",
    description: "Plan and execute the upcoming marketing campaign.",
    createdAt: "2026-09-03",
  },
];

const initialTasks = [
  {
    id: "task-1",
    title: "Create homepage wireframe",
    description: "Prepare the first homepage wireframe.",
    projectId: "website",
    status: "In Progress",
    priority: "High",
    dueDate: "2026-09-18",
    tag: "Design",
    createdAt: "2026-09-01",
  },
  {
    id: "task-2",
    title: "Prepare responsive layouts",
    description: "Create responsive versions for mobile and tablet.",
    projectId: "website",
    status: "To Do",
    priority: "Medium",
    dueDate: "2026-09-22",
    tag: "Frontend",
    createdAt: "2026-09-02",
  },
];

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function createId(prefix = "item") {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function formatDate(date) {
  if (!date) return "No due date";

  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function isOverdue(task) {
  if (!task.dueDate || task.status === "Completed") return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(`${task.dueDate}T00:00:00`);

  return due < today;
}

function mapProjectFromDb(project) {
  return {
    id: project.id,
    name: project.name,
    color: project.color || "#6c5ce7",
    description: project.description || "",
    createdAt: project.created_at
      ? String(project.created_at).slice(0, 10)
      : new Date().toISOString().slice(0, 10),
  };
}

function mapTaskFromDb(task) {
  return {
    id: task.id,
    title: task.title,
    description: task.description || "",
    projectId: task.project_id,
    status: task.status || "To Do",
    priority: task.priority || "Medium",
    dueDate: task.due_date || "",
    tag: task.tag || "",
    createdAt: task.created_at
      ? String(task.created_at).slice(0, 10)
      : new Date().toISOString().slice(0, 10),
  };
}

function App() {
  const [projects, setProjects] = useState(() =>
    readStorage(PROJECTS_KEY, initialProjects)
  );

  const [tasks, setTasks] = useState(() =>
    readStorage(TASKS_KEY, initialTasks)
  );

  const [darkMode, setDarkMode] = useState(() =>
    readStorage(THEME_KEY, false)
  );

  const [activePage, setActivePage] = useState("Dashboard");
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [editingProject, setEditingProject] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [supabaseMode, setSupabaseMode] = useState(Boolean(WORKSPACE_ID));

  const [projectForm, setProjectForm] = useState({
    name: "",
    color: COLORS[0],
    description: "",
  });

  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    projectId: "",
    status: "To Do",
    priority: "Medium",
    dueDate: "",
    tag: "",
  });

  const selectedProject = projects.find(
    (project) => project.id === selectedProjectId
  );

  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode);
    localStorage.setItem(THEME_KEY, JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    if (!supabaseMode) {
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    }
  }, [projects, supabaseMode]);

  useEffect(() => {
    if (!supabaseMode) {
      localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    }
  }, [tasks, supabaseMode]);

  useEffect(() => {
    if (!notice) return;

    const timer = setTimeout(() => setNotice(""), 3500);

    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    loadSupabaseData();
  }, []);

  async function loadSupabaseData() {
    if (!WORKSPACE_ID) {
      setSupabaseMode(false);
      return;
    }

    setLoading(true);

    try {
      const [
        { data: projectRows, error: projectsError },
        { data: taskRows, error: tasksError },
      ] = await Promise.all([
        supabase
          .from("projects")
          .select("*")
          .eq("workspace_id", WORKSPACE_ID)
          .order("created_at", { ascending: true }),

        supabase
          .from("tasks")
          .select("*")
          .eq("workspace_id", WORKSPACE_ID)
          .order("created_at", { ascending: false }),
      ]);

      if (projectsError) throw projectsError;
      if (tasksError) throw tasksError;

      setProjects((projectRows || []).map(mapProjectFromDb));
      setTasks((taskRows || []).map(mapTaskFromDb));
      setSupabaseMode(true);
      showMessage("Supabase data loaded successfully.");
    } catch (error) {
      console.error("Supabase loading error:", error);
      setSupabaseMode(false);
      showMessage(
        "Supabase data load nahi ho saka. Local data use ho raha hai."
      );
    } finally {
      setLoading(false);
    }
  }

  function showMessage(message) {
    setNotice(message);
  }

  const stats = useMemo(() => {
    const completed = tasks.filter(
      (task) => task.status === "Completed"
    ).length;

    const inProgress = tasks.filter(
      (task) => task.status === "In Progress"
    ).length;

    const todo = tasks.filter((task) => task.status === "To Do").length;

    const overdue = tasks.filter(isOverdue).length;

    const completionRate = tasks.length
      ? Math.round((completed / tasks.length) * 100)
      : 0;

    return {
      totalProjects: projects.length,
      totalTasks: tasks.length,
      completed,
      inProgress,
      todo,
      overdue,
      completionRate,
    };
  }, [projects, tasks]);

  const filteredTasks = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    const result = tasks.filter((task) => {
      const project = projects.find(
        (item) => item.id === task.projectId
      );

      const searchableText = [
        task.title,
        task.description,
        task.status,
        task.priority,
        task.tag,
        project?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !term || searchableText.includes(term);

      const matchesStatus =
        statusFilter === "All" || task.status === statusFilter;

      const matchesPriority =
        priorityFilter === "All" ||
        task.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });

    return [...result].sort((a, b) => {
      if (sortBy === "oldest") {
        return String(a.createdAt).localeCompare(
          String(b.createdAt)
        );
      }

      if (sortBy === "dueDate") {
        return String(a.dueDate || "9999").localeCompare(
          String(b.dueDate || "9999")
        );
      }

      if (sortBy === "priority") {
        const weight = {
          High: 3,
          Medium: 2,
          Low: 1,
        };

        return weight[b.priority] - weight[a.priority];
      }

      return String(b.createdAt).localeCompare(
        String(a.createdAt)
      );
    });
  }, [
    projects,
    tasks,
    searchTerm,
    statusFilter,
    priorityFilter,
    sortBy,
  ]);

  function getProjectTasks(projectId) {
    return tasks.filter((task) => task.projectId === projectId);
  }

  function getProjectProgress(projectId) {
    const projectTasks = getProjectTasks(projectId);

    if (!projectTasks.length) return 0;

    const completed = projectTasks.filter(
      (task) => task.status === "Completed"
    ).length;

    return Math.round((completed / projectTasks.length) * 100);
  }

  function getProjectName(projectId) {
    return (
      projects.find((project) => project.id === projectId)?.name ||
      "Unknown Project"
    );
  }

  function openProject(projectId) {
    setSelectedProjectId(projectId);
    setActivePage("Project");
  }

  function resetProjectForm() {
    setProjectForm({
      name: "",
      color: COLORS[0],
      description: "",
    });
  }

  function openNewProject() {
    setEditingProject(null);
    resetProjectForm();
    setShowProjectModal(true);
  }

  function openEditProject(project) {
    setEditingProject(project);

    setProjectForm({
      name: project.name,
      color: project.color,
      description: project.description || "",
    });

    setShowProjectModal(true);
  }

  async function saveProject(event) {
    event.preventDefault();

    const name = projectForm.name.trim();

    if (!name) {
      showMessage("Please enter a project name.");
      return;
    }

    setLoading(true);

    try {
      if (editingProject) {
        const updatedProject = {
          ...editingProject,
          ...projectForm,
          name,
          description: projectForm.description.trim(),
        };

        if (supabaseMode) {
          const { error } = await supabase
            .from("projects")
            .update({
              name: updatedProject.name,
              description: updatedProject.description,
              color: updatedProject.color,
              updated_at: new Date().toISOString(),
            })
            .eq("id", editingProject.id)
            .eq("workspace_id", WORKSPACE_ID);

          if (error) throw error;
        }

        setProjects((current) =>
          current.map((project) =>
            project.id === editingProject.id
              ? updatedProject
              : project
          )
        );

        showMessage("Project updated successfully.");
      } else {
        const newProject = {
          id: createId("project"),
          name,
          color: projectForm.color,
          description: projectForm.description.trim(),
          createdAt: new Date().toISOString().slice(0, 10),
        };

        if (supabaseMode) {
          const { data, error } = await supabase
            .from("projects")
            .insert({
              id: newProject.id,
              workspace_id: WORKSPACE_ID,
              name: newProject.name,
              description: newProject.description,
              color: newProject.color,
            })
            .select()
            .single();

          if (error) throw error;

          setProjects((current) => [
            ...current,
            mapProjectFromDb(data),
          ]);
        } else {
          setProjects((current) => [...current, newProject]);
        }

        setSelectedProjectId(newProject.id);
        setActivePage("Project");
        showMessage("Project created successfully.");
      }

      setShowProjectModal(false);
      setEditingProject(null);
    } catch (error) {
      console.error("Project save error:", error);
      showMessage(error.message || "Project save nahi ho saka.");
    } finally {
      setLoading(false);
    }
  }

  function requestDeleteProject(project) {
    setConfirmAction(() => async () => {
      setLoading(true);

      try {
        if (supabaseMode) {
          const { error: taskError } = await supabase
            .from("tasks")
            .delete()
            .eq("project_id", project.id)
            .eq("workspace_id", WORKSPACE_ID);

          if (taskError) throw taskError;

          const { error: projectError } = await supabase
            .from("projects")
            .delete()
            .eq("id", project.id)
            .eq("workspace_id", WORKSPACE_ID);

          if (projectError) throw projectError;
        }

        setProjects((current) =>
          current.filter((item) => item.id !== project.id)
        );

        setTasks((current) =>
          current.filter((task) => task.projectId !== project.id)
        );

        setSelectedProjectId(null);
        setActivePage("Projects");
        showMessage("Project and related tasks deleted.");
      } catch (error) {
        console.error("Project delete error:", error);
        showMessage(error.message || "Project delete nahi ho saka.");
      } finally {
        setLoading(false);
      }
    });

    setShowConfirmModal(true);
  }

  function resetTaskForm(projectId = "") {
    setTaskForm({
      title: "",
      description: "",
      projectId:
        projectId ||
        selectedProject?.id ||
        projects[0]?.id ||
        "",
      status: "To Do",
      priority: "Medium",
      dueDate: "",
      tag: "",
    });
  }

  function openNewTask(projectId = "") {
    setEditingTask(null);
    resetTaskForm(projectId);
    setShowTaskModal(true);
  }

  function openEditTask(task) {
    setEditingTask(task);

    setTaskForm({
      title: task.title,
      description: task.description || "",
      projectId: task.projectId,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate || "",
      tag: task.tag || "",
    });

    setShowTaskModal(true);
  }

  async function saveTask(event) {
    event.preventDefault();

    if (!taskForm.title.trim()) {
      showMessage("Please enter a task title.");
      return;
    }

    if (!taskForm.projectId) {
      showMessage("Please select a project.");
      return;
    }

    setLoading(true);

    const cleanTask = {
      ...taskForm,
      title: taskForm.title.trim(),
      description: taskForm.description.trim(),
      tag: taskForm.tag.trim(),
    };

    try {
      if (editingTask) {
        const updatedTask = {
          ...editingTask,
          ...cleanTask,
        };

        if (supabaseMode) {
          const { error } = await supabase
            .from("tasks")
            .update({
              title: updatedTask.title,
              description: updatedTask.description,
              project_id: updatedTask.projectId,
              status: updatedTask.status,
              priority: updatedTask.priority,
              due_date: updatedTask.dueDate || null,
              tag: updatedTask.tag,
              updated_at: new Date().toISOString(),
            })
            .eq("id", editingTask.id)
            .eq("workspace_id", WORKSPACE_ID);

          if (error) throw error;
        }

        setTasks((current) =>
          current.map((task) =>
            task.id === editingTask.id ? updatedTask : task
          )
        );

        showMessage("Task updated successfully.");
      } else {
        const newTask = {
          ...cleanTask,
          id: createId("task"),
          createdAt: new Date().toISOString().slice(0, 10),
        };

        if (supabaseMode) {
          const { data, error } = await supabase
            .from("tasks")
            .insert({
              id: newTask.id,
              workspace_id: WORKSPACE_ID,
              project_id: newTask.projectId,
              title: newTask.title,
              description: newTask.description,
              status: newTask.status,
              priority: newTask.priority,
              due_date: newTask.dueDate || null,
              tag: newTask.tag,
            })
            .select()
            .single();

          if (error) throw error;

          setTasks((current) => [
            mapTaskFromDb(data),
            ...current,
          ]);
        } else {
          setTasks((current) => [newTask, ...current]);
        }

        showMessage("Task created successfully.");
      }

      setShowTaskModal(false);
      setEditingTask(null);
    } catch (error) {
      console.error("Task save error:", error);
      showMessage(error.message || "Task save nahi ho saka.");
    } finally {
      setLoading(false);
    }
  }

  function requestDeleteTask(task) {
    setConfirmAction(() => async () => {
      setLoading(true);

      try {
        if (supabaseMode) {
          const { error } = await supabase
            .from("tasks")
            .delete()
            .eq("id", task.id)
            .eq("workspace_id", WORKSPACE_ID);

          if (error) throw error;
        }

        setTasks((current) =>
          current.filter((item) => item.id !== task.id)
        );

        showMessage("Task deleted.");
      } catch (error) {
        console.error("Task delete error:", error);
        showMessage(error.message || "Task delete nahi ho saka.");
      } finally {
        setLoading(false);
      }
    });

    setShowConfirmModal(true);
  }

  async function updateTaskStatus(taskId, status) {
    try {
      if (supabaseMode) {
        const { error } = await supabase
          .from("tasks")
          .update({
            status,
            updated_at: new Date().toISOString(),
          })
          .eq("id", taskId)
          .eq("workspace_id", WORKSPACE_ID);

        if (error) throw error;
      }

      setTasks((current) =>
        current.map((task) =>
          task.id === taskId ? { ...task, status } : task
        )
      );

      showMessage("Task status updated.");
    } catch (error) {
      console.error("Status update error:", error);
      showMessage(error.message || "Status update nahi ho saka.");
    }
  }

  function clearFilters() {
    setSearchTerm("");
    setStatusFilter("All");
    setPriorityFilter("All");
    setSortBy("newest");
  }

  function exportWorkspace() {
    const data = {
      projects,
      tasks,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "projectflow-workspace.json";
    link.click();

    URL.revokeObjectURL(url);

    showMessage("Workspace exported successfully.");
  }

  function importWorkspace(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = (loadEvent) => {
      try {
        const data = JSON.parse(loadEvent.target.result);

        if (
          !Array.isArray(data.projects) ||
          !Array.isArray(data.tasks)
        ) {
          throw new Error("Invalid file");
        }

        setProjects(data.projects);
        setTasks(data.tasks);
        setActivePage("Dashboard");
        setSelectedProjectId(null);

        showMessage("Workspace imported successfully.");
      } catch {
        showMessage("Invalid workspace JSON file.");
      }
    };

    reader.readAsText(file);
    event.target.value = "";
  }

  function resetWorkspace() {
    setConfirmAction(() => () => {
      setProjects(initialProjects);
      setTasks(initialTasks);
      setActivePage("Dashboard");
      setSelectedProjectId(null);
      clearFilters();

      showMessage("Workspace reset successfully.");
    });

    setShowConfirmModal(true);
  }

  function renderDashboard() {
    return (
      <>
        <PageHeading
          eyebrow="Workspace overview"
          title="Good morning, Alex 👋"
          subtitle="Here's what's happening with your projects today."
          action={
            <button
              className="primary-button"
              onClick={() => openNewTask()}
            >
              ＋ New Task
            </button>
          }
        />

        <div className="stats-grid">
          <StatCard
            title="Total Projects"
            value={stats.totalProjects}
            icon="▦"
            color="purple"
            detail="Active projects"
          />

          <StatCard
            title="Total Tasks"
            value={stats.totalTasks}
            icon="✓"
            color="blue"
            detail="Across all projects"
          />

          <StatCard
            title="In Progress"
            value={stats.inProgress}
            icon="◷"
            color="orange"
            detail="Tasks being worked on"
          />

          <StatCard
            title="Completed"
            value={stats.completed}
            icon="★"
            color="green"
            detail={`${stats.completionRate}% completion rate`}
          />
        </div>

        <div className="dashboard-grid">
          <section className="panel">
            <PanelHeading
              title="Project Progress"
              subtitle="Track the progress of your active projects."
              action={
                <button
                  className="text-button"
                  onClick={() => setActivePage("Projects")}
                >
                  View all →
                </button>
              }
            />

            <div className="project-progress-list">
              {projects.slice(0, 5).map((project) => {
                const progress = getProjectProgress(project.id);
                const count = getProjectTasks(project.id).length;

                return (
                  <button
                    className="project-progress-row"
                    key={project.id}
                    onClick={() => openProject(project.id)}
                  >
                    <div
                      className="project-icon"
                      style={{ background: project.color }}
                    >
                      {getInitials(project.name)}
                    </div>

                    <div className="project-progress-content">
                      <div className="project-progress-top">
                        <strong>{project.name}</strong>
                        <span>{progress}%</span>
                      </div>

                      <div className="progress-track">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${progress}%`,
                            background: project.color,
                          }}
                        />
                      </div>

                      <small>{count} tasks</small>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="panel overview-panel">
            <PanelHeading
              title="Task Overview"
              subtitle="Your current task distribution."
            />

            <div
              className="donut-chart"
              style={{
                background: `conic-gradient(
                  #00b894 0deg ${stats.completed * 3.6}deg,
                  #fdcb6e ${stats.completed * 3.6}deg ${
                  (stats.completed + stats.inProgress) * 3.6
                }deg,
                  #6c5ce7 ${
                    (stats.completed + stats.inProgress) * 3.6
                  }deg 360deg
                )`,
              }}
            >
              <div className="donut-center">
                <strong>{stats.totalTasks}</strong>
                <span>Total Tasks</span>
              </div>
            </div>

            <div className="legend-list">
              <Legend
                color="#00b894"
                label="Completed"
                value={stats.completed}
              />

              <Legend
                color="#fdcb6e"
                label="In Progress"
                value={stats.inProgress}
              />

              <Legend
                color="#6c5ce7"
                label="To Do"
                value={stats.todo}
              />
            </div>
          </section>
        </div>

        <section className="panel">
          <PanelHeading
            title="Recent Tasks"
            subtitle="Latest tasks from your workspace."
            action={
              <button
                className="text-button"
                onClick={() => openNewTask()}
              >
                ＋ Add task
              </button>
            }
          />

          <TaskTable
            tasks={tasks.slice(0, 6)}
            getProjectName={getProjectName}
            onStatusChange={updateTaskStatus}
            onEdit={openEditTask}
            onDelete={requestDeleteTask}
          />
        </section>
      </>
    );
  }

  function renderProjects() {
    return (
      <>
        <PageHeading
          eyebrow="Workspace"
          title="Projects"
          subtitle="Manage all your projects from one place."
          action={
            <button
              className="primary-button"
              onClick={openNewProject}
            >
              ＋ New Project
            </button>
          }
        />

        <div className="projects-grid">
          {projects.map((project) => {
            const projectTasks = getProjectTasks(project.id);
            const progress = getProjectProgress(project.id);

            return (
              <article className="project-card" key={project.id}>
                <div className="project-card-top">
                  <button
                    className="large-project-icon"
                    style={{ background: project.color }}
                    onClick={() => openProject(project.id)}
                  >
                    {getInitials(project.name)}
                  </button>

                  <div className="card-actions">
                    <button
                      className="small-icon-button"
                      onClick={() => openEditProject(project)}
                      title="Edit project"
                    >
                      ✎
                    </button>

                    <button
                      className="small-icon-button danger"
                      onClick={() => requestDeleteProject(project)}
                      title="Delete project"
                    >
                      ×
                    </button>
                  </div>
                </div>

                <button
                  className="project-card-title"
                  onClick={() => openProject(project.id)}
                >
                  {project.name}
                </button>

                <p>
                  {project.description || "No project description."}
                </p>

                <div className="project-card-meta">
                  <span>{projectTasks.length} tasks</span>
                  <strong>{progress}%</strong>
                </div>

                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${progress}%`,
                      background: project.color,
                    }}
                  />
                </div>

                <button
                  className="outline-button full-width"
                  onClick={() => openProject(project.id)}
                >
                  Open project →
                </button>
              </article>
            );
          })}
        </div>
      </>
    );
  }

  function renderProjectPage() {
    if (!selectedProject) {
      setActivePage("Projects");
      return null;
    }

    const projectTasks = filteredTasks.filter(
      (task) => task.projectId === selectedProject.id
    );

    return (
      <>
        <PageHeading
          eyebrow="Project workspace"
          title={selectedProject.name}
          subtitle={
            selectedProject.description ||
            "Organize and track tasks for this project."
          }
          action={
            <button
              className="primary-button"
              onClick={() => openNewTask(selectedProject.id)}
            >
              ＋ New Task
            </button>
          }
        />

        <div className="project-toolbar">
          <button
            className="back-button"
            onClick={() => setActivePage("Projects")}
          >
            ← Back to projects
          </button>

          <div className="toolbar-actions">
            <button
              className="outline-button"
              onClick={() => openEditProject(selectedProject)}
            >
              ✎ Edit Project
            </button>

            <button
              className="outline-button danger-text"
              onClick={() => requestDeleteProject(selectedProject)}
            >
              Delete
            </button>
          </div>
        </div>

        <div className="project-mini-stats">
          <div>
            <span>Total Tasks</span>
            <strong>{projectTasks.length}</strong>
          </div>

          <div>
            <span>To Do</span>
            <strong>
              {
                projectTasks.filter(
                  (task) => task.status === "To Do"
                ).length
              }
            </strong>
          </div>

          <div>
            <span>In Progress</span>
            <strong>
              {
                projectTasks.filter(
                  (task) => task.status === "In Progress"
                ).length
              }
            </strong>
          </div>

          <div>
            <span>Completed</span>
            <strong>
              {
                projectTasks.filter(
                  (task) => task.status === "Completed"
                ).length
              }
            </strong>
          </div>
        </div>

        <div className="kanban-board">
          {STATUSES.map((status) => {
            const statusTasks = projectTasks.filter(
              (task) => task.status === status
            );

            return (
              <section className="kanban-column" key={status}>
                <div className="kanban-heading">
                  <div
                    className={`status-dot ${status
                      .replace(/\s/g, "-")
                      .toLowerCase()}`}
                  />

                  <h2>{status}</h2>
                  <span>{statusTasks.length}</span>
                </div>

                <div className="kanban-task-list">
                  {statusTasks.length === 0 ? (
                    <div className="empty-column">
                      <span>○</span>
                      No tasks here
                    </div>
                  ) : (
                    statusTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onStatusChange={updateTaskStatus}
                        onEdit={openEditTask}
                        onDelete={requestDeleteTask}
                      />
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </>
    );
  }

  function renderAllTasks() {
    return (
      <>
        <PageHeading
          eyebrow="Workspace"
          title="All Tasks"
          subtitle="Search, filter and manage every task."
          action={
            <button
              className="primary-button"
              onClick={() => openNewTask()}
            >
              ＋ New Task
            </button>
          }
        />

        <section className="panel">
          <div className="filters-header">
            <div>
              <h2>Task Management</h2>
              <p>{filteredTasks.length} matching tasks found.</p>
            </div>

            <button
              className="outline-button"
              onClick={() => setShowFilters((value) => !value)}
            >
              ⚙ Filters
            </button>
          </div>

          {showFilters && (
            <div className="filters-panel">
              <label>
                Status
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value)
                  }
                >
                  <option>All</option>
                  {STATUSES.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </label>

              <label>
                Priority
                <select
                  value={priorityFilter}
                  onChange={(event) =>
                    setPriorityFilter(event.target.value)
                  }
                >
                  <option>All</option>
                  {PRIORITIES.map((priority) => (
                    <option key={priority}>{priority}</option>
                  ))}
                </select>
              </label>

              <label>
                Sort By
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="dueDate">Due Date</option>
                  <option value="priority">Priority</option>
                </select>
              </label>

              <button className="text-button" onClick={clearFilters}>
                Clear filters
              </button>
            </div>
          )}

          <TaskTable
            tasks={filteredTasks}
            getProjectName={getProjectName}
            onStatusChange={updateTaskStatus}
            onEdit={openEditTask}
            onDelete={requestDeleteTask}
          />
        </section>
      </>
    );
  }

  function renderSettings() {
    return (
      <>
        <PageHeading
          eyebrow="Preferences"
          title="Settings"
          subtitle="Customize your ProjectFlow workspace."
        />

        <section className="panel settings-panel">
          <div className="settings-row">
            <div>
              <h3>Dark Mode</h3>
              <p>Switch between light and dark appearance.</p>
            </div>

            <button
              className={`toggle ${darkMode ? "active" : ""}`}
              onClick={() => setDarkMode((value) => !value)}
              aria-label="Toggle dark mode"
            >
              <span />
            </button>
          </div>

          <div className="settings-row">
            <div>
              <h3>Database Connection</h3>
              <p>
                {supabaseMode
                  ? "Connected with Supabase database."
                  : "Using local browser storage."}
              </p>
            </div>

            <span className="settings-badge">
              {supabaseMode ? "Supabase" : "Local"}
            </span>
          </div>

          <div className="settings-row">
            <div>
              <h3>Workspace Statistics</h3>
              <p>
                {stats.totalProjects} projects and{" "}
                {stats.totalTasks} tasks currently stored.
              </p>
            </div>
          </div>

          <div className="settings-row">
            <div>
              <h3>Export Workspace</h3>
              <p>Download your projects and tasks as a JSON file.</p>
            </div>

            <button
              className="outline-button"
              onClick={exportWorkspace}
            >
              Export JSON
            </button>
          </div>

          <div className="settings-row">
            <div>
              <h3>Import Workspace</h3>
              <p>Restore projects and tasks from a JSON backup.</p>
            </div>

            <label className="outline-button file-button">
              Import JSON
              <input
                type="file"
                accept="application/json"
                onChange={importWorkspace}
              />
            </label>
          </div>

          <div className="settings-row danger-row">
            <div>
              <h3>Reset Workspace</h3>
              <p>Restore demo data in the current browser.</p>
            </div>

            <button
              className="outline-button danger-text"
              onClick={resetWorkspace}
            >
              Reset Data
            </button>
          </div>
        </section>
      </>
    );
  }

  function renderContent() {
    if (activePage === "Dashboard") return renderDashboard();
    if (activePage === "Projects") return renderProjects();
    if (activePage === "Tasks") return renderAllTasks();
    if (activePage === "Settings") return renderSettings();
    if (activePage === "Project") return renderProjectPage();

    return renderDashboard();
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">P</div>

          <div>
            <strong>ProjectFlow</strong>
            <span>Workspace</span>
          </div>
        </div>

        <div className="sidebar-section">
          <p className="sidebar-label">Main Menu</p>

          <NavItem
            icon="⌂"
            label="Dashboard"
            active={activePage === "Dashboard"}
            onClick={() => setActivePage("Dashboard")}
          />

          <NavItem
            icon="▦"
            label="Projects"
            count={projects.length}
            active={activePage === "Projects"}
            onClick={() => setActivePage("Projects")}
          />

          <NavItem
            icon="✓"
            label="All Tasks"
            count={tasks.length}
            active={activePage === "Tasks"}
            onClick={() => setActivePage("Tasks")}
          />

          <NavItem
            icon="⚙"
            label="Settings"
            active={activePage === "Settings"}
            onClick={() => setActivePage("Settings")}
          />
        </div>

        <div className="sidebar-section">
          <div className="sidebar-label-row">
            <p className="sidebar-label">Your Projects</p>

            <button
              className="sidebar-add"
              onClick={openNewProject}
              title="New project"
            >
              ＋
            </button>
          </div>

          {projects.map((project) => (
            <button
              className={`nav-item project-nav-item ${
                selectedProjectId === project.id &&
                activePage === "Project"
                  ? "active"
                  : ""
              }`}
              key={project.id}
              onClick={() => openProject(project.id)}
            >
              <span
                className="nav-project-dot"
                style={{ background: project.color }}
              />

              <span className="nav-project-name">
                {project.name}
              </span>
            </button>
          ))}
        </div>

        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <div className="upgrade-icon">✦</div>
            <strong>Upgrade Workspace</strong>
            <p>Unlock more powerful productivity features.</p>

            <button
              onClick={() =>
                showMessage("Upgrade feature coming soon.")
              }
            >
              Upgrade now →
            </button>
          </div>

          <div className="profile">
            <div className="avatar">A</div>

            <div>
              <strong>Alex Morgan</strong>
              <span>Administrator</span>
            </div>

            <button onClick={() => setActivePage("Settings")}>
              ⋯
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="mobile-brand">
            <div className="brand-logo">P</div>
            <strong>ProjectFlow</strong>
          </div>

          <div className="search-box">
            <span>⌕</span>

            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search projects, tasks..."
            />

            {searchTerm && (
              <button onClick={() => setSearchTerm("")}>×</button>
            )}
          </div>

          <div className="topbar-actions">
            <button
              className="icon-button"
              onClick={() => setDarkMode((value) => !value)}
              title="Toggle dark mode"
            >
              {darkMode ? "☀" : "☾"}
            </button>

            <button
              className="icon-button notification-button"
              onClick={() =>
                showMessage(
                  stats.overdue
                    ? `You have ${stats.overdue} overdue task(s).`
                    : "You are all caught up."
                )
              }
              title="Notifications"
            >
              ♢
              {stats.overdue > 0 && <span />}
            </button>

            <div className="topbar-user">
              <div className="avatar">A</div>

              <div>
                <strong>Alex Morgan</strong>
                <span>Admin</span>
              </div>
            </div>
          </div>
        </header>

        {loading && (
          <div className="loading-bar">
            Saving / loading data...
          </div>
        )}

        <div className="content-area">{renderContent()}</div>
      </main>

      {notice && <div className="toast">{notice}</div>}

      {showProjectModal && (
        <Modal
          title={editingProject ? "Edit Project" : "Create New Project"}
          subtitle={
            editingProject
              ? "Update your project information."
              : "Add a new project to your workspace."
          }
          onClose={() => setShowProjectModal(false)}
        >
          <form onSubmit={saveProject} className="modal-form">
            <label>
              Project Name
              <input
                autoFocus
                value={projectForm.name}
                onChange={(event) =>
                  setProjectForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="e.g. Website Redesign"
              />
            </label>

            <label>
              Description
              <textarea
                value={projectForm.description}
                onChange={(event) =>
                  setProjectForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="Write a short project description..."
                rows="3"
              />
            </label>

            <label>
              Project Color
              <div className="color-options">
                {COLORS.map((color) => (
                  <button
                    type="button"
                    key={color}
                    className={`color-option ${
                      projectForm.color === color ? "selected" : ""
                    }`}
                    style={{ background: color }}
                    onClick={() =>
                      setProjectForm((current) => ({
                        ...current,
                        color,
                      }))
                    }
                  />
                ))}
              </div>
            </label>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowProjectModal(false)}
              >
                Cancel
              </button>

              <button className="primary-button" type="submit">
                {editingProject ? "Save Changes" : "Create Project"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showTaskModal && (
        <Modal
          title={editingTask ? "Edit Task" : "Create New Task"}
          subtitle={
            editingTask
              ? "Update task details."
              : "Add a task to one of your projects."
          }
          onClose={() => setShowTaskModal(false)}
        >
          <form onSubmit={saveTask} className="modal-form">
            <label>
              Task Title
              <input
                autoFocus
                value={taskForm.title}
                onChange={(event) =>
                  setTaskForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                placeholder="e.g. Design landing page"
              />
            </label>

            <label>
              Description
              <textarea
                value={taskForm.description}
                onChange={(event) =>
                  setTaskForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="Describe this task..."
                rows="3"
              />
            </label>

            <label>
              Project
              <select
                value={taskForm.projectId}
                onChange={(event) =>
                  setTaskForm((current) => ({
                    ...current,
                    projectId: event.target.value,
                  }))
                }
              >
                <option value="">Select project</option>

                {projects.map((project) => (
                  <option value={project.id} key={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="form-grid">
              <label>
                Status
                <select
                  value={taskForm.status}
                  onChange={(event) =>
                    setTaskForm((current) => ({
                      ...current,
                      status: event.target.value,
                    }))
                  }
                >
                  {STATUSES.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </label>

              <label>
                Priority
                <select
                  value={taskForm.priority}
                  onChange={(event) =>
                    setTaskForm((current) => ({
                      ...current,
                      priority: event.target.value,
                    }))
                  }
                >
                  {PRIORITIES.map((priority) => (
                    <option key={priority}>{priority}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="form-grid">
              <label>
                Due Date
                <input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(event) =>
                    setTaskForm((current) => ({
                      ...current,
                      dueDate: event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                Tag
                <input
                  value={taskForm.tag}
                  onChange={(event) =>
                    setTaskForm((current) => ({
                      ...current,
                      tag: event.target.value,
                    }))
                  }
                  placeholder="e.g. Design"
                />
              </label>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowTaskModal(false)}
              >
                Cancel
              </button>

              <button className="primary-button" type="submit">
                {editingTask ? "Save Changes" : "Create Task"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showConfirmModal && (
        <Modal
          title="Are you sure?"
          subtitle="This action cannot be undone."
          onClose={() => setShowConfirmModal(false)}
        >
          <div className="confirm-content">
            <div className="confirm-icon">!</div>

            <p>
              Please confirm that you want to continue with this action.
            </p>
          </div>

          <div className="modal-actions">
            <button
              className="secondary-button"
              onClick={() => setShowConfirmModal(false)}
            >
              Cancel
            </button>

            <button
              className="primary-button danger-button"
              onClick={async () => {
                await confirmAction?.();
                setShowConfirmModal(false);
                setConfirmAction(null);
              }}
            >
              Confirm
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function PageHeading({ eyebrow, title, subtitle, action }) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="page-subtitle">{subtitle}</p>
      </div>

      {action}
    </div>
  );
}

function PanelHeading({ title, subtitle, action }) {
  return (
    <div className="panel-heading">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>

      {action}
    </div>
  );
}

function NavItem({ icon, label, count, active, onClick }) {
  return (
    <button
      className={`nav-item ${active ? "active" : ""}`}
      onClick={onClick}
    >
      <span>{icon}</span>
      {label}
      {count !== undefined && <small>{count}</small>}
    </button>
  );
}

function StatCard({ title, value, icon, color, detail }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}>{icon}</div>

      <div className="stat-card-content">
        <span>{title}</span>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>

      <span className="stat-arrow">↗</span>
    </div>
  );
}

function Legend({ color, label, value }) {
  return (
    <div className="legend-item">
      <div className="legend-label">
        <span style={{ background: color }} />
        {label}
      </div>

      <strong>{value}</strong>
    </div>
  );
}

function TaskTable({
  tasks,
  getProjectName,
  onStatusChange,
  onEdit,
  onDelete,
}) {
  if (!tasks.length) {
    return (
      <div className="empty-state">
        <span>✓</span>
        <strong>No tasks found</strong>
        <p>Try changing your filters or create a new task.</p>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table className="task-table">
        <thead>
          <tr>
            <th>Task</th>
            <th>Project</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Due Date</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {tasks.map((task) => (
            <tr key={task.id}>
              <td>
                <div className="table-task-title">
                  <strong>{task.title}</strong>

                  {task.description && (
                    <small>{task.description}</small>
                  )}

                  {task.tag && <span>#{task.tag}</span>}
                </div>
              </td>

              <td>{getProjectName(task.projectId)}</td>

              <td>
                <span
                  className={`priority ${task.priority.toLowerCase()}`}
                >
                  {task.priority}
                </span>
              </td>

              <td>
                <select
                  className="status-select"
                  value={task.status}
                  onChange={(event) =>
                    onStatusChange(task.id, event.target.value)
                  }
                >
                  {STATUSES.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </td>

              <td>
                <span className={isOverdue(task) ? "overdue" : ""}>
                  {task.dueDate ? formatDate(task.dueDate) : "—"}
                </span>

                {isOverdue(task) && (
                  <small className="overdue-label">Overdue</small>
                )}
              </td>

              <td>
                <div className="table-actions">
                  <button
                    className="small-icon-button"
                    onClick={() => onEdit(task)}
                    title="Edit task"
                  >
                    ✎
                  </button>

                  <button
                    className="small-icon-button danger"
                    onClick={() => onDelete(task)}
                    title="Delete task"
                  >
                    ×
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TaskCard({ task, onStatusChange, onEdit, onDelete }) {
  return (
    <article className="task-card">
      <div className="task-card-top">
        <span className={`priority ${task.priority.toLowerCase()}`}>
          {task.priority}
        </span>

        <div className="task-card-actions">
          <button onClick={() => onEdit(task)} title="Edit task">
            ✎
          </button>

          <button onClick={() => onDelete(task)} title="Delete task">
            ×
          </button>
        </div>
      </div>

      <h3>{task.title}</h3>

      {task.description && <p>{task.description}</p>}

      {task.tag && <span className="task-tag">#{task.tag}</span>}

      <div className="task-card-bottom">
        <span className={isOverdue(task) ? "overdue" : ""}>
          {task.dueDate ? formatDate(task.dueDate) : "No due date"}
        </span>

        <select
          value={task.status}
          onChange={(event) =>
            onStatusChange(task.id, event.target.value)
          }
        >
          {STATUSES.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
      </div>
    </article>
  );
}

function Modal({ title, subtitle, onClose, children }) {
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        className="modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-heading">
          <div>
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>

          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

export default App;