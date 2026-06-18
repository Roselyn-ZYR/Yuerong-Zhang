const header = document.querySelector(".site-header");
const revealTargets = document.querySelectorAll(".work-item, .research-list article");
const sideLinks = [...document.querySelectorAll(".side-index a")];
const sections = sideLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

let previousScrollY = window.scrollY;

const updateHeader = () => {
  const currentScrollY = window.scrollY;
  const scrollingDown = currentScrollY > previousScrollY;
  header.classList.toggle("is-hidden", scrollingDown && currentScrollY > 90);
  previousScrollY = Math.max(currentScrollY, 0);
};

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.14 }
);

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      sideLinks.forEach((link) => {
        link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`);
      });
    });
  },
  { rootMargin: "-42% 0px -46% 0px" }
);

revealTargets.forEach((target) => revealObserver.observe(target));
sections.forEach((section) => sectionObserver.observe(section));
window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();
