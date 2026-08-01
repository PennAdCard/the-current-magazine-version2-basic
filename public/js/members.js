// SIMPLE MAGAZINE - VERSION 2
// This file controls the member form and member table.

// This is the name used to save our information in the browser.
const storageName = "simpleMagazineMembers";

// Get the HTML elements that JavaScript needs to use.
const memberForm = document.getElementById("memberForm");
const memberId = document.getElementById("memberId");
const fullName = document.getElementById("fullName");
const email = document.getElementById("email");
const phone = document.getElementById("phone");
const ageGrade = document.getElementById("ageGrade");
const address = document.getElementById("address");
const memberTableBody = document.getElementById("memberTableBody");
const tableContainer = document.getElementById("tableContainer");
const noMembersMessage = document.getElementById("noMembersMessage");
const jsonDisplay = document.getElementById("jsonDisplay");
const formHeading = document.getElementById("formHeading");
const saveButton = document.getElementById("saveButton");
const cancelButton = document.getElementById("cancelButton");
const messageBox = document.getElementById("messageBox");
const searchInput = document.getElementById("searchInput");

// Start with an empty member list.
let members = [];

// Look for previously saved JSON data in the browser.
const savedMemberData = localStorage.getItem(storageName);

if (savedMemberData !== null) {
  // JSON.parse changes JSON text back into a JavaScript array.
  members = JSON.parse(savedMemberData);
}

// Save the member array as JSON text.
function saveMembers() {
  const jsonText = JSON.stringify(members);
  localStorage.setItem(storageName, jsonText);
}

// Show a message at the top of the page.
function showMessage(message, color) {
  messageBox.textContent = message;
  messageBox.className = "alert alert-" + color;
}

// Clear the form and return it to Add Member mode.
function clearForm() {
  memberForm.reset();
  memberForm.classList.remove("was-validated");
  memberId.value = "";
  formHeading.textContent = "Add a Member";
  saveButton.textContent = "Add Member";
  cancelButton.classList.add("d-none");
}

// Display the member list in the table.
function displayMembers(searchText) {
  // First, remove the old table rows.
  memberTableBody.innerHTML = "";

  const search = searchText.toLowerCase();

  // Create a smaller list containing only matching members.
  const matchingMembers = members.filter(function(member) {
    return member.fullName.toLowerCase().includes(search) ||
      member.email.toLowerCase().includes(search) ||
      member.address.toLowerCase().includes(search);
  });

  // Create one table row for each matching member.
  matchingMembers.forEach(function(member) {
    const row = document.createElement("tr");

    const contactCell = document.createElement("td");
    const nameText = document.createElement("strong");
    nameText.textContent = member.fullName;
    const contactText = document.createElement("div");
    contactText.className = "member-contact";
    contactText.textContent = member.email;
    if (member.phone !== "") {
      contactText.textContent += " | " + member.phone;
    }
    contactCell.appendChild(nameText);
    contactCell.appendChild(contactText);

    const ageCell = document.createElement("td");
    ageCell.textContent = member.ageGrade;

    const addressCell = document.createElement("td");
    addressCell.textContent = member.address;

    const actionsCell = document.createElement("td");
    actionsCell.className = "action-buttons";

    const editButton = document.createElement("button");
    editButton.textContent = "Edit";
    editButton.className = "btn btn-sm btn-warning";
    editButton.addEventListener("click", function() {
      editMember(member.id);
    });

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.className = "btn btn-sm btn-danger";
    deleteButton.addEventListener("click", function() {
      deleteMember(member.id);
    });

    actionsCell.appendChild(editButton);
    actionsCell.appendChild(deleteButton);

    row.appendChild(contactCell);
    row.appendChild(ageCell);
    row.appendChild(addressCell);
    row.appendChild(actionsCell);
    memberTableBody.appendChild(row);
  });

  // Show or hide the table depending on whether matches exist.
  if (matchingMembers.length === 0) {
    tableContainer.classList.add("d-none");
    noMembersMessage.classList.remove("d-none");

    if (members.length > 0) {
      noMembersMessage.textContent = "No members match your search.";
    } else {
      noMembersMessage.textContent = "No members have been added yet.";
    }
  } else {
    tableContainer.classList.remove("d-none");
    noMembersMessage.classList.add("d-none");
  }

  // JSON.stringify with null and 2 makes the JSON easier to read.
  jsonDisplay.textContent = JSON.stringify(members, null, 2);
}

// Run this function when the form is submitted.
memberForm.addEventListener("submit", function(event) {
  // Prevent the browser from refreshing the page.
  event.preventDefault();

  // Show Bootstrap validation messages if the form is invalid.
  if (memberForm.checkValidity() === false) {
    memberForm.classList.add("was-validated");
    return;
  }

  // Create a member object from the form values.
  const member = {
    id: memberId.value === "" ? Date.now() : Number(memberId.value),
    fullName: fullName.value.trim(),
    email: email.value.trim(),
    phone: phone.value.trim(),
    ageGrade: ageGrade.value.trim(),
    address: address.value.trim()
  };

  if (memberId.value === "") {
    // Add the new object to the array.
    members.push(member);
    showMessage("The member was added successfully.", "success");
  } else {
    // Find and replace the member being edited.
    const memberPosition = members.findIndex(function(item) {
      return item.id === member.id;
    });
    members[memberPosition] = member;
    showMessage("The member was updated successfully.", "success");
  }

  saveMembers();
  displayMembers(searchInput.value);
  clearForm();
});

// Put one member's information back into the form.
function editMember(id) {
  const member = members.find(function(item) {
    return item.id === id;
  });

  memberId.value = member.id;
  fullName.value = member.fullName;
  email.value = member.email;
  phone.value = member.phone;
  ageGrade.value = member.ageGrade;
  address.value = member.address;

  formHeading.textContent = "Update Member";
  saveButton.textContent = "Save Changes";
  cancelButton.classList.remove("d-none");
  window.scrollTo(0, 0);
}

// Remove one member after asking for confirmation.
function deleteMember(id) {
  const answer = confirm("Are you sure you want to delete this member?");

  if (answer === true) {
    members = members.filter(function(member) {
      return member.id !== id;
    });

    saveMembers();
    displayMembers(searchInput.value);
    clearForm();
    showMessage("The member was deleted.", "warning");
  }
}

// Cancel an update and clear the form.
cancelButton.addEventListener("click", function() {
  clearForm();
});

// Update the visible table as the user types in the search box.
searchInput.addEventListener("input", function() {
  displayMembers(searchInput.value);
});

// Display any saved members when the page first opens.
displayMembers("");
