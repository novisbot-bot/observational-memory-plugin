import { join } from "path";
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, unlinkSync } from "fs";
import type { Logger } from "openclaw/plugin-sdk";
import type { ObservationalMemoryConfig } from "../index";
import { ensureDirectoryStructure, getFileSize, formatBytes, parseSize, DEFAULT_TEMPLATES } from "../utils/files";

export interface MemoryStatus {
  workspace: string;
  initialized: boolean;
  tiers: {
    system: { files: string[]; totalSize: string };
    observations: { files: string[]; totalSize: string; entryCount?: number };
    reflections: { files: string[]; totalSize: string };
    raw: { files: string[]; totalSize: string };
  };
  compressionStats: {
    originalSize: string;
    compressedSize: string;
    ratio: string;
    savingsPercent: number;
  };
  config: {
    observerEnabled: boolean;
    reflectorEnabled: boolean;
    recentMaxTurns: number;
    observationRetentionDays: number;
  };
}

export interface MigrationResult {
  success: boolean;
  migrated: string[];
  backedUp: string[];
  errors: string[];
  summary: string;
}

interface ServiceOptions {
  workspace: string;
  config: ObservationalMemoryConfig;
  logger: Logger;
}

export class ObservationalMemoryService {
  private workspace: string;
  private config: ObservationalMemoryConfig;
  private logger: Logger;

  constructor(options: ServiceOptions) {
    this.workspace = options.workspace;
    this.config = options.config;
    this.logger = options.logger;
    this.initialize();
  }

  private initialize(): void {
    ensureDirectoryStructure(this.workspace, DEFAULT_TEMPLATES);
    this.logger.info(`Observational Memory workspace initialized at ${this.workspace}`);
  }

  getStatus(): MemoryStatus {
    const tiers = {
      system: this.getTierStatus("SYSTEM"),
      observations: this.getTierStatus("OBSERVATIONS"),
      reflections: this.getTierStatus("REFLECTIONS"),
      raw: this.getTierStatus("RAW_MEMORY")
    };

    const systemSize = parseSize(tiers.system.totalSize);
    const observationsSize = parseSize(tiers.observations.totalSize);
    const reflectionsSize = parseSize(tiers.reflections.totalSize);
    const rawSize = parseSize(tiers.raw.totalSize);

    const compressedSize = systemSize + observationsSize + reflectionsSize;
    const originalSize = rawSize || compressedSize * 4;
    const savingsPercent = originalSize > 0 ? Math.round(((originalSize - compressedSize) / originalSize) * 100) : 0;

    return {
      workspace: this.workspace,
      initialized: existsSync(join(this.workspace, "SYSTEM", "CORE.md")),
      tiers,
      compressionStats: {
        originalSize: formatBytes(originalSize),
        compressedSize: formatBytes(compressedSize),
        ratio: `1:${Math.round(originalSize / compressedSize) || 1}`,
        savingsPercent
      },
      config: {
        observerEnabled: this.config.observer.enabled,
        reflectorEnabled: this.config.reflector.enabled,
        recentMaxTurns: this.config.tiers.recent.maxTurns,
        observationRetentionDays: this.config.tiers.observations.retentionDays
      }
    };
  }

  private getTierStatus(tier: string): { files: string[]; totalSize: string; entryCount?: number } {
    const tierPath = join(this.workspace, tier);
    if (!existsSync(tierPath)) {
      return { files: [], totalSize: "0 B" };
    }

    const files = readdirSync(tierPath).filter(f => {
      const stat = statSync(join(tierPath, f));
      return stat.isFile();
    });

    let totalSize = 0;
    let entryCount = 0;

    for (const file of files) {
      const size = getFileSize(join(tierPath, file));
      totalSize += size;

      if (tier === "OBSERVATIONS" && file === "observation_log.md") {
        const content = readFileSync(join(tierPath, file), "utf-8");
        entryCount = (content.match(/^##\s+\d{4}-\d{2}-\d{2}/gm) || []).length;
      }
    }

    return {
      files,
      totalSize: formatBytes(totalSize),
      entryCount: entryCount > 0 ? entryCount : undefined
    };
  }

  async migrateExistingMemory(checkOnly: boolean): Promise<MigrationResult> {
    const migrated: string[] = [];
    const backedUp: string[] = [];
    const errors: string[] = [];

    const filesToMigrate = [
      { source: "SOUL.md", dest: "RAW_MEMORY/SOUL.md", condensed: "SYSTEM/CORE.md" },
      { source: "AGENTS.md", dest: "RAW_MEMORY/AGENTS.md", condensed: "SYSTEM/RULES.md" },
      { source: "MEMORY.md", dest: "RAW_MEMORY/MEMORY.md", condensed: "REFLECTIONS/user_preferences.json" },
      { source: "SECURITY.md", dest: "RAW_MEMORY/SECURITY.md", condensed: "SYSTEM/SECURITY_CORE.md" }
    ];

    const workspaceRoot = process.env.OPENCLAW_WORKSPACE || ".";

    for (const { source, dest } of filesToMigrate) {
      const sourcePath = join(workspaceRoot, source);
      const destPath = join(this.workspace, dest);

      if (existsSync(sourcePath)) {
        if (checkOnly) {
          migrated.push(`${source} → ${dest}`);
        } else {
          try {
            const content = readFileSync(sourcePath, "utf-8");
            writeFileSync(destPath, content, "utf-8");
            backedUp.push(source);
            migrated.push(`${source} → ${dest}`);
            this.logger.info(`Migrated ${source} to ${dest}`);
          } catch (error) {
            errors.push(`${source}: ${error}`);
          }
        }
      }
    }

    return {
      success: errors.length === 0,
      migrated,
      backedUp,
      errors,
      summary: `Migrated ${migrated.length} files, ${errors.length} errors`
    };
  }

  getObservationLogPath(): string {
    return join(this.workspace, "OBSERVATIONS", "observation_log.md");
  }

  getTodayPath(): string {
    return join(this.workspace, "OBSERVATIONS", "TODAY.md");
  }

  getYesterdayPath(): string {
    return join(this.workspace, "OBSERVATIONS", "YESTERDAY.md");
  }

  getReflectionsPath(): string {
    return join(this.workspace, "REFLECTIONS");
  }

  appendToObservationLog(content: string): void {
    const logPath = this.getObservationLogPath();
    const existing = existsSync(logPath) ? readFileSync(logPath, "utf-8") : "";
    writeFileSync(logPath, existing + content, "utf-8");
  }

  readObservations(): string {
    const logPath = this.getObservationLogPath();
    if (!existsSync(logPath)) return "";
    return readFileSync(logPath, "utf-8");
  }

  readToday(): string {
    const path = this.getTodayPath();
    if (!existsSync(path)) return "";
    return readFileSync(path, "utf-8");
  }

  writeToday(content: string): void {
    writeFileSync(this.getTodayPath(), content, "utf-8");
  }

  rotateTodayToYesterday(): void {
    const todayPath = this.getTodayPath();
    const yesterdayPath = this.getYesterdayPath();

    if (existsSync(todayPath)) {
      const content = readFileSync(todayPath, "utf-8");
      writeFileSync(yesterdayPath, content, "utf-8");
      writeFileSync(todayPath, `# Today's Notes - ${new Date().toISOString().split('T')[0]}\n\n## Morning\n\n## Afternoon\n\n## Decisions\n\n## Next Steps\n\n`, "utf-8");
    }
  }

  readUserPreferences(): object {
    const path = join(this.workspace, "REFLECTIONS", "user_preferences.json");
    if (!existsSync(path)) return {};
    try {
      return JSON.parse(readFileSync(path, "utf-8"));
    } catch {
      return {};
    }
  }

  writeUserPreferences(prefs: object): void {
    const path = join(this.workspace, "REFLECTIONS", "user_preferences.json");
    writeFileSync(path, JSON.stringify(prefs, null, 2), "utf-8");
  }

  readLessonsLearned(): string {
    const path = join(this.workspace, "REFLECTIONS", "lessons_learned.md");
    if (!existsSync(path)) return "";
    return readFileSync(path, "utf-8");
  }

  writeLessonsLearned(content: string): void {
    writeFileSync(join(this.workspace, "REFLECTIONS", "lessons_learned.md"), content, "utf-8");
  }

  searchObservations(query: string): string[] {
    const logPath = this.getObservationLogPath();
    if (!existsSync(logPath)) return [];

    const content = readFileSync(logPath, "utf-8");
    const sections = content.split(/^##\s+/m);
    const queryLower = query.toLowerCase();

    return sections
      .filter(section => section.toLowerCase().includes(queryLower))
      .map(section => `## ${section.trim()}`);
  }

  cleanupOldObservations(): number {
    const retentionDays = this.config.tiers.observations.retentionDays;
    const logPath = this.getObservationLogPath();
    if (!existsSync(logPath)) return 0;

    const content = readFileSync(logPath, "utf-8");
    const sections = content.split(/^##\s+/m).filter(s => s.trim());

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    let keptCount = 0;
    const keptSections = sections.filter(section => {
      const dateMatch = section.match(/^(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        const sectionDate = new Date(dateMatch[1]);
        if (sectionDate >= cutoffDate) {
          keptCount++;
          return true;
        }
      }
      return false;
    });

    const removedCount = sections.length - keptCount;
    if (removedCount > 0) {
      writeFileSync(logPath, keptSections.map(s => `## ${s}`).join("\n\n"), "utf-8");
      this.logger.info(`Cleaned up ${removedCount} old observation entries`);
    }

    return removedCount;
  }
}
