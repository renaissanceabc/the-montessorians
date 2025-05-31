# 🙌 Contributing to Polymaths Data

Thanks for your interest in contributing to the Polymaths project! This repo serves as the open data source for [The Polymaths](https://example.com), a curated showcase of extraordinary people who pursued alternative education paths like homeschooling, Montessori, and self-directed learning.

---

## ✍️ How to Contribute

1. **Fork this repo** and create a new branch.
2. Add or update a profile YAML file in the `/data/` directory.
3. If adding a new person, upload a headshot image to `/images/`, named using the person's slug (e.g. `ada-lovelace.jpg`).
4. Open a Pull Request with a clear title and description of your change.

---

## 🧾 YAML Profile Format

Each profile should follow this format:

```yaml
name: Full Name
slug: lowercase-hyphenated-name
tags:
  - homeschool
  - entrepreneur
bio: >-
  A short paragraph describing the individual and their background.
education:
  - type: homeschool | montessori | unschool | other
    notes: Optional extra detail about how they were educated
notableAchievements:
  - One-line achievement 1
  - One-line achievement 2
links:
  wikipedia: https://...
  website: https://... (optional)
image: slug.jpg
```

---

## ✅ Contribution Tips

- Keep bios concise and factual.
- Use respectful and inclusive language.
- If citing notable achievements, link to credible sources when possible.
- Please avoid speculative or unverifiable claims.

---

## 🖼 Image Guidelines

- Images should be square or nearly square (e.g., 600x600).
- Use publicly available portraits when possible.
- Only upload images you have permission to use or that are in the public domain.
- File name should match the `slug` and be placed in `/images/`.

---

## 📄 License

By contributing, you agree that your additions will be released under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). You retain attribution for your contributions.

---

Thank you for helping us build a world-class directory of alternative-educated changemakers! 🚀
