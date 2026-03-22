import React from "react";
import TaskForm from "../admin/TaskForm.jsx";

/**
 * Task form for personnel — uses /api/tasks, no assign-to dropdown.
 */
const PersonnelTaskForm = (props) => (
  <TaskForm
    {...props}
    apiBase="/tasks"
    showAssignTo={false}
    officers={[]}
  />
);

export default PersonnelTaskForm;
