# Codex Skills

This folder contains shareable Codex skills.

## skill-router

Routes ambiguous or complex tasks to the most relevant installed skill before execution.

Install on Windows:

```powershell
Copy-Item -Recurse .\skills\skill-router "$env:USERPROFILE\.codex\skills\"
```

Then restart Codex or start a new thread so the skill metadata is loaded.
