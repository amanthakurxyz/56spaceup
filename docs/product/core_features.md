# Core Features: Spaceup.ai

## 1. Material-Contextual Connection
- **Feature:** Material sample images link directly to the main view node on the infinite canvas.
- **Workflow:** Dropping a material (fabric, wood, tile) creates a visual connection line to the interior view.
- **System Impact:** These connections define the *active context* for the next iteration.

## 2. Connection-Linked Intent (Comments)
- **Feature:** Connection lines themselves host metadata in the form of comments.
- **Example:** A line connecting a marble texture to a countertop node can contain the comment: *"add to tv unit"* or *"apply to flooring"*.
- **Logic:** This eliminates ambiguous prompting by tying the intent directly to the visual structure.

## 3. Targeted Agent Context
- **Rule:** Only the *linked visual connections* are passed as active context to the AI agent (Nano Banana).
- **Optimization:** This ensures high precision and credit efficiency by not overloading the model with the entire canvas history, focusing only on the current designer intent.

## 4. Specialized Agent Skills
The Spaceup Agent possesses distinct core skills used to orchestrate complex design tasks:
- **Design:** Geometric spatial reasoning and furniture layout.
- **Render:** Final-pass lighting and high-fidelity texture application.
- **Theme:** Holistic aesthetic consistency (e.g., Japandi, Mid-Century).
- **Mood:** Lighting, atmosphere, and emotional color grading.
- **Material:** Understanding physical properties and finishes (reflectivity, grain, texture).
