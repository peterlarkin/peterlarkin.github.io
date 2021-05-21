import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

function zigZag (trigger) {
  gsap.timeline({
    scrollTrigger: {
      trigger,
      start: 'top 75%',
      end: 'bottom 50%',
      // toggleActions: 'play none none reverse'
      scrub: true
    }
  })
    .to('.js-zag', { y: 0, x: 0, stagger: 0.2, duration: 0.2, delay: 0.5, ease: 'sine.inOut' })
    .add('end')
    .to('.js-zig-end', { width: '100%', duration: 0.3, ease: 'sine.Out' }, 'end')
    .to('.js-zig-label-1', { x: 0, opacity: 1, duration: 0.2, delay: 0.1, ease: 'sine.Out' }, 'end')
    .to('.js-zig-label-2', { x: 0, opacity: 1, duration: 0.2, delay: 0.2, ease: 'sine.Out' }, 'end')
    .to('.js-work-item', { y: 0, opacity: 1, duration: 0.25, stagger: 0.15, ease: 'sine.inOut' });
}

export default function () {
  const trigger = document.querySelector('#js-zig-zag');
  if (trigger) {
    zigZag(trigger);
  }
}
