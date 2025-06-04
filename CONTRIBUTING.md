# 🙌 Contributing to The Montessorians

This repository serves as the open source dataset for [The Montessorians](https://themontessorians.xyz), a
community-driven compilation of extraordinary Montessori alumni.

Thank you for contributing to The Montessorians!

---

## ✍️ How to Contribute

To add or update a profile, you have two options:

1. [Submit a new profile request](https://github.com/renaissanceabc/the-montessorians/issues/new?template=01_profile_request.md)
2. [Submit a pull request by forking this repo](https://github.com/renaissanceabc/the-montessorians/fork) (slightly more
   advanced)

### Via Code (Advanced)

1. Fork this repo
2. Run `pnpm i` and install dependencies
3. Add a new `.yaml` file to the `/data` folder (see the [example below](#example-profile))
4. Add a profile image (`.jpg`) to `/images`, using the same `slug` as the filename from step #3
5. Run `pnpm lint` and confirm that the commands are successful prior to opening up a pull request
6. Submit a pull request with your updates

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
education:
  - montessori
education_notes: >-
  Add brief notes about the person's Montessori experience and background
notable_achievements:
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

- Images should be square (1:1 aspect ratio) and ideally 800x800 in size.
- Images must use the `.jpg` format.
- Use publicly available portraits when possible.
- Only upload images you have permission to use or that are in the public domain.
- File name should match the profile's `slug` (lowercase, hyphenated name) and be placed in the `/images` folder.

---

## 📄 License

By contributing, you agree that your additions will be released under
[CC0](https://github.com/renaissanceabc/the-montessorians?tab=CC0-1.0-1-ov-file#readme).
