import OAuthProvider from "@cloudflare/workers-oauth-provider";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";
import {
  UpstreamHandler,
  PROVIDER_TOKEN_URL,
  type UpstreamOAuthProps,
} from "./oauth-handler.js";

// Import tool registration functions
// import { registerExampleTools } from "./tools/example.js";

type StoredTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
};

const TOKENS_STORAGE_KEY = "provider_tokens";

// REPLACE: Rename class to match your project (e.g. AsanaMcpAgent, LinearMcpAgent)
export class MyMcpAgent extends McpAgent<Env, unknown, UpstreamOAuthProps> {
  server = new McpServer({
    name: "REPLACE-WITH-SERVER-NAME",
    version: "0.1.0",
  });

  async init() {
    if (!this.props?.accessToken) {
      throw new Error(
        "Missing OAuth access token. The user must complete OAuth authentication before using MCP tools.",
      );
    }

    const storedTokens = await this.ctx.storage.get<StoredTokens>(TOKENS_STORAGE_KEY);
    const accessToken = storedTokens?.accessToken ?? this.props.accessToken;

    // REPLACE: Create your API client with the access token
    // const client = new ApiClient(accessToken, () => this.refreshAccessToken());
    // registerExampleTools(this.server, client);
  }

  async refreshAccessToken(): Promise<string> {
    const storedTokens = await this.ctx.storage.get<StoredTokens>(TOKENS_STORAGE_KEY);
    const refreshToken = storedTokens?.refreshToken ?? this.props?.refreshToken;

    if (!refreshToken) {
      throw new Error("No refresh token available. The user must re-authenticate.");
    }

    const response = await fetch(PROVIDER_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: this.env.UPSTREAM_CLIENT_ID,
        client_secret: this.env.UPSTREAM_CLIENT_SECRET,
        refresh_token: refreshToken,
      }).toString(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Token refresh failed (${response.status}). The user may need to re-authenticate.`,
      );
    }

    // REPLACE: Adapt to your provider's token refresh response shape
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

// REPLACE: Add { jurisdiction: "eu" } to .serve() if you need EU data residency
export default new OAuthProvider({
  apiHandler: MyMcpAgent.serve("/mcp"),
  apiRoute: "/mcp",
  defaultHandler: UpstreamHandler,
  authorizeEndpoint: "/authorize",
  tokenEndpoint: "/token",
  clientRegistrationEndpoint: "/register",
});
