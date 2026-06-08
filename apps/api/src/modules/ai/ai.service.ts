import { Injectable } from "@nestjs/common";
import { getTenantContext } from "@riyada/shared";
import { LlmRouter, type LlmTool, type TenantLlmPolicy } from "./llm-router";
import { AnthropicProvider } from "./providers/anthropic.provider";
import { OpenAiProvider } from "./providers/openai.provider";
import { GeminiProvider } from "./providers/gemini.provider";
import { LocalProvider } from "./providers/local.provider";
import { SkillsService } from "../skills/skills.service";
import { ComplianceService } from "../compliance/compliance.service";
import { RecommendationsService } from "../recommendations/recommendations.service";
import { PrismaService } from "../../common/prisma/prisma.service";

/**
 * RIYADA AI — grounded, tool-calling assistant. Every answer is grounded in the platform's own
 * data (Skills Graph, compliance state, recommendations) via typed tools, so the model reasons
 * over real numbers instead of hallucinating. OpenAI/Gemini/local adapters register the same way.
 */
@Injectable()
export class AiService {
  private readonly router = new LlmRouter();

  constructor(
    private readonly prisma: PrismaService,
    private readonly skills: SkillsService,
    private readonly compliance: ComplianceService,
    private readonly recommendations: RecommendationsService,
  ) {
    // Default reasoning model: Anthropic Claude. The other adapters are registered so per-tenant
    // model policy (cost routing, or requireLocal for sovereign tenants) can route to them.
    this.router.register(new AnthropicProvider());
    this.router.register(new OpenAiProvider());
    this.router.register(new GeminiProvider());
    this.router.register(new LocalProvider());
  }

  private tools(): LlmTool[] {
    return [
      {
        name: "get_skill_gap",
        description: "Get a user's skill gap against a target job role. Call this whenever the user asks what they need to learn, what skills they're missing, or about readiness for a role.",
        inputSchema: {
          type: "object",
          properties: { userId: { type: "string" }, roleId: { type: "string" } },
          required: ["userId", "roleId"],
        },
      },
      {
        name: "get_compliance_status",
        description: "Get green/amber/red compliance status for a department. Call this for any question about compliance, audit readiness, or risk.",
        inputSchema: {
          type: "object",
          properties: { departmentId: { type: "string" } },
          required: ["departmentId"],
        },
      },
      {
        name: "recommend_courses",
        description: "Generate explainable course recommendations for a user. Call this when the user asks what training to take.",
        inputSchema: {
          type: "object",
          properties: { userId: { type: "string" }, roleId: { type: "string" } },
          required: ["userId"],
        },
      },
    ];
  }

  /** Execute a tool the model asked for, against real platform data (tenant-scoped). Falls back
   *  to the current user's ids when the model omits them, and never throws (returns {error}). */
  private async runTool(name: string, input: Record<string, unknown>, ctx: ChatCtx) {
    const id = (v: unknown, fallback: string) => (v ? String(v) : fallback);
    try {
      switch (name) {
        case "get_skill_gap":
          return await this.skills.getSkillGap(id(input.userId, ctx.userId), id(input.roleId, ctx.roleId));
        case "get_compliance_status":
          return await this.compliance.departmentDashboard(id(input.departmentId, ctx.departmentId));
        case "recommend_courses":
          return await this.recommendations.generateForUser(id(input.userId, ctx.userId), id(input.roleId, ctx.roleId) || undefined);
        default:
          return { error: `unknown tool ${name}` };
      }
    } catch (e) {
      return { error: e instanceof Error ? e.message : "tool failed" };
    }
  }

  /**
   * One assistant turn with a single round of tool execution. A production implementation loops
   * until the model stops calling tools; kept to one hop here for clarity.
   */
  async chat(prompt: string, policy: TenantLlmPolicy = {}) {
    const tctx = getTenantContext();
    const userId = tctx.userId ?? "";
    const user = userId
      ? await this.prisma.db.user.findFirst({
          where: { id: userId },
          select: { firstName: true, lastName: true, targetRoleId: true, currentRoleId: true, departmentId: true },
        })
      : null;
    const ctx: ChatCtx = {
      userId,
      roleId: user?.targetRoleId ?? user?.currentRoleId ?? "",
      departmentId: user?.departmentId ?? "",
    };

    // Pre-fetch a compact live snapshot so even a small model answers grounded without depending
    // on tool-calling. Tools remain available for capable models.
    let snapshot = "";
    if (ctx.userId && ctx.roleId) {
      try {
        const gap = await this.skills.getSkillGap(ctx.userId, ctx.roleId);
        snapshot =
          `User: ${user?.firstName ?? ""} ${user?.lastName ?? ""}. Target role: ${gap.roleName}. ` +
          `Required-skill coverage ${Math.round(gap.coverage * 100)}%. ` +
          `Missing skills: ${gap.gaps.map((g) => g.name).join(", ") || "none"}.`;
      } catch {
        /* no snapshot */
      }
    }

    const system =
      "You are RIYADA AI, a workforce-intelligence assistant. Answer from the live context and " +
      "tool results; explain the 'why'; be concise and specific.\n" +
      (snapshot ? `LIVE CONTEXT — ${snapshot}\n` : "") +
      `When you call tools, use userId="${ctx.userId}", roleId="${ctx.roleId}", departmentId="${ctx.departmentId}".`;

    const first = await this.router.route("reasoning", {
      system,
      messages: [{ role: "user", content: prompt }],
      tools: this.tools(),
    }, policy);

    if (first.toolCalls.length === 0) return { answer: first.text, grounding: [] };

    const grounding = [];
    for (const call of first.toolCalls) {
      grounding.push({ tool: call.name, result: await this.runTool(call.name, call.input, ctx) });
    }

    const second = await this.router.route("reasoning", {
      system,
      messages: [
        { role: "user", content: prompt },
        { role: "assistant", content: first.text || "(calling tools)" },
        { role: "user", content: `Tool results (ground your answer in these, explain the why):\n${JSON.stringify(grounding)}` },
      ],
    }, policy);

    return { answer: second.text, grounding };
  }
}

interface ChatCtx {
  userId: string;
  roleId: string;
  departmentId: string;
}
