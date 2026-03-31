import OAuthProvider from "@cloudflare/workers-oauth-provider";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";
import { BoxOAuthHandler, BOX_TOKEN_URL, type BoxOAuthProps } from "./oauth-handler.js";
import { BoxClient } from "./lib/box-client.js";

import { registerMetaTools } from "./tools/meta.js";
import { registerSearchTools } from "./tools/search.js";
import { registerAiTools } from "./tools/ai.js";
import { registerDocgenTools } from "./tools/docgen.js";
import { registerFileTools } from "./tools/files.js";
import { registerFileTransferTools } from "./tools/file-transfer.js";
import { registerFolderTools } from "./tools/folders.js";
import { registerMetadataTools } from "./tools/metadata.js";
import { registerUserTools } from "./tools/users.js";
import { registerGroupTools } from "./tools/groups.js";
import { registerCollaborationTools } from "./tools/collaborations.js";
import { registerSharedLinkTools } from "./tools/shared-links.js";
import { registerWebLinkTools } from "./tools/web-links.js";
import { registerTaskTools } from "./tools/tasks.js";

type StoredTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
};

const TOKENS_STORAGE_KEY = "box_tokens";

export class BoxMcpAgent extends McpAgent<Env, unknown, BoxOAuthProps> {
  server = new McpServer({
    name: "box-mcp-server",
    version: "0.1.0",
  });

  async init() {
    if (!this.props?.accessToken) {
      throw new Error(
        "Missing Box OAuth access token. The user must complete OAuth authentication before using MCP tools.",
      );
    }

    const storedTokens = await this.ctx.storage.get<StoredTokens>(TOKENS_STORAGE_KEY);
    const accessToken = storedTokens?.accessToken ?? this.props.accessToken;

    if (!storedTokens) {
      await this.ctx.storage.put(TOKENS_STORAGE_KEY, {
        accessToken: this.props.accessToken,
        refreshToken: this.props.refreshToken,
        expiresAt: this.props.expiresAt,
      } satisfies StoredTokens);
    }

    const boxClient = new BoxClient({
      accessToken,
      onTokenRefresh: () => this.refreshAccessToken(),
    });

    registerMetaTools(this.server, boxClient);
    registerSearchTools(this.server, boxClient);
    registerAiTools(this.server, boxClient);
    registerDocgenTools(this.server, boxClient);
    registerFileTools(this.server, boxClient);
    registerFileTransferTools(this.server, boxClient);
    registerFolderTools(this.server, boxClient);
    registerMetadataTools(this.server, boxClient);
    registerUserTools(this.server, boxClient);
    registerGroupTools(this.server, boxClient);
    registerCollaborationTools(this.server, boxClient);
    registerSharedLinkTools(this.server, boxClient);
    registerWebLinkTools(this.server, boxClient);
    registerTaskTools(this.server, boxClient);
  }

  async refreshAccessToken(): Promise<string> {
    const storedTokens = await this.ctx.storage.get<StoredTokens>(TOKENS_STORAGE_KEY);
    const refreshToken = storedTokens?.refreshToken ?? this.props?.refreshToken;

    if (!refreshToken) {
      throw new Error("No refresh token available. The user must re-authenticate with Box.");
    }

    const response = await fetch(BOX_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: this.env.BOX_CLIENT_ID,
        client_secret: this.env.BOX_CLIENT_SECRET,
        refresh_token: refreshToken,
      }).toString(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Box token refresh failed (${response.status}): ${errorBody}. The user may need to re-authenticate.`,
      );
    }

    const tokenData = (await response.json()) as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };

    const newTokens: StoredTokens = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: Date.now() + tokenData.expires_in * 1000,
    };

    await this.ctx.storage.put(TOKENS_STORAGE_KEY, newTokens);
    return newTokens.accessToken;
  }
}

export default new OAuthProvider({
  apiHandler: BoxMcpAgent.serve("/mcp", { jurisdiction: "eu" }),
  apiRoute: "/mcp",
  defaultHandler: BoxOAuthHandler,
  authorizeEndpoint: "/authorize",
  tokenEndpoint: "/token",
  clientRegistrationEndpoint: "/register",
});
