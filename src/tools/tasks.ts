import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { BoxClient } from "../lib/box-client.js";

export function registerTaskTools(server: McpServer, client: BoxClient) {
  server.tool(
    "box_task_complete_create",
    "Create a completion task on a file. Assignees must mark the task as complete.",
    {
      file_id: z.string().describe("The ID of the file to attach the task to"),
      due_at: z.string().optional().describe("ISO 8601 due date for the task"),
      message: z.string().optional().describe("Message/instructions for the task"),
      requires_all_assignees_to_complete: z.boolean().optional()
        .describe("Whether ALL assignees must complete the task (vs. just one)"),
    },
    async () => {
      // TODO: POST /tasks (action: complete)
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_task_review_create",
    "Create a review task on a file. Assignees must approve or reject the file.",
    {
      file_id: z.string().describe("The ID of the file to attach the review task to"),
      due_at: z.string().optional().describe("ISO 8601 due date for the task"),
      message: z.string().optional().describe("Message/instructions for the reviewer"),
      requires_all_assignees_to_complete: z.boolean().optional()
        .describe("Whether ALL assignees must review (vs. just one)"),
    },
    async () => {
      // TODO: POST /tasks (action: review)
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_task_details",
    "Get details of a specific task including status, assignees, and due date.",
    {
      task_id: z.string().describe("The ID of the task"),
    },
    async () => {
      // TODO: GET /tasks/:id
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_task_update",
    "Update a task's due date, message, or completion requirements.",
    {
      task_id: z.string().describe("The ID of the task to update"),
      due_at: z.string().optional().describe("New ISO 8601 due date"),
      message: z.string().optional().describe("Updated message/instructions"),
      requires_all_assignees_to_complete: z.boolean().optional()
        .describe("Update whether ALL assignees must complete"),
    },
    async () => {
      // TODO: PUT /tasks/:id
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_task_remove",
    "Delete a task from a file.",
    {
      task_id: z.string().describe("The ID of the task to delete"),
    },
    async () => {
      // TODO: DELETE /tasks/:id
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_task_file_list",
    "List all tasks on a specific file.",
    {
      file_id: z.string().describe("The ID of the file"),
    },
    async () => {
      // TODO: GET /files/:id/tasks
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_task_assign_by_email",
    "Assign a task to a user by their email address.",
    {
      task_id: z.string().describe("The ID of the task"),
      email: z.string().email().describe("The email address of the user to assign"),
    },
    async () => {
      // TODO: POST /task_assignments
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_task_assign_by_user_id",
    "Assign a task to a user by their Box user ID.",
    {
      task_id: z.string().describe("The ID of the task"),
      user_id: z.string().describe("The Box user ID to assign the task to"),
    },
    async () => {
      // TODO: POST /task_assignments
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_task_assignments_list",
    "List all assignments for a task. Shows who is assigned and their completion status.",
    {
      task_id: z.string().describe("The ID of the task"),
    },
    async () => {
      // TODO: GET /tasks/:id/assignments
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_task_assignment_details",
    "Get details of a specific task assignment including status and resolution.",
    {
      assignment_id: z.string().describe("The ID of the task assignment"),
    },
    async () => {
      // TODO: GET /task_assignments/:id
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_task_assignment_update",
    "Update a task assignment — mark as complete/incomplete or add a resolution message.",
    {
      assignment_id: z.string().describe("The ID of the task assignment"),
      is_positive_outcome: z.boolean().describe("True = approved/completed, False = rejected/incomplete"),
      message: z.string().optional().describe("Resolution message or comment"),
    },
    async () => {
      // TODO: PUT /task_assignments/:id
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_task_assignment_remove",
    "Remove a user's task assignment, unassigning them from the task.",
    {
      assignment_id: z.string().describe("The ID of the task assignment to remove"),
    },
    async () => {
      // TODO: DELETE /task_assignments/:id
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );
}
