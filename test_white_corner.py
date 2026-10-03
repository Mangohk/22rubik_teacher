#!/usr/bin/env python3
"""Facelet tests for WHITE_CORNER_CASES / step presets in index.html (v1.10)."""
from __future__ import annotations

import ast
import re
import sys
from pathlib import Path


def solved():
    return {
        "U": ["white"] * 4,
        "D": ["yellow"] * 4,
        "F": ["green"] * 4,
        "B": ["blue"] * 4,
        "L": ["orange"] * 4,
        "R": ["red"] * 4,
    }


def rot_cw(face, times):
    t = ((times % 4) + 4) % 4
    f = face[:]
    for _ in range(t):
        f = [f[2], f[0], f[3], f[1]]
    return f


class Cube:
    def __init__(self):
        self.faces = solved()

    def moveU(self, times=1):
        f = self.faces
        f["U"] = rot_cw(f["U"], times)
        for _ in range(times):
            tmp = [f["F"][0], f["F"][1]]
            f["F"][0], f["F"][1] = f["R"][0], f["R"][1]
            f["R"][0], f["R"][1] = f["B"][0], f["B"][1]
            f["B"][0], f["B"][1] = f["L"][0], f["L"][1]
            f["L"][0], f["L"][1] = tmp

    def moveD(self, times=1):
        f = self.faces
        f["D"] = rot_cw(f["D"], times)
        for _ in range(times):
            tmp = [f["F"][2], f["F"][3]]
            f["F"][2], f["F"][3] = f["L"][2], f["L"][3]
            f["L"][2], f["L"][3] = f["B"][2], f["B"][3]
            f["B"][2], f["B"][3] = f["R"][2], f["R"][3]
            f["R"][2], f["R"][3] = tmp

    def moveF(self, times=1):
        f = self.faces
        f["F"] = rot_cw(f["F"], times)
        for _ in range(times):
            u2, u3 = f["U"][2], f["U"][3]
            f["U"][2], f["U"][3] = f["L"][3], f["L"][1]
            f["L"][1], f["L"][3] = f["D"][0], f["D"][1]
            f["D"][0], f["D"][1] = f["R"][2], f["R"][0]
            f["R"][0], f["R"][2] = u2, u3

    def moveB(self, times=1):
        f = self.faces
        f["B"] = rot_cw(f["B"], times)
        for _ in range(times):
            u0, u1 = f["U"][0], f["U"][1]
            f["U"][0], f["U"][1] = f["R"][1], f["R"][3]
            f["R"][1], f["R"][3] = f["D"][3], f["D"][2]
            f["D"][2], f["D"][3] = f["L"][0], f["L"][2]
            f["L"][0], f["L"][2] = u1, u0

    def moveL(self, times=1):
        # Matches inverted L sense in index.html (token L = prior L').
        f = self.faces
        f["L"] = rot_cw(f["L"], times)
        for _ in range(times):
            u0, u2 = f["U"][0], f["U"][2]
            f0, f2 = f["F"][0], f["F"][2]
            d0, d2 = f["D"][0], f["D"][2]
            b1, b3 = f["B"][1], f["B"][3]
            f["U"][0], f["U"][2] = b3, b1
            f["B"][1], f["B"][3] = d2, d0
            f["D"][0], f["D"][2] = f0, f2
            f["F"][0], f["F"][2] = u0, u2

    def moveR(self, times=1):
        f = self.faces
        f["R"] = rot_cw(f["R"], times)
        for _ in range(times):
            u1, u3 = f["U"][1], f["U"][3]
            f1, f3 = f["F"][1], f["F"][3]
            d1, d3 = f["D"][1], f["D"][3]
            b0, b2 = f["B"][0], f["B"][2]
            f["U"][1], f["U"][3] = f1, f3
            f["F"][1], f["F"][3] = d1, d3
            f["D"][1], f["D"][3] = b2, b0
            f["B"][0], f["B"][2] = u3, u1

    def apply(self, token: str):
        movers = {
            "U": self.moveU,
            "D": self.moveD,
            "F": self.moveF,
            "B": self.moveB,
            "L": self.moveL,
            "R": self.moveR,
        }
        face, rest = token[0], token[1:]
        times = 1
        if rest == "'":
            times = 3
        elif rest == "2":
            times = 2
        movers[face](times)

    def apply_seq(self, seq):
        for t in seq:
            self.apply(t)

    def white_on_dfr(self) -> str:
        f = self.faces
        if f["D"][1] == "white":
            return "D"
        if f["F"][3] == "white":
            return "F"
        if f["R"][2] == "white":
            return "R"
        return "?"

    def ufr_wgr(self) -> bool:
        f = self.faces
        return f["U"][3] == "white" and f["F"][1] == "green" and f["R"][0] == "red"


def parse_cases(html: str) -> dict:
    block = re.search(
        r"const WHITE_CORNER_CASES = \{([\s\S]*?)\n  \};",
        html,
    )
    if not block:
        raise SystemExit("WHITE_CORNER_CASES not found")
    body = block.group(1)
    cases = {}
    for name in ("side", "front", "down", "stuck"):
        m = re.search(
            rf"{name}:\s*\{{([\s\S]*?)\n    \}},",
            body,
        )
        if not m:
            raise SystemExit(f"case {name} not found")
        chunk = m.group(1)
        alg = re.search(r"alg:\s*(\[[^\]]*\])", chunk)
        setup = re.search(r"setup:\s*(\[[^\]]*\])", chunk)
        label = re.search(r'algLabel:\s*"([^"]*)"', chunk)
        if not alg or not setup or not label:
            raise SystemExit(f"incomplete {name}")
        cases[name] = {
            "alg": eval(alg.group(1), {"__builtins__": {}}),
            "setup": eval(setup.group(1), {"__builtins__": {}}),
            "algLabel": label.group(1),
        }
    return cases


def main():
    html = Path(__file__).with_name("index.html").read_text(encoding="utf-8")
    version = re.search(r'const APP_VERSION = "([^"]+)"', html)
    badge = re.search(r'id="app-version"[^>]*>v([^<]+)<', html)
    readme = Path(__file__).with_name("README.md").read_text(encoding="utf-8")
    readme_v = re.search(r"## Version\s+\*\*([^*]+)\*\*", readme)

    results = []

    def ok(item, passed, detail=""):
        results.append((item, passed, detail))
        mark = "PASS" if passed else "FAIL"
        print(f"[{mark}] {item}" + (f" — {detail}" if detail else ""))

    # T1 version consistency
    v = version.group(1) if version else None
    ok("T1 APP_VERSION present", bool(v), v or "missing")
    ok(
        "T1 version triad match",
        v and badge and readme_v and v == badge.group(1) == readme_v.group(1).strip(),
        f"js={v} badge={badge.group(1) if badge else None} readme={readme_v.group(1).strip() if readme_v else None}",
    )

    cases = parse_cases(html)

    # T2 side
    c = Cube()
    c.apply_seq(cases["side"]["setup"])
    ok("T2 side setup white on R", c.white_on_dfr() == "R", c.white_on_dfr())
    c.apply_seq(cases["side"]["alg"])
    ok("T2 side alg inserts WGR@UFR", c.ufr_wgr())
    ok(
        "T2 side setup ≠ alg",
        cases["side"]["setup"] != cases["side"]["alg"],
        f"setup={cases['side']['setup']} alg={cases['side']['alg']}",
    )

    # T3 front
    c = Cube()
    c.apply_seq(cases["front"]["setup"])
    ok("T3 front setup white on F", c.white_on_dfr() == "F", c.white_on_dfr())
    c.apply_seq(cases["front"]["alg"])
    ok("T3 front alg inserts WGR@UFR", c.ufr_wgr())
    ok(
        "T3 front alg is D' + R'DR",
        cases["front"]["alg"] == ["D'", "R'", "D", "R"],
        str(cases["front"]["alg"]),
    )

    # T4 down
    c = Cube()
    c.apply_seq(cases["down"]["setup"])
    ok("T4 down setup white on D", c.white_on_dfr() == "D", c.white_on_dfr())
    c.apply_seq(cases["down"]["alg"])
    ok("T4 down alg inserts WGR@UFR", c.ufr_wgr())
    ok(
        "T4 down alg uses R'DR family (no D R2)",
        cases["down"]["alg"] == ["R'", "D", "R", "D2", "R'", "D'", "R"],
        str(cases["down"]["alg"]),
    )
    ok("T4 down label mentions R'DR", "R' D R" in cases["down"]["algLabel"])

    # T5 stuck dump → white on F
    c = Cube()
    c.apply_seq(cases["stuck"]["setup"])
    c.apply_seq(cases["stuck"]["alg"])
    ok("T5 stuck dump → white on F", c.white_on_dfr() == "F", c.white_on_dfr())
    ok(
        "T5 stuck core alg is R'DR",
        cases["stuck"]["alg"] == ["R'", "D", "R"],
        str(cases["stuck"]["alg"]),
    )

    # T6 step2 after-alg1: four whites on U, L pair, messy D
    setup_m = re.search(
        r'name === "after-alg1"\) \{[\s\S]*?(\[[^\]]+\])\.forEach',
        html,
    )
    setup = ast.literal_eval(setup_m.group(1)) if setup_m else []
    c = Cube()
    c.apply_seq(setup)
    ok(
        "T6 step2 after-alg1 has 4 whites on U",
        c.faces["U"].count("white") == 4,
        str(c.faces["U"]),
    )
    ok(
        "T6 step2 after-alg1 left side is a pair",
        c.faces["L"][0] == c.faces["L"][1],
        str(c.faces["L"][:2]),
    )
    ok(
        "T6 step2 after-alg1 D is not solid yellow",
        c.faces["D"].count("yellow") < 4,
        str(c.faces["D"]),
    )

    failed = sum(1 for _, p, _ in results if not p)
    print(f"\n{len(results) - failed}/{len(results)} passed, {failed} failed")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
