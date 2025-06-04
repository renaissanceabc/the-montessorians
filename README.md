# The Montessorians

[The Montessorians](https://themontessorians.xyz) is the world's largest open source dataset of Montessori alumni who've
gone on to do great things.

The Montessorians is fully community-driven and open for contributions under a Creative Commons CC0 license.

Created and maintained by [Renaissance](https://renaissance.education), an education startup studio.

---

## Structure

- Structured YAML files under `/data` — one for each person
- Associated profile images under `/images`

```
/data/
  - yo-yo-ma.yaml
  - ...
/images/
  - yo-yo-ma.jpg
  - ...
```

---

## Contributing

We welcome contributions from the community! To add or update a profile, you have two options:

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

---

## Contributors

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="12.5%"><a href="https://github.com/karelvuong"><img src="https://avatars.githubusercontent.com/u/95452264?v=4?s=100" width="100px;" alt="Karel Vuong"/><br /><sub><b>Karel Vuong</b></sub></a><br /><a href="#data-karelvuong" title="Profile contributions">📝</a></td>
      <td align="center" valign="top" width="12.5%"><a href="https://github.com/samjvuong"><img src="https://avatars.githubusercontent.com/u/89951683?v=4?s=100" width="100px;" alt="Sam Vuong"/><br /><sub><b>Sam Vuong</b></sub></a><br /><a href="#data-samjvuong" title="Profile contributions">📝</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->
<!-- ALL-CONTRIBUTORS-LIST:END -->
