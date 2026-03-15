import type { PluginApi } from "openclaw/plugin-sdk";
import { ObservationalMemoryService } from "./services/memory-service";
import { ObserverAgent } from "./agents/observer";
import { ReflectorAgent } from "./agents/reflector";
import { MemoryTools } from "./tools/memory-tools";
import { setupCliCommands } from "./cli/commands";

export interface ObservationalMemoryConfig {
  workspace: string;
  observer: {
    enabled: boolean;
    schedule: string;
    model: string;
    compressionTarget: number;
  };
  reflector: {
    enabled: boolean;
    schedule: string;
    model: string;
    extractPatterns: boolean;
  };
  tiers: {
    recent: {
      maxTurns: number;
      maxSize: string;
    };
    observations: {
      maxSize: string;
      retentionDays: number;
    };
    reflections: {
      maxPatterns: number;
      maxLessons: number;
    };
  };
}

export default function observationalMemoryPlugin(api: PluginApi) {
  const config = api.config.plugins?.entries?.["observational-memory"]?.config as ObservationalMemoryConfig;
  
  if (!config) {
    api.logger.warn("Observational Memory plugin loaded but no configuration found");
    return;
  }

  const workspace = config.workspace.replace(/^~/, process.env.HOME || "");
  
  // Initialize core service
  const memoryService = new ObservationalMemoryService({
    workspace,
    config,
    logger: api.logger
  });

  // Initialize agents
  const observer = new ObserverAgent({
    service: memoryService,
    model: config.observer.model,
    compressionTarget: config.observer.compressionTarget,
    logger: api.logger
  });

  const reflector = new ReflectorAgent({
    service: memoryService,
    model: config.reflector.model,
    extractPatterns: config.reflector.extractPatterns,
    logger: api.logger
  });

  // Register agent tools
  const tools = new MemoryTools(memoryService, observer, reflector);
  api.registerTool("obs_memory_status", tools.getStatusTool());
  api.registerTool("obs_trigger_observer", tools.getObserverTool());
  api.registerTool("obs_trigger_reflector", tools.getReflectorTool());
  api.registerTool("obs_search_observations", tools.getSearchTool());
  api.registerTool("obs_get_reflections", tools.getReflectionsTool());

  // Register CLI commands
  setupCliCommands(api, { memoryService, observer, reflector });

  // Register background services for scheduled jobs
  if (config.observer.enabled) {
    api.registerService({
      id: "observational-memory-observer",
      start: async () => {
        api.logger.info("Observational Memory Observer service starting...");
        // Cron job registered via gateway cron API
        await api.cron.add({
          name: "observational-memory-observer",
          schedule: { kind: "cron", expr: config.observer.schedule },
          payload: {
            kind: "agentTurn",
            message: "Run observational memory observer compression",
            model: config.observer.model
          },
          sessionTarget: "isolated",
          enabled: true
        });
      },
      stop: async () => {
        api.logger.info("Observational Memory Observer service stopping...");
      }
    });
  }

  if (config.reflector.enabled) {
    api.registerService({
      id: "observational-memory-reflector",
      start: async () => {
        api.logger.info("Observational Memory Reflector service starting...");
        await api.cron.add({
          name: "observational-memory-reflector",
          schedule: { kind: "cron", expr: config.reflector.schedule },
          payload: {
            kind: "agentTurn",
            message: "Run observational memory reflector pattern extraction",
            model: config.reflector.model
          },
          sessionTarget: "isolated",
          enabled: true
        });
      },
      stop: async () => {
        api.logger.info("Observational Memory Reflector service stopping...");
      }
    });
  }

  // Register gateway RPC methods
  api.registerGatewayMethod("observational-memory.status", ({ respond }) => {
    const status = memoryService.getStatus();
    respond(true, status);
  });

  api.registerGatewayMethod("observational-memory.migrate", async ({ respond, params }) => {
    try {
      const result = await memoryService.migrateExistingMemory(params.checkOnly ?? false);
      respond(true, result);
    } catch (error) {
      respond(false, { error: String(error) });
    }
  });

  api.logger.info("Observational Memory plugin initialized");
}
