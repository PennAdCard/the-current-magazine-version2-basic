// SIMPLE MAGAZINE - HOME PAGE
// This file adds small interactive features for the long homepage articles.

// Create a reading progress bar at the very top of the page.
const progressBar = document.createElement("div");
progressBar.className = "reading-progress";
document.body.prepend(progressBar);

// Update the progress bar as the reader scrolls down the page.
window.addEventListener("scroll", function() {
  const pageHeight = document.documentElement.scrollHeight - window.innerHeight;
  const scrollAmount = window.scrollY;
  const progress = pageHeight > 0 ? (scrollAmount / pageHeight) * 100 : 0;

  progressBar.style.width = progress + "%";
});

// Let readers collapse or expand each long article.
const articleButtons = document.querySelectorAll(".article-toggle");

articleButtons.forEach(function(button) {
  button.addEventListener("click", function() {
    const article = button.closest("[data-article]");
    article.classList.toggle("is-collapsed");

    if (article.classList.contains("is-collapsed")) {
      button.textContent = "Expand Article";
    } else {
      button.textContent = "Collapse Article";
    }
  });
});
