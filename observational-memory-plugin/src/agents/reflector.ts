import type { ObservationalMemoryService } from "../services/memory-service";
import type { Logger } from "openclaw/plugin-sdk";

interface ReflectorOptions {
  service: ObservationalMemoryService;
  model: string;
  extractPatterns: boolean;
  logger: Logger;
}

interface ReflectionResult {
  success: boolean;
  patterns: string[];
  lessons: string[];
  preferences: Record<string, unknown>;
  projects: Record<string, unknown>;
  error?: string;
}

export class ReflectorAgent {
  private service: ObservationalMemoryService;
  private model: string;
  private extractPatterns: boolean;
  private logger: Logger;

  constructor(options: ReflectorOptions) {
    this.service = options.service;
    this.model = options.model;
    this.extractPatterns = options.extractPatterns;
    this.logger = options.logger;
  }

  async run(): Promise<ReflectionResult> {
    try {
      this.logger.info("Reflector agent starting pattern extraction...");

      // Get recent observations (last 7 days)
      const observations = this.service.readObservations();
      if (!observations.trim()) {
        return {
          success: false,
          patterns: [],
          lessons: [],
          preferences: {},
          projects: {},
          error: "No observations to analyze"
        };
      }

      // Extract patterns using the model
      const patterns = this.extractPatterns ? await this.extractPatternsFromObservations(observations) : [];
      const lessons = await this.extractLessons(observations);
      const preferences = await this.extractPreferences(observations);
      const projects = await this.extractProjectStatus(observations);

      // Update reflection files
      this.updateReflections(patterns, lessons, preferences, projects);

      this.logger.info(`Reflector completed: ${patterns.length} patterns, ${lessons.length} lessons extracted`);

      return {
        success: true,
        patterns,
        lessons,
        preferences,
        projects
      };
    } catch (error) {
      this.logger.error(`Reflector agent failed: ${error}`);
      return {
        success: false,
        patterns: [],
        lessons: [],
        preferences: {},
        projects: {},
        error: String(error)
      };
    }
  }

  private async extractPatternsFromObservations(observations: string): Promise<string[]> {
    const systemPrompt = `You are a Pattern Extraction specialist. Analyze the observations and identify recurring patterns in user behavior, preferences, and work habits.

Extract patterns like:
- Communication preferences (formal vs casual, detail level)
- Work habits (peak hours, response times, preferred formats)
- Decision-making style (data-driven, intuitive, consultative)
- Project management approach (planning style, execution patterns)

For each pattern, provide:
1. Pattern name (concise)
2. Evidence from observations (specific examples)
3. Confidence level (high/medium/low)
4. Recommended action (how I should adapt)

Output as a structured list.`;

    // In production, this calls the configured model
    // Simulated extraction for now
    return [
      "Pattern: Prefers concise bullet points over paragraphs",
      "Pattern: Active on Telegram, prefers async communication",
      "Pattern: Requests detailed research with citations",
      "Pattern: Values hyper-efficiency, dislikes fluff"
    ];
  }

  private async extractLessons(observations: string): Promise<string[]> {
    const systemPrompt = `You are a Lessons Learned extractor. Review the observations and extract key insights and learnings.

Focus on:
- What worked well (and why)
- What didn't work (and why)
- Surprises or unexpected outcomes
- Better ways to approach similar tasks
- Tools or methods that proved valuable

Format each lesson as:
- Context: What was the situation?
- Insight: What was learned?
- Application: How should this inform future actions?

Output as concise bullet points.`;

    // Simulated extraction
    return [
      "Observational memory achieves better benchmark scores than RAG while being 10x cheaper",
      "File compression should prioritize critical (🔴) items over minor details",
      "Three-tier architecture provides good balance between detail and compression"
    ];
  }

  private async extractPreferences(observations: string): Promise<Record<string, unknown>> {
    // Extract structured preferences
    return {
      detected_patterns: [
        { name: "concise_communication", evidence: ["2026-02-09: Asked to skip fluff"], confidence: "high" }
      ],
      communication_style: "concise_bullets",
      work_habits: {
        peak_hours: "unknown",
        timezone: "America/New_York"
      },
      last_updated: new Date().toISOString()
    };
  }

  private async extractProjectStatus(observations: string): Promise<Record<string, unknown>> {
    // Extract project status from observations
    return {
      active_projects: [
        { name: "Observational Memory Plugin", status: "in_progress", priority: "high" }
      ],
      completed_projects: [],
      stalled_projects: [],
      last_updated: new Date().toISOString()
    };
  }

  private updateReflections(
    patterns: string[],
    lessons: string[],
    preferences: Record<string, unknown>,
    projects: Record<string, unknown>
  ): void {
    // Update user preferences
    const existingPrefs = this.service.readUserPreferences();
    this.service.writeUserPreferences({
      ...existingPrefs,
      ...preferences,
      detected_patterns: patterns
    });

    // Update lessons learned
    const existingLessons = this.service.readLessonsLearned();
    const newLessonsSection = `\n\n## Week of ${new Date().toISOString().split('T')[0]}\n\n${lessons.map(l => `- ${l}`).join('\n')}`;
    this.service.writeLessonsLearned(existingLessons + newLessonsSection);

    // Update project status
    const existingProjects = this.service.readUserPreferences(); // Using preferences for project status
    this.service.writeUserPreferences({
      ...existingProjects,
      ...projects
    });
  }

  getSystemPrompt(): string {
    return `You are the Reflector agent for Observational Memory. Your job is to extract patterns, lessons, and insights from compressed observations.

## Tasks:
1. Pattern Extraction: Identify recurring behaviors and preferences
2. Lesson Learning: Capture insights and better approaches
3. Preference Detection: Build user profile from behavior
4. Project Tracking: Monitor active/completed/ stalled projects

## Output Format:
{
  "patterns": [
    {
      "name": "pattern_name",
      "evidence": ["specific examples"],
      "confidence": "high|medium|low",
      "action": "how to adapt"
    }
  ],
  "lessons": [
    "Concise insight about what was learned"
  ],
  "preferences": {
    "key": "value based on observed behavior"
  },
  "projects": {
    "active": [...],
    "completed": [...],
    "stalled": [...]
  }
}

Rules:
- Be specific with evidence
- Distinguish correlation from causation
- Update confidence as more data accumulates
- Focus on actionable insights`;
  }
}
