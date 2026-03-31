# MCP Server Best Practices

## Quick Reference

### Server Naming
- **Node/TypeScript**: `{service}-mcp-server` (e.g., `slack-mcp-server`)

### Tool Naming
- Use snake_case with service prefix
- Format: `{service}_{action}_{resource}`
- Example: `slack_send_message`, `github_create_issue`

### Response Formats
- Support both JSON and Markdown formats
- JSON for programmatic processing
- Markdown for human readability

### Pagination
- Always respect `limit` parameter
- Return `has_more`, `next_offset`, `total_count`
- Default to 20-50 items

### Transport
- **Streamable HTTP**: For remote servers, multi-client scenarios
- **stdio**: For local integrations, command-line tools
- Avoid SSE (deprecated in favor of streamable HTTP)

---

## Tool Naming and Design

### Tool Naming

1. **Use snake_case**: `search_users`, `create_project`, `get_channel_info`
2. **Include service prefix**: Anticipate that your MCP server may be used alongside other MCP servers
   - Use `slack_send_message` instead of just `send_message`
   - Use `github_create_issue` instead of just `create_issue`
3. **Be action-oriented**: Start with verbs (get, list, search, create, etc.)
4. **Be specific**: Avoid generic names that could conflict with other servers

### Tool Design

- Tool descriptions must narrowly and unambiguously describe functionality
- Descriptions must precisely match actual functionality
- Provide tool annotations (readOnlyHint, destructiveHint, idempotentHint, openWorldHint)
- Keep tool operations focused and atomic

---

## Response Formats

### JSON Format (`response_format="json"`)
- Machine-readable structured data
- Include all available fields and metadata
- Consistent field names and types

### Markdown Format (`response_format="markdown"`, typically default)
- Human-readable formatted text
- Use headers, lists, and formatting for clarity
- Convert timestamps to human-readable format
- Omit verbose metadata

---

## Pagination

For tools that list resources:

- **Always respect the `limit` parameter**
- **Implement pagination**: Use `offset` or cursor-based pagination
- **Return pagination metadata**: Include `has_more`, `next_offset`/`next_cursor`, `total_count`
- **Default to reasonable limits**: 20-50 items is typical

---

## Security Best Practices

### Authentication and Authorization

**OAuth 2.1**:
- Use secure OAuth 2.1 with certificates from recognized authorities
- Validate access tokens before processing requests

**API Keys**:
- Store API keys in environment variables, never in code
- Validate keys on server startup
- Provide clear error messages when authentication fails

### Input Validation

- Use schema validation (Zod) for all inputs
- Sanitize file paths to prevent directory traversal
- Validate URLs and external identifiers
- Check parameter sizes and ranges

### Error Handling

- Don't expose internal errors to clients
- Log security-relevant errors server-side
- Provide helpful but not revealing error messages
- Clean up resources after errors

---

## Tool Annotations

| Annotation | Type | Default | Description |
|-----------|------|---------|-------------|
| `readOnlyHint` | boolean | false | Tool does not modify its environment |
| `destructiveHint` | boolean | true | Tool may perform destructive updates |
| `idempotentHint` | boolean | false | Repeated calls with same args have no additional effect |
| `openWorldHint` | boolean | true | Tool interacts with external entities |

---

## Error Handling

- Use standard JSON-RPC error codes
- Report tool errors within result objects (not protocol-level errors)
- Provide helpful, specific error messages with suggested next steps

```typescript
try {
  const result = performOperation();
  return { content: [{ type: "text", text: result }] };
} catch (error) {
  return {
    isError: true,
    content: [{
      type: "text",
      text: `Error: ${error.message}. Try using filter='active_only' to reduce results.`
    }]
  };
}
```
