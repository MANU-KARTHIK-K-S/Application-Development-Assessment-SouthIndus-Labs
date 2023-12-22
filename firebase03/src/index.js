import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCABR9km6fz9aAJ-rTRjQ4LPYByRcQ5-jI",
  authDomain: "south-indus-lab.firebaseapp.com",
  projectId: "south-indus-lab",
  storageBucket: "south-indus-lab.appspot.com",
  messagingSenderId: "688042843571",
  appId: "1:688042843571:web:9c98227d0b26c59f2bbfc6",
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Reference to the "books" collection
const colRef = collection(db, "user");
const organizationRef = collection(db, "organization");

// Reference to the "cities" collection
const citiesRef = collection(db, "cities");

// Fetch organization names
const organizationDropdown = document.querySelector("#userOrg");
getDocs(organizationRef)
  .then((snapshot) => {
    snapshot.docs.forEach((doc) => {
      const option = document.createElement("option");
      option.value = doc.data().name;
      option.text = doc.data().name;
      organizationDropdown.appendChild(option);
    });
  })
  .catch((err) => {
    console.log(err.message);
  });

// Fetch city names
const cityDropdown = document.querySelector("#userCity");
getDocs(citiesRef)
  .then((snapshot) => {
    snapshot.docs.forEach((doc) => {
      const option = document.createElement("option");
      option.value = doc.data().name;
      option.text = doc.data().name;
      cityDropdown.appendChild(option);
    });
  })
  .catch((err) => {
    console.log(err.message);
  });

// adding docs
const addUser = document.querySelector(".add");
addUser.addEventListener("submit", (e) => {
  e.preventDefault();

  addDoc(colRef, {
    name: addUser.username.value,
    ID: generateRandomAlphanumeric(6),
    email: addUser.userEmail.value,
    city: addUser.userCity.value,
    organization: addUser.userOrg.value,
  }).then(() => {
    alert("new user added");
    addUser.reset();
  });
});

// Get real time data from the collection
let users = [];
let startIdx;
let endIdx;
onSnapshot(colRef, (snapshot) => {
  // clear old data
  users = [];
  snapshot.docs.forEach((doc) => {
    // Extract data from each document
    const { name, ID, email, organization, city } = doc.data();

    // Add data to the books array
    users.push({ id: doc.id, name, ID, email, organization, city });
  });
  console.log(users);

  // Call a function to populate the table with the retrieved data
  populateTable(sortUsers("asc", 0, users.length - 1));
  // Add an event listener to the sorting dropdown menu
  const sortDropdown = document.getElementById("sort-dropdown");
  sortDropdown.addEventListener("change", () => {
    // Call a function to re-populate the table with sorted data for the current page
    const sortedUsers = sortUsers(sortDropdown.value, startIdx, endIdx);
    populateTable(sortedUsers);
  });
});
// printing cities
onSnapshot(citiesRef, (snapshot) => {
  // clear old data
  let cit_list = [];
  snapshot.docs.forEach((doc) => {
    // Extract data from each document
    const { ID, country, name, time_zone } = doc.data();

    // Add data to the books array
    cit_list.push({ firestore_id: doc.id, ID, country, name, time_zone });
  });
  console.log("Cities:");
  console.log(cit_list);
});
//printing organizations
onSnapshot(organizationRef, (snapshot) => {
  // clear old data
  let org_list = [];
  snapshot.docs.forEach((doc) => {
    // Extract data from each document
    const { name, ID, email, address } = doc.data();

    // Add data to the books array
    org_list.push({ firestore_id: doc.id, name, ID, email, address });
  });
  console.log(`Organizations: `);
  console.log(org_list);
});

const itemsPerPage = 10;
let currentPage = 1;

// Update the event listener for the "Next" button
const nextButton = document.getElementById("nextbtn");
nextButton.addEventListener("click", () => {
  const totalItems = users.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (currentPage < totalPages) {
    currentPage++;
    populateTable(sortUsers("asc", startIdx, endIdx));
  }
});

// Update the event listener for the "Previous" button
const prevButton = document.getElementById("prevbtn");
prevButton.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    populateTable(sortUsers("asc", startIdx, endIdx));
  }
});

// Update the populateTable function to display items based on the current page
// startIdx and endIdx declared in higher scope for sorting
function populateTable(users) {
  const tableBody = document.getElementById("data-table-body");
  startIdx = (currentPage - 1) * itemsPerPage;
  endIdx = startIdx + itemsPerPage;
  const displayedUsers = users.slice(startIdx, endIdx);

  // Clear existing table content
  tableBody.innerHTML = "";
  let serialNumber = startIdx + 1;

  // Loop through the displayed users and add rows to the table
  displayedUsers.forEach((individual) => {
    const row = document.createElement("tr");

    // Add columns to the row
    row.innerHTML = `
      <td><input type="checkbox" name="selectRow"></td>
      <td>${serialNumber++}</td>
      <td>${individual.name}</td>
      <td>${individual.ID}</td>
      <td>${individual.email}</td>
      <td>${individual.organization}</td>
      <td>${individual.city}</td>
    `;

    // Append the row to the table body
    tableBody.appendChild(row);
  });

  // Update the information line below the Add User button
  const totalItems = users.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  // const startSerial = Math.min(serialNumber - 1, totalItems);
  const endSerial = Math.min(startIdx + itemsPerPage - 1, totalItems);

  updateInfoLine(startIdx + 1, endSerial + 1, totalItems);

  // Update button visibility
  prevButton.style.display = currentPage > 1 ? "inline-block" : "none";
  nextButton.style.display = currentPage < totalPages ? "inline-block" : "none";
}

// Function to update the information line
function updateInfoLine(startSerial, endSerial, totalDocuments) {
  const infoLine = document.getElementById("info-line");
  const correctedEndSerial =
    endSerial > totalDocuments ? totalDocuments : endSerial;

  infoLine.textContent = `Displaying content: (${startSerial}-${correctedEndSerial} of ${totalDocuments})`;
}

// Function to sort users based on the selected option
function sortUsers(sortOrder, startIndex, endIndex) {
  const sortedUsers = users.slice(startIndex, endIndex + 1); // Extract the subset to sort

  // Sort the array based on the selected option
  if (sortOrder === "asc") {
    sortedUsers.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortOrder === "desc") {
    sortedUsers.sort((a, b) => b.name.localeCompare(a.name));
  }
  if (sortOrder === "casc") {
    sortedUsers.sort((a, b) => a.city.localeCompare(b.city));
  } else if (sortOrder === "cdesc") {
    sortedUsers.sort((a, b) => b.city.localeCompare(a.city));
  }
  if (sortOrder === "oasc") {
    sortedUsers.sort((a, b) => a.organization.localeCompare(b.organization));
  } else if (sortOrder === "odesc") {
    sortedUsers.sort((a, b) => b.organization.localeCompare(a.organization));
  }

  // Replace the sorted subset in the original array
  users.splice(startIndex, sortedUsers.length, ...sortedUsers);
  return users;
}
// func to gen ID for user
function generateRandomAlphanumeric(length) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
// Event listener for checkboxes in the table
const tableBody = document.getElementById("data-table-body");
tableBody.addEventListener("change", () => {
  const checkboxes = tableBody.querySelectorAll('input[name="selectRow"]');
  const actionButton = document.getElementById("action-button");

  // Check if any checkbox is selected
  const anyCheckboxSelected = Array.from(checkboxes).some(
    (checkbox) => checkbox.checked
  );

  // Update button visibility
  actionButton.style.display = anyCheckboxSelected ? "inline-block" : "none";
});

function deleteUser(id) {
  // Find the user in the users array based on the id
  const userToDelete = users.find((user) => user.ID === id);
  let todelID;
  // Check if the user is found
  if (userToDelete) {
    // Remove the user from the users array
    users.forEach((user) => {
      if (user.ID === id) {
        todelID = user.id;
      }
    });
    users = users.filter((user) => user.id !== id);

    // Repopulate the table with the updated users array
    populateTable(users);

    // Delete data from Firestore based on userId
    deleteDoc(doc(db, "user", todelID))
      .then(() => {
        console.log(
          `Document with ID ${id} deleted successfully from Firestore.`
        );
        actionButton.style.display = "none";
      })
      .catch((error) => {
        console.error(`Error deleting document: ${error}`);
      });
  }
}

// Add an event listener to the button
const actionButton = document.getElementById("action-button");
actionButton.addEventListener("click", () => {
  // Get the selected rows
  const selectedRows = Array.from(
    tableBody.querySelectorAll('input[name="selectRow"]:checked')
  ).map((checkbox) => checkbox.closest("tr"));

  // Check if any rows are selected
  if (selectedRows.length > 0) {
    // Perform additional actions: delete data from Firebase
    selectedRows.forEach((row) => {
      const userId = row.children[3].textContent; // Assuming ID is in the fourth column
      deleteUser(userId);
    });

    // Clear the selection in checkboxes
    selectedRows.forEach((row) => {
      row.querySelector('input[name="selectRow"]').checked = false;
    });
  }
});
// --------------------------------------------------
// Event listener for the search button
const searchButton = document.getElementById("searchbtn");
searchButton.addEventListener("click", async () => {
  const searchInput = document.querySelector('input[name="searchuser"]').value;

     // Filter the users array based on the search input
  const searchResults = users.filter(user =>
    user.name.toLowerCase().includes(searchInput)
  );
    if (searchResults.length > 0) {
      // Populate the table with the search results
      populateTable(searchResults);
      // Update the information line
      const totalItems = searchResults.length;
      updateInfoLine(1, totalItems, totalItems);

      // Hide pagination buttons since search results are displayed in one page
      const prevButton = document.getElementById("prevbtn");
      const nextButton = document.getElementById("nextbtn");
      const clrsearch = document.getElementById("clearserach");
      prevButton.style.display = "none";
      nextButton.style.display = "none";
      clrsearch.style.display = "inline-block";
    } else {
      alert("No users found! ");
    }
});
const clrbtn = document.getElementById("clearserach");
clrbtn.addEventListener("click", () => {
  const clrsearch = document.getElementById("clearserach");
  populateTable(sortUsers("asc", startIdx, endIdx));
  searchInput.value = "";
  clrsearch.style.display = "none";
});
