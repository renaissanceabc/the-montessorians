# The Montessorians

[The Montessorians](https://themontessorians.xyz) is the world's largest open source dataset of Montessori alumni who've
gone on to do great things.

Created and maintained by [Renaissance](https://renaissance.education), an education startup studio, Montessorians is
fully community-driven and open for contributions under a Creative Commons CC0 license.

---

## Repo Structure

- Structured YAML files under `/data` — one for each person
- Associated profile images under `/images`
- Transparent contribution history, curated by the community

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

## Contributing

We welcome contributions from the community! To add or update a profile:

1. **Fork this repo**
2. Add a new `.yaml` file to `/data/` (see the [example below](#example-profile))
3. Add a profile image (`.jpg` or `.png`) to `/images/`, using the same `slug` as the filename
4. Open a Pull Request

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for more guidelines.

---

### Example Profile

```yaml
name: Yo-Yo Ma
slug: yo-yo-ma
tagline: World-renowned cellist, United Nations Peace Ambassador, and winner of 19 Grammy Awards
bio: >-
  Yo-Yo Ma is an acclaimed American cellist known for his extraordinary technique and deep musicality. A cultural
  ambassador and humanitarian, he has performed around the world and founded the Silk Road Ensemble to foster
  cross-cultural collaboration through music.
tags:
  - musician
  - cellist
  - performer
  - cultural-ambassador
education:
  - montessori
education_notes: >-
  Yo-Yo Ma attended a Montessori school as a young child, where his artistic sensibilities and self-motivation were
  nurtured through exploration.
notable_achievements:
  - 19-time Grammy Award winner
  - Founder of the Silk Road Ensemble
  - Presidential Medal of Freedom recipient
links:
  - type: wikipedia
    url: https://en.wikipedia.org/wiki/Yo-Yo_Ma
```

---

### Submit a Suggestion

Know someone who should be featured? Submit a pull request or open an issue.

---

### License

By contributing, you agree that your additions will be released under
[CC0](https://github.com/renaissanceabc/the-montessorians?tab=CC0-1.0-1-ov-file#readme).
