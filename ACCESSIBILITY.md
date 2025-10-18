# Accessibility Best Practices

This document outlines accessibility best practices for web development, user interfaces, and app development. Following these guidelines ensures our applications are usable by everyone, including people with disabilities.

## Table of Contents

- [Core Principles (WCAG)](#core-principles-wcag)
- [Web Development](#web-development)
- [User Interface Design](#user-interface-design)
- [Native App Development](#native-app-development)
- [Testing & Validation](#testing--validation)
- [Project-Specific Guidelines](#project-specific-guidelines)

## Core Principles (WCAG)

The Web Content Accessibility Guidelines (WCAG) 2.1 define four core principles (POUR):

### 1. **Perceivable**
Information and UI components must be presentable to users in ways they can perceive.

### 2. **Operable**
UI components and navigation must be operable by all users.

### 3. **Understandable**
Information and UI operation must be understandable.

### 4. **Robust**
Content must be robust enough to work with current and future assistive technologies.

## Web Development

### Semantic HTML

**DO:**
```html
<header>
  <nav aria-label="Main navigation">
    <ul>
      <li><a href="/home">Home</a></li>
    </ul>
  </nav>
</header>

<main>
  <article>
    <h1>Page Title</h1>
    <p>Content goes here...</p>
  </article>
</main>

<footer>
  <p>&copy; 2025 Company Name</p>
</footer>
```

**DON'T:**
```html
<div class="header">
  <div class="nav">
    <div class="link">Home</div>
  </div>
</div>
```

### ARIA Labels and Roles

Use ARIA attributes to enhance accessibility when semantic HTML isn't sufficient:

```html
<!-- Label interactive elements -->
<button aria-label="Close dialog">×</button>

<!-- Describe complex widgets -->
<div role="tablist">
  <button role="tab" aria-selected="true" aria-controls="panel-1">
    Tab 1
  </button>
</div>

<!-- Live regions for dynamic content -->
<div role="status" aria-live="polite">
  Loading...
</div>

<!-- Expandable sections -->
<button aria-expanded="false" aria-controls="content-1">
  Show more
</button>
```

**ARIA Rules:**
1. No ARIA is better than bad ARIA
2. Use semantic HTML first
3. Don't override native semantics
4. All interactive elements must be keyboard accessible
5. Don't use `role="presentation"` or `aria-hidden="true"` on focusable elements

### Keyboard Navigation

All interactive elements must be keyboard accessible:

```tsx
// Custom button component
const Button = ({ onClick, children }) => (
  <button
    onClick={onClick}
    onKeyDown={(e) => {
      // Handle Enter and Space
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick(e);
      }
    }}
  >
    {children}
  </button>
);

// Skip to main content link
<a href="#main-content" className="skip-link">
  Skip to main content
</a>
```

**Keyboard Requirements:**
- **Tab**: Navigate forward through interactive elements
- **Shift + Tab**: Navigate backward
- **Enter/Space**: Activate buttons and links
- **Arrow keys**: Navigate within composite widgets (menus, tabs, etc.)
- **Escape**: Close dialogs and modals

### Focus Management

```css
/* DO: Provide visible focus indicator */
button:focus-visible {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}

/* DON'T: Remove outlines without replacement */
button {
  outline: none; /* ❌ Bad */
}
```

```tsx
// Focus management in React
const Modal = ({ isOpen, onClose }) => {
  const closeButtonRef = useRef(null);
  
  useEffect(() => {
    if (isOpen) {
      // Trap focus inside modal
      closeButtonRef.current?.focus();
    }
  }, [isOpen]);
  
  return (
    <dialog open={isOpen} aria-modal="true">
      <button ref={closeButtonRef} onClick={onClose}>
        Close
      </button>
    </dialog>
  );
};
```

### Color and Contrast

**WCAG AA Standards:**
- Normal text: 4.5:1 contrast ratio
- Large text (18pt+ or 14pt+ bold): 3:1 contrast ratio
- UI components and graphics: 3:1 contrast ratio

**DO:**
```css
/* Good contrast */
.button-primary {
  background: #0066cc;
  color: #ffffff; /* 4.54:1 ratio */
}

/* Don't rely on color alone */
.error-message {
  color: #d32f2f;
  font-weight: bold; /* Additional indicator */
}

.error-message::before {
  content: "⚠ "; /* Visual icon */
}
```

**DON'T:**
```css
/* Poor contrast */
.text-light {
  color: #cccccc;
  background: #ffffff; /* 1.6:1 ratio ❌ */
}

/* Color only indicator */
.required {
  color: red; /* ❌ Users with color blindness won't see this */
}
```

### Forms and Labels

```html
<!-- Always associate labels with inputs -->
<label for="email">Email Address</label>
<input
  type="email"
  id="email"
  name="email"
  required
  aria-required="true"
  aria-describedby="email-hint"
/>
<span id="email-hint" class="hint">
  We'll never share your email.
</span>

<!-- Group related inputs -->
<fieldset>
  <legend>Contact Preferences</legend>
  <label>
    <input type="radio" name="contact" value="email" />
    Email
  </label>
  <label>
    <input type="radio" name="contact" value="phone" />
    Phone
  </label>
</fieldset>

<!-- Error messages -->
<label for="password">Password</label>
<input
  type="password"
  id="password"
  aria-invalid="true"
  aria-describedby="password-error"
/>
<span id="password-error" role="alert">
  Password must be at least 8 characters
</span>
```

### Images and Media

```html
<!-- Informative images -->
<img
  src="chart.png"
  alt="Sales increased 25% from January to March 2025"
/>

<!-- Decorative images -->
<img src="decorative-pattern.svg" alt="" role="presentation" />

<!-- Complex images -->
<figure>
  <img src="infographic.png" alt="2025 User Statistics" />
  <figcaption>
    Detailed description: 60% mobile users, 30% desktop, 10% tablet...
  </figcaption>
</figure>

<!-- Video -->
<video controls>
  <source src="demo.mp4" type="video/mp4" />
  <track kind="captions" src="captions.vtt" srclang="en" label="English" />
  <track kind="descriptions" src="descriptions.vtt" srclang="en" />
</video>
```

### Responsive and Zoom

```css
/* Use relative units */
body {
  font-size: 16px; /* Base size */
}

h1 {
  font-size: 2rem; /* Scales with user preferences */
}

/* Support text zoom up to 200% */
@media (min-width: 768px) {
  .container {
    max-width: 60rem; /* Uses rem, not px */
  }
}

/* Don't disable zoom */
<meta name="viewport" content="width=device-width, initial-scale=1"> ✅
<!-- DON'T: user-scalable=no, maximum-scale=1 ❌ -->
```

## User Interface Design

### Visual Hierarchy

- Use heading levels (`<h1>` through `<h6>`) in sequential order
- Don't skip heading levels (e.g., `<h1>` to `<h3>`)
- Provide clear visual hierarchy through size, weight, and spacing

### Touch Targets

**Minimum sizes:**
- Mobile: 44×44px (iOS), 48×48dp (Android)
- Desktop: 24×24px minimum, 44×44px recommended

```css
/* Adequate touch target */
.button {
  min-width: 44px;
  min-height: 44px;
  padding: 12px 24px;
}

/* Increase clickable area */
.icon-button {
  position: relative;
  padding: 8px;
}

.icon-button::after {
  content: '';
  position: absolute;
  top: -12px;
  right: -12px;
  bottom: -12px;
  left: -12px;
}
```

### Motion and Animation

```css
/* Respect user preferences */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Safe animation example */
.fade-in {
  animation: fadeIn 0.3s ease-in;
}

@media (prefers-reduced-motion: reduce) {
  .fade-in {
    animation: none;
    opacity: 1;
  }
}
```

**Guidelines:**
- Don't auto-play videos with sound
- Provide pause/stop controls for moving content
- Avoid flashing content (no more than 3 flashes per second)

### Color Blindness

Test designs with color blindness simulators:
- Protanopia (red-blind)
- Deuteranopia (green-blind)
- Tritanopia (blue-blind)

**DO:**
- Use patterns, icons, or text labels in addition to color
- Ensure graphs use different patterns/shapes, not just colors
- Test with grayscale to verify information isn't lost

### Dark Mode

```css
/* System preference support */
@media (prefers-color-scheme: dark) {
  :root {
    --background: #1a1a1a;
    --text: #f0f0f0;
    --primary: #66b3ff;
  }
}

/* Maintain contrast ratios in both modes */
.button {
  background: var(--primary);
  color: var(--background);
}
```

## Native App Development

### macOS (Swift/SwiftUI)

```swift
// Accessibility labels
Button(action: saveDocument) {
    Image(systemName: "square.and.arrow.down")
}
.accessibilityLabel("Save document")
.accessibilityHint("Saves the current document to disk")

// Grouping elements
VStack {
    Text("Temperature")
    Text("72°F")
}
.accessibilityElement(children: .combine)
.accessibilityLabel("Temperature: 72 degrees Fahrenheit")

// Dynamic Type support
Text("Title")
    .font(.title)
    .dynamicTypeSize(...DynamicTypeSize.xxxLarge)

// Keyboard shortcuts
Button("New Window") { }
    .keyboardShortcut("n", modifiers: .command)
```

### Windows (WPF/C#)

```xml
<!-- Automation properties -->
<Button
    AutomationProperties.Name="Submit Form"
    AutomationProperties.HelpText="Submits the current form data"
    Content="Submit" />

<!-- Keyboard access -->
<MenuItem Header="_File">
    <MenuItem Header="_New" InputGestureText="Ctrl+N" />
</MenuItem>

<!-- Screen reader support -->
<TextBlock
    AutomationProperties.LiveSetting="Polite"
    Text="{Binding StatusMessage}" />
```

### iOS/Android Best Practices

- Support system font size settings
- Provide alternative text for images
- Ensure minimum touch target sizes
- Support screen readers (VoiceOver/TalkBack)
- Test with accessibility scanner tools

## Testing & Validation

### Automated Testing Tools

**Browser Extensions:**
- [axe DevTools](https://www.deque.com/axe/devtools/) - Comprehensive accessibility testing
- [WAVE](https://wave.webaim.org/) - Visual feedback on accessibility issues
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Built into Chrome DevTools

**Command Line:**
```bash
# axe-core CLI
npm install -g @axe-core/cli
axe https://example.com

# pa11y
npm install -g pa11y
pa11y https://example.com
```

**In Code (React):**
```tsx
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

test('should not have accessibility violations', async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Manual Testing

**Keyboard Testing:**
1. Unplug your mouse
2. Navigate entire site with Tab, Shift+Tab, Enter, Space, Arrow keys
3. Verify all interactive elements are reachable
4. Check focus indicators are visible

**Screen Reader Testing:**
- **macOS**: VoiceOver (Cmd+F5)
- **Windows**: NVDA (free) or JAWS
- **iOS**: VoiceOver (Settings → Accessibility)
- **Android**: TalkBack (Settings → Accessibility)

**Visual Testing:**
1. Zoom to 200% - verify layout doesn't break
2. Test with browser text-only mode
3. Use color blindness simulators
4. Test in high contrast mode (Windows)

### Accessibility Checklist

- [ ] All images have appropriate alt text
- [ ] Form inputs have associated labels
- [ ] Color is not the only means of conveying information
- [ ] Contrast ratios meet WCAG AA standards (4.5:1 for text)
- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators are visible
- [ ] Heading levels are sequential
- [ ] ARIA labels are used where appropriate
- [ ] Forms provide clear error messages
- [ ] Videos have captions
- [ ] Page has a meaningful title
- [ ] Language is declared (`<html lang="en">`)
- [ ] Skip navigation link is present
- [ ] No keyboard traps exist
- [ ] Motion respects `prefers-reduced-motion`

## Project-Specific Guidelines

### For This Scheduling Application

#### Admin Panel (Next.js)

```tsx
// Calendar date picker
<button
  aria-label={`${isSelected ? 'Selected' : 'Select'} ${format(date, 'MMMM d, yyyy')}`}
  aria-pressed={isSelected}
  onClick={() => onSelectDate(date)}
>
  {format(date, 'd')}
</button>

// Status indicators
<div
  role="status"
  aria-live="polite"
  aria-label={`${clientsConnected} OBS clients connected`}
>
  <span className="sr-only">{clientsConnected} clients connected</span>
  <span aria-hidden="true">{clientsConnected}</span>
</div>

// Data tables
<table>
  <caption className="sr-only">Scheduled recordings</caption>
  <thead>
    <tr>
      <th scope="col">Time</th>
      <th scope="col">Client</th>
      <th scope="col">Status</th>
    </tr>
  </thead>
</table>
```

#### Frontend (React)

```tsx
// Time slot selection
<fieldset>
  <legend className="sr-only">Select time slot</legend>
  {timeSlots.map(slot => (
    <label key={slot.id}>
      <input
        type="radio"
        name="timeslot"
        value={slot.id}
        aria-label={`${format(slot.start, 'h:mm a')} to ${format(slot.end, 'h:mm a')}`}
      />
      <span>{format(slot.start, 'h:mm a')}</span>
    </label>
  ))}
</fieldset>

// Loading states
<div role="status" aria-live="polite">
  {isLoading && <span>Loading available time slots...</span>}
</div>
```

#### OBS Control Interface

```tsx
// Stream status with announcements
const [streamStatus, setStreamStatus] = useState('stopped');

<div
  role="status"
  aria-live="assertive"
  aria-atomic="true"
>
  {streamStatus === 'streaming' && 'Stream started successfully'}
  {streamStatus === 'stopped' && 'Stream stopped'}
  {streamStatus === 'error' && 'Error: Stream failed to start'}
</div>

// Control buttons with clear labels
<button
  onClick={startStream}
  disabled={isStreaming}
  aria-label={isStreaming ? 'Stream already running' : 'Start stream'}
>
  {isStreaming ? 'Streaming...' : 'Start Stream'}
</button>
```

### Shadcn/ui Components

Our project uses shadcn/ui which has good accessibility built-in, but verify:

```tsx
// Dialog component - already accessible
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogTitle>Confirm Booking</DialogTitle>
    {/* Content is automatically trapped and announced */}
  </DialogContent>
</Dialog>

// Select component - fully keyboard accessible
import { Select, SelectContent, SelectItem } from '@/components/ui/select';

<Select>
  <SelectTrigger aria-label="Select OBS instance">
    <SelectValue placeholder="Choose instance" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="obs-1">OBS Client 1</SelectItem>
  </SelectContent>
</Select>
```

## Resources

### Standards & Guidelines
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/) - Official guidelines
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/) - Widget patterns
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility) - Developer guides

### Testing Tools
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE](https://wave.webaim.org/)
- [Color Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [WebAIM Screen Reader Simulator](https://webaim.org/simulations/screenreader)

### Learning Resources
- [A11y Project](https://www.a11yproject.com/) - Beginner-friendly guides
- [Inclusive Components](https://inclusive-components.design/) - Accessible patterns
- [Web.dev Accessibility](https://web.dev/accessibility/) - Google's guides

### Legal Requirements
- **US**: Section 508, ADA
- **EU**: EN 301 549
- **International**: WCAG 2.1 Level AA (widely adopted)

---

**Remember**: Accessibility is not a feature—it's a fundamental requirement. Build it in from the start, not as an afterthought.
