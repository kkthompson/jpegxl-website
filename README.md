# JPEG XL Community Website

Source for the JPEG XL community website at [jpegxl.info](https://jpegxl.info).
The site is built with [Astro](https://astro.build/) and published as static files.

## Development

Use Node.js 22 or newer.

```bash
npm ci
npm run dev
```

The development server prints its local URL after startup.

## Validation

```bash
npm run check
npm run build
npm run preview
```

The production build is written to `dist/`. GitHub Actions runs the type/content
checks and production build for every pull request and every push to `main`.

## Project structure

- `src/pages/` contains route entry points.
- `src/components/` contains shared UI components.
- `src/content/` contains structured editorial content.
- `src/styles/` contains site styles.
- `public/` contains assets copied directly into the static build.

## Deployment

The Pages workflow is intentionally manual until the `jpegxl.info` custom-domain
cutover is configured in the new repository. Once the cutover is complete, the
workflow can be changed to deploy automatically after successful pushes to `main`.

## License

The project is available under the [Creative Commons Attribution 4.0
International License](LICENSE). Third-party assets retain their respective
licenses and attribution requirements.
