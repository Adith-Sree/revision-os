---
name: stitch-designer
description: >-
  Work with Google Stitch designs via Stitch MCP. Browse projects, inspect screens,
  retrieve design tokens and HTML/CSS screen code, and generate or update UI components.
---

# Google Stitch MCP Skill

This skill provides guidance for using the Google Stitch MCP integration to bridge AI-generated UI prototypes with code implementations.

## Overview
Stitch by Google (`stitch.withgoogle.com`) is an AI design workspace for generating UI screens, themes, and design tokens.
The Stitch MCP server (`@_davideast/stitch-mcp`) provides direct access to Stitch projects and screens.

## Available MCP Tools
When the Stitch MCP server is active, the following tools are available:
- `list_projects`: List available projects in your Stitch workspace.
- `get_project`: Retrieve details and screen list for a specific project ID.
- `list_screens`: List screens for a given project.
- `get_screen`: Fetch screen metadata and layout information.
- `get_screen_code`: Fetch production-ready HTML/CSS/Tailwind code for a screen.
- `get_screen_image`: Fetch rendered image snapshot of a screen.
- `generate_screen_from_text`: Generate a new screen design from natural language prompt.
- `edit_screens`: Edit existing screens using revision instructions.
- `generate_variants`: Generate design variations for an existing screen.
- `create_design_system`: Define design tokens (colors, typography, spacing).
- `list_design_systems`: List available design systems in the workspace.
- `build_site`: Build a multi-page site structure from Stitch screens.

## Workflow: From Stitch Design to Code
1. Use `list_projects` to locate the relevant project.
2. Use `list_screens` to view screens created in the project.
3. Use `get_screen_code` to retrieve the design code and HTML structure.
4. Adapt the HTML/CSS into React components, mapping data props and state interactions.
