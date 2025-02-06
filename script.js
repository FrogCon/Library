var ownerGamesVisibility = {};
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

async function hasLibrary() {
    const userUID = auth.currentUser.uid

    if (!userUID) {
        console.error("No user UID provided.");
        return false;
    }

    try {
        const userDocRef = doc(db, "users", userUID);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()){
            alert("You do not have access to any libraries yet. Contact Josh for access.");
        }
        return userDoc.exists(); // Returns true if the document exists, otherwise false
    } catch (error) {
        console.error("Error checking user existence:", error);
        return false;
    }
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
document.getElementById("getCollectionButton").addEventListener("click", getBggLibrary);
document.getElementById("searchGamesButton").addEventListener("click", () => searchGames(document.getElementById("searchGamesButton")));
document.getElementById("searchLibraryButton").addEventListener("click", () => searchLibrary(document.getElementById("searchLibraryButton")));

// Automatically open the default tab on page load
document.getElementById("homeTab").click();

async function getBggLibrary() {
    if (!isLoggedIn()) return;
    const hasAccess = await hasLibrary(); // Wait for the result
    if (!hasAccess) return;
    
    var username = document.getElementById('bggUsername').value;
    var statusDiv = document.getElementById('statusMessage');
    
    if (username) {
        statusDiv.innerHTML = 'Fetching Collection...';
        fetch(`https://boardgamegeek.com/xmlapi2/collection?username=${encodeURIComponent(username)}&own=1&version=1`)
            .then(response => {
                if (response.status === 202) {
                    // Request is queued, show retry message and retry after some delay
                    statusDiv.innerHTML = 'Shelving Games. Please Wait...';
                    setTimeout(() => getBggLibrary(), 10000); // Retry after 10 seconds
                } else if (response.ok) {
                    return response.text();
                } else {
                    statusDiv.innerHTML = '';
                    throw new Error('Network response was not ok.');
                }
            })
            .then(str => {
                if (str) {
                    return (new window.DOMParser()).parseFromString(str, "text/xml");
                }
            })
            .then(data => {
                if (data) {
                    prepareData(data);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert ('An error occurred. Please try again.');
                statusDiv.innerHTML = '';
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
    const userUID = auth.currentUser.uid;
  
    // 1) Build extractedData from BGG XML
    const extractedData = [];
    const items = data.getElementsByTagName('item');
  
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
    statusDiv.innerHTML = 'Updating Database...';
  
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
            removeGame(game.objectId);
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
    const userUID = auth.currentUser.uid;  // <-- get the UID, not email
    const q = query(collection(db, "games"), where("owners", "array-contains", userUID));
    const snapshot = await getDocs(q);

    const gamesArray = [];
    snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        gamesArray.push({
            name: data.name,
            objectId: data.objectId,
            thumbnail: data.thumbnail,
            status: data.status,
            newGame: data.newGame,
            owners: data.owners    // array of UIDs
        });
    });

    return gamesArray;
}

async function fetchAllGames() {
    const gamesSnapshot = await getDocs(collection(db, "games"));
    const allGameDocs = gamesSnapshot.docs.map(docSnap => docSnap.data());

    // 1) Collect all unique owner UIDs across all games
    const uniqueOwnerUIDs = new Set();
    allGameDocs.forEach(game => {
        const ownersArray = game.owners || [];
        ownersArray.forEach(uid => uniqueOwnerUIDs.add(uid));
    });

    // 2) For each unique UID, fetch their user doc (library name)
    //    We'll build a uid -> libraryName map.
    const uidArray = [...uniqueOwnerUIDs];  // convert Set to array
    const userMap = {}; // { uid: libraryName }

    // Load each user doc, if it exists
    for (let uid of uidArray) {
        const userDocRef = doc(db, "users", uid);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
        const userData = userSnap.data();
        userMap[uid] = userData.libraryName || "(No Library Name)";
        } else {
        // If no user doc found, fallback to some default
        userMap[uid] = "(Unknown Owner)";
        }
    }

    // 3) Flatten each game doc for each owner
    //    So if a game has 2 owners, we create 2 output items
    const output = [];
    allGameDocs.forEach(gameDoc => {
        const ownersArray = gameDoc.owners || [];
        ownersArray.forEach(uid => {
            // Build a single object with the shape your display code expects
            output.push({
                owner: userMap[uid],          // e.g. "Alice's Library"
                name: gameDoc.name,
                objectId: gameDoc.objectId,
                thumbnail: gameDoc.thumbnail,
                newGame: gameDoc.newGame || "",
                status: Array.isArray(gameDoc.status) ? gameDoc.status : []
            });
        });
    });

    return output;
}

function fetchGameDetails(gameId) {
    const detailsUrl = `https://boardgamegeek.com/xmlapi2/thing?id=${gameId}&versions=1`;

    fetch(detailsUrl)
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

async function searchGames(button) {
    if (!isLoggedIn()) return;
    const hasAccess = await hasLibrary(); // Wait for the result
    if (!hasAccess) return;

    var query = document.getElementById('bggSearchQuery').value;
    var searchUrl = `https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(query)}&type=boardgame`;

    fetch(searchUrl)
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

async function searchLibrary(button) {
    if (!isLoggedIn()) return;
    const hasAccess = await hasLibrary(); // Wait for the result
    if (!hasAccess) return;

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
    // Toggle showing or hiding the list of games for the owner
    ownerDiv.style.display = ownerDiv.style.display === 'none' ? 'block' : 'none';
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
        removeGame(game.objectId);

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

async function updateGame(game, action) {
    const userUID = auth.currentUser.uid;
    const docRef = doc(db, "games", String(game.objectId));

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
    const docRef = doc(db, "games", String(game.objectId));
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
        // create brand new doc
        await setDoc(docRef, {
        objectId: game.objectId,
        name: game.name,
        thumbnail: game.thumbnail,
        newGame: game.newGame,
        status: Array.isArray(game.status) ? game.status : [],
        owners: [userUID]
        });
        console.log(`Created new doc: ${game.name} (${game.objectId})`);
    } else {
        // doc exists, arrayUnion user to owners
        await updateDoc(docRef, {
        owners: arrayUnion(userUID)
        });
        console.log(`Added owner ${userUID} to: ${game.name} (${game.objectId})`);
    }
}  

async function removeGame(objectId) {
    const userUID = auth.currentUser.uid;
    const docRef = doc(db, "games", String(objectId));
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
        console.warn(`Doc for objectId ${objectId} does not exist.`);
        return;
    }

    // Remove the user from owners
    await updateDoc(docRef, {
        owners: arrayRemove(userUID)
    });

    // Check if owners is now empty
    const updatedSnap = await getDoc(docRef);
    const updatedOwners = updatedSnap.data().owners || [];
    if (updatedOwners.length === 0) {
        // Optional: delete the document entirely if no owners remain
        await deleteDoc(docRef);
        console.log(`Deleted doc for objectId ${objectId}, as no owners remain.`);
    } else {
        console.log(`Removed UID ${userUID} from owners for objectId ${objectId}.`);
    }
}

function showLoadingOverlay() {
    document.getElementById('loadingOverlay').style.display = 'block';
}

function hideLoadingOverlay() {
    document.getElementById('loadingOverlay').style.display = 'none';
}