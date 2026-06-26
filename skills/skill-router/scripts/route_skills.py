#!/usr/bin/env python3
"""Recommend installed skills for a user task.

This script uses only the Python standard library so it can run in most Codex
environments. It scans common skill locations, reads SKILL.md frontmatter, and
scores task words against skill names/descriptions plus a few routing synonyms.
"""

from __future__ import annotations

import argparse
import json
import os
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable


SKIP_DIRS = {".system", "__pycache__", ".git", "node_modules"}

CATEGORY_HINTS = {
    "paper": [
        "paper",
        "论文",
        "arxiv",
        "citation",
        "citations",
        "pdf",
        "research",
        "学术",
    ],
    "book": ["book", "书", "拆书", "作者", "chapter", "reading"],
    "reading": ["read", "阅读", "伴读", "文章", "essay", "news", "理解"],
    "plain": ["plain", "白话", "说人话", "解释", "小白", "简单"],
    "thinking": ["think", "本质", "深挖", "为什么", "root", "cause", "strategy"],
    "writing": ["write", "写", "文章", "文案", "稿", "post", "公众号", "小红书"],
    "visual": ["card", "卡片", "图", "海报", "infographic", "visual", "png"],
    "slides": ["present", "presentation", "slides", "ppt", "演讲", "汇报"],
    "invest": ["invest", "投资", "项目", "尽调", "pitch", "创业"],
    "travel": ["travel", "旅行", "博物馆", "古建", "city"],
    "word": ["word", "单词", "英文词", "vocabulary"],
    "code": ["code", "代码", "bug", "repo", "测试", "frontend", "ui"],
    "docs": ["docx", "document", "文档", "word文档"],
    "pdf": ["pdf"],
    "spreadsheet": ["xlsx", "spreadsheet", "excel", "表格", "csv"],
}

SKILL_BONUSES = {
    "ljg-paper": ["paper", "论文", "arxiv"],
    "ljg-paper-flow": ["论文卡片", "paper flow", "读论文并做卡片"],
    "ljg-paper-river": ["倒读", "论文溯源", "citation", "来龙去脉"],
    "ljg-book": ["拆书", "分析这本书", "book"],
    "ljg-library": ["图书馆卡", "书卡", "library card"],
    "ljg-read": ["伴读", "陪我读", "读这篇"],
    "ljg-qa": ["问答", "q&a", "qa", "提问"],
    "ljg-plain": ["白话", "说人话", "plain"],
    "ljg-think": ["想透", "本质", "深挖", "think"],
    "ljg-rank": ["降秩", "找秩", "核心力量"],
    "ljg-card": ["卡片", "信息图", "海报", "png", "小红书卡片"],
    "ljg-present": ["present", "slides", "演讲", "汇报"],
    "ljg-writes": ["写作", "文章", "稿子"],
    "ljg-invest": ["投资", "尽调", "pitch", "项目分析"],
    "ljg-word": ["单词", "english word", "英文词"],
    "ljg-word-flow": ["词卡", "word card"],
    "ljg-travel": ["旅行", "博物馆", "古建"],
    "ljg-skill-map": ["技能地图", "有哪些技能", "list skills"],
    "skill-router": ["自动选 skill", "skill router", "选择技能", "路由"],
}

COMBO_BONUSES = [
    (
        "ljg-paper-flow",
        ["paper", "论文", "arxiv", "学术"],
        ["card", "卡片", "图", "视觉", "小红书", "png"],
        45,
        "combo: paper + visual output",
    ),
    (
        "ljg-word-flow",
        ["word", "单词", "英文词"],
        ["card", "卡片", "图", "视觉", "png"],
        35,
        "combo: word + visual output",
    ),
    (
        "ljg-library",
        ["book", "书", "拆书"],
        ["card", "卡片", "图书馆", "书卡"],
        35,
        "combo: book + visual card",
    ),
    (
        "ljg-writes",
        ["think", "想透", "本质", "观点", "深挖"],
        ["write", "写", "文章", "稿", "公众号"],
        25,
        "combo: thinking + writing",
    ),
]


@dataclass
class Skill:
    name: str
    path: Path
    description: str


def common_roots() -> list[Path]:
    roots: list[Path] = []
    home = Path.home()
    env_codex = os.environ.get("CODEX_HOME")
    if env_codex:
        roots.append(Path(env_codex) / "skills")
    roots.extend(
        [
            home / ".codex" / "skills",
            home / ".agents" / "skills",
            home / ".claude" / "skills",
        ]
    )
    seen: set[str] = set()
    unique: list[Path] = []
    for root in roots:
        key = str(root).lower()
        if key not in seen:
            seen.add(key)
            unique.append(root)
    return unique


def parse_frontmatter(text: str) -> tuple[str | None, str]:
    if not text.startswith("---"):
        return None, ""
    match = re.match(r"---\s*\n(.*?)\n---", text, flags=re.S)
    if not match:
        return None, ""
    front = match.group(1)
    name = None
    desc_lines: list[str] = []
    in_desc = False
    for line in front.splitlines():
        if line.startswith("name:"):
            name = line.split(":", 1)[1].strip().strip("\"'")
            in_desc = False
        elif line.startswith("description:"):
            value = line.split(":", 1)[1].strip()
            desc_lines.append(value.strip("\"'"))
            in_desc = value in {">", ">-", "|", "|-"}
        elif in_desc and (line.startswith(" ") or line.startswith("\t")):
            desc_lines.append(line.strip().strip("\"'"))
        elif re.match(r"^[A-Za-z_-]+:", line):
            in_desc = False
    return name, " ".join(x for x in desc_lines if x)


def scan_skills(roots: Iterable[Path]) -> list[Skill]:
    skills: dict[str, Skill] = {}
    for root in roots:
        if not root.exists():
            continue
        for child in root.iterdir():
            if not child.is_dir() or child.name in SKIP_DIRS:
                continue
            skill_file = child / "SKILL.md"
            if not skill_file.exists():
                continue
            try:
                text = skill_file.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                text = skill_file.read_text(errors="ignore")
            name, desc = parse_frontmatter(text)
            if not name:
                name = child.name
            existing = skills.get(name)
            if existing is None or len(desc) > len(existing.description):
                skills[name] = Skill(name=name, path=child, description=desc)
    return sorted(skills.values(), key=lambda s: s.name)


def tokens(text: str) -> set[str]:
    lowered = text.lower()
    english = set(re.findall(r"[a-z0-9][a-z0-9_-]{1,}", lowered))
    cjk_chunks = set(re.findall(r"[\u4e00-\u9fff]{2,}", lowered))
    return english | cjk_chunks


def score_skill(task: str, skill: Skill) -> tuple[int, list[str]]:
    task_lower = task.lower()
    task_tokens = tokens(task)
    haystack = f"{skill.name} {skill.description}".lower()
    hay_tokens = tokens(haystack)
    score = 0
    reasons: list[str] = []

    overlap = sorted(task_tokens & hay_tokens)
    if overlap:
        score += len(overlap) * 3
        reasons.append("keyword overlap: " + ", ".join(overlap[:5]))

    def has_hint(hint: str) -> bool:
        normalized_hint = hint.lower()
        normalized_task = task_lower
        if normalized_hint in {"书", "书卡"}:
            normalized_task = normalized_task.replace("小红书", "")
        return normalized_hint in normalized_task

    for phrase in SKILL_BONUSES.get(skill.name, []):
        if has_hint(phrase):
            score += 20
            reasons.append(f"direct trigger: {phrase}")

    for target, left, right, bonus, reason in COMBO_BONUSES:
        if skill.name != target:
            continue
        if any(has_hint(x) for x in left) and any(has_hint(x) for x in right):
            score += bonus
            reasons.append(reason)

    for category, hints in CATEGORY_HINTS.items():
        task_hits = [h for h in hints if has_hint(h)]
        if task_hits and any(h.lower() in haystack for h in hints):
            score += 8 + len(task_hits)
            reasons.append(f"category: {category}")

    if skill.name in task_lower:
        score += 30
        reasons.append("skill named explicitly")

    return score, reasons


def recommend(task: str, top: int) -> list[dict[str, object]]:
    rows = []
    for skill in scan_skills(common_roots()):
        score, reasons = score_skill(task, skill)
        if score <= 0:
            continue
        rows.append(
            {
                "name": skill.name,
                "score": score,
                "path": str(skill.path),
                "description": skill.description,
                "reasons": reasons[:3],
            }
        )
    rows.sort(key=lambda r: (-int(r["score"]), str(r["name"])))
    return rows[:top]


def task_has(task_lower: str, hints: list[str]) -> bool:
    normalized = task_lower.replace("小红书", "xiaohongshu")
    return any(h.lower() in normalized for h in hints)


def suggest_route(task: str, candidates: list[dict[str, object]]) -> list[str]:
    task_lower = task.lower()
    available = {str(row["name"]) for row in candidates}

    route_rules = [
        (
            ["paper", "论文", "arxiv", "学术"],
            ["card", "卡片", "图", "视觉", "小红书", "png"],
            ["ljg-paper-flow"],
        ),
        (
            ["word", "单词", "英文词"],
            ["card", "卡片", "图", "视觉", "png"],
            ["ljg-word-flow"],
        ),
        (
            ["book", "书", "拆书"],
            ["card", "卡片", "图书馆", "书卡"],
            ["ljg-library"],
        ),
        (
            ["think", "想透", "本质", "观点", "深挖"],
            ["write", "写", "文章", "稿", "公众号"],
            ["ljg-think", "ljg-writes"],
        ),
    ]

    for left, right, route in route_rules:
        if task_has(task_lower, left) and task_has(task_lower, right):
            return route

    if candidates:
        first = str(candidates[0]["name"])
        if first in available:
            return [first]
    return []


def main() -> int:
    parser = argparse.ArgumentParser(description="Recommend installed skills for a task.")
    parser.add_argument("--task", required=True, help="User task or project description.")
    parser.add_argument("--top", type=int, default=8, help="Number of candidates to show.")
    parser.add_argument("--json", action="store_true", help="Output JSON.")
    args = parser.parse_args()

    rows = recommend(args.task, args.top)
    if args.json:
        print(
            json.dumps(
                {"suggested_route": suggest_route(args.task, rows), "candidates": rows},
                ensure_ascii=False,
                indent=2,
            )
        )
        return 0

    if not rows:
        print("No strong installed-skill match. Proceed normally.")
        return 0

    print(f"Task: {args.task}")
    route = suggest_route(args.task, rows)
    if route:
        print("Suggested route: " + " -> ".join(route))
    print("Recommended skills:")
    for i, row in enumerate(rows, 1):
        desc = str(row["description"])
        if len(desc) > 180:
            desc = desc[:177].rstrip() + "..."
        print(f"{i}. {row['name']} (score {row['score']})")
        print(f"   Path: {row['path']}")
        print(f"   Why: {'; '.join(row['reasons'])}")
        print(f"   Desc: {desc}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
