import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { BoxClient } from "../lib/box-client.js";
import { toolError } from "../lib/errors.js";

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
    async (args) => {
      try {
        const body: Record<string, unknown> = {
          item: { id: args.file_id, type: "file" },
          action: "complete",
        };
        if (args.due_at) body.due_at = args.due_at;
        if (args.message) body.message = args.message;
        if (args.requires_all_assignees_to_complete !== undefined) {
          body.completion_rule = args.requires_all_assignees_to_complete ? "all_assignees" : "any_assignee";
        }
        const result = await client.post("/tasks", body);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return toolError("Create completion task", error, { file_id: args.file_id });
      }
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
    async (args) => {
      try {
        const body: Record<string, unknown> = {
          item: { id: args.file_id, type: "file" },
          action: "review",
        };
        if (args.due_at) body.due_at = args.due_at;
        if (args.message) body.message = args.message;
        if (args.requires_all_assignees_to_complete !== undefined) {
          body.completion_rule = args.requires_all_assignees_to_complete ? "all_assignees" : "any_assignee";
        }
        const result = await client.post("/tasks", body);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return toolError("Create review task", error, { file_id: args.file_id });
      }
    },
  );

  server.tool(
    "box_task_details",
    "Get details of a specific task including status, assignees, and due date.",
    {
      task_id: z.string().describe("The ID of the task"),
    },
    async (args) => {
      try {
        const result = await client.get(`/tasks/${args.task_id}`);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return toolError("Get task details", error, { task_id: args.task_id });
      }
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
    async (args) => {
      try {
        const body: Record<string, unknown> = {};
        if (args.due_at) body.due_at = args.due_at;
        if (args.message) body.message = args.message;
        if (args.requires_all_assignees_to_complete !== undefined) {
          body.completion_rule = args.requires_all_assignees_to_complete ? "all_assignees" : "any_assignee";
        }
        const result = await client.put(`/tasks/${args.task_id}`, body);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return toolError("Update task", error, { task_id: args.task_id });
      }
    },
  );

  server.tool(
    "box_task_remove",
    "Delete a task from a file.",
    {
      task_id: z.string().describe("The ID of the task to delete"),
    },
    async (args) => {
      try {
        await client.delete(`/tasks/${args.task_id}`);
        return { content: [{ type: "text" as const, text: `Task ${args.task_id} deleted successfully.` }] };
      } catch (error) {
        return toolError("Delete task", error, { task_id: args.task_id });
      }
    },
  );

  server.tool(
    "box_task_file_list",
    "List all tasks on a specific file.",
    {
      file_id: z.string().describe("The ID of the file"),
    },
    async (args) => {
      try {
        const result = await client.get(`/files/${args.file_id}/tasks`);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return toolError("List file tasks", error, { file_id: args.file_id });
      }
    },
  );

  server.tool(
    "box_task_assign_by_email",
    "Assign a task to a user by their email address.",
    {
      task_id: z.string().describe("The ID of the task"),
      email: z.string().email().describe("The email address of the user to assign"),
    },
    async (args) => {
      try {
        const result = await client.post("/task_assignments", {
          task: { id: args.task_id, type: "task" },
          assign_to: { login: args.email },
        });
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return toolError("Assign task by email", error, { task_id: args.task_id, email: args.email });
      }
    },
  );

  server.tool(
    "box_task_assign_by_user_id",
    "Assign a task to a user by their Box user ID.",
    {
      task_id: z.string().describe("The ID of the task"),
      user_id: z.string().describe("The Box user ID to assign the task to"),
    },
    async (args) => {
      try {
        const result = await client.post("/task_assignments", {
          task: { id: args.task_id, type: "task" },
          assign_to: { id: args.user_id },
        });
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return toolError("Assign task by user ID", error, { task_id: args.task_id, user_id: args.user_id });
      }
    },
  );

  server.tool(
    "box_task_assignments_list",
    "List all assignments for a task. Shows who is assigned and their completion status.",
    {
      task_id: z.string().describe("The ID of the task"),
    },
    async (args) => {
      try {
        const result = await client.get(`/tasks/${args.task_id}/assignments`);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return toolError("List task assignments", error, { task_id: args.task_id });
      }
    },
  );

  server.tool(
    "box_task_assignment_details",
    "Get details of a specific task assignment including status and resolution.",
    {
      assignment_id: z.string().describe("The ID of the task assignment"),
    },
    async (args) => {
      try {
        const result = await client.get(`/task_assignments/${args.assignment_id}`);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return toolError("Get task assignment details", error, { assignment_id: args.assignment_id });
      }
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
    async (args) => {
      try {
        const body: Record<string, unknown> = {
          resolution_state: args.is_positive_outcome ? "completed" : "rejected",
        };
        if (args.message) body.message = args.message;
        const result = await client.put(`/task_assignments/${args.assignment_id}`, body);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return toolError("Update task assignment", error, { assignment_id: args.assignment_id });
      }
    },
  );

  server.tool(
    "box_task_assignment_remove",
    "Remove a user's task assignment, unassigning them from the task.",
    {
      assignment_id: z.string().describe("The ID of the task assignment to remove"),
    },
    async (args) => {
      try {
        await client.delete(`/task_assignments/${args.assignment_id}`);
        return { content: [{ type: "text" as const, text: `Task assignment ${args.assignment_id} removed successfully.` }] };
      } catch (error) {
        return toolError("Remove task assignment", error, { assignment_id: args.assignment_id });
      }
    },
  );
}
