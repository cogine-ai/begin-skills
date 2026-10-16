# Folio / The hush vessel

An original, self-contained two-page object annotation desk. The artwork, maker, and small exhibition are fictional.

## Run locally

From this `site/` directory:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open `http://127.0.0.1:8000/`. Stop the foreground server with Ctrl+C. This static website has no installation or runtime dependencies. Its working copy is local to this browser and address. JavaScript enables annotation and export.

The desk contains three editable sample notes. `guide.html` explains every interaction and its storage/export limits. Export produces one offline HTML reading record; it cannot be imported as a workspace.

Font sources and complete licenses are included in `FONT_SOURCES.json`, `NOTICES.md`, and `fonts/`. The exported record uses built-in browser fonts.
