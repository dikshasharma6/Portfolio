# Diksha Sharma — portfolio

Static site. No build step, no dependencies. Open `index.html` or serve the folder.

    python3 -m http.server 8000

## Structure

    portfolio/
    ├── index.html
    ├── css/style.css
    ├── js/script.js
    ├── README.md
    └── assets/
        ├── docs/
        │   ├── Diksha-Sharma-Resume.pdf              (from OffCampus_Resume)
        │   └── MARS-College-Starter-Kit-Deck.pdf     (10-slide deck)
        └── img/
            ├── resume-preview.jpg
            ├── mars/slide-01..10.jpg, ideation-01..02.jpg
            └── haldiram/page-01..05.jpg

## Two things you must do before publishing

1. **Add a profile photo.** Save a square-ish portrait as `assets/img/profile.jpg`
   (recommended 800×1000, under 300 KB). Until then the hero shows a "DS" monogram
   — the fallback is automatic, no code change needed.

2. **Wire the contact form.** It validates in the browser, then opens the visitor's
   mail client via `mailto:`. That silently fails for anyone without a desktop mail
   client configured. To capture submissions properly, create a form endpoint
   (Formspree, Basin, Netlify Forms) and replace the `window.location.href = 'mailto:...'`
   block in `js/script.js` §8 with a `fetch()` POST.

## Nice to have

- The résumé PDF was rebuilt from page images at ~112 DPI. Replace
  `assets/docs/Diksha-Sharma-Resume.pdf` with your original export before sending it
  to recruiters — text will be selectable and ATS-parseable.
- Update the `<link rel="canonical">` and `og:image` in `index.html` once you know
  the live URL.

## Deploy

GitHub Pages: push this folder to a repo named `dkshaSharma.github.io`, then
Settings → Pages → deploy from `main` / root.
