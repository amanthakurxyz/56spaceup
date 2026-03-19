# Roadmap: Nano Banana AI Pipeline Integration

Image-to-image designer workflow using Google's Gemini model via InsForge Edge Functions.

---

## Status: In Progress — Frontend wiring is the last remaining step

---

## Architecture

### 1. Edge Functions (both written, neither deployed)

Two functions exist. **`generate-image` is the canonical one for this integration.**

| Function | File | API | Returns | Use |
|---|---|---|---|---|
| `generate-image` | `insforge/functions/generate-image/index.ts` | camelCase | `{ url: string }` | ✅ Use this |
| `nano-banana` | `insforge/functions/nano-banana/index.ts` | snake_case | `{ node: nodeData }` | Alternate (persists to DB, requires `project_id`) |

**`generate-image` input payload:**
```ts
{
  prompt: string;
  baseImageUrl: string;   // active node's current image URL
  targetNodeId: string;   // activeContext from store
  intent: 'tweak' | 'structural';
}
```

**`generate-image` output:**
```ts
{ url: string }  // URL of new image stored in spaceup-canvas bucket
```

**Internal flow:**
1. Auth-checks user token via InsForge SDK
2. Calls `client.ai.images.generate()` with model `google/gemini-3-pro-image-preview`
3. Uploads result to `spaceup-canvas` bucket under `generations/{targetNodeId}/{timestamp}.png`
4. Returns `{ url }`

### 2. Frontend: `AgentPanel.tsx`
- **Location**: `src/components/layout/AgentPanel.tsx`
- Intent classification: ✅ Done (`classifyIntent` — tweak/structural keywords)
- Store wiring: ✅ Done (`updateNodeImage`, `createBranch`, `activeContext`)
- **Remaining**: Replace `setTimeout` stub (line 71) with real Edge Function call

**Call pattern to implement:**
```ts
const res = await fetch('/api/insforge/generate-image', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userToken}` },
  body: JSON.stringify({ prompt: text, baseImageUrl: activeNode.url, targetNodeId, intent }),
});
const { url } = await res.json();

if (intent === 'tweak') {
  updateNodeImage(targetNodeId, url);
} else {
  updateNode(newNodeId, { url });  // newNodeId from createBranch() called earlier
}
```

### 3. State Management: `useAppStore.ts`
- `updateNodeImage(id, url)` — ✅ Implemented
- `createBranch(parentId)` → returns `newNodeId` — ✅ Implemented
- `updateNode(id, updates)` — ✅ Implemented

---

## Phases

### Phase 1: Infrastructure ← **Do first**
- [ ] Configure `NANO_BANANA_API_KEY` in InsForge Secrets (key still pending)
- [ ] Verify `spaceup-canvas` storage bucket exists and is public-readable
- [ ] Deploy `generate-image` edge function via InsForge CLI:
  ```bash
  insforge functions deploy generate-image
  ```

### Phase 2: Frontend Wiring ← **Core gap**
- [ ] Replace `setTimeout` stub in `AgentPanel.tsx:71` with real Edge Function call
- [ ] On `tweak` → `updateNodeImage(targetNodeId, url)`
- [ ] On `structural` → `updateNode(newNodeId, { url })` (newNodeId returned by `createBranch`)
- [ ] Add error state: show error message in chat if Edge Function call fails

### Phase 3: Validation
- [ ] Upload an image to canvas, select it
- [ ] Type `"Make it warmer"` → should call Edge Function, update node image in-place (tweak)
- [ ] Type `"Change to minimalist style"` → should call Edge Function, populate branch node (structural)
- [ ] Verify new image appears on canvas at correct node without page reload
- [ ] Verify storage path `generations/{nodeId}/{timestamp}.png` exists in `spaceup-canvas` bucket

---

## Known Gaps / Risks

| Gap | Detail |
|---|---|
| `project_id` not in frontend state | `nano-banana` requires it; `generate-image` does not — use `generate-image` |
| User token for Edge Function auth | Frontend must pass InsForge session token as `Authorization: Bearer <token>` |
| Model availability | `google/gemini-3-pro-image-preview` — confirm model ID with InsForge docs |
| Image-to-image support | Current prompt passes base image URL as text context, not binary — verify Gemini accepts URL-based context |
| `spaceup-canvas` bucket RLS | Must be public-readable for `<img src>` to work without signed URLs |

---

## Critical Files

| File | Status |
|---|---|
| `insforge/functions/generate-image/index.ts` | Written, not deployed |
| `insforge/functions/nano-banana/index.ts` | Written, not deployed (keep as fallback) |
| `src/components/layout/AgentPanel.tsx` | Stub at line 71 — last remaining work |
| `src/store/useAppStore.ts` | Complete |
| `src/components/Canvas/CanvasWrapper.tsx` | References `spaceup-canvas` bucket |

---

## Progress Tracking

| Task | Status |
|---|---|
| `updateNodeImage` store action | ✅ Done |
| Intent classification (tweak/structural) | ✅ Done |
| `createBranch` + node context forwarding | ✅ Done |
| `generate-image` edge function code | ✅ Written |
| Deploy edge function | ⏳ Pending |
| Configure `NANO_BANANA_API_KEY` secret | ⏳ Pending API key |
| Verify `spaceup-canvas` bucket | ⏳ Pending |
| Replace `setTimeout` stub in AgentPanel | ⏳ **Next action** |

**Target**: March 19, 2026
