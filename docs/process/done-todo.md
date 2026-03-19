# Done & To-Do Tracker

## 🟩 Done
- [x] Initial PRD Drafting & Gap Analysis
- [x] Condensing PRD for Stitch Architecture
- [x] PRD Designer Workflow & Gap Analysis
- [x] Core Mechanics & Tech Stack Pivot
- [x] Thin-Layer Architecture & Multipurpose Freedom
- [x] Synchronized AGENTS.md with PRD.md
- [x] Planning WebGL Canvas
- [x] Create always active rule for synchronizing PRD updates with done-todo.md
- [x] Design Tree branching (Sequential Layering)
- [x] WebGL Curved connection lines
- [x] Node dragging & Movable canvas objects
- [x] Automated overlap prevention (creation & dragging)
- [x] Formalize Nano Banana & InsForge execution logic in PRD
- [x] Document Material-to-View connections & Connection comments (Core Features)

## 🟦 To Do

### Canvas Engine (PRD §2, §1.3)
- [x] Implement WebGL/WASM dot-grid infinite canvas base
- [ ] Build floating toolbar (Select, Pan, Mask/In-paint, Undo/Redo)
- [x] Implement context/connection lines between canvas nodes
- [ ] Add image commenting on canvas nodes
- [ ] Implement selection fill / inpainting region selection
- [ ] Add Z-Depth foreground/background isolation controls
- [x] Build Design Tree branching & visual iteration history

### Frontend UI (PRD §2, §5.1)
- [x] Build split-screen layout (Chat left, Canvas right)
- [x] Build conversational AI chat interface with context uploads
- [ ] Implement Workspace → Project hierarchy & navigation
- [ ] Integrate Stitch UI refinements

### Backend — InsForge (PRD §6)
- [ ] Setup InsForge backend connection & SDK client
- [ ] Design & create PostgreSQL schema for Design Tree (nodes/edges)
- [ ] Setup storage buckets for image outputs
- [ ] Implement Auth & Row Level Security (RLS)
- [ ] Integrate Realtime WebSocket push for canvas updates

### AI Pipeline (PRD §4, §5.3.1)
- [ ] Connect Nano Banana (Gemini Image) for image-to-image generation [/]
- [ ] Integrate ControlNet for depth/segmentation structural adherence [ ]
- [ ] Build InsForge Edge Function for secure AI API routing [/]
- [x] Create Design Tree visual roadmap for Nano Banana [/]
- [ ] Implement canvas auto-placement of generated image nodes [ ]

### Collaboration & Sharing (PRD §5.4)
- [ ] Client view-only sharing via node links with pinned comments
- [ ] Sourcing/procurement handoff from material boards
