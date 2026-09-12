import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import useLocalStorage from "../../hooks/useLocalStorage";

function ProjectBoard() {
  const { projectId } = useParams();

  const [projects] = useLocalStorage("projects", []);
  const [tasks, setTasks] = useLocalStorage("tasks", []);

  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskStatus, setTaskStatus] = useState("todo");
  const [taskPriority, setTaskPriority] = useState("medium");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskTags, setTaskTags] = useState("");

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const project = projects.find(
    (item) => item.id === projectId
  );

  const projectTasks = tasks.filter(
    (task) => task.projectId === projectId
  );

  const filteredTasks = [...projectTasks]
    .filter((task) => {
      const search = searchTerm.toLowerCase().trim();

      if (!search) {
        return true;
      }

      return (
        task.title?.toLowerCase().includes(search) ||
        task.description?.toLowerCase().includes(search) ||
        task.tags?.some((tag) =>
          tag.toLowerCase().includes(search)
        )
      );
    })
    .filter((task) => {
      if (statusFilter === "all") {
        return true;
      }

      return task.status === statusFilter;
    })
    .filter((task) => {
      if (priorityFilter === "all") {
        return true;
      }

      return task.priority === priorityFilter;
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return (
          new Date(b.createdAt) -
          new Date(a.createdAt)
        );
      }

      if (sortBy === "oldest") {
        return (
          new Date(a.createdAt) -
          new Date(b.createdAt)
        );
      }

      if (sortBy === "priority") {
        const priorityOrder = {
          urgent: 1,
          high: 2,
          medium: 3,
          low: 4,
        };

        return (
          (priorityOrder[a.priority] || 5) -
          (priorityOrder[b.priority] || 5)
        );
      }

      if (sortBy === "dueDate") {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;

        return (
          new Date(a.dueDate) -
          new Date(b.dueDate)
        );
      }

      return 0;
    });

  const todoTasks = filteredTasks.filter(
    (task) => task.status === "todo"
  );

  const inProgressTasks = filteredTasks.filter(
    (task) => task.status === "in-progress"
  );

  const doneTasks = filteredTasks.filter(
    (task) => task.status === "done"
  );

  const totalTodoTasks = projectTasks.filter(
    (task) => task.status === "todo"
  ).length;

  const totalInProgressTasks = projectTasks.filter(
    (task) => task.status === "in-progress"
  ).length;

  const totalDoneTasks = projectTasks.filter(
    (task) => task.status === "done"
  ).length;

  function openCreateModal() {
    setEditingTask(null);
    setTaskTitle("");
    setTaskDescription("");
    setTaskStatus("todo");
    setTaskPriority("medium");
    setTaskDueDate("");
    setTaskTags("");
    setShowModal(true);
  }

  function openEditModal(task) {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskDescription(task.description || "");
    setTaskStatus(task.status || "todo");
    setTaskPriority(task.priority || "medium");
    setTaskDueDate(task.dueDate || "");
    setTaskTags(
      Array.isArray(task.tags)
        ? task.tags.join(", ")
        : ""
    );
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingTask(null);
    setTaskTitle("");
    setTaskDescription("");
    setTaskStatus("todo");
    setTaskPriority("medium");
    setTaskDueDate("");
    setTaskTags("");
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!taskTitle.trim()) {
      alert("Please enter task title.");
      return;
    }

    const formattedTags = taskTags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    if (editingTask) {
      const updatedTasks = tasks.map((task) =>
        task.id === editingTask.id
          ? {
              ...task,
              title: taskTitle.trim(),
              description: taskDescription.trim(),
              status: taskStatus,
              priority: taskPriority,
              dueDate: taskDueDate,
              tags: formattedTags,
            }
          : task
      );

      setTasks(updatedTasks);
    } else {
      const newTask = {
        id: crypto.randomUUID(),
        projectId,
        title: taskTitle.trim(),
        description: taskDescription.trim(),
        status: taskStatus,
        priority: taskPriority,
        dueDate: taskDueDate,
        tags: formattedTags,
        createdAt: new Date().toISOString(),
      };

      setTasks([...tasks, newTask]);
    }

    closeModal();
  }

  function deleteTask(taskId) {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this task?"
    );

    if (!confirmDelete) {
      return;
    }

    setTasks(
      tasks.filter((task) => task.id !== taskId)
    );
  }

  function toggleTaskComplete(taskId) {
    setTasks(
      tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status:
                task.status === "done"
                  ? "todo"
                  : "done",
            }
          : task
      )
    );
  }

  function moveTask(taskId, newStatus) {
    setTasks(
      tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: newStatus,
            }
          : task
      )
    );
  }

  function clearFilters() {
    setSearchTerm("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setSortBy("newest");
  }

  function renderTaskCard(task) {
    return (
      <div className="task-card" key={task.id}>
        <div className="task-card-header">
          <span
            className={`priority-badge ${
              task.priority || "medium"
            }`}
          >
            {task.priority || "medium"}
          </span>

          <div className="task-card-menu">
            <button
              className="task-icon-btn"
              onClick={() => openEditModal(task)}
              title="Edit task"
            >
              ✏️
            </button>

            <button
              className="task-icon-btn"
              onClick={() => deleteTask(task.id)}
              title="Delete task"
            >
              🗑️
            </button>
          </div>
        </div>

        <h3>{task.title}</h3>

        {task.description && (
          <p className="task-description">
            {task.description}
          </p>
        )}

        {task.tags && task.tags.length > 0 && (
          <div className="task-tags">
            {task.tags.map((tag, index) => (
              <span
                className="task-tag"
                key={`${tag}-${index}`}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {task.dueDate && (
          <div className="task-due-date">
            📅 {task.dueDate}
          </div>
        )}

        <div className="task-card-footer">
          <button
            className="complete-task-btn"
            onClick={() =>
              toggleTaskComplete(task.id)
            }
          >
            {task.status === "done"
              ? "↩ Reopen"
              : "✓ Mark Done"}
          </button>

          {task.status === "todo" && (
            <button
              className="move-task-btn"
              onClick={() =>
                moveTask(task.id, "in-progress")
              }
            >
              Start →
            </button>
          )}

          {task.status === "in-progress" && (
            <button
              className="move-task-btn"
              onClick={() =>
                moveTask(task.id, "done")
              }
            >
              Complete →
            </button>
          )}

          {task.status === "done" && (
            <span className="completed-label">
              Completed
            </span>
          )}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <h2>Project not found</h2>

          <p>
            This project may have been deleted or does not exist.
          </p>

          <Link
            to="/projects"
            className="primary-btn"
          >
            ← Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <Link
            to="/projects"
            className="back-link"
          >
            ← Back to Projects
          </Link>

          <div className="project-title-row">
            <div
              className="project-title-icon"
              style={{
                backgroundColor: project.color,
              }}
            >
              📁
            </div>

            <div>
              <p className="page-label">
                PROJECT BOARD
              </p>

              <h1>{project.name}</h1>
            </div>
          </div>

          <p className="page-description">
            {project.description ||
              "Manage tasks and track project progress."}
          </p>
        </div>

        <button
          className="primary-btn"
          onClick={openCreateModal}
        >
          + New Task
        </button>
      </div>

      {/* Board Stats */}
      <div className="board-stats">
        <div className="board-stat">
          <span>Total Tasks</span>
          <strong>{projectTasks.length}</strong>
        </div>

        <div className="board-stat">
          <span>To Do</span>
          <strong>{totalTodoTasks}</strong>
        </div>

        <div className="board-stat">
          <span>In Progress</span>
          <strong>{totalInProgressTasks}</strong>
        </div>

        <div className="board-stat">
          <span>Completed</span>
          <strong>{totalDoneTasks}</strong>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="task-filters">
        <div className="task-search-box">
          <span>🔍</span>

          <input
            type="text"
            placeholder="Search tasks, descriptions or tags..."
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value)
          }
        >
          <option value="all">All Statuses</option>
          <option value="todo">To Do</option>
          <option value="in-progress">
            In Progress
          </option>
          <option value="done">Completed</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(event) =>
            setPriorityFilter(event.target.value)
          }
        >
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <select
          value={sortBy}
          onChange={(event) =>
            setSortBy(event.target.value)
          }
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="priority">Priority</option>
          <option value="dueDate">Due Date</option>
        </select>

        {(searchTerm ||
          statusFilter !== "all" ||
          priorityFilter !== "all" ||
          sortBy !== "newest") && (
          <button
            className="clear-filters-btn"
            onClick={clearFilters}
          >
            Clear
          </button>
        )}
      </div>

      {/* Filter Result Message */}
      {(searchTerm ||
        statusFilter !== "all" ||
        priorityFilter !== "all") && (
        <p className="filter-result-text">
          Showing {filteredTasks.length} of{" "}
          {projectTasks.length} tasks
        </p>
      )}

      {/* Kanban Board */}
      <div className="kanban-board">
        <div className="kanban-column">
          <div className="kanban-column-header todo-header">
            <div>
              <span className="column-dot todo-dot"></span>
              <h2>To Do</h2>
            </div>

            <span className="column-count">
              {todoTasks.length}
            </span>
          </div>

          <div className="kanban-tasks">
            {todoTasks.length === 0 ? (
              <div className="column-empty">
                No tasks here
              </div>
            ) : (
              todoTasks.map(renderTaskCard)
            )}
          </div>
        </div>

        <div className="kanban-column">
          <div className="kanban-column-header progress-header">
            <div>
              <span className="column-dot progress-dot"></span>
              <h2>In Progress</h2>
            </div>

            <span className="column-count">
              {inProgressTasks.length}
            </span>
          </div>

          <div className="kanban-tasks">
            {inProgressTasks.length === 0 ? (
              <div className="column-empty">
                No tasks here
              </div>
            ) : (
              inProgressTasks.map(renderTaskCard)
            )}
          </div>
        </div>

        <div className="kanban-column">
          <div className="kanban-column-header done-header">
            <div>
              <span className="column-dot done-dot"></span>
              <h2>Completed</h2>
            </div>

            <span className="column-count">
              {doneTasks.length}
            </span>
          </div>

          <div className="kanban-tasks">
            {doneTasks.length === 0 ? (
              <div className="column-empty">
                No tasks here
              </div>
            ) : (
              doneTasks.map(renderTaskCard)
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Task Modal */}
      {showModal && (
        <div
          className="modal-overlay"
          onClick={closeModal}
        >
          <div
            className="modal-box"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="modal-header">
              <div>
                <p className="page-label">
                  TASK MANAGEMENT
                </p>

                <h2>
                  {editingTask
                    ? "Edit Task"
                    : "Create New Task"}
                </h2>
              </div>

              <button
                className="close-btn"
                onClick={closeModal}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="taskTitle">
                  Task Title
                </label>

                <input
                  id="taskTitle"
                  type="text"
                  placeholder="e.g. Design homepage"
                  value={taskTitle}
                  onChange={(event) =>
                    setTaskTitle(event.target.value)
                  }
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="taskDescription">
                  Description
                </label>

                <textarea
                  id="taskDescription"
                  rows="3"
                  placeholder="Describe this task..."
                  value={taskDescription}
                  onChange={(event) =>
                    setTaskDescription(
                      event.target.value
                    )
                  }
                ></textarea>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="taskStatus">
                    Status
                  </label>

                  <select
                    id="taskStatus"
                    value={taskStatus}
                    onChange={(event) =>
                      setTaskStatus(event.target.value)
                    }
                  >
                    <option value="todo">
                      To Do
                    </option>

                    <option value="in-progress">
                      In Progress
                    </option>

                    <option value="done">
                      Completed
                    </option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="taskPriority">
                    Priority
                  </label>

                  <select
                    id="taskPriority"
                    value={taskPriority}
                    onChange={(event) =>
                      setTaskPriority(event.target.value)
                    }
                  >
                    <option value="low">Low</option>
                    <option value="medium">
                      Medium
                    </option>
                    <option value="high">High</option>
                    <option value="urgent">
                      Urgent
                    </option>
                  </select>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="taskDueDate">
                    Due Date
                  </label>

                  <input
                    id="taskDueDate"
                    type="date"
                    value={taskDueDate}
                    onChange={(event) =>
                      setTaskDueDate(event.target.value)
                    }
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="taskTags">
                    Tags
                  </label>

                  <input
                    id="taskTags"
                    type="text"
                    placeholder="design, frontend"
                    value={taskTags}
                    onChange={(event) =>
                      setTaskTags(event.target.value)
                    }
                  />
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

                <button
                  type="submit"
                  className="primary-btn"
                >
                  {editingTask
                    ? "Save Changes"
                    : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectBoard;