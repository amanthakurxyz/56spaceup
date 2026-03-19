# Product Requirements Document (PRD)

**Product Name:** Spaceup.ai
**Version:** 3.0 (Stitch Architecture)
**Target:** Interior Designers & Spatial Planners

## 1. Concept & Philosophy
Spaceup.ai is an agent-driven workspace for spatial design, mimicking the architecture of Google Stitch. Instead of generating UI code, it generates and manipulates spatial renders through natural language.

### 1.1 Core Principles
- **Designing without Modeling:** Moving away from traditional, bulky 3D workflows (like SketchUp or Blender). Design development occurs *directly* on the image, making the process inherently faster and more accessible.
- **Scale:** The technical architecture (WASM web canvas + Vercel + InsForge) is built to handle massive, infinite node graphs without browser memory crashing.
- **Speed:** A snappy, fast canvas and instantaneous chat experience ensure zero-friction UX. Immediate image-to-image visual response is prioritized over waiting for 3D geometry renders.
- **Simple:** The "Thin-Layer" approach. There are no complex UI settings panels—the Chat orchestrates the complexity. This is meant to be "Claude Code for interior designers"—a designer-first application, intuitive enough for a first-time user with zero complex learning curve.

### 1.2 Target User Profiles
- **Interior Designers:** Seeking rapid ideation, mood board integration, and fast client feedback loops without needing to build 3D geometry from scratch.
- **Architects:** Needing to quickly visualize spatial concepts, material finishes, and lighting based on floor plans or raw site photos.
- **Visualizers:** Looking to accelerate their rendering workflow through granular AI-assisted staging and inpainting, bypassing hours of manual 3D staging.

### 1.3 Core Application Mechanics
- **The Thin-Layer Philosophy:** Inspired by developer tools like Claude Code, Spaceup.ai acts as a minimal, unopinionated layer on top of foundational AI models (like Nano Banana). Rather than hardcoding complex UI panels for lighting, 3D parameters, or rendering settings, the application relies on the LLM's intelligence to parse the designer's intent and orchestrate the image model.
- **Multipurpose Creative Freedom:** The workspace does not enforce a rigid "Step 1, Step 2" pipeline. Designers have the creative freedom to start with a blank canvas, a messy sketch, a 2D floorplan, a high-res photo, or a site photo of the space. The agent adapts to the context.
- **The Base Image:** Every design flow begins with a central base image (which can be any visual starting point). This base image acts as the anchor where designs are developed iteratively. Iteration is the fundamental core of Spaceup.ai.
- **Contextual Connections:** The base image is explicitly linked to moodboards, material boards, and finish/theme boards. "Connection" equals "Context." These connection lines themselves contain prompts or comments dictating *how* that context applies.
- **Directional Canvas Flow:** The infinite canvas must be highly visual, interconnected, and possess a clear directional flow mapping the design journey from base image to final render.
- **Granular Iteration (Selection Fill):** Designers iterate granularly. They can make partial or full selection fills, selecting just a specific part of an image to modify without regenerating the whole sequence.
- **Image Commenting:** Designers can directly comment on images in the canvas, similar to Antigravity, to leave notes for the AI or themselves.

## 2. UI/UX Architecture (Split-Screen)

**Left Panel: The Spaceup Agent (Command & Context)**
- **Conversational Interface:** Chat history where the AI explains its thought process and actions visually. Because it is a "thin layer," the chat is the primary driver of all complex modifications.
- **Input:** "Describe your design" prompt box at the base.
- **Context Upload:** Attach mood boards, fabric swatches, or 2D floor plans directly into the chat flow, or drop reference images directly onto the infinite canvas for spatial contextualization.
- **Zero-Friction UI:** No complex dropdowns for model selection, prompt weights, or render settings. The agent automatically infers the required parameters and model calls based on the conversational input and visual context.

**Right Panel: The Visual Canvas (Output Space)**
- **Expansive Workspace:** An infinite dot-grid canvas for placing and directly manipulating generated views.
- **Floating Toolbar:** Core tools (Select, Pan, Mask/In-paint, Undo/Redo) located centrally at the bottom.
- **Iterative Editing:** Select a specific piece of furniture on the canvas, and prompt the agent in the left panel to "Replace this sofa with a mid-century modern leather sectional."

## 3. Multipurpose Workflows
Because Spaceup.ai is an unopinionated thin layer, it supports a variety of fluid workflows without enforcing a specific path:

1. **Fluid Foundation:** The designer can upload a 2D floor plan, a hand-drawn napkin sketch, or a raw site photo. The agent analyzes the structural intent and drops an initial baseline view onto the canvas.
2. **Contextual Styling:** Drop a mood board into the chat or link it on the canvas. The agent organically applies styles, colors, and lighting to the baseline without requiring explicit style-transfer settings.
3. **Conversational Refinement:** Select regions on the canvas and converse with the agent to swap furniture, change floor finishes, or adjust lighting. The AI manages the heavy lifting of sequential Nano Banana model calls.
4. **Versioning via Design Tree:** The canvas retains a visual history of iterations mapping back to the conversation log, allowing designers to branch off into new aesthetic directions instantly.

## 4. Technical Stack
- **Frontend:** React/Next.js (**TypeScript**) for the UI shell. The architecture must remain **simple and highly scalable** to avoid over-engineering. Because the infinite canvas is the absolute center of the application, it must utilize the fastest and most scalable technology available. We will implement a custom high-performance canvas engine utilizing **WASM (WebAssembly) and WebGL** (similar to the architecture powering Figma and Weavy.ai) to handle massive, high-res image manipulation seamlessly at scale, rather than relying on standard DOM-based canvas libraries.
- **AI Pipeline:** Agentic orchestrator utilizing **Nano Banana** (Google's Gemini Image suite) for high-efficiency, multi-turn sequential image editing and generation. ControlNet for structural adherence where needed.
- **Backend:** Insforge (https://insforge.dev/) for backend state and data management, and Vercel for fast, scalable hosting.

## 5. User Flow: The Designer Workflow

This section outlines the step-by-step journey of a designer within Spaceup.ai, emphasizing an **Image -> Design -> Render** approach, rather than modeling the spaces in 3D like Sketchup or Blender.

### 5.1 Workspace Hierarchy & Navigation
- **Workspaces & Projects:** The application is organized hierarchically. A designer starts at the top-level **Workspace** (e.g., an agency-wide or global "Antigravity" workspace). Inside, they create or open specific **Projects**.
- **Chats & Canvas:** Each Project contains exactly **one infinite canvas** and multiple contextual **Chats**.
- **The Design Tree (Core Concept):** Instead of a linear undo/redo, the core architecture takes the form of a "Design Tree." The project evolves through branching iterations (image-to-image), allowing designers to explore multiple spatial directions simultaneously and trace back to any previous state.

### 5.2 Project Initialization & Asset Gathering
- **Opening the Project:** The designer opens the project and is presented with the light, highly performant infinite canvas. The canvas is the absolute center of the application, built with the fastest and most scalable tech, ensuring it is light and easy to navigate.
- **The Visual Sandbox:** The designer populates the canvas with foundational visual data:
  - Site images (before photos)
  - SketchUp conceptual views or raw 2D floor plans
  - Moodboards (group images together to make a moodboard)
  - Material boards and interior finish samples (textures, colors)

### 5.3 Conversational Design Iteration (Image-to-Image)
- **Linking Assets:** The designer explicitly links moodboards with specific material boards. This combined visual context is fed into the chat interface.
- **Prompting for Change:** Using the chat, the designer requests modifications based on the uploaded visual context. 
- **Image-to-Design Approach:** Crucially, Spaceup is **NOT** a "text-to-model-to-render" platform. It is strictly an **Image-to-Design-to-Render** platform. The AI takes the existing canvas imagery, understands the linked material boards, and uses state-of-the-art image editing models (like Nano Banana) to generate the next iteration.
- **Sequential Refinement:** The designer continuously refines the space image-to-image, building upon the previous layer without losing the structural integrity of the room.

### 5.3.1 Step-by-Step Nano Banana Execution Logic
- **1. Contextual Selection & Visual Connection:** The designer drops an image of a laminate finish onto the canvas and draws a line connecting it to a specific view of the interior. All connections are visually marked in the canvas with a line.
- **2. Chat Orchestration (The Loop):** The designer uses the chat to prompt the edit: *"Add this @[laminate image] to the TV unit in @[interior view]."* The design is inherently iterative, continuously looping based on user comments and visual context routing.
- **3. Execution (InsForge Edge Functions):** *(Architecture Best Practice)* The frontend bundles the base image, the linked context images, and the text prompt and sends them to a secure InsForge Edge function. Routing through a backend function hides the Nano Banana API keys from the public client, secures the connection, allows for database logging before the call is made, and prevents client-side timeout issues during long generations.
- **4. Canvas Auto-Placement:** The Edge Function returns the updated image URL. The canvas organically creates a new node connected to the original view via a visual line containing the prompt, creating the next branch in the Design Tree.

### 5.4 Addressing Workflow Gaps
To ensure Spaceup.ai fits natively into professional interior design workflows, this flow accounts for critical industry gaps that standard AI image generators miss:
- **Spatial Consistency & True Scale:** By relying on an image-to-image "Design Tree" integrated with ControlNet (depth/segmentation), Spaceup prevents impossible spatial hallucinations and ensures that added furniture respects real-world proportions and site constraints.
- **Sourcing & Procurement Handoff:** The linked material boards ensure that what is rendered is tied to actual finishes. The AI acts as a bridge, converting conceptual render iterations into tangible specification/tear sheets for vendor procurement.
- **Client Presentation & Feedback Loop:** The Design Tree allows designers to cleanly present Option A (Branch 1) vs. Option B (Branch 2). Instead of exporting massive files, designers simply share a view-only link to a specific canvas node, allowing clients to leave pinned comments directly on the spatial render.
- **Granular Z-Depth Control:** During iteration, designers can isolate the foreground (e.g., a specific sofa) from the background architecture, preventing the AI from accidentally overwriting structural details when changing a piece of furniture.

## 6. Backend Data Handling (InsForge)
The platform manages massive state architectures securely at scale:
- **PostgreSQL Database:** Stores the metadata of the "Design Tree". Every node (image) and edge (connection line/prompt) is a row, creating a lightweight JSON graph mapping the canvas.
- **Storage Buckets:** Nano Banana outputs high-res images directly to InsForge Storage. The database only stores the URL references, keeping API payloads extremely fast and light.
- **Auth & RLS:** Collaborative editing relies on InsForge Row Level Security to ensure designers only see projects they own or are invited to.
- **Realtime (WebSockets):** Using InsForge Realtime, when the backend finishes generating the Nano Banana image, it pushes the new node UI update directly to every user viewing that canvas project.
