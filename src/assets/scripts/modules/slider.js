import Glide, { Controls, Breakpoints } from '@glidejs/glide/dist/glide.modular.esm';

export default function () {
  if (document.querySelectorAll('.glide').length) {
    new Glide('.glide', {
      type: 'carousel'
    }).mount({ Controls, Breakpoints });
  }
}
