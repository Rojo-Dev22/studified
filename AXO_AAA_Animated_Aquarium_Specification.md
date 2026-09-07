# AXO — AAA Studio Animated Aquarium Hero Specification

## 0. Project Goal

Build a premium, highly polished **2D animated aquarium landing page / hero experience** centered around a cute but sophisticated full-body axolotl.

The website should feel like the user is entering a living underwater environment rather than viewing a normal webpage with animations layered on top.

The axolotl should continuously feel alive and should travel through the aquarium as the visitor explores the website.

### Core principle

**The user is the creative director. The AI is responsible for implementation and animation.**

The user should not have to manually create keyframes, animation timelines, swimming cycles, particle systems, scroll animations, or animation logic.

The AI coding agent should generate, connect, test, debug, and optimize the entire animation system.

---

# 1. Creative Direction

## Visual Concept

Create a full-screen 2D underwater aquarium environment.

The visual language should be:

- AAA studio-quality
- Premium
- Clean
- Organic
- Atmospheric
- Modern
- Slightly magical
- Cute without being childish
- Expressive without becoming cartoonishly exaggerated

The aquarium should feel like one continuous world.

Avoid making each webpage section feel like an unrelated animated card.

Instead, the visitor should feel like they are **traveling deeper through the same aquarium**.

---

# 2. Full-Body Axolotl Character

The original concept was head-focused, but the final implementation must generate and support the **entire axolotl**, not only the head.

The character must include:

- Head
- Face
- Torso/body
- Four limbs
- Long flexible tail
- Three feathery gills on each side of the head
- Two eyes
- Soft "w" mouth

The head remains the primary visual focal point, but it must be attached to a complete body.

## Character silhouette

The axolotl should have:

- Rounded forms
- Soft edges
- Organic proportions
- Smooth transitions between body parts
- A recognizable axolotl silhouette
- A long expressive tail

The character must look appropriate for underwater movement.

---

# 3. Character Color Palette

## Primary

Light mint green:

`#A8E6CF`

## Secondary

Slightly darker mint/green tones for:

- Body depth
- Subtle shading
- Separation between body parts

## Gills

Darker forest green.

Use lighter green highlights where useful to make individual gill structures readable.

## Eyes

Deep black.

## Mouth

Deep black.

## Optional lighting

Use subtle underwater highlights and soft mint/green illumination when appropriate.

Avoid:

- Excessive neon colors
- Oversaturated colors
- Heavy cartoon styling
- Visually noisy gradients

---

# 4. Layered Character Architecture

The axolotl should be constructed as independently addressable layers whenever possible.

Recommended structure:

```text
AXOLOTL
│
├── Back Gills
│   ├── Left Gills
│   └── Right Gills
│
├── Tail
│   ├── Tail Base
│   ├── Tail Middle
│   └── Tail Tip
│
├── Body
│   ├── Body Base
│   └── Body Highlights
│
├── Back Limbs
│   ├── Back Left Leg
│   └── Back Right Leg
│
├── Head
│   ├── Face
│   ├── Left Eye
│   ├── Right Eye
│   └── Mouth
│
└── Front Limbs
    ├── Front Left Leg
    └── Front Right Leg
```

Do not flatten the character into a single image if doing so prevents independent animation.

---

# 5. AI-Generated Animation Requirement

The AI must create the animation system.

The user should NOT have to manually:

- Create keyframes
- Animate the tail
- Animate the legs
- Animate the gills
- Animate the eyes
- Create swimming loops
- Create scroll timelines
- Create particle systems
- Create bubble animations
- Create plant animations
- Create environmental motion
- Connect animation states
- Debug animation timing

The user should be able to provide natural-language instructions such as:

> "Make the axolotl swim slower."

> "Make the tail movement more natural."

> "Make it dive toward the next section."

> "Make the aquarium feel deeper."

The AI should modify the implementation itself.

---

# 6. Swimming Animation

The axolotl must appear to genuinely swim.

Do NOT simply translate the character vertically or horizontally.

Swimming should combine:

- Tail undulation
- Body rotation
- Body compression/extension
- Limb paddling
- Gill fluttering
- Head movement
- Vertical bobbing
- Side-to-side movement
- Momentum
- Acceleration/deceleration

The tail should provide the majority of the visual propulsion.

Concept:

```text
        HEAD
         🦎
          \
           \
            ~~~
              ~~~
                 ~~~
                    >
                  TAIL
```

The swimming motion must be smooth and organic.

Avoid robotic loops.

---

# 7. Tail Animation

The tail is one of the most important animation components.

The AI should create a procedural or timeline-based tail system capable of:

- Smooth lateral waves
- Wave propagation from body to tail tip
- Variable wave amplitude
- Variable speed
- Natural acceleration/deceleration
- Subtle variation
- Smooth looping

The tail should respond to movement direction.

## Turning left

The movement should visually propagate:

1. Head begins turning left.
2. Body follows.
3. Tail base bends.
4. Tail middle follows.
5. Tail tip follows last.

## Turning right

Reverse the behavior.

The character must appear to have momentum rather than rotating as one rigid object.

---

# 8. Limb Animation

The four limbs should have independent subtle animation.

While swimming:

- Front limbs gently paddle.
- Back limbs make subtle paddling movements.
- Limbs should not be perfectly synchronized.
- Movement should remain secondary to the tail.

While idle:

- Limbs relax.
- Small floating movement may continue.

The AI should automatically create these animations.

---

# 9. Gill Animation

Each gill should have independent animation.

Gills should:

- Flutter gently
- Move with underwater currents
- Have slight left/right variation
- React subtly to swimming speed
- Avoid perfectly synchronized mechanical movement

When swimming faster:

- Gill movement can increase slightly.

When slowing down:

- Gills should settle naturally.

---

# 10. Facial Animation

## Blinking

Use natural, irregular blinking.

Avoid blinking at a perfectly predictable interval.

## Dormant / Idle

- Relaxed eyes
- Soft expression
- Gentle floating

## Active

- Slightly wider eyes
- More alert expression
- Increased head movement

## Excited

- Slightly wider eyes
- More energetic body motion
- More expressive movement

Facial animation should remain subtle and premium.

---

# 11. Underwater Environmental System

The aquarium should feel alive even when the user is not scrolling.

Generate and animate:

- Bubbles
- Tiny underwater particles
- Aquatic plants
- Rocks
- Sand/gravel
- Water gradients
- Light rays
- Caustic-style lighting
- Foreground objects
- Background objects
- Depth layers

## Environmental behavior

### Plants

Slowly sway.

### Particles

Drift independently.

### Bubbles

Rise naturally at different speeds and sizes.

### Light rays

Move extremely slowly.

### Water

Use subtle motion to avoid a static background.

---

# 12. Aquarium Depth and Parallax

Create multiple visual depth layers.

Recommended:

```text
BACKGROUND
│
├── Water gradient
├── Distant particles
├── Distant plants
│
MIDDLE GROUND
│
├── Axolotl
├── Main plants
├── Rocks
│
FOREGROUND
│
├── Large plants
├── Particles
├── Bubbles
└── Soft lighting effects
```

Different layers should move at different rates.

The goal is to create depth without requiring expensive 3D rendering.

---

# 13. Continuous Scroll Experience

The entire website should feel like one continuous underwater environment.

The axolotl should travel through the aquarium as the user scrolls.

## Hero

The axolotl enters the scene.

Content introduces the website.

## Section 2

The axolotl swims deeper.

The environment changes subtly.

A new description appears.

## Section 3

The axolotl changes direction and swims through aquatic plants.

Another website description appears.

## Section 4

The axolotl moves toward another area of the aquarium.

Features/content are introduced.

## Final CTA

The axolotl reaches the final area.

The CTA becomes the visual destination.

### Critical requirement

The axolotl must NEVER teleport between sections.

Movement must be continuous.

---

# 14. Curved Swimming Path

The axolotl should follow designed curved paths.

Avoid simple:

```text
A
│
│
│
B
```

Prefer:

```text
        🫧

             🦎
            /
           /
      🌿  /
         /
        ╰──────
              🌿

                  🪨
```

The AI should automatically generate smooth paths and synchronize the character's orientation with the path.

---

# 15. Character State Machine

Use a state-machine architecture.

Possible states:

| State | Visual Behavior |
|---|---|
| Dormant | Gentle breathing, relaxed limbs, blinking, subtle floating |
| Swimming | Tail propulsion, limb paddling, gill fluttering, body movement |
| Active | Alert expression, faster movement, wider eyes |
| Thinking | Slows down, front limb toward chin, slight head tilt, subtle thought/lightbulb indicator |
| Loading | Gentle idle swimming with circular progress particles |
| Ecstatic | Excited movement, faster tail, energetic limbs, sparkles |
| Turning | Head leads, body follows, tail curves naturally |
| Diving | Body rotates downward and tail follows |
| Ascending | Body rotates upward and tail follows |

State transitions must be smooth.

Avoid abrupt switching between animation states.

---

# 16. Thinking State

When Thinking:

- Swimming slows.
- One front limb moves toward the chin.
- Head tilts slightly.
- Eyes shift subtly.
- Optional small lightbulb/thought indicator appears.
- Tail continues subtle movement.
- Gills continue moving.

The character should still feel alive.

---

# 17. Loading State

When Loading:

- Keep the axolotl visible.
- Continue subtle tail movement.
- Continue gill fluttering.
- Continue body bobbing.
- Add small orbiting progress particles if appropriate.

Never completely freeze the character.

---

# 18. Ecstatic State

When Ecstatic:

- Eyes become slightly wider.
- Body performs a small excited bounce.
- Tail becomes more energetic.
- Gills flutter faster.
- Limbs move more energetically.
- Small particles/sparkles appear.

Do not make the effect chaotic.

---

# 19. Animation Technology

Preferred free/open technologies:

- GSAP
- GSAP ScrollTrigger
- SVG
- CSS
- JavaScript

Optional:

- Three.js only if advanced 3D effects are genuinely required.
- Lottie/dotLottie for isolated animations when useful.

Do not introduce unnecessary dependencies.

The default implementation should remain primarily 2D.

---

# 20. Animation Responsibility

The AI coding agent is responsible for:

1. Inspecting the existing project.
2. Understanding the current design system.
3. Planning the animation architecture.
4. Creating the character system.
5. Creating the aquarium.
6. Creating swimming animation.
7. Creating environmental animation.
8. Creating scroll behavior.
9. Creating state transitions.
10. Testing the implementation.
11. Fixing errors.
12. Optimizing performance.
13. Adapting the animation to mobile.

The user should only need to provide creative feedback.

---

# 21. Recommended Development Stack

Use a completely free software stack wherever possible.

| Technology | Purpose |
|---|---|
| Antigravity | AI coding/development agent |
| GSAP | Main animation engine |
| ScrollTrigger | Scroll-driven animation |
| SVG | Axolotl and environmental artwork |
| CSS | Water/environment effects |
| JavaScript | Animation/state logic |
| Three.js | Optional advanced 3D |
| dotLottie/Lottie | Optional isolated animations |
| VS Code | Development environment |
| Git | Version control |

No paid animation service should be required.

No paid API should be required.

No subscription-based animation library should be required.

---

# 22. Recommended Editor Extensions

Keep the development environment lightweight.

## Essential

### Antigravity

Primary AI development environment/agent.

### Prettier

Automatically formats generated code.

### Live Server

Provides a fast local preview.

## Recommended

### SVG Preview

Useful for inspecting the axolotl and other vector assets.

### Image Preview

Useful for inspecting generated visual assets.

### GitLens

Optional for version control and restoring previous versions.

Do not install unnecessary animation extensions.

The actual animation should be generated by the AI using the project's animation libraries.

---

# 23. Performance Requirements

The experience must remain smooth on lower-end hardware.

Prioritize:

- GPU-friendly transforms
- Lightweight SVG
- Efficient animation loops
- Minimal DOM manipulation
- Lazy loading
- Optimized assets
- Reasonable particle counts
- Efficient ScrollTrigger usage

Avoid:

- Huge background images
- Video backgrounds unless absolutely necessary
- Excessive blur
- Excessive filters
- Unnecessary WebGL
- Hundreds of individually expensive DOM animations

Use 2D techniques by default.

---

# 24. Responsive Design

Support:

- Desktop
- Laptop
- Tablet
- Mobile

On smaller devices:

- Reduce particle count.
- Reduce expensive effects.
- Adjust axolotl size.
- Adjust swimming paths.
- Preserve the core character animation.
- Keep text readable.
- Keep the axolotl visible.
- Avoid blocking content.

The animation should adapt rather than simply scale down.

---

# 25. Accessibility

Respect:

```text
prefers-reduced-motion
```

When enabled:

- Reduce or disable continuous swimming.
- Reduce environmental movement.
- Reduce particles.
- Replace complex transitions with simple fades.
- Keep all important content visible.

Use `aria-live` for meaningful dynamic state changes.

Animations must never prevent users from accessing the website content.

---

# 26. Suggested Project Architecture

```text
project/
│
├── index.html
│
├── css/
│   ├── main.css
│   ├── aquarium.css
│   └── animations.css
│
├── js/
│   ├── main.js
│   ├── aquarium.js
│   ├── axolotl.js
│   ├── scroll.js
│   └── stateMachine.js
│
├── assets/
│   ├── axolotl/
│   │   ├── axolotl.svg
│   │   └── parts/
│   │       ├── head.svg
│   │       ├── body.svg
│   │       ├── tail.svg
│   │       ├── gills.svg
│   │       ├── front-limbs.svg
│   │       └── back-limbs.svg
│   │
│   ├── plants/
│   ├── rocks/
│   ├── bubbles/
│   └── textures/
│
└── README.md
```

Adapt this structure to the existing project rather than blindly replacing an existing architecture.

---

# 27. Antigravity Implementation Prompt

Use the following as the primary instruction to the AI coding agent:

```text
You are responsible for building the complete animated aquarium experience.

I do NOT want to manually create or edit animations.

You must create:
- the axolotl animation
- swimming animation
- tail animation
- limb animation
- gill animation
- blinking
- expressions
- bubbles
- particles
- plants
- water movement
- lighting movement
- parallax
- scroll animations
- section transitions
- state transitions
- responsive behavior

Use free technologies.

Preferred:
- GSAP
- GSAP ScrollTrigger
- SVG
- CSS
- JavaScript

Do not introduce paid services.

First inspect the existing project.

Do not destroy existing functionality.

Understand the existing design language before modifying it.

Create a full-body axolotl.

The character must include:
- head
- body
- four limbs
- long flexible tail
- three feathery gills on each side
- eyes
- mouth

The head should remain the focal point.

The axolotl must genuinely swim.

Do not simply move a static image down the page.

Create:
- tail undulation
- body rotation
- limb paddling
- gill fluttering
- subtle head movement
- body bobbing
- natural acceleration/deceleration

Create a continuous underwater environment.

As the user scrolls, the axolotl should travel through the aquarium.

Do not teleport it between sections.

Use curved swimming paths.

Make the character orientation follow its movement.

Create background, middle-ground and foreground depth layers.

Animate:
- plants
- bubbles
- particles
- lighting
- water atmosphere

Create a state machine supporting:
- Dormant
- Swimming
- Active
- Thinking
- Loading
- Ecstatic
- Turning
- Diving
- Ascending

All transitions must be smooth.

The user should be able to give natural-language feedback such as:

"Make the axolotl swim slower."

"Make the tail more natural."

"Make the aquarium deeper."

"Make the axolotl dive here."

You must modify the implementation yourself.

Do not respond with instructions telling me how to manually create the animation.

Implement it.

Then test it.

Check:
- console errors
- responsiveness
- animation smoothness
- scroll behavior
- mobile behavior
- reduced-motion behavior

Fix problems you find.

Optimize the result.

Do not stop at a basic prototype.

Iterate toward a polished, premium, AAA-inspired interactive aquarium experience.
```

---

# 28. Quality Bar

The final product should NOT feel like:

- A static webpage with an animated GIF
- A character sliding down the screen
- Random animations placed everywhere
- A children's cartoon
- A generic AI-generated landing page
- A collection of disconnected sections

It SHOULD feel like:

> **A living underwater world that happens to contain a website.**

The axolotl should feel like the website's companion and guide.

Its movement should have:

- Personality
- Momentum
- Weight
- Fluidity
- Purpose
- Natural variation

The environment should reinforce the movement rather than compete with it.

---

# 29. Final Experience

The ideal experience is:

```text
PAGE LOAD
    ↓
Aquarium fades in
    ↓
Particles begin drifting
    ↓
Plants gently move
    ↓
Bubbles rise
    ↓
Axolotl slowly enters
    ↓
Axolotl swims naturally
    ↓
Hero message appears
    ↓
USER SCROLLS
    ↓
Axolotl follows a curved path
    ↓
Environment shifts
    ↓
New content appears
    ↓
Axolotl turns
    ↓
It swims deeper
    ↓
New section
    ↓
Axolotl reacts to content/state
    ↓
Final area
    ↓
Axolotl reaches CTA
    ↓
User is invited to continue
```

The animation should feel continuous from beginning to end.

---

# 30. Non-Negotiable Requirements

1. Full-body axolotl — not head-only.
2. Head remains the primary focal point.
3. Tail must be independently animated.
4. Four limbs must be independently animatable.
5. Six gills must be independently animatable.
6. Eyes must blink naturally.
7. Swimming must look physically believable.
8. Axolotl must follow curved paths.
9. Scroll movement must be continuous.
10. No teleporting between sections.
11. Aquarium environment must continuously animate.
12. Background/middle/foreground depth must be established.
13. Animation must be generated by the AI.
14. User should not need to manually animate anything.
15. The implementation must prioritize $0/free technologies.
16. The website must remain responsive.
17. `prefers-reduced-motion` must be supported.
18. Performance must be considered from the beginning.
19. The AI must test and debug its own implementation.
20. The final result must feel like a cohesive premium underwater experience.


# 31. ANTIGRAVITY AUTONOMOUS EXECUTION CONTRACT

## Primary Objective

Antigravity must treat this specification as an **implementation contract**, not merely a design suggestion.

Its job is to take the existing project from its current state to the finished animated aquarium experience with the minimum amount of unnecessary work, while preserving existing functionality.

The user should not be required to understand the underlying animation implementation.

The AI should make appropriate technical decisions automatically.

---

## 31.1 Use What Is Actually Needed

Antigravity is explicitly allowed to use whatever **free, appropriate, technically necessary tooling, libraries, APIs, browser capabilities, project dependencies, and local development utilities** are available to complete the task.

Do not artificially restrict implementation to the libraries named in this document.

However:

### Priority order

1. Existing project architecture and dependencies
2. Native browser capabilities
3. Free/open-source libraries already installed
4. Free/open-source libraries that materially improve the implementation
5. Additional tooling only when it provides a clear benefit

Do NOT add dependencies simply because they are available.

Every added dependency must have a reason.

Before installing or introducing a new dependency, determine whether the existing stack can accomplish the same result efficiently.

---

## 31.2 Free-First Requirement

The final implementation must not depend on paid services.

Do not require:

- Paid APIs
- Paid animation services
- Paid asset libraries
- Paid hosting
- Paid plugins
- Paid AI services
- Subscription-only libraries

Prefer MIT, Apache, BSD, public-domain, or similarly permissive free/open-source solutions when external libraries are necessary.

If an external resource is optional rather than necessary, prefer a local implementation.

---

## 31.3 Autonomous Tool Selection

Antigravity should decide which implementation technique is best for each component.

For example:

### Use SVG when:

- The character needs scalable vector artwork.
- Body parts need independent animation.
- The artwork is relatively simple.

### Use CSS when:

- The effect is simple.
- The browser can render it efficiently.
- JavaScript is unnecessary.

### Use GSAP when:

- Multiple animation sequences must be coordinated.
- Scroll-driven animation is required.
- Timelines and sequencing are needed.
- Motion paths are useful.

### Use Canvas when:

- There are many lightweight particles.
- DOM/SVG particle rendering would become inefficient.

### Use WebGL/Three.js only when:

- The visual requirement genuinely benefits from GPU-based rendering.
- A 2D solution cannot reasonably achieve the required effect.

Do not use heavy technology merely because it looks impressive on paper.

---

# 32. ANTIGRAVITY WORKFLOW

Antigravity must follow this workflow rather than immediately generating a large amount of code.

## Phase 1 — Inspect

First inspect:

- Existing project structure
- package manager
- package.json
- existing dependencies
- HTML
- CSS
- JavaScript/TypeScript
- assets
- routing
- existing components
- existing design system
- existing animation systems
- build configuration
- responsive breakpoints

Do not overwrite existing functionality blindly.

---

## Phase 2 — Understand

Determine:

- Which framework the project uses
- Which files control the home/hero page
- Which stylesheet controls global colors/fonts
- How assets are currently loaded
- Whether GSAP or another animation system already exists
- Whether the axolotl already exists
- Whether the current design has reusable components

Reuse existing infrastructure wherever possible.

---

## Phase 3 — Plan

Before major implementation, create a concise internal implementation plan covering:

1. Character architecture
2. Aquarium architecture
3. Animation architecture
4. Scroll architecture
5. Asset requirements
6. Dependencies
7. Performance strategy
8. Responsive strategy
9. Accessibility strategy

Do not create unnecessary abstractions.

---

# 33. ASSET GENERATION AND ASSET HANDLING

If the full-body axolotl artwork does not already exist, Antigravity should determine what assets are required.

The required character components are:

- Head
- Body
- Tail
- Four limbs
- Six gills
- Eyes
- Mouth
- Optional highlights/shadows

If possible, generate or construct these as layered SVG/vector assets so they can be animated independently.

If a suitable existing project asset is available, reuse it instead of generating a duplicate.

### Asset consistency

All generated character parts must:

- Match the same art style
- Match proportions
- Match lighting
- Match colors
- Align correctly
- Share the same coordinate system
- Connect without visible seams

The final character must look like one coherent axolotl.

---

# 34. IF AI ASSET GENERATION IS AVAILABLE

If the development environment provides an appropriate image/vector generation capability, Antigravity may use it to create missing visual assets.

When doing so:

- Generate the full character, not just the head.
- Preserve the specified mint-green palette.
- Keep the head as the focal point.
- Generate body, limbs, tail, and gills.
- Prefer assets that can be separated into animation layers.
- Avoid generating multiple inconsistent versions of the character.
- Reuse the approved character design throughout the website.

If a generated raster asset cannot be cleanly animated, prefer creating or converting a suitable layered/vector representation.

---

# 35. DO NOT OVER-ENGINEER

The goal is a polished experience, not a complicated codebase.

Avoid:

- Unnecessary frameworks
- Duplicate animation libraries
- Multiple systems performing the same task
- Huge abstraction layers
- Excessive component fragmentation
- Unused dependencies
- Unused assets
- Unnecessary build tooling
- Overly complicated state management

Prefer the simplest architecture that can reliably deliver the required experience.

---

# 36. ANIMATION QUALITY CONTROL

Antigravity must visually inspect the result during development whenever browser preview/testing capabilities are available.

Check for:

- Character proportions
- Swimming realism
- Tail continuity
- Limb positioning
- Gill movement
- Body rotation
- Path direction
- Text overlap
- Section transitions
- Bubbles appearing in front/behind correctly
- Plant movement
- Parallax depth
- Mobile layout
- Performance
- Console errors

Do not consider the implementation finished merely because the code compiles.

---

# 37. ITERATIVE SELF-CORRECTION

After the first implementation, Antigravity must evaluate the result and improve obvious problems.

Examples:

If the axolotl looks like it is sliding:

→ Improve propulsion and body/tail movement.

If the tail looks disconnected:

→ Fix the joint and animation origin.

If the character looks robotic:

→ Add timing variation and more natural motion.

If the environment feels static:

→ Add subtle independent environmental motion.

If the page feels visually chaotic:

→ Reduce animation intensity and establish hierarchy.

If the page is slow:

→ Reduce expensive effects and optimize rendering.

---

# 38. PERFORMANCE BUDGET

Performance is a design requirement.

Prefer:

- `transform`
- `opacity`
- GPU-friendly properties
- efficient SVG transforms
- batched animation
- efficient particle rendering
- lazy loading
- asset compression
- limited DOM nodes

Avoid repeatedly animating expensive layout properties such as:

- `top`
- `left`
- `width`
- `height`

when transforms can accomplish the same visual result.

Avoid excessive:

- `filter`
- `backdrop-filter`
- large blurs
- shadows
- WebGL effects
- particle counts

---

# 39. DEPENDENCY DECISION RULE

Before adding a dependency, Antigravity should ask internally:

> "Can I achieve this with the existing project, browser APIs, CSS, SVG, or an already-installed library?"

If yes:

**Do not add a dependency.**

If no:

> "Is there a free/open-source lightweight library that solves this cleanly?"

If yes:

**Use it only if the benefit is meaningful.**

---

# 40. ERROR RECOVERY

If an implementation approach fails:

1. Identify the cause.
2. Attempt the smallest reasonable fix.
3. Re-test.
4. If the approach remains unreliable, replace it with a simpler approach.
5. Do not leave broken experimental code in the final project.

Never knowingly leave:

- Console errors
- Broken imports
- Missing assets
- Dead animation references
- Invalid selectors
- Broken responsive layouts
- Unused failed implementations

---

# 41. EXISTING PROJECT SAFETY

Before modifying files:

- Identify existing functionality.
- Preserve working features.
- Reuse existing styles where appropriate.
- Avoid deleting unrelated components.
- Avoid replacing the entire project unless explicitly required.

When a new system conflicts with an existing implementation, integrate carefully.

Do not assume that the animation page should control the entire application.

---

# 42. RESPONSIVE AUTONOMY

Antigravity must automatically determine appropriate animation behavior for each viewport.

Do not simply scale desktop coordinates down.

For mobile:

- Recalculate paths.
- Reposition content.
- Reduce particle counts.
- Reduce expensive effects.
- Adjust character scale.
- Adjust animation timing where needed.
- Ensure the CTA remains usable.
- Prevent the axolotl from covering important content.

---

# 43. ACCESSIBILITY AUTONOMY

Implement accessibility automatically.

At minimum:

- Respect `prefers-reduced-motion`.
- Ensure content remains accessible without animation.
- Ensure contrast remains readable.
- Do not rely on animation to communicate essential information.
- Ensure interactive elements remain keyboard accessible.

---

# 44. USER FEEDBACK LOOP

After implementation, the user may give natural-language visual feedback.

Examples:

> Make the axolotl bigger.

> Make the water darker.

> Make the swimming more realistic.

> Make the animation smoother.

> Make the aquarium less busy.

> Make the axolotl go behind the plants.

> Make the transition between these sections slower.

Antigravity should translate these requests into the appropriate code/assets/animation changes.

The user should NOT need to specify:

- CSS properties
- GSAP methods
- animation durations
- easing functions
- SVG transforms
- JavaScript architecture

The AI should determine those details.

---

# 45. FINAL ACCEPTANCE TEST

Before declaring the task complete, Antigravity must verify:

### Character

- [ ] Full body exists.
- [ ] Head is the focal point.
- [ ] Body connects correctly.
- [ ] Tail is present and flexible.
- [ ] Four limbs are present.
- [ ] Six gills are present.
- [ ] Eyes and mouth are present.
- [ ] Character proportions are coherent.

### Animation

- [ ] Swimming looks natural.
- [ ] Tail drives the swimming motion.
- [ ] Limbs move subtly.
- [ ] Gills flutter.
- [ ] Eyes blink.
- [ ] Body rotates naturally.
- [ ] Turns have momentum.
- [ ] Diving works.
- [ ] Ascending works.
- [ ] State transitions are smooth.

### Aquarium

- [ ] Bubbles move.
- [ ] Plants move.
- [ ] Particles drift.
- [ ] Lighting moves subtly.
- [ ] Background has depth.
- [ ] Foreground has depth.
- [ ] Parallax works.
- [ ] Aquarium does not feel static.

### Scroll

- [ ] Axolotl follows a continuous path.
- [ ] No teleportation occurs.
- [ ] Sections transition smoothly.
- [ ] Content remains readable.
- [ ] Final CTA is reached naturally.

### Technical

- [ ] No console errors.
- [ ] No broken imports.
- [ ] No missing assets.
- [ ] No unnecessary dependencies.
- [ ] No paid services required.
- [ ] Desktop works.
- [ ] Tablet works.
- [ ] Mobile works.
- [ ] Reduced-motion works.
- [ ] Performance has been checked.

---

# 46. DEFINITION OF DONE

The task is complete only when the website behaves like a cohesive animated underwater experience and not merely when the requested files have been generated.

**Definition of Done:**

> A visitor can open the website, immediately understand the visual concept, watch the aquarium subtly move, see a complete full-body axolotl swimming naturally, scroll through the website while the axolotl continuously travels through the environment, experience smooth transitions and character states, and reach the final CTA without encountering visual, technical, accessibility, or performance problems.

Antigravity should make the technical decisions necessary to reach this result while remaining free-first, efficient, maintainable, and faithful to the existing website.
