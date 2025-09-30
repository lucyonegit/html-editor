# HTML Visual Editor

A visual HTML editor built with React that supports editing DOM elements and iframe content with hover highlighting and click-to-edit functionality.

## Features

- **Core Editor Library** (`lib/`)
  - HTMLEditor: Core editor with hover highlighting and focus selection
  - StyleManager: Manages font, margin, padding, background, color, and border styles
  - EventManager: Handles events for both regular DOM and iframe elements

- **React Hooks** (`hooks/`)
  - `useDirectMode`: Edit DOM elements via React ref or iframe content directly
  - `useInjectMode`: Inject editor into iframe for editing internal elements

- **Components** (`components/`)
  - Tooltip: Contextual toolbar with editing options
    - Text elements: Font size, background color, text color, bold, italic, underline, delete
    - Block elements: Background color, border radius, border, margin, delete
    - Image elements: Reserved API design

- **Test Pages** (`pages/`)
  - `react-dom.tsx`: React ref DOM editing example
  - `iframe.tsx`: Iframe content editing example

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

The app will open at http://localhost:3000

## Usage

### React DOM Mode
Navigate to the home page to see React ref-based editing. Hover over elements to highlight them, click to select and edit.

### Iframe Mode
Navigate to `/iframe` to see iframe injection-based editing. The editor is injected into the iframe allowing you to edit elements inside.

## Project Structure

```
doc-editor/
├── src/
│   ├── lib/              # Core editor library
│   │   ├── index.ts      # HTMLEditor class
│   │   ├── types.d.ts    # TypeScript definitions
│   │   └── core/
│   │       ├── eventManager/
│   │       └── styleManager/
│   ├── hooks/            # React hooks
│   │   ├── useDirectMode.ts
│   │   └── useInjectMode.ts
│   ├── components/       # React components
│   │   └── tooltip.tsx
│   ├── pages/            # Test pages
│   │   ├── react-dom.tsx
│   │   └── iframe.tsx
│   ├── styles/           # Global styles
│   │   └── global.css
│   └── index.tsx         # App entry point
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Build

```bash
npm run build
```

## Style Configuration API

The editor provides a comprehensive style configuration API to customize hover, focus, and badge styles.

### Basic Usage

```typescript
import HTMLEditor from './lib/index';

const editor = new HTMLEditor({
  container: '#editor',
  styleConfig: {
    hover: {
      outline: '2px dashed #4dabf7',
      cursor: 'pointer'
    },
    selected: {
      outline: '2px solid #228be6'
    },
    badge: {
      enabled: true,
      position: 'top-left',
      background: '#228be6',
      color: 'white'
    }
  }
});
```

### React Hooks Usage

```typescript
import { useDirectMode } from './hooks/useDirectMode';

const { editor, selectedElement, position } = useDirectMode(containerRef, {
  styleConfig: {
    badge: {
      position: 'top-right',
      background: '#ff6b6b'
    }
  }
});
```

For detailed style configuration options, see [STYLE_API.md](./STYLE_API.md).

## Technologies

- React 18
- TypeScript
- Vite
- React Router