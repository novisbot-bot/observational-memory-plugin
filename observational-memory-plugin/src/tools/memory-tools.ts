import type { ObservationalMemoryService } from "../services/memory-service";
import type { ObserverAgent } from "../agents/observer";
import type { ReflectorAgent } from "../agents/reflector";

export class MemoryTools {
  private service: ObservationalMemoryService;
  private observer: ObserverAgent;
  private reflector: ReflectorAgent;

  constructor(
    service: ObservationalMemoryService,
    observer: ObserverAgent,
    reflector: ReflectorAgent
  ) {
    this.service = service;
    this.observer = observer;
    this.reflector = reflector;
  }

  getStatusTool() {
    return {
      name: "obs_memory_status",
      description: "Check observational memory status, compression stats, and configuration",
      parameters: {
        type: "object",
        properties: {},
        required: []
      },
      handler: async () => {
        const status = this.service.getStatus();
        return {
          content: [{
            type: "text",
            text: JSON.stringify(status, null, 2)
          }]
        };
      }
    };
  }

  getObserverTool() {
    return {
      name: "obs_trigger_observer",
      description: "Manually trigger the observer agent to compress yesterday's notes into the observation log",
      parameters: {
        type: "object",
        properties: {
          dryRun: {
            type: "boolean",
            description: "Preview compression without saving changes",
            default: false
          }
        },
        required: []
      },
      handler: async ({ dryRun = false }: { dryRun?: boolean }) => {
        if (dryRun) {
          const yesterday = this.service.readYesterday();
          return {
            content: [{
              type: "text",
              text: `Dry run - Yesterday's content (${yesterday.length} chars):\n\n${yesterday.substring(0, 1000)}...`
            }]
          };
        }

        const result = await this.observer.run();
        return {
          content: [{
            type: "text",
            text: result.success
              ? `✅ Observer completed: ${result.originalSize} → ${result.compressedSize} chars (${Math.round((1 - result.compressedSize/result.originalSize) * 100)}% reduction)`
              : `❌ Observer failed: ${result.error}`
          }]
        };
      }
    };
  }

  getReflectorTool() {
    return {
      name: "obs_trigger_reflector",
      description: "Manually trigger the reflector agent to extract patterns and lessons from observations",
      parameters: {
        type: "object",
        properties: {
          dryRun: {
            type: "boolean",
            description: "Preview patterns without saving changes",
            default: false
          }
        },
        required: []
      },
      handler: async ({ dryRun = false }: { dryRun?: boolean }) => {
        if (dryRun) {
          const observations = this.service.readObservations();
          return {
            content: [{
              type: "text",
              text: `Dry run - Observations to analyze (${observations.length} chars):\n\n${observations.substring(0, 1000)}...`
            }]
          };
        }

        const result = await this.reflector.run();
        return {
          content: [{
            type: "text",
            text: result.success
              ? `✅ Reflector completed: ${result.patterns.length} patterns, ${result.lessons.length} lessons extracted`
              : `❌ Reflector failed: ${result.error}`
          }]
        };
      }
    };
  }

  getSearchTool() {
    return {
      name: "obs_search_observations",
      description: "Search through compressed observations for specific topics or time periods",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search query for observations"
          }
        },
        required: ["query"]
      },
      handler: async ({ query }: { query: string }) => {
        const results = this.service.searchObservations(query);
        return {
          content: [{
            type: "text",
            text: results.length > 0
              ? `Found ${results.length} observation entries:\n\n${results.join('\n\n---\n\n')}`
              : `No observations found matching "${query}"`
          }]
        };
      }
    };
  }

  getReflectionsTool() {
    return {
      name: "obs_get_reflections",
      description: "Retrieve user preferences, lessons learned, and project status from reflections tier",
      parameters: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["preferences", "lessons", "projects", "all"],
            description: "Type of reflection data to retrieve",
            default: "all"
          }
        },
        required: []
      },
      handler: async ({ type = "all" }: { type?: string }) => {
        const data: Record<string, unknown> = {};

        if (type === "all" || type === "preferences") {
          data.preferences = this.service.readUserPreferences();
        }

        if (type === "all" || type === "lessons") {
          data.lessons = this.service.readLessonsLearned();
        }

        if (type === "all" || type === "projects") {
          const prefs = this.service.readUserPreferences();
          data.projects = prefs.active_projects || [];
        }

        return {
          content: [{
            type: "text",
            text: JSON.stringify(data, null, 2)
          }]
        };
      }
    };
  }
}
