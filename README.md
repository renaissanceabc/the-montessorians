# 🧠 The Montessorians

This is the **open-source dataset** of remarkable individuals who were educated through the Montessori method — a
pioneering approach that nurtures independence, creativity, and lifelong learning.

It powers [The Montessorians](https://themontessorians.xyz), a public showcase of extraordinary Montessori alumni,
created and maintained by [Renaissance](https://renaissance.education).

---

## ✨ What's in this repo?

- Structured YAML files under `/data` — one for each person
- Associated profile images under `/images`
- Transparent contribution history, curated by the community

Each profile includes:

- Name, slug, tagline, and bio
- Education type(s) and notes (e.g., Montessori, homeschool)
- Tags and achievements
- Source links (e.g. Wikipedia, interviews)

---

## 📁 Project Structure

---

## 📁 Project Structure

```
/data/
- bill-gates.yaml
- yo-yo-ma.yaml
- ...
/images/
- yo-yo-ma.jpg
- bill-gates.jpg
- ...
README.md
CONTRIBUTING.md
```

---

## ✅ Adding or Editing a Profile

We welcome contributions from the community! To add or update a profile:

1. **Fork this repo**
2. Add a new `.yaml` file to `/data/` (see the [example below](#example-profile))
3. Add a profile image (`.jpg` or `.png`) to `/images/`, using the same `slug` as the filename
4. Open a Pull Request

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for guidelines and required fields.

---

## 🧾 Example Profile

```yaml
name: Yo-Yo Ma
slug: yo-yo-ma
tagline: World-renowned cellist and cultural ambassador
tags:
  - musician
  - artist
  - montessori
bio: >-
  Yo-Yo Ma is an internationally acclaimed cellist celebrated for his musical mastery and cross-cultural collaborations.
  He has won multiple Grammy Awards and is known for his humanistic approach to the arts.
education:
  - type: montessori
    notes: Attended a Montessori preschool in Paris, which nurtured his early artistic expression and discipline.
notableAchievements:
  - 19-time Grammy Award winner
  - Founder of the Silkroad Ensemble
  - Recipient of the Presidential Medal of Freedom
quotes:
  - "Montessori helped me learn how to learn. That mindset shaped my music and my mission."
links:
  - type: wikipedia
    url: https://en.wikipedia.org/wiki/Yo-Yo_Ma
  - type: website
    url: https://www.yo-yoma.com/
```

---

## 📬 Submit a Suggestion

Know someone who should be featured? Open an issue or fill out the submission form at
renaissance.education/polymaths-submit (coming soon).

---

## 💡 License

Data in this repository is open under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Images must be properly
attributed and are subject to their own usage rights.

---

## 🛠 Maintained by

[Renaissance](https://renaissance.education) – Building tools and stories to rethink education from first principles.
