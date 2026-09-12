import { useState } from "react";

function TaskBoard({ tasks, setTasks }) {
  const [showModal, setShowModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState("Medium");

  function createTask(event) {
    event.preventDefault();

    if (!taskTitle.trim()) return;

    const newTask = {
      id: Date.now(),
      title: taskTitle.trim(),
      description: taskDescription.trim(),
      priority: taskPriority,
      status: "To Do",
    };

    setTasks((previousTasks) => [
      ...previousTasks,
      newTask,
    ]);

    setTaskTitle("");
    setTaskDescription("");
    setTaskPriority("Medium");
    setShowModal(false);
  }

  function updateTaskStatus(taskId, status) {
    setTasks((previousTasks) =>
      previousTasks.map((task) =>
        task.id === taskId
          ? { ...task, status }
          : task
      )
    );
  }

  function deleteTask(taskId) {
    setTasks((previousTasks) =>
      previousTasks.filter((task) => task.id !== taskId)
    );
  }

  const columns = ["To Do", "In Progress", "Completed"];

  return (
    <section className="task-board-section">
      <div className="section-title-row">
        <div>
          <span className="eyebrow">TASK MANAGEMENT</span>
          <h1>Task Board</h1>
          <p>Organize and track your work easily.</p>
        </div>

        <button
          className="primary-button"
          onClick={() => setShowModal(true)}
        >
          + New Task
        </button>
      </div>

      <div className="task-board">
        {columns.map((column) => {
          const columnTasks = tasks.filter(
            (task) => task.status === column
          );

          return (
            <div className="task-column" key={column}>
              <div className="task-column-header">
                <h2>{column}</h2>
                <span>{columnTasks.length}</span>
              </div>

              <div className="task-column-content">
                {columnTasks.length === 0 && (
                  <div className="no-tasks">
                    No tasks here
                  </div>
                )}

                {columnTasks.map((task) => (
                  <article className="task-card" key={task.id}>
                    <div className="task-card-top">
                      <span
                        className={`priority-badge ${task.priority.toLowerCase()}`}
                      >
                        {task.priority}
                      </span>

                      <button
                        className="delete-task"
                        onClick={() => deleteTask(task.id)}
                        title="Delete task"
                      >
                        ×
                      </button>
                    </div>

                    <h3>{task.title}</h3>

                    {task.description && (
                      <p>{task.description}</p>
                    )}

                    <select
                      value={task.status}
                      onChange={(event) =>
                        updateTaskStatus(
                          task.id,
                          event.target.value
                        )
                      }
                    >
                      {columns.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </article>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <button
              className="modal-close"
              onClick={() => setShowModal(false)}
            >
              ×
            </button>

            <h2>Create New Task</h2>
            <p>Add a task to your workspace.</p>

            <form onSubmit={createTask}>
              <label>Task Title</label>

              <input
                type="text"
                value={taskTitle}
                onChange={(event) =>
                  setTaskTitle(event.target.value)
                }
                placeholder="e.g. Design homepage"
                required
              />

              <label>Description</label>

              <textarea
                value={taskDescription}
                onChange={(event) =>
                  setTaskDescription(event.target.value)
                }
                placeholder="Write task details..."
                rows="4"
              />

              <label>Priority</label>

              <select
                value={taskPriority}
                onChange={(event) =>
                  setTaskPriority(event.target.value)
                }
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default TaskBoard;