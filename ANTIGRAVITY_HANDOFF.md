# Antigravity Handoff: 3D Modular House Configurator

## 1. Project Overview
Build a responsive, browser-based 3D modular house configurator. The core experience centers on a 3D master view that allows users to seamlessly design a house step-by-step. The application handles dynamic 3D rendering, a multi-step configuration UI, state management for modular components, AI-assisted layout suggestions, and output generation.

Reference POC / MVP: https://www.skanskabyggvaror.se/modulara-byggnader/skapa-din-modulara-byggsats/?configId=002850&configHashKey=36310002BF

## 2. Technical Stack
* **Framework:** Vue 3 with TypeScript (Composition API, `<script setup>`)
* **3D Rendering:** Three.js with OrbitControls
* **Styling:** Tailwind CSS (fully responsive desktop, tablet/iPad, mobile)
* **State Management:** Pinia
* **i18n:** `vue-i18n` (Swedish / English)

## 3. Core Features & Requirements
* **3D Master View:** OrbitControls for seamless 360-degree dragging, rotating, and zooming with boundary constraints.
* **View Toggling:** Master toggle between Outside (exterior walls, siding, roof) and Inside (floor plan, interior framing, loft).
* **Step-by-Step UI:** Intuitive step-by-step sidebar on desktop and swipeable bottom drawer on mobile/iPad.
* **AI Support Hooks:** Extensible service integration for generative space layout, door/window placement recommendations, and budget constraints.
* **Export Pipeline:**
  * 2D Blueprint (Canvas / SVG / PDF)
  * Walkthrough video recording (Three.js WebGL canvas frame capture)
  * High-res rendered images (WebGLRenderTarget)

## 4. Agent Execution Milestones
1. **Scaffold & Architecture:** Set up dependencies, directory structure, Pinia store, and Tailwind base.
2. **3D Engine Initialization:** Setup `HouseScene.ts`, camera projection, lighting, OrbitControls, and basic procedural walls/roof geometry.
3. **UI Layout & State Management:** Overlay UI with outside/inside toggle and step navigation.
4. **Modular Integration & Interactivity:** Placement slots for doors, windows, and modular roof types reacting to Pinia updates.
5. **Export Utilities & AI Integration:** Implement rendering capture, blueprint generation stubs, and AI prompt helper endpoints.
