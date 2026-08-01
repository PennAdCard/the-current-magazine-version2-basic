// SIMPLE MAGAZINE - VERSION 2
// This file/code controls the article form and article table.

// The name used to save our information in the browser.
const storageName = "simpleMagazineArticles";

// Get the HTML elements that JavaScript needs to use.
const contentForm = document.getElementById("contentForm");
const articleId = document.getElementById("articleId");
const articleCode = document.getElementById("articleCode");
const articleTitle = document.getElementById("articleTitle");
const articleCategory = document.getElementById("articleCategory");
const articleFormat = document.getElementById("articleFormat");
const articlePrice = document.getElementById("articlePrice");
const articleWordCount = document.getElementById("articleWordCount");
const articleTableBody = document.getElementById("articleTableBody");
const tableContainer = document.getElementById("tableContainer");
const noArticlesMessage = document.getElementById("noArticlesMessage");
const jsonDisplay = document.getElementById("jsonDisplay");
const formHeading = document.getElementById("formHeading");
const saveButton = document.getElementById("saveButton");
const cancelButton = document.getElementById("cancelButton");
const messageBox = document.getElementById("messageBox");
const searchInput = document.getElementById("searchInput");

// Start with an empty article list.
let articles = [];

// Look for previously saved JSON data in the browser.
const savedArticleData = localStorage.getItem(storageName);

if (savedArticleData !== null) {
  // JSON.parse changes JSON text back into a JavaScript array.
  // The try/catch keeps the page working even if old saved data is damaged.
  try {
    const parsedArticles = JSON.parse(savedArticleData);

    if (Array.isArray(parsedArticles)) {
      articles = parsedArticles;
    }
  } catch (error) {
    articles = [];
  }
}

// Save the article array as JSON text in the browser.
function saveArticles() {
  const jsonText = JSON.stringify(articles);
  localStorage.setItem(storageName, jsonText);
}

// Show a message at the top of the page.
function showMessage(message, color) {
  messageBox.textContent = message;
  messageBox.className = "alert alert-" + color;
}

// Clear the form and return it to Add Article mode.
function clearForm() {
  contentForm.reset();
  contentForm.classList.remove("was-validated");
  articleId.value = "";
  formHeading.textContent = "Add an Article";
  saveButton.textContent = "Add Article";
  cancelButton.classList.add("d-none");
}

// Display articles in the table, filtered by search text.
function displayArticles(searchText) {
  // Remove the old table rows.
  articleTableBody.innerHTML = "";

  const search = searchText.toLowerCase().trim();

  const matchingArticles = articles.filter(function(article) {
    return article.title.toLowerCase().includes(search) ||
      article.category.toLowerCase().includes(search) ||
      article.articleCode.toLowerCase().includes(search) ||
      article.format.toLowerCase().includes(search);
  });

  // Build one table row for each matching article.
  matchingArticles.forEach(function(article) {
    const row = document.createElement("tr");

    const codeCell = document.createElement("td");
    codeCell.textContent = article.articleCode;

    const titleCell = document.createElement("td");
    const titleText = document.createElement("strong");
    titleText.textContent = article.title;
    const categoryText = document.createElement("div");
    categoryText.className = "member-contact";
    categoryText.textContent = article.category;
    titleCell.appendChild(titleText);
    titleCell.appendChild(categoryText);

    const formatCell = document.createElement("td");
    formatCell.textContent = article.format;

    const priceCell = document.createElement("td");
    priceCell.textContent = article.price === 0 ? "Free" : "$" + article.price.toFixed(2);

    const actionsCell = document.createElement("td");
    actionsCell.className = "action-buttons";

    const editButton = document.createElement("button");
    editButton.textContent = "Edit";
    editButton.className = "btn btn-sm btn-warning";
    editButton.addEventListener("click", function() {
      editArticle(article.id);
    });

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.className = "btn btn-sm btn-danger";
    deleteButton.addEventListener("click", function() {
      deleteArticle(article.id);
    });

    actionsCell.appendChild(editButton);
    actionsCell.appendChild(deleteButton);

    row.appendChild(codeCell);
    row.appendChild(titleCell);
    row.appendChild(formatCell);
    row.appendChild(priceCell);
    row.appendChild(actionsCell);
    articleTableBody.appendChild(row);
  });

  // Show or hide the table depending on whether matches exist.
  if (matchingArticles.length === 0) {
    tableContainer.classList.add("d-none");
    noArticlesMessage.classList.remove("d-none");

    if (articles.length > 0) {
      noArticlesMessage.textContent = "No articles match your search.";
    } else {
      noArticlesMessage.textContent = "No articles have been added yet.";
    }
  } else {
    tableContainer.classList.remove("d-none");
    noArticlesMessage.classList.add("d-none");
  }

  // JSON.stringify with null and 2 makes the JSON easier to read.
  jsonDisplay.textContent = JSON.stringify(articles, null, 2);
}

// Run this function when the user submits the form.
contentForm.addEventListener("submit", function(event) {
  // Prevent the browser from refreshing the page.
  event.preventDefault();

  // Show Bootstrap validation messages if the form is invalid.
  if (contentForm.checkValidity() === false) {
    contentForm.classList.add("was-validated");
    return;
  }

  // Create an article object from the form values.
  const article = {
    id: articleId.value === "" ? Date.now() : Number(articleId.value),
    articleCode: articleCode.value.trim(),
    title: articleTitle.value.trim(),
    category: articleCategory.value,
    format: articleFormat.value,
    price: parseFloat(articlePrice.value),
    wordCount: articleWordCount.value !== "" ? parseInt(articleWordCount.value) : null
  };

  if (articleId.value === "") {
    // Add the new object to the array.
    articles.push(article);
    showMessage("The article was added successfully.", "success");
  } else {
    // Find and replace the article being edited.
    const articlePosition = articles.findIndex(function(item) {
      return item.id === article.id;
    });
    articles[articlePosition] = article;
    showMessage("The article was updated successfully.", "success");
  }

  saveArticles();
  displayArticles(searchInput.value);
  clearForm();
});

// Put one article's information back into the form for editing.
function editArticle(id) {
  const article = articles.find(function(item) {
    return item.id === id;
  });

  articleId.value = article.id;
  articleCode.value = article.articleCode;
  articleTitle.value = article.title;
  articleCategory.value = article.category;
  articleFormat.value = article.format;
  articlePrice.value = article.price;
  articleWordCount.value = article.wordCount !== null ? article.wordCount : "";

  formHeading.textContent = "Update Article";
  saveButton.textContent = "Save Changes";
  cancelButton.classList.remove("d-none");
  window.scrollTo(0, 0);
}

// Remove one article after asking for confirmation.
function deleteArticle(id) {
  const answer = confirm("Are you sure you want to delete this article?");

  if (answer === true) {
    articles = articles.filter(function(article) {
      return article.id !== id;
    });

    saveArticles();
    displayArticles(searchInput.value);
    clearForm();
    showMessage("The article was deleted.", "warning");
  }
}

// Cancel an update and return the form to Add mode.
cancelButton.addEventListener("click", function() {
  clearForm();
});

// Update the visible table as the user types in the search box.
// This uses plain JavaScript, just like the Members page.
searchInput.addEventListener("input", function() {
  displayArticles(searchInput.value);
});

// Display any saved articles when the page first opens.
displayArticles("");
