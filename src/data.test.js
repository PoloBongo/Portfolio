// Cohérence des données du site : ce qui casse sans bruit quand on ajoute ou renomme un projet.
import fs from "fs";
import path from "path";
import { WORKS } from "./Pages/work";
import { SKILLS, projectsFor } from "./Component/skillsData";
import { CERTIFICATES } from "./Component/certificatesData";

const LANGS = ["fr", "en", "es"];
const locale = (lang) =>
  JSON.parse(fs.readFileSync(path.join(__dirname, "..", "public", "locales", lang, "translation.json"), "utf8"));
const get = (obj, dotted) => dotted.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);

describe("projets", () => {
  test("chaque projet a un slug unique", () => {
    const slugs = WORKS.map((w) => w.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  test.each(LANGS)("chaque projet a son accroche (Work.Tagline.<slug>) en %s", (lang) => {
    const dict = locale(lang);
    const missing = WORKS.filter((w) => !get(dict, `Work.Tagline.${w.slug}`)).map((w) => w.slug);
    expect(missing).toEqual([]);
  });
});

describe("compétences", () => {
  test("les projets cités dans `also` existent", () => {
    const slugs = new Set(WORKS.map((w) => w.slug));
    const unknown = SKILLS.flatMap((s) => (s.also || []).filter((id) => !slugs.has(id)));
    expect(unknown).toEqual([]);
  });

  test("les indices de certificats (`certs`) existent", () => {
    SKILLS.forEach((s) =>
      (s.certs || []).forEach((i) => {
        expect(CERTIFICATES[i]).toBeDefined();
      })
    );
  });

  test("une compétence n'est rattachée qu'à des projets qui la listent", () => {
    SKILLS.filter((s) => s.match && s.match.length).forEach((s) => {
      projectsFor(s, WORKS)
        .filter((w) => !(s.also || []).includes(w.slug) && !s.all)
        .forEach((w) => {
          const tags = String(w.tags || "").toLowerCase();
          expect(s.match.some((m) => tags.includes(m.toLowerCase()))).toBe(true);
        });
    });
  });
});

describe("certificats", () => {
  test("chacun a un lien de vérification, une date AAAA-MM et un sigle", () => {
    CERTIFICATES.forEach((c) => {
      expect(c.url).toMatch(/^https:\/\//);
      expect(c.date).toMatch(/^\d{4}-\d{2}$/);
      expect(c.abbr).toBeTruthy();
    });
  });
});
