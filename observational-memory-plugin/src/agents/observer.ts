import type { ObservationalMemoryService } from "../services/memory-service";
import type { Logger } from "openclaw/plugin-sdk";

interface ObserverOptions {
  service: ObservationalMemoryService;
  model: string;
  compressionTarget: number;
  logger: Logger;
}

interface CompressionResult {
  success: boolean;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  observations: string;
  error?: string;
}

export class ObserverAgent {
  private service: ObservationalMemoryService;
  private model: string;
  private compressionTarget: number;
  private logger: Logger;

  constructor(options: ObserverOptions) {
    this.service = options.service;
    this.model = options.model;
    this.compressionTarget = options.compressionTarget;
    this.logger = options.logger;
  }

  async run(): Promise<CompressionResult> {
    try {
      this.logger.info("Observer agent starting compression...");

      // Get yesterday's content
      const yesterdayContent = this.service.readYesterday();
      if (!yesterdayContent.trim()) {
        return {
          success: false,
          originalSize: 0,
          compressedSize: 0,
          compressionRatio: 0,
          observations: "",
          error: "No content to compress"
        };
      }

      const originalSize = yesterdayContent.length;

      // Compress using the model
      const compressed = await this.compressWithModel(yesterdayContent);
      const compressedSize = compressed.length;
      const compressionRatio = originalSize / compressedSize;

      // Append to observation log
      const today = new Date().toISOString().split('T')[0];
      const formatted = `## ${today}\n\n${compressed}\n\n`;
      this.service.appendToObservationLog(formatted);

      // Rotate today's to yesterday for next run
      this.service.rotateTodayToYesterday();

      // Cleanup old observations
      const cleaned = this.service.cleanupOldObservations();

      this.logger.info(`Observer completed: ${originalSize} → ${compressedSize} chars (${Math.round((1 - compressedSize/originalSize) * 100)}% reduction)`);

      return {
        success: true,
        originalSize,
        compressedSize,
        compressionRatio,
        observations: compressed
      };
    } catch (error) {
      this.logger.error(`Observer agent failed: ${error}`);
      return {
        success: false,
        originalSize: 0,
        compressedSize: 0,
        compressionRatio: 0,
        observations: "",
        error: String(error)
      };
    }
  }

  private async compressWithModel(content: string): Promise<string> {
    const targetLength = Math.floor(content.length * this.compressionTarget);

    const systemPrompt = `You are an Observation Compressor. Your task is to compress daily activity logs into concise, structured observations.

## Compression Rules:
1. Preserve ALL 🔴 critical items (decisions, blockers, key events)
2. Summarize 🟡 important items into 1-2 bullet points each
3. Condense 🟢 minor notes into a single summary line
4. Use this format:
   - 🔴 [Critical]: Specific detail with context
   - 🟡 [Topic]: Brief summary of what was done
   - 🟢 [General]: One-line summary of minor items
5. Keep timestamps only for critical events
6. Remove fluff: "worked on", "discussed", "looked at"
7. Keep specific facts, numbers, names, decisions

Target compression: ${Math.round(this.compressionTarget * 100)}% of original size (aim for ~${targetLength} chars)

Output ONLY the compressed observations, no explanations.`;

    // This would be called via the model API in the actual implementation
    // For now, return a simulated compression
    return this.simulateCompression(content, targetLength);
  }

  private simulateCompression(content: string, targetLength: number): string {
    // In production, this calls the configured model
    // This is a placeholder for the actual LLM compression
    const lines = content.split('\n');
    const filtered = lines.filter(line => {
      const trimmed = line.trim();
      return trimmed.startsWith('-') || trimmed.startsWith('##') || trimmed.includes('🔴') || trimmed.includes('🟡');
    });

    let result = filtered.join('\n');
    if (result.length > targetLength) {
      result = result.substring(0, targetLength) + "\n...";
    }

    return result || "No significant observations to record.";
  }

  getSystemPrompt(): string {
    return `You are the Observer agent for Observational Memory. Your job is to compress daily activity into concise observations.

## Output Format:
### Morning/Afternoon (if applicable)
- 🔴 [Priority]: Specific detail
- 🟡 [Topic]: Brief summary
- 🟢 [General]: One-line summary

### Decisions
- 🔴 [Decision]: What was decided with context

### Blockers (if any)
- 🔴 [Blocker]: What's blocking progress

### Next Steps
- 🟡 [Action]: What needs to happen next

Rules:
- Preserve specific facts, numbers, names
- Remove narrative fluff
- Group related items
- Prioritize ruthlessly (red = must remember, yellow = useful, green = noted)`;
  }
}
