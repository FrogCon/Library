var currentActiveOverlays = {
    websiteOverlay: null,
    addActionOverlay: null
};
const loginModal = document.getElementById("loginModal");
const signUpModal = document.getElementById("signUpModal");
const forgotPasswordModal = document.getElementById("forgotPasswordModal");
const closeLoginModal = document.getElementById("closeLoginModal");
const closeSignUpModal = document.getElementById("closeSignUpModal");
const signUpButton = document.getElementById("signUpButton");
const loginButton = document.getElementById("loginButton");
const submitLoginButton = document.getElementById("submitLoginButton");
const userStatus = document.getElementById("userStatus");
let activeTab = "Home";

// Import Firebase modules
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { getFirestore, collection, doc, query, where, updateDoc, arrayRemove, arrayUnion, deleteDoc, setDoc, getDoc, getDocs } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

// Get references to Firebase services
const auth = getAuth(); // Uses the app initialized in index.html
const db = getFirestore(); // Uses the same app

// Authentication Functions
function signUp(email, password) {
    createUserWithEmailAndPassword(auth, email, password)
        .then(userCredential => {
            console.log("User signed up");
            login(email, password);
            signUpModal.style.display = "none";
        })
        .catch(error => {
            console.error("Error during signup:", error.message);
            alert("Sign-up failed, try again...");
        });
}

function login(email, password) {
    signInWithEmailAndPassword(auth, email, password)
        .then(userCredential => {
            console.log("User logged in");
            alert("Login successful!");
            // Close the login modal
            const loginModal = document.getElementById("loginModal");
            loginModal.style.display = "none";
        })
        .catch(error => {
            console.error("Error during login:", error.message);
            alert("Login failed, try again...");
        });
}

logoutButton.addEventListener("click", () => {
    signOut(auth)
        .then(() => {
            console.log("User logged out.");
            alert("Logout successful!");
        })
        .catch((error) => {
            console.error("Error during logout:", error.message);
            alert("Logout failed, try again...");
        });
});

// Monitor User State
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is logged in
        userStatus.textContent = user.email;
        loginButton.style.display = "none";
        logoutButton.style.display = "block";
    } else {
        // User is not logged in
        userStatus.textContent = "Not Logged In";
        loginButton.style.display = "block";
        logoutButton.style.display = "none";
    }

    // Call the appropriate function for the active tab
    if (activeTab === "Games") {
        displayGamesTab();
    }
});

// Close modal
closeLoginModal.addEventListener("click", () => {
    loginModal.style.display = "none";
});

// Close modal if clicking outside the modal
window.addEventListener("click", (event) => {
    if (event.target === loginModal) {
        loginModal.style.display = "none";
    }
});

// Open modal
loginButton.addEventListener("click", () => {
    loginModal.style.display = "block";
});

// Close modal
closeLoginModal.addEventListener("click", () => {
    loginModal.style.display = "none";
    document.getElementById("loginEmail").value = "";
    document.getElementById("loginPassword").value = "";
});

// Open and close the sign-up modal
signUpButton.addEventListener("click", () => {
    loginModal.style.display = "none"; // Close login modal
    document.getElementById("loginEmail").value = "";
    document.getElementById("loginPassword").value = "";
    signUpModal.style.display = "block"; // Open sign-up modal
});

closeSignUpModal.addEventListener("click", () => {
    signUpModal.style.display = "none";
    document.getElementById("signUpEmail").value = "";
    document.getElementById("signUpPassword").value = "";
    document.getElementById("confirmPassword").value = "";
});

// Open the forgot password modal
document.getElementById("forgotPasswordLink").addEventListener("click", () => {
    document.getElementById("forgotPasswordModal").style.display = "block";
    document.getElementById("loginModal").style.display = "none";
});

// Close the forgot password modal
document.getElementById("closeForgotPasswordModal").addEventListener("click", () => {
    document.getElementById("forgotPasswordModal").style.display = "none";
    document.getElementById("forgotPasswordEmail").value = "";
});

// Send password reset email
document.getElementById("submitForgotPasswordButton").addEventListener("click", () => {
    const email = document.getElementById("forgotPasswordEmail").value;

    if (!email) {
        alert("Please enter your email address.");
        return;
    }

    sendPasswordResetEmail(auth, email) // Pass the auth instance as the first argument
        .then(() => {
            alert("Password reset email sent! Please check your inbox.");
            document.getElementById("forgotPasswordModal").style.display = "none";
            document.getElementById("forgotPasswordEmail").value = ""; // Clear the email field
        })
        .catch(error => {
            console.error("Error sending password reset email:", error.message);
            alert("Failed to send reset email. Please try again.");
        });
});

// Close modals if clicking outside them
window.addEventListener("click", (event) => {
    if (event.target === loginModal) {
        loginModal.style.display = "none";
        document.getElementById("loginEmail").value = "";
        document.getElementById("loginPassword").value = "";
    }
    if (event.target === signUpModal) {
        signUpModal.style.display = "none";
        document.getElementById("signUpEmail").value = "";
        document.getElementById("signUpPassword").value = "";
        document.getElementById("confirmPassword").value = "";
    }
    if (event.target === forgotPasswordModal) {
        forgotPasswordModal.style.display = "none";
	document.getElementById("forgotPasswordEmail").value = "";
    }
});

// Handle login
submitLoginButton.addEventListener("click", () => {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    // Call the existing login function
    login(email, password);

    // Clear the input fields after submission
    document.getElementById("loginEmail").value = "";
    document.getElementById("loginPassword").value = "";
});

// Handle sign-up
submitSignUpButton.addEventListener("click", () => {
    const email = document.getElementById("signUpEmail").value;
    const password = document.getElementById("signUpPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
        alert("Passwords do not match!");
        document.getElementById("signUpPassword").value = "";
        document.getElementById("confirmPassword").value = "";
        return;
    }

    signUp(email, password);

    // Clear the input fields after submission
    document.getElementById("signUpEmail").value = "";
    document.getElementById("signUpPassword").value = "";
    document.getElementById("confirmPassword").value = "";
});

// Define Library functions
function isLoggedIn() {
    const user = auth.currentUser;
    if (!user) {
        alert("You must be logged in to access this feature.");
        loginModal.style.display = "block";
        return false;
    }
    return true;
}

function openTab(evt, tabName) {
    var i, tabcontent, tablinks;

    // Hide all tab content
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Remove the "active" clas from all buttons
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    if (tabName === 'Games') {
        displayGamesTab();
    }

    if (tabName === 'ModifyGames') {
        document.getElementById('bggUsername').value = '';
        document.getElementById('searchResults').innerHTML = '';
        document.getElementById('bggSearchQuery').value = '';
        document.getElementById('libraryResults').innerHTML = '';
    }

    // Update the active tab
    activeTab = tabName;

    // Show the selected tab and set the clicked button as active
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
}

// Attach event listeners to the buttons
document.getElementById("homeTab").addEventListener("click", (event) => openTab(event, "Home"));
document.getElementById("gamesTab").addEventListener("click", (event) => openTab(event, "Games"));
document.getElementById("modifyGamesTab").addEventListener("click", (event) => openTab(event, "ModifyGames"));
document.getElementById("getCollectionButton").addEventListener("click", getCollection);
document.getElementById("searchGamesButton").addEventListener("click", () => searchGames(document.getElementById("searchGamesButton")));
document.getElementById("searchLibraryButton").addEventListener("click", () => searchLibrary(document.getElementById("searchLibraryButton")));

// Automatically open the default tab on page load
document.getElementById("homeTab").click();

const BGG_COLLECTION_URL =
  "https://getbggcollection-qj3gq57tma-uc.a.run.app";

const BGG_SEARCH_URL =
  "https://searchbgggames-qj3gq57tma-uc.a.run.app";

const BGG_DETAILS_URL =
  "https://getbgggamedetails-qj3gq57tma-uc.a.run.app";

function getCollection() {
    if (!isLoggedIn()) return;
    
    var username = document.getElementById('bggUsername').value;
    var statusDiv = document.getElementById('statusMessage');
    
    if (username) {
        statusDiv.innerHTML = 'Fetching Library...';
        fetch(`${BGG_COLLECTION_URL}?username=${encodeURIComponent(username)}`)
            .then(async response => {
                const xmlText = await response.text();

                const errorMessage = response.headers.get("X-BGG-Error");
                if (errorMessage) {
                    statusDiv.innerHTML = errorMessage;
                    return null;
                }

                const queued = response.headers.get("X-BGG-Queued") === "true";
                if (queued) {
                    statusDiv.innerHTML = "Library found! Request has been queued retrying in 10s...";
                    setTimeout(getCollection, 10000);
                    return null;
                }

                return xmlText;
            })
            .then(str => {
                if (!str) return;
                const data = new DOMParser().parseFromString(str, "text/xml");
                prepareData(data);
            })
            .catch(error => {
                console.error(error);
                alert("An error occurred. Please try again.");
                statusDiv.innerHTML = "";
            });
    } else {
        if (!username) {
            alert ('Please Enter A Username.');
            statusDiv.innerHTML = '';
        }
    }
}

function prepareData(data) {
    const statusDiv = document.getElementById('statusMessage');

    const items = data.getElementsByTagName('item');

    // GUARD: No games yet (queued or empty collection)
    if (!items || items.length === 0) {
        console.warn("BGG returned no <item> elements yet");

        statusDiv.innerHTML = "Library is still being prepared. Retrying in 10s...";
        setTimeout(getCollection, 10000);
        return;
    }

    const userUID = auth.currentUser.uid;
    statusDiv.innerHTML = 'Sorting Library...';
  
    // 1) Build extractedData from BGG XML
    const extractedData = [];
  
    for (let i = 0; i < items.length; i++) {
      const name = items[i].getElementsByTagName('name')[0].textContent;
      const objectId = items[i].getAttribute('objectid');
      const objectIdNum = Number(objectId);
  
      let thumbnail = './no-image.png';
      const thumbnailElements = items[i].getElementsByTagName('thumbnail');
      if (thumbnailElements.length > 0) {
        thumbnail = thumbnailElements[0].textContent;
      }
  
      const status = [];
      const newGame = 'Y';
  
      extractedData.push({
        name,
        objectId: objectIdNum,
        thumbnail,
        status,
        newGame
      });
    }
  
    // Show the first 10 game names for confirmation
    const firstSet = extractedData.slice(0, 10).map(g => g.name).join('\n');
    const confirmation = confirm(
      `Here are the first 10 games from this collection:\n\n${firstSet}\n\nDoes this look correct?`
    );
    if (!confirmation) {
      statusDiv.innerHTML = '';
      return;
    }
  
    // 2) If confirmed, fetch user's Firestore games (via UID)
    statusDiv.innerHTML = 'Loading Library...';
  
    fetchUserGames().then(async (existingGames) => {
        // existingGames: array of { name, objectId, thumbnail, owners, ... }
        
        // If user has zero existing games, prompt once for library name
        if (existingGames.length === 0) {
            const libraryName = prompt(
            "This is your first game! What would you like others to see your library called?"
            );
            if (libraryName) {
                await setDoc(doc(db, "users", userUID), { libraryName }, { merge: true });
            }
        }

        // 3) Remove user ownership for any existing games not in new extractedData
        const newObjectIds = extractedData.map(g => g.objectId);
        const gamesToRemove = existingGames.filter(g =>
            !newObjectIds.includes(g.objectId)
        );

        gamesToRemove.forEach(game => {
            if (confirm(`Remove "${game.name}" from your ownership?`)) {
            removeGame(game);
            }
        });

        // 4) Add new games from extractedData that user doesn't already own
        const existingObjectIds = existingGames.map(g => g.objectId);
        const uniqueGames = extractedData.filter(g =>
            !existingObjectIds.includes(g.objectId)
        );

        if (uniqueGames.length > 0) {
            const addPromises = uniqueGames.map(g => addGame(g));
            Promise.all(addPromises)
            .then(() => {
                alert(`${uniqueGames.length} new game(s) added to your ownership.`);
                statusDiv.innerHTML = '';
            })
            .catch(error => {
                console.error('Error adding games:', error);
                alert('Failed to add some games. See console for details.');
                statusDiv.innerHTML = '';
            });
        } else {
            alert('No new games to add.');
            statusDiv.innerHTML = '';
        }
    })
    .catch(error => {
        console.error('Error fetching user-owned games:', error);
        alert('An error occurred while fetching your games. Please try again.');
        statusDiv.innerHTML = '';
    });
}
  
async function fetchUserGames() {
  const userUID = auth.currentUser.uid;
  const userCollectionRef = collection(db, userUID); 
  const snapshot = await getDocs(userCollectionRef);

  const gamesArray = [];
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    gamesArray.push({
      name: data.name,
      docName: docSnap.id,
      objectId: data.objectId,
      thumbnail: data.thumbnail,
      newGame: data.newGame, 
      status: data.status
    });
  });

  return gamesArray;
}

async function fetchAllGames() {
    // Get all users (to know their UID and libraryName)
    const usersSnap = await getDocs(collection(db, "users"));
    let gameMap = new Map(); // key: objectId, value: game data plus owner info
  
    // For each user, load their personal top-level collection
    for (const userDoc of usersSnap.docs) {
      const userUID = userDoc.id;
      const libraryName = userDoc.data().libraryName || "(No Library Name)";
      const userGamesSnap = await getDocs(collection(db, userUID));
  
      userGamesSnap.forEach(gameDoc => {
        const gData = gameDoc.data();
        // Save additional info for grouping later
        gData.ownerUID = userUID;
        gData.libraryName = libraryName;
        gData.docName = gameDoc.id;
        const objectId = gData.objectId;
  
        if (gameMap.has(objectId)) {
            const existing = gameMap.get(objectId);
            if (!existing.sharedOwners) {
              existing.sharedOwners = [{ ownerUID: existing.ownerUID, libraryName: existing.libraryName }];
            }
            existing.sharedOwners.push({ ownerUID: gData.ownerUID, libraryName: gData.libraryName });
          } else {
            gameMap.set(objectId, gData);
          }
          
      });
    }
    // Return as an array
    return Array.from(gameMap.values());
}  

function fetchGameDetails(gameId) {
    fetch(`${BGG_DETAILS_URL}?id=${gameId}`)
        .then(response => response.text())
        .then(str => (new window.DOMParser()).parseFromString(str, "text/xml"))
        .then(data => {
            var items = data.getElementsByTagName('item');
            if (items.length > 0) {
                var objectId = items[0].getAttribute('id');
                var thumbnails = items[0].getElementsByTagName('thumbnail');
                if (thumbnails.length > 0) {
                    var thumbnailUrl = thumbnails[0].textContent;
                    var thumbnailImg = document.getElementById('thumbnail-' + objectId);
                    if (thumbnailImg) {
                        thumbnailImg.src = thumbnailUrl;
                        thumbnailImg.style.display = 'block'; // Make it visible
                    }
                }
            }
        })
        .catch(error => console.error('Error fetching game details:', error));
}

function searchGames(button) {
    if (!isLoggedIn()) return;

    var query = document.getElementById('bggSearchQuery').value;
    fetch(`${BGG_SEARCH_URL}?query=${encodeURIComponent(query)}`)
        .then(response => response.text())
        .then(str => (new window.DOMParser()).parseFromString(str, "text/xml"))
        .then(data => displaySearchResults(data, button));
}

function displaySearchResults(data, button) {
    var items = data.getElementsByTagName('item');
    var resultsDiv = document.getElementById('searchResults');
    resultsDiv.innerHTML = ''; // Clear previous results

    var rowDiv = document.createElement('div');
    rowDiv.className = 'result-row';
    resultsDiv.appendChild(rowDiv);

    const maxItemsToShow = 18; // Maximum number of items to display
    for (var i = 0; i < Math.min(items.length, maxItemsToShow); i++) {
        var objectId = items[i].getAttribute('id');
        var name = items[i].getElementsByTagName('name')[0].getAttribute('value');

        var resultDiv = document.createElement('div');
        resultDiv.className = 'result-item'; // CSS class for styling

        var thumbnailImg = document.createElement('img');
        thumbnailImg.id = 'thumbnail-' + objectId; // Unique ID for the thumbnail
        thumbnailImg.alt = 'Loading thumbnail...';
        thumbnailImg.className = 'thumbnail-img'; // CSS class for styling

        var nameDiv = document.createElement('div');
        nameDiv.innerHTML = name;
        nameDiv.className = 'game-name'; // CSS class for styling

        resultDiv.appendChild(thumbnailImg);
        resultDiv.appendChild(nameDiv);

        var status = [];
	    var newGame = 'Y';

        // Setup click event
        resultDiv.onclick = createClickHandler(name, objectId, thumbnailImg, status, newGame, resultDiv);

        rowDiv.appendChild(resultDiv);

        // Fetch and display game details including the thumbnail
        fetchGameDetails(objectId);
    }

    button.scrollIntoView({ behavior: 'smooth' });
}

async function displayGamesTab() {
    if (!isLoggedIn()) return;

    showLoadingOverlay();

    try {
        // Fetch all games from every user's top-level collection.
        const allGames = await fetchAllGames();
        const userUID = auth.currentUser ? auth.currentUser.uid : null;
        var gamesDiv = document.getElementById('Games');
        gamesDiv.innerHTML = '<h1>Make Your Selections</h1>'; // Clear previous content and add title

        // Create checkbox for toggling visibility (same as before)
        var checkboxDiv = document.createElement('div');
        checkboxDiv.className = 'checkbox-container';
        var checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = 'showSelected';
        checkbox.className = 'large-checkbox';
        checkbox.checked = false;
        var label = document.createElement('label');
        label.htmlFor = 'showSelected';
        label.textContent = ' Only show selected games';

        checkboxDiv.appendChild(checkbox);
        checkboxDiv.appendChild(label);
        gamesDiv.appendChild(checkboxDiv);

        // Separate shared games from individual ones.
        let sharedGames = allGames.filter(game => game.sharedOwners && game.sharedOwners.length > 1);
        let individualGames = allGames.filter(game => !game.sharedOwners || game.sharedOwners.length < 2);

        // --- Render the Shared Library ---
        if (sharedGames.length > 0) {
            // Sort shared games
            sharedGames.sort((a, b) => {
                // If a is new and b is not, a comes first.
                if (a.newGame === "Y" && b.newGame !== "Y") return -1;
                // If b is new and a is not, b comes first.
                if (a.newGame !== "Y" && b.newGame === "Y") return 1;
                // Otherwise, sort alphabetically by name.
                return a.name.localeCompare(b.name);
              });              
            
            // Create a container for the shared library (collapsed by default)
            var sharedOwnerDiv = document.createElement('div');
            sharedOwnerDiv.className = 'owner-games';
            sharedOwnerDiv.style.display = 'none';  // Collapsed by default
        
            // Create a header for the shared library
            var sharedHeader = document.createElement('h2');
            sharedHeader.innerHTML = "Shared Library";
            sharedHeader.className = 'owner-header';
            sharedHeader.onclick = createOwnerHeaderClickHandler(sharedHeader, sharedOwnerDiv);
        
            // Append the header to the main container (gamesDiv)
            gamesDiv.appendChild(sharedHeader);
        
            // Create a single row container for the shared library games
            var sharedRowDiv = document.createElement('div');
            sharedRowDiv.className = 'result-row';
        
            // Append the row container to the sharedOwnerDiv
            sharedOwnerDiv.appendChild(sharedRowDiv);
        
            // Append the sharedOwnerDiv to the main container (gamesDiv)
            gamesDiv.appendChild(sharedOwnerDiv);

            sharedGames.forEach(game => {
                // Create the game element (similar to below)
                var resultDiv = document.createElement('div');
                resultDiv.className = 'result-item';
                
                // (Set the background color based on status as before)
                let statusArray = Array.isArray(game.status) ? game.status : [];
                if (userUID && statusArray.includes(userUID)) {
                    resultDiv.style.backgroundColor = "darkgreen"; // Current user selected
                } else if (statusArray.length > 0) {
                    resultDiv.style.backgroundColor = "lightgreen";
                } else {
                    resultDiv.style.backgroundColor = "";
                }
                resultDiv.dataset.status = statusArray;
                
                // Build thumbnail and name elements
                var thumbnailImg = document.createElement('img');
                thumbnailImg.src = game.thumbnail;
                thumbnailImg.alt = game.name;
                thumbnailImg.className = 'thumbnail-img';

                var nameDiv = document.createElement('div');
                nameDiv.innerHTML = game.name;
                nameDiv.className = 'game-name';

                if (game.newGame === "Y") {
                    // Create a "New Game" indicator
                    const newGameIndicator = document.createElement('img');
                    newGameIndicator.src = './new.png'; // Path to the "new game" icon
                    newGameIndicator.alt = 'New Game';
                    newGameIndicator.style = `
                        position: absolute; 
                        top: -10px; 
                        left: -10px; 
                        width: 40px; 
                        height: 40px; 
                    `;
                
                    // Append the "New Game" indicator to the resultDiv
                    resultDiv.appendChild(newGameIndicator);
                }
    
                // Create overlays but keep them hidden initially
                var websiteOverlay = document.createElement('div');
                websiteOverlay.style = 'position: absolute; top: 0; left: 0; width: 100%; height: 50%; background-color: rgba(255, 0, 0, 0.5); color: white; display: flex; justify-content: center; align-items: center; display: none; border-top-left-radius: 1rem; border-top-right-radius: 1rem; text-shadow: 2px 2px 4px #000000;';
                var websiteText = document.createElement('span');
                websiteText.textContent = 'View On BGG';
                websiteText.style = `background-color: rgba(0, 0, 0, 0.5); padding: 0.5rem 1rem; border-radius: 0.5rem;`;
                websiteOverlay.appendChild(websiteText);
                websiteOverlay.onclick = function(event) {
                    window.open(`https://boardgamegeek.com/boardgame/${game.objectId}`, '_blank');
                    hideOverlays(websiteOverlay, addActionOverlay);
                    // Re-enable showing overlays on click
                    resultDiv.onclick = showOverlaysFunction(websiteOverlay, addActionOverlay);
                    event.stopPropagation(); // Prevent triggering clicks on underlying elements
                };
    
                var addActionOverlay = document.createElement('div');
                addActionOverlay.style = `
                    position: absolute; 
                    bottom: 0; 
                    right: 0; 
                    width: 100%; 
                    height: 50%; 
                    background-color: rgba(0, 255, 0, 0.5); 
                    color: white; 
                    display: flex; 
                    justify-content: center; 
                    align-items: center; 
                    display: none;
                    border-bottom-left-radius: 1rem; 
                    border-bottom-right-radius: 1rem; 
                    text-shadow: 2px 2px 4px #000000;
                `;
                
                // Create an image element for the "Add/Remove" icon
                var addActionImage = document.createElement('img');
                addActionImage.src = './thumbUp.png'; // Path to the image
                addActionImage.alt = 'Add/Remove';
                addActionImage.style = `
                    width: 90px; 
                    height: 90px; 
                `;
                
                // Append the image to the overlay
                addActionOverlay.appendChild(addActionImage);
    
                // Update the color of the image based on data-status
                function updateThumbColor() {
                    const status = resultDiv.dataset.status || "";
                    const hasUsers = status.trim() !== ""; // Check if there are any users in data-status
                    addActionImage.style.filter = hasUsers ? "none" : "grayscale(100%)"; // Gray if no users
                }
                
                // Call updateThumbColor initially and on data-status changes
                updateThumbColor();
    
                var userCountIndicator = document.createElement('div');
                userCountIndicator.style = `
                    position: absolute; 
                    top: 0px; 
                    right: 0px; 
                    width: 32px; 
                    height: 32px; 
                    border-radius: 16px; 
                    background-color: rgba(0, 0, 0, 0.5); 
                    color: white; 
                    display: flex; 
                    justify-content: center; 
                    align-items: center; 
                    font-weight: bold;
                    box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.5);
                    cursor: pointer;
                    z-index: 10;
                `;
                
                // Append the indicator to the resultDiv
                resultDiv.appendChild(userCountIndicator);

                userCountIndicator.addEventListener("click", async (event) => {
                    event.stopPropagation(); // Stop the click from reaching the resultDiv overlay logic
                    const selectedUsers = Array.isArray(game.status) ? game.status : [];
                    if (selectedUsers.length > 0) {
                        await showUserList(selectedUsers);
                    } else {
                        alert("No users have selected this game yet.");
                    }
                });
                
                // Initial update of the user count
                updateUserCount(game.status || [], userCountIndicator);
                
                // Click handler for the overlay
                addActionOverlay.onclick = function(event) {
                    createGameClickHandler(game, resultDiv, userCountIndicator)();
                    hideOverlays(websiteOverlay, addActionOverlay);
                    updateThumbColor();
                    //updateUserCount(game.status || []);
                    // Re-enable showing overlays on click
                    resultDiv.onclick = showOverlaysFunction(websiteOverlay, addActionOverlay);
                    event.stopPropagation(); // Prevent triggering clicks on underlying elements
                };
    
                resultDiv.style.position = 'relative';
                resultDiv.appendChild(websiteOverlay);
                resultDiv.appendChild(addActionOverlay);
    
                // Initial click on the game item shows the overlays
                resultDiv.onclick = showOverlaysFunction(websiteOverlay, addActionOverlay);

                // Here we manually append thumbnail and name:
                resultDiv.appendChild(thumbnailImg);
                resultDiv.appendChild(nameDiv);
                
                sharedRowDiv.appendChild(resultDiv);
            });
        }

        // --- Render Individual Libraries ---
        // Sort individual games by owner (libraryName), then newGame, then name.
        individualGames.sort((a, b) => {
            if (a.libraryName !== b.libraryName) {
                return a.libraryName.localeCompare(b.libraryName);
            }
            if (a.newGame === "Y" && b.newGame !== "Y") return -1;
            if (a.newGame !== "Y" && b.newGame === "Y") return 1;
            return a.name.localeCompare(b.name);
        });

        var currentOwner = null;
        var ownerDiv;
        var rowDiv;

        individualGames.forEach(game => {
            if (game.libraryName !== currentOwner) {
                currentOwner = game.libraryName;
                ownerDiv = document.createElement('div');
                ownerDiv.className = 'owner-games';
                ownerDiv.style.display = 'none';

                var ownerHeader = document.createElement('h2');
                ownerHeader.innerHTML = currentOwner;
                ownerHeader.className = 'owner-header';
                ownerHeader.onclick = createOwnerHeaderClickHandler(ownerHeader, ownerDiv);

                gamesDiv.appendChild(ownerHeader);

                rowDiv = document.createElement('div');
                rowDiv.className = 'result-row';
                ownerDiv.appendChild(rowDiv);

                gamesDiv.appendChild(ownerDiv);
            }

            var resultDiv = document.createElement('div');
            resultDiv.className = 'result-item';

            let statusArray = Array.isArray(game.status) ? game.status : [];
            if (userUID && statusArray.includes(userUID)) {
                resultDiv.style.backgroundColor = "darkgreen";
            } else if (statusArray.length > 0) {
                resultDiv.style.backgroundColor = "lightgreen";
            } else {
                resultDiv.style.backgroundColor = "";
            }
            resultDiv.dataset.status = statusArray;

            var thumbnailImg = document.createElement('img');
            thumbnailImg.src = game.thumbnail;
            thumbnailImg.alt = game.name;
            thumbnailImg.className = 'thumbnail-img';

            var nameDiv = document.createElement('div');
            nameDiv.innerHTML = game.name;
            nameDiv.className = 'game-name';

            if (game.newGame === "Y") {
                const newGameIndicator = document.createElement('img');
                newGameIndicator.src = './new.png';
                newGameIndicator.alt = 'New Game';
                newGameIndicator.style = `
                    position: absolute; 
                    top: -10px; 
                    left: -10px; 
                    width: 40px; 
                    height: 40px;
                `;
                resultDiv.appendChild(newGameIndicator);
            }

            
            


            if (game.newGame === "Y") {
                // Create a "New Game" indicator
                const newGameIndicator = document.createElement('img');
                newGameIndicator.src = './new.png'; // Path to the "new game" icon
                newGameIndicator.alt = 'New Game';
                newGameIndicator.style = `
                    position: absolute; 
                    top: -10px; 
                    left: -10px; 
                    width: 40px; 
                    height: 40px; 
                `;
            
                // Append the "New Game" indicator to the resultDiv
                resultDiv.appendChild(newGameIndicator);
            }

            // Create overlays but keep them hidden initially
            var websiteOverlay = document.createElement('div');
            websiteOverlay.style = 'position: absolute; top: 0; left: 0; width: 100%; height: 50%; background-color: rgba(255, 0, 0, 0.5); color: white; display: flex; justify-content: center; align-items: center; display: none; border-top-left-radius: 1rem; border-top-right-radius: 1rem; text-shadow: 2px 2px 4px #000000;';
            var websiteText = document.createElement('span');
            websiteText.textContent = 'View On BGG';
            websiteText.style = `background-color: rgba(0, 0, 0, 0.5); padding: 0.5rem 1rem; border-radius: 0.5rem;`;
            websiteOverlay.appendChild(websiteText);
            websiteOverlay.onclick = function(event) {
                window.open(`https://boardgamegeek.com/boardgame/${game.objectId}`, '_blank');
                hideOverlays(websiteOverlay, addActionOverlay);
                // Re-enable showing overlays on click
                resultDiv.onclick = showOverlaysFunction(websiteOverlay, addActionOverlay);
                event.stopPropagation(); // Prevent triggering clicks on underlying elements
            };

            var addActionOverlay = document.createElement('div');
            addActionOverlay.style = `
                position: absolute; 
                bottom: 0; 
                right: 0; 
                width: 100%; 
                height: 50%; 
                background-color: rgba(0, 255, 0, 0.5); 
                color: white; 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                display: none;
                border-bottom-left-radius: 1rem; 
                border-bottom-right-radius: 1rem; 
                text-shadow: 2px 2px 4px #000000;
            `;
            
            // Create an image element for the "Add/Remove" icon
            var addActionImage = document.createElement('img');
            addActionImage.src = './thumbUp.png'; // Path to the image
            addActionImage.alt = 'Add/Remove';
            addActionImage.style = `
                width: 90px; 
                height: 90px; 
            `;
            
            // Append the image to the overlay
            addActionOverlay.appendChild(addActionImage);

            // Update the color of the image based on data-status
            function updateThumbColor() {
                const status = resultDiv.dataset.status || "";
                const hasUsers = status.trim() !== ""; // Check if there are any users in data-status
                addActionImage.style.filter = hasUsers ? "none" : "grayscale(100%)"; // Gray if no users
            }
            
            // Call updateThumbColor initially and on data-status changes
            updateThumbColor();

            var userCountIndicator = document.createElement('div');
            userCountIndicator.style = `
                position: absolute; 
                top: 0px; 
                right: 0px; 
                width: 32px; 
                height: 32px; 
                border-radius: 16px; 
                background-color: rgba(0, 0, 0, 0.5); 
                color: white; 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                font-weight: bold;
                box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.5);
                cursor: pointer;
                z-index: 10;
            `;
            
            // Append the indicator to the resultDiv
            resultDiv.appendChild(userCountIndicator);

            userCountIndicator.addEventListener("click", async (event) => {
                event.stopPropagation(); // Stop the click from reaching the resultDiv overlay logic
                const selectedUsers = Array.isArray(game.status) ? game.status : [];
                if (selectedUsers.length > 0) {
                    await showUserList(selectedUsers);
                } else {
                    alert("No users have selected this game yet.");
                }
            });
            
            // Initial update of the user count
            updateUserCount(game.status || [], userCountIndicator);
            
            // Click handler for the overlay
            addActionOverlay.onclick = function(event) {
                createGameClickHandler(game, resultDiv, userCountIndicator)();
                hideOverlays(websiteOverlay, addActionOverlay);
                updateThumbColor();
                //updateUserCount(game.status || []);
                // Re-enable showing overlays on click
                resultDiv.onclick = showOverlaysFunction(websiteOverlay, addActionOverlay);
                event.stopPropagation(); // Prevent triggering clicks on underlying elements
            };

            resultDiv.style.position = 'relative';
            resultDiv.appendChild(websiteOverlay);
            resultDiv.appendChild(addActionOverlay);

            // Initial click on the game item shows the overlays
            resultDiv.onclick = showOverlaysFunction(websiteOverlay, addActionOverlay);





            resultDiv.appendChild(thumbnailImg);
            resultDiv.appendChild(nameDiv);

            rowDiv.appendChild(resultDiv);
        });

        hideLoadingOverlay();

        checkbox.addEventListener('change', function() {
            const allGameItems = document.querySelectorAll('.result-item');
            allGameItems.forEach(item => {
                const hasUsers = item.dataset.status && item.dataset.status.trim() !== "";
                if (this.checked) {
                    if (!hasUsers) {
                        item.style.display = 'none';
                    }
                } else {
                    item.style.display = '';
                }
            });
        });
    } catch (error) {
        console.error("Error fetching all games from Firestore:", error);
        alert("Failed to load games. Please try again later.");
        hideLoadingOverlay();
    }
}

async function olddisplayGamesTab() {
    if (!isLoggedIn()) return;

    showLoadingOverlay();

    try {
        const gamesData = await fetchAllGames();
        const userUID = auth.currentUser ? auth.currentUser.uid : null;
        var gamesDiv = document.getElementById('Games');
        gamesDiv.innerHTML = '<h1>Make Your Selections</h1>'; // Clear previous content and add title

        // Create checkbox for toggling visibility
        var checkboxDiv = document.createElement('div');
        checkboxDiv.className = 'checkbox-container';
        var checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = 'showSelected';
        checkbox.className = 'large-checkbox';
        checkbox.checked = false;
        var label = document.createElement('label');
        label.htmlFor = 'showSelected';
        label.textContent = ' Only show selected games';

        checkboxDiv.appendChild(checkbox);
        checkboxDiv.appendChild(label);
        gamesDiv.appendChild(checkboxDiv);

        // Sort the gamesData: Group by owner, new games first within each group, then alphabetically by name
        var sortedGames = gamesData.sort((a, b) => {
            // Group by owner
            if (a.owner !== b.owner) {
                return a.owner.localeCompare(b.owner); // Alphabetical by owner
            }
        
            // Within the same owner, prioritize new games
            if (a.newGame === "Y" && b.newGame !== "Y") return -1;
            if (a.newGame !== "Y" && b.newGame === "Y") return 1;
        
            // If both are the same type (new or not), sort alphabetically by name
            return a.name.localeCompare(b.name);
        });


        var currentOwner = null;
        var ownerDiv;
        var rowDiv;

        sortedGames.forEach(game => {
            if (game.owner !== currentOwner) {
                // Create a new div for each owner
                currentOwner = game.owner;
                ownerDiv = document.createElement('div');
                ownerDiv.className = 'owner-games';
                ownerDiv.style.display = 'none';

                // Create a header for the owner's games
                var ownerHeader = document.createElement('h2');
                ownerHeader.innerHTML = currentOwner;
                ownerHeader.className = 'owner-header';
                ownerHeader.onclick = createOwnerHeaderClickHandler(ownerHeader, ownerDiv);

                gamesDiv.appendChild(ownerHeader);

                // Create a single rowDiv for this owner
                rowDiv = document.createElement('div');
                rowDiv.className = 'result-row';
                ownerDiv.appendChild(rowDiv);

                gamesDiv.appendChild(ownerDiv);
            }

            var resultDiv = document.createElement('div');
            resultDiv.className = 'result-item';
            
            let statusArray = Array.isArray(game.status) ? game.status : [];

            // Set background color based on whether the user’s UID is in `statusArray`
            if (userUID && statusArray.includes(userUID)) {
                resultDiv.style.backgroundColor = "darkgreen"; // Current user selected
            } else if (statusArray.length > 0) {
                resultDiv.style.backgroundColor = "lightgreen"; // At least one user selected
            } else {
                resultDiv.style.backgroundColor = ""; // Default background
            }


            resultDiv.dataset.status = statusArray;

            var thumbnailImg = document.createElement('img');
            thumbnailImg.src = game.thumbnail; // Assuming thumbnail URL is available
            thumbnailImg.alt = game.name;
            thumbnailImg.className = 'thumbnail-img';

            var nameDiv = document.createElement('div');
            nameDiv.innerHTML = game.name;
            nameDiv.className = 'game-name';

            if (game.newGame === "Y") {
                // Create a "New Game" indicator
                const newGameIndicator = document.createElement('img');
                newGameIndicator.src = './new.png'; // Path to the "new game" icon
                newGameIndicator.alt = 'New Game';
                newGameIndicator.style = `
                    position: absolute; 
                    top: -10px; 
                    left: -10px; 
                    width: 40px; 
                    height: 40px; 
                `;
            
                // Append the "New Game" indicator to the resultDiv
                resultDiv.appendChild(newGameIndicator);
            }

            // Create overlays but keep them hidden initially
            var websiteOverlay = document.createElement('div');
            websiteOverlay.style = 'position: absolute; top: 0; left: 0; width: 100%; height: 50%; background-color: rgba(255, 0, 0, 0.5); color: white; display: flex; justify-content: center; align-items: center; display: none; border-top-left-radius: 1rem; border-top-right-radius: 1rem; text-shadow: 2px 2px 4px #000000;';
            var websiteText = document.createElement('span');
            websiteText.textContent = 'View On BGG';
            websiteText.style = `background-color: rgba(0, 0, 0, 0.5); padding: 0.5rem 1rem; border-radius: 0.5rem;`;
            websiteOverlay.appendChild(websiteText);
            websiteOverlay.onclick = function(event) {
                window.open(`https://boardgamegeek.com/boardgame/${game.objectId}`, '_blank');
                hideOverlays(websiteOverlay, addActionOverlay);
                // Re-enable showing overlays on click
                resultDiv.onclick = showOverlaysFunction(websiteOverlay, addActionOverlay);
                event.stopPropagation(); // Prevent triggering clicks on underlying elements
            };

            var addActionOverlay = document.createElement('div');
            addActionOverlay.style = `
                position: absolute; 
                bottom: 0; 
                right: 0; 
                width: 100%; 
                height: 50%; 
                background-color: rgba(0, 255, 0, 0.5); 
                color: white; 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                display: none;
                border-bottom-left-radius: 1rem; 
                border-bottom-right-radius: 1rem; 
                text-shadow: 2px 2px 4px #000000;
            `;
            
            // Create an image element for the "Add/Remove" icon
            var addActionImage = document.createElement('img');
            addActionImage.src = './thumbUp.png'; // Path to the image
            addActionImage.alt = 'Add/Remove';
            addActionImage.style = `
                width: 90px; 
                height: 90px; 
            `;
            
            // Append the image to the overlay
            addActionOverlay.appendChild(addActionImage);

            // Update the color of the image based on data-status
            function updateThumbColor() {
                const status = resultDiv.dataset.status || "";
                const hasUsers = status.trim() !== ""; // Check if there are any users in data-status
                addActionImage.style.filter = hasUsers ? "none" : "grayscale(100%)"; // Gray if no users
            }
            
            // Call updateThumbColor initially and on data-status changes
            updateThumbColor();

            var userCountIndicator = document.createElement('div');
            userCountIndicator.style = `
                position: absolute; 
                top: 0px; 
                right: 0px; 
                width: 32px; 
                height: 32px; 
                border-radius: 16px; 
                background-color: rgba(0, 0, 0, 0.5); 
                color: white; 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                font-weight: bold;
                box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.5);
            `;
            
            // Append the indicator to the resultDiv
            resultDiv.appendChild(userCountIndicator);
            
            // Initial update of the user count
            updateUserCount(game.status || [], userCountIndicator);
            
            // Click handler for the overlay
            addActionOverlay.onclick = function(event) {
                createGameClickHandler(game, resultDiv, userCountIndicator)();
                hideOverlays(websiteOverlay, addActionOverlay);
                updateThumbColor();
                //updateUserCount(game.status || []);
                // Re-enable showing overlays on click
                resultDiv.onclick = showOverlaysFunction(websiteOverlay, addActionOverlay);
                event.stopPropagation(); // Prevent triggering clicks on underlying elements
            };

            resultDiv.style.position = 'relative';
            resultDiv.appendChild(websiteOverlay);
            resultDiv.appendChild(addActionOverlay);

            // Initial click on the game item shows the overlays
            resultDiv.onclick = showOverlaysFunction(websiteOverlay, addActionOverlay);

            resultDiv.appendChild(thumbnailImg);
            resultDiv.appendChild(nameDiv);

            rowDiv.appendChild(resultDiv);
        });

        hideLoadingOverlay();

        checkbox.addEventListener('change', function() {
            const allGameItems = document.querySelectorAll('.result-item');
            allGameItems.forEach(item => {
                // Check if data-status contains any text (indicating users)
                const hasUsers = item.dataset.status && item.dataset.status.trim() !== "";
        
                // Apply display logic
                if (this.checked) {
                    if (!hasUsers) {
                        item.style.display = 'none'; // Hide games with no users
                    }
                } else {
                    item.style.display = ''; // Show all games
                }
            });
        });
    } catch (error) {
        console.error("Error fetching all games from Firestore:", error);
        alert("Failed to load games. Please try again later.");
        hideLoadingOverlay();
    }
}

function updateUserCount(statusArray, userCountIndicator) {
    const count = statusArray.length;
    userCountIndicator.textContent = count;
    userCountIndicator.style.display = count > 0 ? 'flex' : 'none';
}

function showOverlaysFunction(websiteOverlay, addActionOverlay) {
    return function() {
        // If the clicked game is already showing its overlays, hide them
        if (currentActiveOverlays.websiteOverlay === websiteOverlay &&
            currentActiveOverlays.addActionOverlay === addActionOverlay &&
            websiteOverlay.style.display !== 'none') {
            hideCurrentActiveOverlays(); // This will hide the overlays and reset currentActiveOverlays
        } else {
            // Hide any currently active overlays before showing the new ones
            hideCurrentActiveOverlays();
            websiteOverlay.style.display = 'flex';
            addActionOverlay.style.display = 'flex';
            // Update current active overlays to the new ones
            currentActiveOverlays.websiteOverlay = websiteOverlay;
            currentActiveOverlays.addActionOverlay = addActionOverlay;
        }
    };
}

function hideOverlays(websiteOverlay, addActionOverlay) {
    websiteOverlay.style.display = 'none';
    addActionOverlay.style.display = 'none';
}

function hideCurrentActiveOverlays() {
    if (currentActiveOverlays.websiteOverlay && currentActiveOverlays.addActionOverlay) {
        currentActiveOverlays.websiteOverlay.style.display = 'none';
        currentActiveOverlays.addActionOverlay.style.display = 'none';
    }
    // Reset current active overlays
    currentActiveOverlays = {
        websiteOverlay: null,
        addActionOverlay: null
    };
}

function searchLibrary(button) {
    if (!isLoggedIn()) return;

    showLoadingOverlay(); // Show the overlay before starting the fetch
    document.getElementById('libraryResults').innerHTML = '';

    // Fetch the user's owned games from Firestore
    fetchUserGames()
        .then(gamesData => {
            const gamesDiv = document.getElementById('libraryResults');
            gamesDiv.innerHTML = ''; // Clear previous content

            // Sort the gamesData alphabetically
            const sortedGames = gamesData.sort((a, b) => a.name.localeCompare(b.name));

            // Create a row container for the results
            const currentRow = document.createElement('div');
            currentRow.className = 'result-row';
            gamesDiv.appendChild(currentRow);

            // Render each game
            sortedGames.forEach((game) => {
                const resultDiv = document.createElement('div');
                resultDiv.className = 'result-item';

                const thumbnailImg = document.createElement('img');
                thumbnailImg.src = game.thumbnail || './no-image.png';
                thumbnailImg.alt = game.name;
                thumbnailImg.className = 'thumbnail-img';

                const nameDiv = document.createElement('div');
                nameDiv.textContent = game.name;
                nameDiv.className = 'game-name';

                // Attach the remove user-ownership click handler
                resultDiv.onclick = createRemoveClickHandler(game, resultDiv);

                resultDiv.appendChild(thumbnailImg);
                resultDiv.appendChild(nameDiv);

                currentRow.appendChild(resultDiv);
            });

            hideLoadingOverlay(); // Hide the overlay once loading is complete
        })
        .catch(error => {
            alert('An error occurred while loading your library. Please try again.');
            console.error(error);
            hideLoadingOverlay(); // Ensure overlay is hidden on error
        });

    button.scrollIntoView({ behavior: 'smooth' });
}

function toggleOwnerGames(ownerDiv) {
    // Use a robust check for empty string or 'none'
    if (!ownerDiv.style.display || ownerDiv.style.display === 'none') {
      ownerDiv.style.display = 'block';
    } else {
      ownerDiv.style.display = 'none';
    }
}

function createClickHandler(name, objectId, thumbnailImg, status, newGame, resultDiv) {
    if (!isLoggedIn()) return;

    return async function() {
        try {
        // Construct the single game object
        const singleGame = {
            name,
            objectId: Number(objectId),
            thumbnail: thumbnailImg.src,
            status,
            newGame
        };

        // 1) Fetch the user's games
        const existingGames = await fetchUserGames();

        // 2) If the user owns no games, prompt for a library name once
        if (existingGames.length === 0) {
            const libraryName = prompt(
            "This is your first game! What would you like others to see your library called?"
            );
            if (libraryName) {
            const userUID = auth.currentUser.uid;
            await setDoc(doc(db, "users", userUID), { libraryName }, { merge: true });
            console.log(`Library name set to "${libraryName}" for UID ${userUID}`);
            }
        }

        // 3) Check if user already owns this specific game
        const existingObjectIds = existingGames.map(g => g.objectId);
        if (!existingObjectIds.includes(singleGame.objectId)) {
            // Not owned: add the game
            await addGame(singleGame);
            console.log("Game added to Firestore:", singleGame.name);
        } else {
            // Already owned
            alert("Game Was Already In Library");
        }

        // 4) Update the background color/animation
        resultDiv.style.backgroundColor = "green";
        resultDiv.style.animation = "spin-grow 1s linear forwards";

        } catch (err) {
        console.error("Error in createClickHandler:", err);
        alert("Could not add or check this game. Please try again later.");
        }
    };
}  

function createRemoveClickHandler(game, resultDiv) {
    if (!isLoggedIn()) return;
    
    return function() {
        removeGame(game);

        // Apply CSS animation
        resultDiv.style.backgroundColor = 'red';
        resultDiv.style.animation = 'spin-shrink-fade 1s ease-out forwards';

        // Remove the element from the DOM after the animation ends
        resultDiv.addEventListener('animationend', function() {
            resultDiv.remove();
        });
    };
}

function createGameClickHandler(game, resultDiv, userCountIndicator) {
    return async function() {
        if (!isLoggedIn() || game.animating) return; // Prevent multiple clicks
        game.animating = true;

        const userUID = auth.currentUser.uid;

        // 1) Ensure game.status is an array (fallback to empty if missing or invalid)
        let statusArray = Array.isArray(game.status) ? [...game.status] : [];

        // 2) Determine whether we are adding or removing the current user
        let action;
        if (statusArray.includes(userUID)) {
            // Remove user from status
            statusArray = statusArray.filter(uid => uid !== userUID);
            action = "remove";
        } else {
            // Add user to status
            statusArray.push(userUID);
            action = "add";
        }

        // 3) Update the game object in memory for immediate UI feedback
        //    (So subsequent clicks see the updated array.)
        game.status = statusArray;

        // Update the user count indicator **immediately**
        updateUserCount(statusArray, userCountIndicator);

        // 4) Update the background color
        if (statusArray.includes(userUID)) {
            resultDiv.style.backgroundColor = "darkgreen"; // Currently selected by this user
        } else if (statusArray.length > 0) {
            resultDiv.style.backgroundColor = "lightgreen"; // Selected by someone else
        } else {
            resultDiv.style.backgroundColor = ""; // Not selected by anyone
        }

        // 5) Firestore update
        try {
            await updateGame(game, action); 
            // e.g., updateGame calls arrayUnion() or arrayRemove() for doc(db, "games", game.objectId)
        } catch (err) {
            console.error("Error updating game status in Firestore:", err);
            alert("Could not update status in Firestore. Please try again later.");
        }

        // 6) Spin-grow animation, then release the animation flag
        resultDiv.style.animation = "spin-grow 1s linear forwards";
        resultDiv.addEventListener(
            "animationend",
            function() {
                resultDiv.style.animation = "";
                game.animating = false;
            },
            { once: true }
        );
    };
}

function createOwnerHeaderClickHandler(ownerHeader, ownerDiv) {
    return function() {
        toggleOwnerGames(ownerDiv);
        ownerHeader.scrollIntoView({ behavior: 'smooth' });
    };
}

function sanitizeDocName(nameString) {
  return nameString
    .replace(/\//g, "-")
    .replace(/\./g, "-")
    .replace(/#/g, "-")
    .replace(/\$/g, "-")
    .replace(/\[/g, "-")
    .replace(/\]/g, "-")
    .replace(/\s+/g, "_")
    .trim();
}

async function updateGame(game, action) {
    const userUID = auth.currentUser.uid;
    const docName = sanitizeDocName(game.name) + "_" + game.objectId;
    const docRef = doc(db, game.ownerUID, docName);

    if (action === "add") {
        await updateDoc(docRef, {
        status: arrayUnion(userUID)
        });
    } else {
        await updateDoc(docRef, {
        status: arrayRemove(userUID)
        });
    }
    console.log(`Game status updated in Firestore for ${game.name}: ${action}`);
}
  
// Simplified: no "first-time" check in here
async function addGame(game) {
    const userUID = auth.currentUser.uid;
    const docName = sanitizeDocName(game.name) + "_" + game.objectId;
    const docRef = doc(db, userUID, docName);

    await setDoc(docRef, {
	    name: game.name,
	    objectId: game.objectId,
	    thumbnail: game.thumbnail,
	    newGame: game.newGame || "N",
	    status: []
    });

    console.log(`Created/updated doc in top-level collection ${userUID}: ${docName}`);
}

async function removeGame(game) {
  const userUID = auth.currentUser.uid;
  const docName = sanitizeDocName(game.name) + "_" + game.objectId;
  const docRef = doc(db, userUID, docName);

  try {
    await deleteDoc(docRef);
    console.log(`Deleted doc '${docName}' from collection '${userUID}'`);
  } catch (error) {
    console.error(`Error deleting doc ${docName} in collection ${userUID}:`, error);
  }
}

function showLoadingOverlay() {
    document.getElementById('loadingOverlay').style.display = 'block';
}

function hideLoadingOverlay() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

// === User List Modal Logic ===
const userListModal = document.getElementById("userListModal");
const closeUserListModal = document.getElementById("closeUserListModal");
const userListElement = document.getElementById("userList");

closeUserListModal.addEventListener("click", () => {
  userListModal.style.display = "none";
  userListElement.innerHTML = "";
});

window.addEventListener("click", (event) => {
  if (event.target === userListModal) {
    userListModal.style.display = "none";
    userListElement.innerHTML = "";
  }
});

// Fetch and display library names for a given array of user UIDs
async function showUserList(statusArray) {
  userListElement.innerHTML = "<li>Loading...</li>";

  const libraryNames = [];

  for (const uid of statusArray) {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        libraryNames.push(data.libraryName || "(Unnamed Library)");
      } else {
        libraryNames.push("(Unknown User)");
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
      libraryNames.push("(Error Loading User)");
    }
  }

  if (libraryNames.length === 0) {
    userListElement.innerHTML = "<li>No one has selected this game yet.</li>";
  } else {
    userListElement.innerHTML = libraryNames.map(name => `<li>${name}</li>`).join("");
  }

  userListModal.style.display = "block";
}