var globalXmlData = null;
var ownerGamesVisibility = {};
var currentActiveOverlays = {
    websiteOverlay: null,
    addActionOverlay: null
};

function getCollection() {
    var username = document.getElementById('bggUsername').value;
    var libraryDropdown = document.getElementById('libraryDropdown');
    var selectedLibrary = libraryDropdown.value;
    var statusDiv = document.getElementById('statusMessage');
    
    if (username && selectedLibrary && selectedLibrary !== 'newLibrary') {
        statusDiv.innerHTML = 'Fetching Collection...';
        fetch(`https://boardgamegeek.com/xmlapi2/collection?username=${encodeURIComponent(username)}&own=1&version=1`)
            .then(response => {
                if (response.status === 202) {
                    // Request is queued, show retry message and retry after some delay
                    statusDiv.innerHTML = 'Shelving Games. Please Wait...';
                    setTimeout(() => getCollection(), 10000); // Retry after 10 seconds
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
                    globalXmlData = data;
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
        } else {
            alert ('Please Choose A Library First.');
            statusDiv.innerHTML = '';
        }
    }
}

function prepareData(data) {
    var extractedData = [];
    var items = data.getElementsByTagName('item');
    var statusDiv = document.getElementById('statusMessage');

    for (var i = 0; i < items.length; i++) {
        var name = items[i].getElementsByTagName('name')[0].textContent;
        var objectId = items[i].getAttribute('objectid');
        var objectIdNum = Number(objectId); // Convert objectId to a number

        // Check if the thumbnail element exists
        var thumbnailElements = items[i].getElementsByTagName('thumbnail');
        var thumbnail = '';
        if (thumbnailElements.length > 0) {
            thumbnail = thumbnailElements[0].textContent;
        } else {
            // Set a default thumbnail or handle the absence of a thumbnail
            thumbnail = 'https://raw.githubusercontent.com/FrogCon/Library/main/no-image.png';
        }

        var status = 'N';
        extractedData.push({ name, objectId: objectIdNum, thumbnail, status });
    }

    // Display an alert with the first 10 names and ask for confirmation
    var firstSet = extractedData.slice(0, 10).map(game => game.name).join('\n');
    var confirmation = confirm(`Here are the first 10 games from this collection:\n\n${firstSet}\n\nDoes this look correct?`);

    if (confirmation) {
        fetchExistingGames().then(gamesDataFromSheet => {
            var objectIdsInXML = extractedData.map(game => game.objectId);
            var gamesToRemove = gamesDataFromSheet.filter(game => !objectIdsInXML.includes(game.objectId));

            gamesToRemove.forEach(game => {
                if (confirm(`Remove "${game.name}" from the sheet?`)) {
                    // Send removal request to Google Apps Script
                    removeFromGoogleSheet(game.objectId);
                }
            });

            var uniqueGames = extractedData.filter(game => !gamesDataFromSheet.map(g => g.objectId).includes(game.objectId));
            if (uniqueGames.length > 0) {
                sendToGoogleSheet({ games: uniqueGames });
                alert (`${uniqueGames.length} new game(s) added.`);
                statusDiv.innerHTML = '';
            } else {
                alert ('No new games to add.');
                statusDiv.innerHTML = '';
            }
        });
    } else {
        statusDiv.innerHTML = '';
    }
}

function fetchExistingGames() {
    var selectedLibrary = document.getElementById('libraryDropdown').value;
    var url = `https://script.google.com/macros/s/AKfycbxlhxw69VE2Nx-_VaGzgRj1LcogTvmcfwjoQ0n9efEpDo0S1evEC1LlDZdQV8VjHdn-cQ/exec?library=${selectedLibrary}`;

    return fetch(url)
        .then(response => response.json())
        .then(existingObjectIds => existingObjectIds)
        .catch(error => console.error('Error:', error));
}

function fetchAllGames() {
    var selectedLibrary = "ALLGAMESLIBRARY";
    var url = `https://script.google.com/macros/s/AKfycbxlhxw69VE2Nx-_VaGzgRj1LcogTvmcfwjoQ0n9efEpDo0S1evEC1LlDZdQV8VjHdn-cQ/exec?library=${selectedLibrary}`;

    return fetch(url)
        .then(response => response.json())
        .then(existingObjectIds => existingObjectIds)
        .catch(error => console.error('Error:', error));
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

function searchGames(button) {
    var libraryDropdown = document.getElementById('libraryDropdown');
    var selectedLibrary = libraryDropdown.value;

    if (selectedLibrary && selectedLibrary !== 'newLibrary') {
        var query = document.getElementById('bggSearchQuery').value;
        var searchUrl = `https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(query)}&type=boardgame`;

        fetch(searchUrl)
            .then(response => response.text())
            .then(str => (new window.DOMParser()).parseFromString(str, "text/xml"))
            .then(data => displaySearchResults(data, button));
    } else {
        alert ('Please select a library first.');
    }
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

        var status = 'N';

        // Setup click event
        resultDiv.onclick = createClickHandler(name, objectId, thumbnailImg, status, resultDiv);

        rowDiv.appendChild(resultDiv);

        // Fetch and display game details including the thumbnail
        fetchGameDetails(objectId);
    }

    button.scrollIntoView({ behavior: 'smooth' });
}

function displayGamesTab() {
    showLoadingOverlay();
    fetchAllGames().then(gamesData => {
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

        // Sort the gamesData alphabetically by the 'name' property
        var sortedGames = gamesData.sort((a, b) => {
            if (a.owner === b.owner) {
                return a.name.localeCompare(b.name);
            }
            return a.owner.localeCompare(b.owner);
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
                ownerHeader.innerHTML = `${currentOwner.charAt(0).toUpperCase()}${currentOwner.slice(1)}'s Games`;
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
            resultDiv.dataset.status = game.status;

            // Check the fourth column data and change background color if it's 'Y'
            if (game.status === 'Y') {
                resultDiv.style.backgroundColor = 'green';
            }

            var thumbnailImg = document.createElement('img');
            thumbnailImg.src = game.thumbnail; // Assuming thumbnail URL is available
            thumbnailImg.alt = game.name;
            thumbnailImg.className = 'thumbnail-img';

            var nameDiv = document.createElement('div');
            nameDiv.innerHTML = game.name;
            nameDiv.className = 'game-name';

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
                resultDiv.onclick = showOverlaysFunction(resultDiv, websiteOverlay, addActionOverlay);
                event.stopPropagation(); // Prevent triggering clicks on underlying elements
            };

            var addActionOverlay = document.createElement('div');
            addActionOverlay.style = 'position: absolute; bottom: 0; right: 0; width: 100%; height: 50%; background-color: rgba(0, 255, 0, 0.5); color: white; display: flex; justify-content: center; align-items: center; display: none;border-bottom-left-radius: 1rem; border-bottom-right-radius: 1rem; text-shadow: 2px 2px 4px #000000;';
            var addActionText = document.createElement('span');
            addActionText.textContent = 'Add / Remove';
            addActionText.style = `background-color: rgba(0, 0, 0, 0.5); padding: 0.5rem 1rem; border-radius: 0.5rem;`;
            addActionOverlay.appendChild(addActionText);
            addActionOverlay.onclick = function(event) {
                createGameClickHandler(game, resultDiv)();
                hideOverlays(websiteOverlay, addActionOverlay);
                // Re-enable showing overlays on click
                resultDiv.onclick = showOverlaysFunction(resultDiv, websiteOverlay, addActionOverlay);
                event.stopPropagation(); // Prevent triggering clicks on underlying elements
            };

            resultDiv.style.position = 'relative';
            resultDiv.appendChild(websiteOverlay);
            resultDiv.appendChild(addActionOverlay);

            // Initial click on the game item shows the overlays
            resultDiv.onclick = showOverlaysFunction(resultDiv, websiteOverlay, addActionOverlay);

            resultDiv.appendChild(thumbnailImg);
            resultDiv.appendChild(nameDiv);

            rowDiv.appendChild(resultDiv);
        });

        hideLoadingOverlay();

        checkbox.addEventListener('change', function() {
            var allGameItems = document.querySelectorAll('.result-item');
            allGameItems.forEach(item => {
                // Assuming the game status is stored in a data attribute or can be inferred from the item
                var status = item.dataset.status; // Update according to how you store the status
                if (this.checked) {
                    if (status === 'N') {
                        item.style.display = 'none'; // Hide games with "N" status
                    }
                } else {
                    item.style.display = ''; // Show all games
                }
            });
        });
    });
}

function showOverlaysFunction(resultDiv, websiteOverlay, addActionOverlay) {
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
    var libraryDropdown = document.getElementById('libraryDropdown');
    var selectedLibrary = libraryDropdown.value;

    if (selectedLibrary && selectedLibrary !== 'newLibrary') {
        fetchExistingGames().then(gamesData => {
            var gamesDiv = document.getElementById('libraryResults');
            gamesDiv.innerHTML = ''; // Clear previous content and add title

            // Sort the gamesData alphabetically
            var sortedGames = gamesData.sort((a, b) => a.name.localeCompare(b.name));

            var currentRow;
            currentRow = document.createElement('div');
            currentRow.className = 'result-row';
            gamesDiv.appendChild(currentRow);

            sortedGames.forEach((game) => {
                var resultDiv = document.createElement('div');
                resultDiv.className = 'result-item';

                // Check the fourth column data and change background color if it's 'Y'
                if (game.status === 'Y') {
                    resultDiv.style.backgroundColor = 'green';
                }

                var thumbnailImg = document.createElement('img');
                thumbnailImg.src = game.thumbnail; // Assuming thumbnail URL is available
                thumbnailImg.alt = game.name;
                thumbnailImg.className = 'thumbnail-img';

                var nameDiv = document.createElement('div');
                nameDiv.innerHTML = game.name;
                nameDiv.className = 'game-name';

                resultDiv.onclick = createRemoveClickHandler(game, resultDiv);

                resultDiv.appendChild(thumbnailImg);
                resultDiv.appendChild(nameDiv);

                currentRow.appendChild(resultDiv);
            });
        });
        button.scrollIntoView({ behavior: 'smooth' });
    } else {
        alert('Select A Library First');
    }
}

function toggleOwnerGames(ownerDiv) {
    // Toggle showing or hiding the list of games for the owner
    ownerDiv.style.display = ownerDiv.style.display === 'none' ? 'block' : 'none';
}

function createClickHandler(name, objectId, thumbnailImg, status, resultDiv) {
    return function() {
        var extractedData = [{ name, objectId: Number(objectId), thumbnail: thumbnailImg.src, status }];
        
        fetchExistingGames().then(gamesDataFromSheet => {
            var uniqueGames = extractedData.filter(game => !gamesDataFromSheet.map(g => g.objectId).includes(game.objectId));
            if (uniqueGames.length > 0) {
                sendToGoogleSheet({ games: uniqueGames });
            } else {
                alert ('Game Was Already In Library');
            }
        });

        //sendToGoogleSheet({ games: [{ name, objectId: Number(objectId), thumbnail: thumbnailImg.src, status }] });

        // Update the background color
        resultDiv.style.backgroundColor = 'green';
        resultDiv.style.animation = 'spin-grow 1s linear forwards';
    };
}

function createRemoveClickHandler(game, resultDiv) {
    return function() {
        removeFromGoogleSheet(game.objectId);

        // Apply CSS animation
        resultDiv.style.backgroundColor = 'red';
        resultDiv.style.animation = 'spin-shrink-fade 1s ease-out forwards';

        // Remove the element from the DOM after the animation ends
        resultDiv.addEventListener('animationend', function() {
            resultDiv.remove();
        });
    };
}

function createGameClickHandler(game, resultDiv) {
    return function() {
        if (game.animating) return; // Prevent handling clicks if animation is ongoing

        game.animating = true; // Set the animating flag

        // Toggle the fourth column value
        game.status = (game.status === 'Y' ? 'N' : 'Y');
        resultDiv.dataset.status = game.status;
        updateGameInSheet(game);

        // Update the background color
        resultDiv.style.backgroundColor = game.status === 'Y' ? 'green' : '#f0f0f0';
        resultDiv.style.animation = 'spin-grow 1s linear forwards';

        resultDiv.addEventListener('animationend', function() {
            resultDiv.style.animation ='';
            game.animating = false;
        }, {once:true});
    };
}

function createOwnerHeaderClickHandler(ownerHeader, ownerDiv) {
    return function() {
        toggleOwnerGames(ownerDiv);
        ownerHeader.scrollIntoView({ behavior: 'smooth' });
    };
}

function updateGameInSheet(game) {
    // Define the payload to send to the Google Apps Script
    const payload = {
        action: 'update',
        objectId: game.objectId,
        newHighlightValue: game.status
    };

    // Send the update request to the Google Apps Script Web App
    var selectedLibrary = game.owner;
    var url = `https://script.google.com/macros/s/AKfycbxlhxw69VE2Nx-_VaGzgRj1LcogTvmcfwjoQ0n9efEpDo0S1evEC1LlDZdQV8VjHdn-cQ/exec?library=${selectedLibrary}`;
    fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    })
    .then(response => console.log('Sheet updated'))
    .catch(error => console.error('Error:', error));
}

function sendToGoogleSheet(data) {
    var selectedLibrary = document.getElementById('libraryDropdown').value;
    var url = `https://script.google.com/macros/s/AKfycbxlhxw69VE2Nx-_VaGzgRj1LcogTvmcfwjoQ0n9efEpDo0S1evEC1LlDZdQV8VjHdn-cQ/exec?library=${selectedLibrary}`;
    fetch(url, {
        method: 'POST',
        mode: 'no-cors', // As Google Apps Script does not support CORS
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
    .then(response => console.log('Data sent to Google Sheets'))
    .catch(error => console.error('Error:', error));
}

function removeFromGoogleSheet(objectId) {
    var selectedLibrary = document.getElementById('libraryDropdown').value;
    var url = `https://script.google.com/macros/s/AKfycbxlhxw69VE2Nx-_VaGzgRj1LcogTvmcfwjoQ0n9efEpDo0S1evEC1LlDZdQV8VjHdn-cQ/exec?library=${selectedLibrary}`;
    const payload = {
        action: 'remove',
        objectId: objectId
    };

    fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    })
    .then(response => console.log('Row removed'))
    .catch(error => console.error('Error:', error));
}

function populateLibraryDropdown() {
    showLoadingOverlay();
    fetch('https://script.google.com/macros/s/AKfycbxlhxw69VE2Nx-_VaGzgRj1LcogTvmcfwjoQ0n9efEpDo0S1evEC1LlDZdQV8VjHdn-cQ/exec?type=sheetNames')
        .then(response => response.json())
        .then(sheetNames => {
            const libraryDropdown = document.getElementById('libraryDropdown');
            // Keep the first two options and remove the rest
            libraryDropdown.length = 2;
            libraryDropdown.selectedIndex = 0;

            // Sort sheet names alphabetically
            sheetNames.sort((a, b) => a.localeCompare(b));

            sheetNames.forEach(name => {
                let option = document.createElement('option');
                option.value = name.toLowerCase();
                option.textContent = name.charAt(0).toUpperCase() + name.slice(1);
                libraryDropdown.appendChild(option);
            });
            hideLoadingOverlay();
        })
    .catch(error => console.error('Error fetching sheet names:', error));
}

function handleLibraryChange() {
    var libraryDropdown = document.getElementById('libraryDropdown');
    var selectedValue = libraryDropdown.value;

    if (selectedValue === 'newLibrary') {
        var newLibraryName = prompt("Please enter a name for the new library:");
        if (newLibraryName) {
            // Add the new library to the dropdown
            var newOption = document.createElement('option');
            newOption.value = newLibraryName.toLowerCase();
            newOption.textContent = newLibraryName.charAt(0).toUpperCase() + newLibraryName.slice(1);
            libraryDropdown.add(newOption, libraryDropdown.options[libraryDropdown.options.length - 1]);

            // Select the newly added library
            libraryDropdown.value = newLibraryName.toLowerCase();
        } else {
            // Reset the selection if the user cancels or enters no name
            libraryDropdown.value = '';
        }
    }
}

function showLoadingOverlay() {
    document.getElementById('loadingOverlay').style.display = 'block';
}

function hideLoadingOverlay() {
    document.getElementById('loadingOverlay').style.display = 'none';
}
