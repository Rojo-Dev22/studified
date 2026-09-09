# AXO — Scroll-Driven 2D Axolotl Hero + Separate Login Experience

## 0. Purpose

This specification is the implementation contract for the **new animated hero experience**.

The goal is to replace any circle/blob-based axolotl construction with a **recognizable, complete 2D axolotl character** and make the entire hero behave like a continuous underwater journey driven by user scrolling.

The implementation must preserve the **existing website's current color palette, typography, visual language, and working functionality** unless a change is explicitly required by this specification.

### Non-negotiable goals

1. The axolotl must look like a real stylized 2D axolotl, not a collection of circles.
2. The axolotl must have a complete body: head, torso, four limbs, long tail, six feathery gills, eyes, and mouth.
3. The axolotl must genuinely swim rather than simply slide/translate through the page.
4. Scrolling must drive the axolotl through a continuous curved underwater path.
5. Each content section must alternate the axolotl's side and direction so the composition feels like a guided underwater journey.
6. The final CTA must make the axolotl visually circle/orbit around a **"Let's Get Started"** button.
7. Clicking **"Let's Get Started"** must navigate to the login page.
8. The **hero and login must remain separate pages/routes**.
9. Do not modify unrelated files, unrelated components, or unrelated functionality.
10. Do not replace the entire project architecture merely to implement this experience.

---

# 1. Target User Experience

The visitor should feel like they are following an axolotl companion through a living aquarium.

The experience should roughly behave like this:

```text
PAGE LOAD
   ↓
Hero / aquarium fades in
   ↓
Axolotl appears on the RIGHT
   ↓
Text content appears on the LEFT
   ↓
USER SCROLLS
   ↓
Axolotl swims downward on a curved path
   ↓
Axolotl travels toward the LEFT
   ↓
Axolotl settles on the LEFT
   ↓
New text appears on the RIGHT
   ↓
USER SCROLLS AGAIN
   ↓
Axolotl swims downward on another curved path
   ↓
Axolotl travels toward the RIGHT
   ↓
Axolotl settles on the RIGHT
   ↓
New text appears on the LEFT
   ↓
Repeat for multiple content sections
   ↓
FINAL SCROLL
   ↓
Axolotl reaches the CTA area
   ↓
"Let's Get Started" button appears as the destination
   ↓
Axolotl gently orbits/circles the button
   ↓
User clicks the button
   ↓
SEPARATE LOGIN PAGE / ROUTE
```

The movement must feel like one continuous swim through one aquarium.

There must be **no teleporting**, hard swapping, or visibly snapping the character from one section to another.

---

# 2. Real 2D Axolotl Requirement

## 2.1 Character quality

Do NOT build the axolotl from a group of basic circles, blobs, or generic geometric primitives.

The character should have a coherent illustrated silhouette with:

- a recognizable axolotl head
- distinct torso/body
- four small limbs
- a long flexible tail
- three feathery gills on each side of the head
- two eyes
- a small soft "w" mouth
- smooth joints between body parts
- organic proportions

The head remains the visual focal point, but it must clearly belong to a full animal.

The character should look good both:

- at hero scale
- while moving across the viewport

## 2.2 Recommended construction

Prefer a layered SVG/vector character so different parts can be animated independently.

Suggested hierarchy:

```text
AXOLOTL
├── Back Gills
│   ├── Left Gill 1
│   ├── Left Gill 2
│   ├── Left Gill 3
│   ├── Right Gill 1
│   ├── Right Gill 2
│   └── Right Gill 3
├── Tail
│   ├── Tail Base
│   ├── Tail Mid
│   ├── Tail End
│   └── Tail Tip
├── Body
│   ├── Body Base
│   └── Body Highlight
├── Back Limbs
│   ├── Back Left
│   └── Back Right
├── Head
│   ├── Face
│   ├── Left Eye
│   ├── Right Eye
│   └── Mouth
└── Front Limbs
    ├── Front Left
    └── Front Right
```

Exact file separation may differ to match the existing project's architecture.

The important requirement is that the implementation permits independent animation of the parts.

---

# 3. Preserve Existing Colors

The current site's colors are authoritative.

## 3.1 Do not invent a new palette

Reuse the existing:

- primary colors
- background colors
- accent colors
- text colors
- button colors
- existing underwater colors

Do not recolor the website simply to match a newly generated asset.

## 3.2 Axolotl palette

Where the existing design already defines axolotl colors, reuse those exact values.

Where the current specification's mint palette is already part of the project, preserve:

- Primary mint: `#A8E6CF`
- darker mint/green values for depth
- forest green gills
- deep black eyes
- deep black mouth

Do not introduce neon, highly saturated, or unnecessary colors.

---

# 4. Aquarium Environment

The aquarium should feel alive behind the character, but it must not compete with the content.

Use layered 2D techniques.

Suggested depth:

```text
BACKGROUND
├── Water atmosphere
├── Soft gradient
├── Distant plants
├── Distant particles
└── Slow light rays

MIDDLE
├── Axolotl
├── Main plants
├── Rocks
└── Medium particles

FOREGROUND
├── Large plants
├── Bubbles
├── Subtle particles
└── Soft light effects
```

Environmental motion should be subtle:

- plants sway
- bubbles rise
- particles drift
- water/light moves slowly
- parallax changes with scroll

Avoid excessive effects, large blurs, heavy filters, and visually noisy backgrounds.

---

# 5. Scroll-Driven Choreography

## 5.1 ScrollTrigger is the preferred system

Use the existing animation architecture if one already exists.

If GSAP is already installed, use:

- GSAP
- ScrollTrigger

If another equivalent system already exists and works well, reuse it instead of introducing a duplicate animation library.

## 5.2 Scroll controls the journey

The axolotl's position should be tied to scroll progress.

Scrolling should control:

- vertical travel
- horizontal travel
- path progression
- orientation
- diving angle
- turning
- swimming speed
- section timing
- arrival/settling
- CTA approach

The character should not behave as an independent floating object while the user scrolls.

## 5.3 Use curved paths

Never use simple straight vertical movement such as:

```text
A
|
|
|
B
```

Instead use smooth paths such as:

```text
START RIGHT
     \
      \
       \____
            \
             LEFT
```

Then the next transition can reverse the direction:

```text
LEFT
   /
  /
 /____
       \
        RIGHT
```

The exact path can be implemented with GSAP motion paths, SVG paths, Bezier-like interpolation, or another lightweight approach.

---

# 6. Section Composition

Each content section should deliberately alternate the visual balance.

## Section 1 — Initial Hero

```text
┌─────────────────────────────────────┐
│                                     │
│  TEXT                  AXOLOTL      │
│  LEFT                   RIGHT        │
│                                     │
└─────────────────────────────────────┘
```

The axolotl begins on the **right side**.

The initial content/text is on the **left**.

The axolotl should be alive immediately:

- gentle tail movement
- subtle body movement
- subtle limb paddling
- gill flutter
- occasional blink
- small vertical float

## Section 2

As the visitor scrolls:

```text
RIGHT
  ↓
  ↘
   ↘
    ↙
LEFT
```

The axolotl dives/swims downward and curves toward the **left**.

When the motion settles:

```text
AXOLOTL              TEXT
LEFT                 RIGHT
```

The new content belongs on the **right**.

The transition should feel like the axolotl is intentionally swimming to the next area.

## Section 3

Reverse direction:

```text
LEFT
  ↓
  ↙
   ↙
    ↘
RIGHT
```

The axolotl finishes on the **right**.

New content appears on the **left**.

## Section 4+

Continue the alternating pattern:

```text
RIGHT + TEXT LEFT
        ↓
LEFT + TEXT RIGHT
        ↓
RIGHT + TEXT LEFT
        ↓
LEFT + TEXT RIGHT
```

The number of repetitions should match the amount of existing hero/content content. Do not create arbitrary extra sections solely for animation.

---

# 7. Text Behavior

Text should feel integrated into the aquarium journey.

Do not make each text block look like an unrelated card.

Use:

- gentle fade/slide entrances
- restrained motion
- readable contrast
- sufficient spacing around the axolotl

Text must remain readable at every scroll position.

The text animation should complement the axolotl's motion rather than compete with it.

---

# 8. Axolotl Swimming System

The character must genuinely swim.

Do NOT solve movement by changing only:

```css
transform: translate(...)
```

The visible swimming motion should combine:

- tail undulation
- body rotation
- subtle body compression/extension
- front-limb paddling
- rear-limb movement
- gill flutter
- head motion
- subtle vertical bobbing
- directional momentum

The tail provides most of the propulsion.

The animal's body should respond to direction changes rather than behaving like one rigid image.

---

# 9. Tail Motion

The tail is a primary swimming mechanism.

Create a smooth traveling wave from:

```text
BODY
 ↓
TAIL BASE
 ↓
TAIL MID
 ↓
TAIL TIP
```

When turning:

### Turning left

```text
HEAD → BODY → TAIL BASE → TAIL MID → TAIL TIP
      left      left         left       last
```

### Turning right

Reverse the same sequence.

Do not rotate the entire axolotl as one rigid object.

The tail should lag slightly behind the body so that the character has:

- momentum
- fluidity
- weight
- underwater resistance

---

# 10. Limb Motion

Front and rear limbs should move independently.

During active swimming:

- front limbs gently paddle
- rear limbs make small stabilizing movements
- left/right limbs should not be perfectly synchronized

During slower movement:

- limb motion decreases naturally

During idle:

- limbs relax
- tiny floating motion continues

---

# 11. Gill Motion

Each gill should have subtle independent movement.

Gills should:

- flutter
- bend slightly
- respond to swim speed
- show small timing differences
- remain visually elegant

Avoid perfectly synchronized mechanical movement.

---

# 12. Face and Expression

Keep the face cute but sophisticated.

Implement:

- irregular natural blinking
- subtle eye movement
- small head tilts
- slight expression changes during major state changes

Avoid exaggerated cartoon expressions.

---

# 13. Scroll States

Use a small, maintainable state model.

Recommended states:

| State | Behavior |
|---|---|
| Idle | Gentle floating, relaxed limbs, occasional blink |
| Swimming | Tail propulsion, limb paddling, gill flutter |
| Turning | Head leads, body follows, tail follows |
| Diving | Character angles downward while swimming |
| Arriving | Movement decelerates and settles |
| Presenting | Calm swimming near content |
| CTA Approach | Character moves toward final CTA |
| CTA Orbit | Character circles the CTA button |

Transitions must be blended instead of abruptly switching.

---

# 14. Final CTA Sequence

The CTA is the endpoint of the underwater journey.

## 14.1 Arrival

After the final content section, the axolotl should naturally swim toward the CTA area.

The movement must continue from the previous path.

Do not instantly reposition the character.

## 14.2 CTA appearance

The button should appear as the visual destination.

Button label must be exactly:

**Let's Get Started**

The CTA must remain clearly clickable and keyboard accessible.

## 14.3 Orbit behavior

Once the axolotl arrives, create a restrained circular/orbital movement around the button.

Concept:

```text
           AXOLOTL
              ↘
        ┌─────────────┐
       /               \
      /   LET'S GET     \
     |     STARTED       |
      \                 /
       \_______________/
              ↑
           AXOLOTL
```

The orbit should be gentle and polished, not a fast spinning gimmick.

While orbiting:

- tail continues swimming
- gills continue moving
- limbs continue subtle motion
- body orientation follows the orbit path
- small bubbles/particles may support the moment

Do not obscure the button.

---

# 15. CTA Navigation

The **hero and login must be separate**.

The CTA is a navigation boundary.

Clicking:

**Let's Get Started**

must take the visitor to the existing login page/route, or create the appropriate separate login route if one does not already exist.

Possible route shape examples:

```text
/
 /login
```

or the project's existing equivalent.

Do not put the login form inside the hero as an expanding overlay unless the existing application architecture already requires that behavior.

The hero page and login page must remain separate experiences.

---

# 16. Login Page Safety

The hero implementation must not redesign, replace, or break the login page unnecessarily.

Before modifying navigation:

1. Inspect the existing routing.
2. Identify the real login route.
3. Reuse the existing login page/component where possible.
4. Make the CTA navigate to that route.
5. Do not rewrite login functionality unless explicitly required.

If a login page already exists, **do not create a duplicate login implementation**.

---

# 17. File-Scope Protection

This is a strict requirement.

The implementation must **not touch unrelated files**.

Before editing anything:

1. Inspect the project.
2. Identify the files that actually control the hero.
3. Identify the existing routing entry needed for the CTA.
4. Identify existing axolotl/assets/animation files that must be reused or replaced.
5. Make the smallest set of changes required.

## Do not:

- rewrite the whole project
- replace the entire design system
- modify unrelated components
- change unrelated pages
- change authentication logic unnecessarily
- delete unrelated assets
- reformat unrelated files
- rename unrelated files
- add broad global styles when a scoped style will work
- add dependencies without a real need

## File-change rule

Every modified file should have a direct reason connected to:

- the new hero
- the axolotl
- the aquarium animation
- scroll behavior
- the CTA navigation
- the required route wiring

Nothing else.

If a file is not necessary, leave it untouched.

---

# 18. Asset Strategy

## Preferred

Reuse an existing axolotl asset if it can satisfy the new full-body requirement.

If the existing asset is only a head or geometric approximation, replace **only the relevant character asset/component** with a proper layered 2D representation.

Prefer SVG/vector artwork because it provides:

- scalable rendering
- crisp edges
- independent animation
- small file size when optimized

The final asset should not look like multiple unrelated generated images assembled together.

All body parts must share:

- the same proportions
- the same lighting
- the same color treatment
- the same illustration style
- aligned coordinate space

---

# 19. Technology Rules

Prefer lightweight free/open technologies already compatible with the project.

Preferred stack:

- GSAP
- GSAP ScrollTrigger
- SVG
- CSS
- JavaScript/TypeScript

Use the project's existing framework and build system.

Only add a new dependency when it provides a clear benefit that cannot be achieved well with the current stack.

Do not introduce Three.js/WebGL for this experience unless the existing implementation genuinely requires it.

This is primarily a **2D animation experience**.

---

# 20. Performance

Keep the animation smooth.

Prioritize:

- `transform`
- `opacity`
- SVG transforms
- efficient GSAP timelines
- minimal DOM updates
- limited particle counts
- optimized SVG assets
- sensible ScrollTrigger usage

Avoid animating expensive layout properties repeatedly when transforms can do the job.

Avoid:

- giant background images
- excessive blur
- huge backdrop filters
- unnecessary WebGL
- hundreds of expensive DOM elements
- redundant animation loops

---

# 21. Responsive Behavior

Desktop composition:

```text
TEXT LEFT     AXO RIGHT
```

then:

```text
AXO LEFT      TEXT RIGHT
```

On smaller screens, automatically redesign the choreography rather than simply scaling desktop coordinates.

Possible mobile behavior:

```text
TEXT
  ↓
AXOLOTL
  ↓
SCROLL
  ↓
AXOLOTL
  ↓
TEXT
```

Requirements:

- keep the axolotl visible
- keep text readable
- keep CTA usable
- avoid blocking important content
- reduce particle count
- reduce expensive effects
- adapt curved paths to the viewport
- maintain the feeling of swimming downward

---

# 22. Reduced Motion

Respect:

```css
prefers-reduced-motion: reduce
```

When enabled:

- reduce or disable complex scroll-driven swimming
- reduce continuous environmental motion
- reduce particles
- replace complex movement with simple fades or short transitions
- keep all content visible
- keep the CTA usable
- preserve the route/navigation behavior

The page must remain fully usable without animation.

---

# 23. Accessibility

The animation is decorative and must not block content.

Ensure:

- semantic headings
- accessible CTA
- keyboard focus
- visible focus treatment
- sufficient text contrast
- buttons remain usable independent of animation
- animation never traps focus
- content remains accessible if JavaScript animation fails

The **Let's Get Started** control must be a genuine accessible interactive element.

---

# 24. Implementation Workflow

## Phase 1 — Inspect

Inspect only what is necessary:

- project structure
- framework
- package manager
- hero/home files
- routing
- existing animation setup
- existing axolotl assets/components
- relevant styles
- existing colors/tokens

## Phase 2 — Plan

Create a concise implementation plan covering:

1. full-body axolotl architecture
2. layered SVG structure
3. swimming animation
4. scroll path system
5. alternating content choreography
6. CTA orbit
7. login navigation
8. responsive behavior
9. reduced-motion behavior
10. exact files that must be changed

## Phase 3 — Implement

Implement the smallest coherent set of changes.

Do not touch unrelated files.

## Phase 4 — Test

Test:

- initial hero position
- right-to-left scroll transition
- left-to-right scroll transition
- multiple repeats
- curved path continuity
- no teleporting
- body/tail/limb/gill animation
- CTA arrival
- CTA orbit
- button navigation
- login route
- desktop
- tablet
- mobile
- reduced motion
- console errors

## Phase 5 — Refine

Fix obvious issues such as:

- axolotl looks like it is sliding
- tail feels disconnected
- turning is too rigid
- character gets hidden under text
- section timing feels abrupt
- orbit overlaps the button
- scroll speed feels unnatural
- content becomes unreadable
- mobile path is awkward
- animation causes frame drops

Do not stop at "it compiles."

---

# 25. Acceptance Criteria

## Character

- [ ] Full-body axolotl exists.
- [ ] It is clearly recognizable as an axolotl.
- [ ] It is not constructed from a bunch of circles.
- [ ] Head is the focal point.
- [ ] Torso is present.
- [ ] Four limbs are present.
- [ ] Long flexible tail is present.
- [ ] Six gills are present.
- [ ] Eyes are present.
- [ ] Mouth is present.
- [ ] Body parts connect cleanly.

## Swimming

- [ ] Tail visibly drives propulsion.
- [ ] Tail wave travels from body toward tip.
- [ ] Limbs paddle subtly.
- [ ] Gills flutter.
- [ ] Body rotates into turns.
- [ ] Character has momentum.
- [ ] Movement is not a simple slide.
- [ ] Diving looks intentional.
- [ ] Arrivals decelerate naturally.

## Scroll choreography

- [ ] Initial axolotl position is on the right.
- [ ] Initial text is on the left.
- [ ] Scrolling makes the axolotl move downward.
- [ ] First major transition sends the axolotl to the left.
- [ ] Text alternates to the right.
- [ ] Next transition sends the axolotl back to the right.
- [ ] Text alternates to the left.
- [ ] This repeats through the planned sections.
- [ ] Motion uses curved paths.
- [ ] There is no teleporting.
- [ ] Section transitions feel continuous.

## Final CTA

- [ ] Final CTA is visible as a destination.
- [ ] Button text is exactly "Let's Get Started".
- [ ] Axolotl approaches the CTA naturally.
- [ ] Axolotl gently orbits around the button.
- [ ] Orbit does not obscure the button.
- [ ] Button is keyboard accessible.
- [ ] Button navigates to the login page/route.

## Login separation

- [ ] Hero is a separate page/route.
- [ ] Login is a separate page/route.
- [ ] Existing login functionality is preserved.
- [ ] No unnecessary login redesign is introduced.

## Visual consistency

- [ ] Existing colors are preserved.
- [ ] Existing visual language is preserved.
- [ ] No unnecessary neon colors are introduced.
- [ ] Aquarium remains premium and cohesive.
- [ ] Text remains readable.

## File safety

- [ ] Only necessary files were modified.
- [ ] Unrelated files were left untouched.
- [ ] Existing functionality was preserved.
- [ ] No unnecessary dependencies were added.
- [ ] No duplicate authentication/login system was created.

## Technical

- [ ] No console errors.
- [ ] No broken imports.
- [ ] No missing assets.
- [ ] Desktop works.
- [ ] Tablet works.
- [ ] Mobile works.
- [ ] Reduced-motion works.
- [ ] Performance is acceptable.

---

# 26. Autonomous Implementation Contract

Treat this document as an implementation contract, not a suggestion.

The coding agent is responsible for making the technical decisions required to produce the experience.

The user should be able to provide feedback in natural language such as:

> Make the axolotl more realistic.

> Make him swim slower.

> Move him farther to the left.

> Make the turn smoother.

> Make the tail more natural.

> Make the orbit smaller.

> Keep the same colors.

The coding agent must translate that feedback into the appropriate asset, animation, layout, and route changes without requiring the user to manually create keyframes or animation code.

---

# 27. Final Definition of Done

The task is complete only when:

> A visitor opens the hero and immediately sees a complete, polished 2D axolotl inside a living aquarium. The axolotl starts on the right with content on the left, then swims downward along a curved path as the user scrolls, alternates sides across several content sections, genuinely animates its tail/limbs/gills/body while moving, and finally reaches a CTA area where it gently orbits a "Let's Get Started" button. Clicking that button takes the visitor to a separate login page/route. Existing colors and functionality remain intact, and unrelated files are not modified.
