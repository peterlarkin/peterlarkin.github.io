// import debounce from 'lodash.debounce';

function setHeightUnit() {
  let vh = window.innerHeight;
  // Set the value of window height in the --vh custom property to the root of the document
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

export default function() {
  setHeightUnit();
  // FIXME: Disabling this as it runs when you scroll on iOS
  // window.addEventListener('resize', debounce(setHeightUnit, 300));
}
