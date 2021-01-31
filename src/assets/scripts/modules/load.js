import gsap from 'gsap';

function loadAnimation() {
  console.log('Loaded');
}

export default function() {
  window.addEventListener('load', loadAnimation);
}
