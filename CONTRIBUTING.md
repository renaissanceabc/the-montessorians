# 🙌 Contributing to The Montessorians

Thanks for your interest in contributing to The Montessorians! This repository serves as the open source dataset for
[The Montessorians](https://themontessorians.xyz), a community-driven compilation of extraordinary Montessori alumni.

---

## ✍️ How to Contribute

1. **Fork this repo** and create a new branch.
2. Add or update a profile YAML file in the `/data/` directory.
3. If adding a new person, upload a headshot image to `/images/`, named using the person's slug (e.g. `yo-yo-ma.jpg`).
4. Open a Pull Request with a clear title and description of your change.

---

## 🧾 Profile Format

Each profile should follow this format:

```yaml
name: Full Name
slug: lowercase-hyphenated-name
tagline: A short description of the individual. (max 100 characters)
bio: >-
  A short paragraph describing the individual and their background. (max 1000 characters)
tags:
  - tech
  - founder
  - entrepreneur
education:
  - montessori
education_notes: >-
  Add brief notes about the person's Montessori experience and background
notableAchievements:
  - One-line achievement 1
  - One-line achievement 2
links:
  - type: wikipedia | website | linkedin | x | instagram | tiktok | article | youtube | imdb
    url: https:// ...
```

---

## ✅ Contribution Tips

- Keep bios concise and factual.
- Use respectful and inclusive language.

---

## 🖼 Image Guidelines

- Images should be square and ideally 800x800 in size.
- Images must use the `.jpg` format.
- Use publicly available portraits when possible.
- Only upload images you have permission to use or that are in the public domain.
- File name should match the `slug` and be placed in `/images/`.

---

## 📄 License

By contributing, you agree that your additions will be released under
[CC0](https://github.com/renaissanceabc/the-montessorians?tab=CC0-1.0-1-ov-file#readme).

---

Thank you for helping us grow the largest open source dataset of Montessori alumni! 🚀
