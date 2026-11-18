# Editing the portfolio

The site is static: `npm run build` turns `content/content.json` and the images in
`public/uploads/` into plain HTML in `out/`, and GitHub Pages serves that folder at
https://ilhamnadhif.github.io.

## Change the content

1. Edit `content/content.json`. Every text has an English (`en`) and Indonesian (`id`)
   version; when one is empty, the other is shown.
2. Put new images in `public/uploads/` (lowercase names, `png`, `jpg`, `webp`, `svg` or `pdf`)
   and refer to them as `/uploads/<name>`. Screenshots look best as 1600px-wide WebP.
3. Check it locally with `npm run dev` (http://localhost:3000), or `npm run build` for
   exactly what will be published.
4. Commit and push to `main`.

Texts support blank lines between paragraphs, lists of lines that start with `- `,
`**bold**` and `[label](https://...)` links. The first screenshot of a project is its cover.
A project's page lives at `/en/projects/<slug>/` (the `id` when `slug` is empty).

The build validates the file (`lib/content/schema.ts`): a typo such as a missing field or a
wrong image path fails the build and nothing is published.

## Publishing

`.github/workflows/ci.yml` lints and builds every push and pull request. On `main` it then
pushes `out/` to the `main` branch of
[ilhamnadhif/ilhamnadhif.github.io](https://github.com/ilhamnadhif/ilhamnadhif.github.io),
which GitHub Pages serves, and waits until the new page is live.

It pushes with a deploy key: the public half is a deploy key with write access on
`ilhamnadhif.github.io` (Settings → Deploy keys), the private half is the
`PAGES_DEPLOY_KEY` secret of this repository. To replace it:

```sh
ssh-keygen -t ed25519 -N "" -C "portfolio pages deploy" -f pages_deploy
gh repo deploy-key add pages_deploy.pub --repo ilhamnadhif/ilhamnadhif.github.io --allow-write --title "portfolio publish (ilhamnadhif/ilhamnadhif CI)"
gh secret set PAGES_DEPLOY_KEY --repo ilhamnadhif/ilhamnadhif < pages_deploy
rm pages_deploy pages_deploy.pub
```

then delete the old key under Deploy keys.
