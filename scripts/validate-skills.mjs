import fs from "fs";
import path from "path";

const SKILLS_DIR = path.join(process.cwd(), ".agents", "skills");

const REQUIRED_SECTIONS = [
  "trigger",
  "purpose",
  "required inputs",
  "allowed files",
  "discovery steps",
  "current-doc requirement",
  "test-first sequence",
  "verification commands",
  "stop conditions",
  "evidence format",
  "handoff format"
];

function validateSkills() {
  if (!fs.existsSync(SKILLS_DIR)) {
    console.log("No skills directory found at .agents/skills");
    process.exit(0);
  }

  const entries = fs.readdirSync(SKILLS_DIR, { withFileTypes: true });
  let hasErrors = false;

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const skillPath = path.join(SKILLS_DIR, entry.name, "SKILL.md");
      if (!fs.existsSync(skillPath)) {
        console.error(`[ERROR] Skill folder ${entry.name} missing SKILL.md`);
        hasErrors = true;
        continue;
      }

      const content = fs.readFileSync(skillPath, "utf-8").toLowerCase();
      for (const section of REQUIRED_SECTIONS) {
        if (!content.includes(section)) {
          console.error(`[ERROR] ${entry.name}/SKILL.md missing section: "${section}"`);
          hasErrors = true;
        }
      }
    }
  }

  if (hasErrors) {
    process.exit(1);
  } else {
    console.log("✓ All agent skills validated successfully.");
  }
}

validateSkills();
