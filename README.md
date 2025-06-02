# 🧠 The Montessorians

This is the **open-source dataset** of remarkable individuals who were educated through the Montessori method, an alternative pathway to education.

It powers [The Montessorians](https://themontessorians.xyz), a public showcase of extraordinary alternative-educated people,
created and maintained by [Renaissance](https://renaissance.education).

---

## ✨ What's in this repo?

- Structured data files in YAML format under `/data`
- Public images used in profile pages
- Contribution history and curation by the community

Each profile contains:

- Name, slug, and image
- Bio and summary
- Type of education (e.g., Montessori, homeschool)
- Notable accomplishments
- Source links (Wikipedia, interviews, websites)

---

## 📁 Project Structure

```
/data/
ada-lovelace.yaml
elon-musk.yaml
/images/
ada-lovelace.jpg
elon-musk.jpg
README.md
CONTRIBUTING.md
```

---

## ✅ Adding or Editing a Profile

We welcome contributions from the community! You can:

1. **Fork this repo**
2. Add a new `.yaml` file in `/data/` (see the [example below](#example-profile))
3. Add a square-ish image (JPG/PNG) to `/images/`, named as `slug.jpg`
4. Open a Pull Request

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for detailed rules and field definitions.

---

## 🧾 Example Profile

```yaml
name: Ada Lovelace
slug: ada-lovelace
tags:
  - autodidact
  - early computing
bio: >-
  Ada Lovelace was a 19th-century mathematician who is often regarded as the first computer programmer.
education:
  - type: homeschool
    notes: Taught by private tutors with a strong emphasis on mathematics
notableAchievements:
  - Published the first algorithm intended for a computing machine
  - Anticipated many elements of modern computing
links:
  wikipedia: https://en.wikipedia.org/wiki/Ada_Lovelace
  biography: https://www.biography.com/scientists/ada-lovelace
```

---

## 📬 Submit a Suggestion

Know someone who should be featured? Open an issue or fill out the submission form at
renaissance.education/polymaths-submit (coming soon).

---

## 💡 License

Data in this repository is open under CC BY 4.0. Images must be properly attributed and are subject to their own usage
rights.

---

## 🛠 Maintained by

Renaissance – Building tools and stories to rethink education from first principles.
