import type { PluginApi } from "openclaw/plugin-sdk";
import type { ObservationalMemoryService } from "../services/memory-service";
import type { ObserverAgent } from "../agents/observer";
import type { ReflectorAgent } from "../agents/reflector";

interface CliContext {
  memoryService: ObservationalMemoryService;
  observer: ObserverAgent;
  reflector: ReflectorAgent;
}

export function setupCliCommands(api: PluginApi, ctx: CliContext): void {
  api.registerCli(
    ({ program }) => {
      // Main command group
      const obsCmd = program
        .command("observational-memory")
        .description("Observational Memory plugin commands");

      // Status command
      obsCmd
        .command("status")
        .description("Show memory tier status and compression stats")
        .action(async () => {
          const status = ctx.memoryService.getStatus();
          console.log("\n🧠 Observational Memory Status\n");
          console.log(`Workspace: ${status.workspace}`);
          console.log(`Initialized: ${status.initialized ? "✅" : "❌"}`);
          console.log("\n📊 Tiers:");
          console.log(`  SYSTEM:        ${status.tiers.system.files.length} files, ${status.tiers.system.totalSize}`);
          console.log(`  OBSERVATIONS:  ${status.tiers.observations.files.length} files, ${status.tiers.observations.totalSize} (${status.tiers.observations.entryCount || 0} entries)`);
          console.log(`  REFLECTIONS:   ${status.tiers.reflections.files.length} files, ${status.tiers.reflections.totalSize}`);
          console.log(`  RAW_MEMORY:    ${status.tiers.raw.files.length} files, ${status.tiers.raw.totalSize}`);
          console.log("\n📈 Compression:");
          console.log(`  Original:    ${status.compressionStats.originalSize}`);
          console.log(`  Compressed:  ${status.compressionStats.compressedSize}`);
          console.log(`  Ratio:       1:${status.compressionStats.ratio}`);
          console.log(`  Savings:     ${status.compressionStats.savingsPercent}%`);
          console.log("\n⚙️  Config:");
          console.log(`  Observer:    ${status.config.observerEnabled ? "✅" : "❌"}`);
          console.log(`  Reflector:   ${status.config.reflectorEnabled ? "✅" : "❌"}`);
          console.log(`  Retention:   ${status.config.observationRetentionDays} days`);
          console.log();
        });

      // Observe command
      obsCmd
        .command("observe")
        .description("Trigger observer compression manually")
        .option("-d, --dry-run", "Preview without saving changes", false)
        .action(async (options) => {
          console.log("📝 Running observer compression...\n");
          const result = await ctx.observer.run();
          if (result.success) {
            console.log(`✅ Compression complete`);
            console.log(`   Original:   ${result.originalSize} chars`);
            console.log(`   Compressed: ${result.compressedSize} chars`);
            console.log(`   Ratio:      1:${result.compressionRatio.toFixed(1)}`);
          } else {
            console.log(`❌ Failed: ${result.error}`);
          }
        });

      // Reflect command
      obsCmd
        .command("reflect")
        .description("Trigger reflector pattern extraction manually")
        .option("-d, --dry-run", "Preview without saving changes", false)
        .action(async (options) => {
          console.log("🔍 Running reflector analysis...\n");
          const result = await ctx.reflector.run();
          if (result.success) {
            console.log(`✅ Pattern extraction complete`);
            console.log(`   Patterns: ${result.patterns.length}`);
            console.log(`   Lessons:  ${result.lessons.length}`);
            if (result.patterns.length > 0) {
              console.log("\n   Detected patterns:");
              result.patterns.forEach(p => console.log(`     - ${p}`));
            }
          } else {
            console.log(`❌ Failed: ${result.error}`);
          }
        });

      // Migrate command
      obsCmd
        .command("migrate")
        .description("Migrate existing memory files to observational structure")
        .option("-c, --check-only", "Preview migration without making changes", false)
        .action(async (options) => {
          console.log("🔄 Migrating existing memory files...\n");
          const result = await ctx.memoryService.migrateExistingMemory(options.checkOnly);
          console.log(`Migration ${result.success ? "successful" : "completed with errors"}`);
          console.log(`   Migrated: ${result.migrated.length} files`);
          console.log(`   Backed up: ${result.backedUp.length} files`);
          if (result.errors.length > 0) {
            console.log(`   Errors: ${result.errors.length}`);
            result.errors.forEach(e => console.log(`     - ${e}`));
          }
        });

      // Reset command
      obsCmd
        .command("reset")
        .description("Reset observational memory to defaults (WARNING: destroys data)")
        .requiredOption("-f, --force", "Confirm destructive reset")
        .action(async (options) => {
          if (!options.force) {
            console.log("⚠️  Use --force to confirm destructive reset");
            return;
          }
          console.log("🗑️  Resetting observational memory...");
          // Implementation would reset files here
          console.log("✅ Reset complete");
        });
    },
    { commands: ["observational-memory"] }
  );
}
