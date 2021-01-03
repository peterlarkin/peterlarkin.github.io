const fs = require('fs');
const path = require('path');
const { outdent } = require('outdent');
const Image = require('@11ty/eleventy-img');
const markdown = require('./markdown');

const iconDefaultSize = 24;
const defaultSizes = '100vw';
const defaultImagesSizes = [1920, 1280, 640, 320];

const isFullUrl = (url) => {
  try {
    return !!new URL(url);
  } catch {
    return false;
  }
};

const manifestPath = path.resolve(__dirname, '../_site/assets/manifest.json');

module.exports = {
  // Allow embedding markdown in `.njk` files
  // {% markdown %}
  // # Heading
  // {% endmarkdown %}
  markdown: (content) => markdown.render(outdent.string(content)),

  // Allow embedding webpack assets pulled out from `manifest.json`
  // {% webpack "main.css" %}
  webpack: async (name) =>
    new Promise((resolve) => {
      fs.readFile(manifestPath, { encoding: 'utf8' }, (err, data) =>
        resolve(err ? `/assets/${name}` : JSON.parse(data)[name])
      );
    }),

  // Allow embedding responsive images
  // {% image "image.jpeg", "Image alt", "Image title", "my-class" %}
  // {% image [100,100], "image.jpeg", "Image alt", "Image title", "my-class" %}
  image: async (...args) => {
    const src = args[0];
    const alt = args[1];
    const className = args[2];
    const lazy = args[3] || true;
    const sizes = args[4] || defaultSizes;

    const extension = path.extname(src).slice(1).toLowerCase();
    const fullSrc = isFullUrl(src) ? src : `./src/assets/images/${src}`;

    let stats;
    try {
      stats = await Image(fullSrc, {
        widths: defaultImagesSizes,
        formats: extension === 'webp' ? ['webp', 'jpeg'] : ['webp', extension],
        urlPath: '/assets/images/',
        outputDir: '_site/assets/images/'
      });
    } catch (e) {
      console.log('\n\x1b[31mERROR\x1b[0m creating image:');
      console.log(`> (${fullSrc})`);
      console.log(`  ${e}\n`);
      return '';
    }

    const fallback = stats[extension].reverse()[0];
    const picture = outdent({ newline: '' })`
    <div class="img${className ? ` img--${className}` : ''}">
      <picture>
        ${Object.values(stats)
          .map(
            (image) =>
              `<source type="image/${image[0].format}" srcset="${image
                .map((entry) => `${entry.url} ${entry.width}w`)
                .join(', ')}" sizes="${sizes}">`
          )
          .join('')}
        <img
          loading="${lazy ? 'lazy' : 'eager'}"
          src="${fallback.url}"
          width="${fallback.width}"
          height="${fallback.height}"
          alt="${alt}">
      </picture>
    </div>`;
    return picture;
  }
};
