# Dark Mode Implementation

The OBS Bridge Admin Panel includes comprehensive dark mode support using `next-themes` and Tailwind CSS.

## Features

- **Three Theme Options**: Light, Dark, and System (follows OS preference)
- **Persistent Preference**: Theme choice is saved in localStorage
- **Smooth Transitions**: Theme changes are handled gracefully
- **Full Component Support**: All shadcn/ui components work in both themes
- **Accessible Toggle**: Easy-to-find theme switcher in the sidebar

## How It Works

### Theme Provider

The application is wrapped in a `ThemeProvider` that manages the current theme state:

```typescript
// src/components/theme-provider.tsx
<ThemeProvider
  attribute="class"
  defaultTheme="system"
  enableSystem
  disableTransitionOnChange
>
  {children}
</ThemeProvider>
```

### Theme Toggle Component

Users can switch themes via the toggle button in the sidebar header:

```typescript
// src/components/theme-toggle.tsx
<ThemeToggle />
```

The toggle provides:
- Light mode
- Dark mode
- System preference (automatically switches based on OS settings)

## Technical Details

### CSS Variables

Tailwind CSS and shadcn/ui use CSS custom properties that automatically switch based on the theme class:

```css
/* Light mode */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  /* ... more variables */
}

/* Dark mode */
.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... more variables */
}
```

### Theme Classes

Components use Tailwind's dark mode variant:

```tsx
<div className="bg-background text-foreground">
  {/* Automatically switches colors based on theme */}
</div>
```

## Customisation

### Change Default Theme

Edit the ThemeProvider in `src/app/layout.tsx`:

```typescript
<ThemeProvider
  attribute="class"
  defaultTheme="light" // or "dark" or "system"
  enableSystem
>
```

### Disable System Theme

Remove the `enableSystem` prop:

```typescript
<ThemeProvider
  attribute="class"
  defaultTheme="light"
>
```

### Enable Transitions

Remove `disableTransitionOnChange` for smooth color transitions:

```typescript
<ThemeProvider
  attribute="class"
  defaultTheme="system"
  enableSystem
>
```

### Customise Theme Colors

Edit the CSS variables in `src/app/globals.css`:

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    /* Add or modify colors */
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    /* Add or modify colors */
  }
}
```

## Adding Dark Mode to New Components

When creating new components, use semantic color tokens:

```tsx
// Good - Uses theme-aware colors
<div className="bg-background text-foreground border-border">
  <h1 className="text-primary">Title</h1>
  <p className="text-muted-foreground">Description</p>
</div>

// Avoid - Hard-coded colors won't switch with theme
<div className="bg-white text-black border-gray-300">
  <h1 className="text-blue-600">Title</h1>
</div>
```

### Available Theme Tokens

- `background` / `foreground` - Main background and text
- `card` / `card-foreground` - Card backgrounds
- `primary` / `primary-foreground` - Primary actions
- `secondary` / `secondary-foreground` - Secondary actions
- `muted` / `muted-foreground` - Muted elements
- `accent` / `accent-foreground` - Accented elements
- `destructive` / `destructive-foreground` - Destructive actions
- `border` - Borders
- `input` - Form inputs
- `ring` - Focus rings

## Testing Dark Mode

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open the app and click the theme toggle in the sidebar

3. Test each theme option:
   - Light mode
   - Dark mode
   - System (change your OS theme to test)

4. Navigate through all pages to ensure consistency:
   - Dashboard
   - OBS Instances
   - Schedules
   - Bookings
   - Users
   - Settings

## Browser Support

Dark mode is supported in all modern browsers:
- Chrome/Edge 76+
- Firefox 67+
- Safari 12.1+
- Opera 62+

## Accessibility

The theme toggle:
- Has proper ARIA labels
- Is keyboard accessible
- Provides visual feedback on focus
- Maintains proper contrast ratios in both themes

## Performance

- Theme preference is loaded from localStorage immediately
- No flash of incorrect theme on page load
- Minimal JavaScript overhead
- CSS-based theme switching (no JavaScript re-rendering)

## Related Files

- `src/components/theme-provider.tsx` - Theme provider wrapper
- `src/components/theme-toggle.tsx` - Theme switcher component
- `src/app/layout.tsx` - Root layout with theme provider
- `src/components/layout/AppLayout.tsx` - Sidebar with theme toggle
- `src/app/globals.css` - Theme color definitions
