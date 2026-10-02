# 22rubik_teacher

Page that teach you how to solve 2x2 Rubik.

# Page
https://mangohk.github.io/22rubik_teacher/

The homepage is a step-by-step 2×2 guide (David Guo beginner method). Original UI with animated step transitions and cube hints.

## Structure

Single-file site: all CSS and JS live in `index.html` (self-contained for GitHub Pages from repo root).

## Version

**1.7**

Matches `APP_VERSION` in the inlined script inside `index.html`. The in-app badge on step 1 (top-right) shows `v` + the same value — bump both together when shipping.

From 1.0 onward, ship bumps only the **minor** segment (`1.1`, `1.2`, …). **Every software change** must bump minor in `APP_VERSION`, the `#app-version` badge text, and this README section together.

## GitHub Pages

Enable: **Settings → Pages → Deploy from a branch → `main` / `/ (root)`**.
