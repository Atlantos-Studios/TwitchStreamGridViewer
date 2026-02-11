class TwitchStreamViewer {
    constructor() {
        this.streams = [];
        this.hiddenStreams = this.loadHiddenStreamsFromStorage();
        this.manageMode = false;
        this.folders = this.loadFoldersFromStorage() || {};
        this.streamFolders = this.loadStreamFoldersFromStorage() || {};
        this.folderStates = this.loadFolderStatesFromStorage() || {};
        this.currentStreamForFolder = null;
        this.currentStreamForRemoval = null;
        this.currentFolderForDeletion = null;
        
        // Twitch API Configuration
        this.clientId = 'YOUR_TWITCH_CLIENT_ID'; // Enter your Twitch Client ID here
        this.streamers = this.loadStreamersFromStorage() || [
            'al3xxandra',
            'AnnieFuchsia',
            'asuna_qt',
            'Bears_Adventures',
            'DesiHeat',
            'Lmgd',
            'MeeresTV',
            'MetaGoblin',
            'Metashi12',
            'Moosfortune',
            'Morgana',
            'Niv78',
            'NoHitJerome',
            'NzSkyy',
            'Opie',
            'Payo',
            'Rycn',
            'Sakuria',
            'Scottejaye',
            'Scripe',
            'Triplebz',
            'Twickel',
            'Vareion',
            'WillE',
            'xaryu',
            'xerwo',
            'Naguura',
            'Fragnance'
        ];
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadStreams();
    }
    
    setupEventListeners() {
        document.getElementById('addStream').addEventListener('click', () => {
            this.showAddStreamPopup();
        });
        
        document.getElementById('closeAddStreamPopup').addEventListener('click', () => {
            this.closeAddStreamPopup();
        });
        
        document.getElementById('confirmAddStream').addEventListener('click', () => {
            this.confirmAddStream();
        });
        
        document.getElementById('cancelAddStream').addEventListener('click', () => {
            this.closeAddStreamPopup();
        });
        
        document.getElementById('addStreamPopup').addEventListener('click', (e) => {
            if (e.target.id === 'addStreamPopup') {
                this.closeAddStreamPopup();
            }
        });
        
        document.getElementById('addStreamNewFolderBtn').addEventListener('click', () => {
            this.toggleAddStreamNewFolderInline();
        });
        
        document.getElementById('addStreamCreateFolderBtn').addEventListener('click', () => {
            this.createFolderFromAddStreamPopup();
        });
        
        document.getElementById('addStreamNameInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.confirmAddStream();
        });
        
        document.getElementById('addStreamNewFolderName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.createFolderFromAddStreamPopup();
        });
        
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.showSettingsPopup();
        });
        
        document.getElementById('closeSettingsPopup').addEventListener('click', () => {
            this.closeSettingsPopup();
        });
        
        document.getElementById('settingsPopup').addEventListener('click', (e) => {
            if (e.target.id === 'settingsPopup') {
                this.closeSettingsPopup();
            }
        });
        
        document.getElementById('saveStreams').addEventListener('click', () => {
            this.saveStreamsToFile();
        });
        
        document.getElementById('loadStreams').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });
        
        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.loadStreamsFromFile(e);
        });
        
        document.getElementById('clearStreams').addEventListener('click', () => {
            this.clearAllStreams();
        });
        
        document.getElementById('addFolder').addEventListener('click', () => {
            this.addNewFolder();
        });
        
        document.getElementById('bulkImport').addEventListener('click', () => {
            this.showBulkImportPopup();
        });
        
        document.getElementById('closeBulkImportPopup').addEventListener('click', () => {
            this.closeBulkImportPopup();
        });
        
        document.getElementById('confirmBulkImport').addEventListener('click', () => {
            this.confirmBulkImport();
        });
        
        document.getElementById('cancelBulkImport').addEventListener('click', () => {
            this.closeBulkImportPopup();
        });
        
        document.getElementById('bulkImportPopup').addEventListener('click', (e) => {
            if (e.target.id === 'bulkImportPopup') {
                this.closeBulkImportPopup();
            }
        });
        
        document.getElementById('bulkImportNewFolderBtn').addEventListener('click', () => {
            this.toggleBulkImportNewFolderInline();
        });
        
        document.getElementById('bulkImportCreateFolderBtn').addEventListener('click', () => {
            this.createFolderFromBulkImport();
        });
        
        document.getElementById('bulkImportNewFolderName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.createFolderFromBulkImport();
        });
        
        // Folder popup event listeners
        document.getElementById('closeFolderPopup').addEventListener('click', () => {
            this.closeFolderPopup();
        });
        
        document.getElementById('assignToFolder').addEventListener('click', () => {
            this.assignSelectedFolder();
        });
        
        document.getElementById('removeFromFolder').addEventListener('click', () => {
            this.removeFromSelectedFolder();
        });
        
        document.getElementById('cancelFolderSelection').addEventListener('click', () => {
            this.closeFolderPopup();
        });
        
        // Close popup when clicking outside
        document.getElementById('folderPopup').addEventListener('click', (e) => {
            if (e.target.id === 'folderPopup') {
                this.closeFolderPopup();
            }
        });
        
        // Remove popup event listeners
        document.getElementById('closeRemovePopup').addEventListener('click', () => {
            this.closeRemovePopup();
        });
        
        document.getElementById('confirmRemove').addEventListener('click', () => {
            this.confirmRemoveStream();
        });
        
        document.getElementById('cancelRemove').addEventListener('click', () => {
            this.closeRemovePopup();
        });
        
        // Close remove popup when clicking outside
        document.getElementById('removePopup').addEventListener('click', (e) => {
            if (e.target.id === 'removePopup') {
                this.closeRemovePopup();
            }
        });
        
        // Delete folder popup event listeners
        document.getElementById('closeDeleteFolderPopup').addEventListener('click', () => {
            this.closeDeleteFolderPopup();
        });
        
        document.getElementById('confirmDeleteFolder').addEventListener('click', () => {
            this.confirmDeleteFolder();
        });
        
        document.getElementById('cancelDeleteFolder').addEventListener('click', () => {
            this.closeDeleteFolderPopup();
        });
        
        document.getElementById('deleteFolderPopup').addEventListener('click', (e) => {
            if (e.target.id === 'deleteFolderPopup') {
                this.closeDeleteFolderPopup();
            }
        });
        
        // Add folder popup event listeners
        document.getElementById('closeAddFolderPopup').addEventListener('click', () => {
            this.closeAddFolderPopup();
        });
        
        document.getElementById('createFolder').addEventListener('click', () => {
            this.createFolderFromPopup();
        });
        
        document.getElementById('cancelAddFolder').addEventListener('click', () => {
            this.closeAddFolderPopup();
        });
        
        // Close add folder popup when clicking outside
        document.getElementById('addFolderPopup').addEventListener('click', (e) => {
            if (e.target.id === 'addFolderPopup') {
                this.closeAddFolderPopup();
            }
        });
        
        // Enter key support for folder input
        document.getElementById('folderNameInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.createFolderFromPopup();
            }
        });
        
        // Clear popup event listeners
        document.getElementById('closeClearPopup').addEventListener('click', () => {
            this.closeClearPopup();
        });
        
        document.getElementById('confirmClear').addEventListener('click', () => {
            this.confirmClearStreams();
        });
        
        document.getElementById('cancelClear').addEventListener('click', () => {
            this.closeClearPopup();
        });
        
        // Close clear popup when clicking outside
        document.getElementById('clearPopup').addEventListener('click', (e) => {
            if (e.target.id === 'clearPopup') {
                this.closeClearPopup();
            }
        });
    }
    
    async loadStreams() {
        const grid = document.getElementById('streamsGrid');
        grid.innerHTML = '<div class="loading">Loading Streams...</div>';
        
        try {
            // Simulate Twitch API call (since we don't have a real Client ID)
            await this.simulateStreamData();
            this.renderStreams();
        } catch (error) {
            console.error('Error loading streams:', error);
            grid.innerHTML = '<div class="error">Error loading streams. Please try again.</div>';
        }
    }
    
    async simulateStreamData() {
        // Simulate stream data for demo purposes
        this.streams = this.streamers.map((streamer, index) => ({
            id: streamer,
            name: streamer,
            displayName: streamer.charAt(0).toUpperCase() + streamer.slice(1),
            isLive: Math.random() > 0.3 // 70% chance of being live for demo
        }));
    }
    
    
    renderStreams() {
        const grid = document.getElementById('streamsGrid');
        grid.innerHTML = '';
        
        this.streams.forEach(stream => {
            if (this.hiddenStreams.has(stream.id)) {
                return; // Überspringe ausgeblendete Streams
            }
            
            const streamElement = this.createStreamElement(stream);
            grid.appendChild(streamElement);
        });
        
        this.updateHiddenStreamsList();
    }
    
    createStreamElement(stream) {
        const streamDiv = document.createElement('div');
        streamDiv.className = 'stream-item';
        streamDiv.id = `stream-${stream.id}`;
        
        const iframeContainer = document.createElement('div');
        iframeContainer.className = 'stream-iframe';
        
        // Create iframe with better error handling
        const iframe = document.createElement('iframe');
        iframe.src = `https://player.twitch.tv/?channel=${stream.id}&parent=${window.location.hostname}&autoplay=false&muted=true&allowfullscreen=true&allowscriptaccess=always&playsinline=true&controls=true`;
        iframe.allowFullscreen = true;
        iframe.setAttribute('allow', 'fullscreen; autoplay; encrypted-media');
        iframe.setAttribute('allowfullscreen', 'true');
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('scrolling', 'no');
        
        // Add error handling for iframe
        iframe.onerror = () => {
            console.log(`Stream ${stream.id} failed to load - likely offline`);
        };
        
        iframeContainer.appendChild(iframe);
        
        const infoDiv = document.createElement('div');
        infoDiv.className = 'stream-info';
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'stream-name';
        nameSpan.textContent = stream.displayName;
        
        const hideBtn = document.createElement('button');
        hideBtn.className = 'hide-stream-btn';
        hideBtn.textContent = 'Hide';
        hideBtn.addEventListener('click', () => this.hideStream(stream.id));
        
        const infoBtn = document.createElement('button');
        infoBtn.className = 'stream-info-btn';
        infoBtn.textContent = 'Info';
        infoBtn.addEventListener('click', () => this.openOnTwitchAbout(stream.id));
        
        const openTwitchBtn = document.createElement('button');
        openTwitchBtn.className = 'open-twitch-btn';
        openTwitchBtn.textContent = 'Twitch';
        openTwitchBtn.addEventListener('click', () => this.openOnTwitch(stream.id));
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-stream-btn';
        removeBtn.textContent = 'X';
        removeBtn.addEventListener('click', () => this.removeStream(stream.id));
        
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'stream-buttons';
        buttonContainer.appendChild(hideBtn);
        buttonContainer.appendChild(infoBtn);
        buttonContainer.appendChild(openTwitchBtn);
        buttonContainer.appendChild(removeBtn);
        
        infoDiv.appendChild(nameSpan);
        infoDiv.appendChild(buttonContainer);
        
        streamDiv.appendChild(iframeContainer);
        streamDiv.appendChild(infoDiv);
        
        // Add folder button after element is created
        this.updateStreamFolderButton(streamDiv, stream.id);
        
        return streamDiv;
    }
    
    hideStream(streamId) {
        this.hiddenStreams.add(streamId);
        this.saveHiddenStreamsToStorage();
        const streamElement = document.getElementById(`stream-${streamId}`);
        if (streamElement) {
            streamElement.classList.add('hidden');
        }
        this.updateHiddenStreamsList();
    }
    
    showStream(streamId) {
        this.hiddenStreams.delete(streamId);
        this.saveHiddenStreamsToStorage();
        let streamElement = document.getElementById(`stream-${streamId}`);
        if (streamElement) {
            streamElement.classList.remove('hidden');
        } else {
            // Stream was hidden at load time – no DOM element exists; create and append it
            const stream = this.streams.find(s => s.id === streamId);
            if (stream) {
                streamElement = this.createStreamElement(stream);
                document.getElementById('streamsGrid').appendChild(streamElement);
            }
        }
        this.updateHiddenStreamsList();
    }
    
    // Method to refresh only hidden streams list without affecting running streams
    refreshHiddenStreamsList() {
        this.updateHiddenStreamsList();
    }
    
    updateHiddenStreamsList() {
        const list = document.getElementById('hiddenStreamsList');
        const hiddenStreams = Array.from(this.hiddenStreams);
        
        // Group hidden streams by folder
        const streamsByFolder = {};
        let streamsWithoutFolder = [];
        
        hiddenStreams.forEach(streamId => {
            const stream = this.streams.find(s => s.id === streamId);
            if (stream) {
                const folderName = this.streamFolders[streamId];
                if (folderName) {
                    if (!streamsByFolder[folderName]) {
                        streamsByFolder[folderName] = [];
                    }
                    streamsByFolder[folderName].push({ id: streamId, stream });
                } else {
                    streamsWithoutFolder.push({ id: streamId, stream });
                }
            }
        });
        
        list.innerHTML = '';
        
        // Show all folders (even empty) so "Hide all" can be used
        const folderNames = Object.keys(this.folders || {}).sort();
        folderNames.forEach(folderName => {
            const streams = streamsByFolder[folderName] || [];
            const folderSection = this.createFolderSection(folderName, streams);
            list.appendChild(folderSection);
        });
        
        // Always show "No Folder" section (streams without folder assignment)
        const noFolderSection = this.createFolderSection('No Folder', streamsWithoutFolder);
        list.appendChild(noFolderSection);
    }
    
    getStreamIdsInFolder(folderName) {
        if (folderName === 'No Folder') {
            return this.streamers.filter(id => !this.streamFolders[id]);
        }
        return this.streamers.filter(id => this.streamFolders[id] === folderName);
    }
    
    hideAllInFolder(folderName) {
        this.getStreamIdsInFolder(folderName).forEach(id => this.hideStream(id));
    }
    
    showAllInFolder(streams) {
        streams.forEach(({ id: streamId }) => this.showStream(streamId));
    }
    
    showDeleteFolderPopup(folderName) {
        if (folderName === 'No Folder') return;
        this.currentFolderForDeletion = folderName;
        const message = document.getElementById('deleteFolderMessage');
        message.textContent = `Delete folder "${folderName}"? All streamers in this folder will be moved to "No Folder".`;
        document.getElementById('deleteFolderPopup').style.display = 'flex';
    }
    
    closeDeleteFolderPopup() {
        document.getElementById('deleteFolderPopup').style.display = 'none';
        this.currentFolderForDeletion = null;
    }
    
    confirmDeleteFolder() {
        const folderName = this.currentFolderForDeletion;
        if (folderName) {
            this.deleteFolder(folderName);
        }
        this.closeDeleteFolderPopup();
    }
    
    deleteFolder(folderName) {
        if (folderName === 'No Folder') return;
        if (!this.folders[folderName]) return;
        
        const streamIdsInFolder = this.getStreamIdsInFolder(folderName);
        streamIdsInFolder.forEach(streamId => {
            delete this.streamFolders[streamId];
        });
        delete this.folders[folderName];
        delete this.folderStates[folderName];
        
        this.saveFoldersToStorage();
        this.saveStreamFoldersToStorage();
        this.saveFolderStatesToStorage();
        
        streamIdsInFolder.forEach(streamId => {
            const streamElement = document.getElementById(`stream-${streamId}`);
            if (streamElement) {
                this.updateStreamFolderButton(streamElement, streamId);
            }
        });
        
        this.updateHiddenStreamsList();
        this.showNotification(`Folder "${folderName}" deleted.`, 'success');
    }
    
    createFolderSection(folderName, streams) {
        const folderSection = document.createElement('div');
        folderSection.className = 'folder-section';
        folderSection.dataset.folderName = folderName;
        
        const folderHeader = document.createElement('div');
        folderHeader.className = 'folder-header';
        
        const titleRow = document.createElement('div');
        titleRow.className = 'folder-title-row';
        titleRow.addEventListener('click', () => this.toggleFolder(folderSection));
        
        const folderTitle = document.createElement('span');
        folderTitle.className = 'folder-title';
        folderTitle.textContent = folderName;
        
        const count = this.getStreamIdsInFolder(folderName).length;
        const badge = document.createElement('span');
        badge.className = 'folder-count-badge';
        badge.textContent = count;
        
        titleRow.appendChild(folderTitle);
        titleRow.appendChild(badge);
        
        const headerActions = document.createElement('div');
        headerActions.className = 'folder-header-actions';
        
        const hideAllBtn = document.createElement('button');
        hideAllBtn.className = 'folder-action-btn hide-all-btn';
        hideAllBtn.textContent = 'Hide all';
        hideAllBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.hideAllInFolder(folderName);
        });
        
        const showAllBtn = document.createElement('button');
        showAllBtn.className = 'folder-action-btn show-all-btn';
        showAllBtn.textContent = 'Show all';
        showAllBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showAllInFolder(streams);
        });
        
        headerActions.appendChild(hideAllBtn);
        headerActions.appendChild(showAllBtn);
        
        if (folderName !== 'No Folder') {
            const deleteFolderBtn = document.createElement('button');
            deleteFolderBtn.className = 'folder-action-btn delete-folder-btn';
            deleteFolderBtn.textContent = 'X';
            deleteFolderBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showDeleteFolderPopup(folderName);
            });
            headerActions.appendChild(deleteFolderBtn);
        }
        
        folderHeader.appendChild(titleRow);
        folderHeader.appendChild(headerActions);
        
        const folderContent = document.createElement('div');
        folderContent.className = 'folder-content';
        
        // Check if folder should be expanded based on saved state
        const isExpanded = this.folderStates[folderName] === true;
        if (isExpanded) {
            folderContent.classList.add('expanded');
        }
        
        streams.forEach(({ id: streamId, stream }) => {
            const item = document.createElement('div');
            item.className = 'hidden-stream-item';
            
            const nameSpan = document.createElement('span');
            nameSpan.className = 'hidden-stream-name';
            nameSpan.textContent = stream.displayName;
            
            const showBtn = document.createElement('button');
            showBtn.className = 'show-stream-btn';
            showBtn.textContent = 'Show';
            showBtn.addEventListener('click', () => this.showStream(streamId));
            
            item.appendChild(nameSpan);
            item.appendChild(showBtn);
            folderContent.appendChild(item);
        });
        
        folderSection.appendChild(folderHeader);
        folderSection.appendChild(folderContent);
        
        return folderSection;
    }
    
    toggleFolder(folderSection) {
        const content = folderSection.querySelector('.folder-content');
        const folderName = folderSection.dataset.folderName;
        
        if (content.classList.contains('expanded')) {
            content.classList.remove('expanded');
            this.folderStates[folderName] = false;
        } else {
            content.classList.add('expanded');
            this.folderStates[folderName] = true;
        }
        
        // Save folder state to storage
        this.saveFolderStatesToStorage();
    }
    
    
    
    // Stream Management Functions
    showAddStreamPopup() {
        const popup = document.getElementById('addStreamPopup');
        document.getElementById('addStreamNameInput').value = '';
        this.populateAddStreamFolderDropdown();
        document.getElementById('addStreamFolderSelect').value = '';
        this.hideAddStreamNewFolderInline();
        popup.style.display = 'flex';
        document.getElementById('addStreamNameInput').focus();
    }
    
    closeAddStreamPopup() {
        document.getElementById('addStreamPopup').style.display = 'none';
        document.getElementById('addStreamNameInput').value = '';
        this.hideAddStreamNewFolderInline();
    }
    
    populateAddStreamFolderDropdown() {
        const select = document.getElementById('addStreamFolderSelect');
        const currentOptions = select.querySelectorAll('option');
        currentOptions.forEach((opt, i) => { if (i > 0) opt.remove(); });
        
        Object.keys(this.folders || {}).sort().forEach(folderName => {
            const option = document.createElement('option');
            option.value = folderName;
            option.textContent = folderName;
            select.appendChild(option);
        });
    }
    
    toggleAddStreamNewFolderInline() {
        const inline = document.getElementById('addStreamNewFolderInline');
        if (inline.style.display === 'none') {
            inline.style.display = 'flex';
            document.getElementById('addStreamNewFolderName').value = '';
            document.getElementById('addStreamNewFolderName').focus();
        } else {
            this.hideAddStreamNewFolderInline();
        }
    }
    
    hideAddStreamNewFolderInline() {
        const inline = document.getElementById('addStreamNewFolderInline');
        inline.style.display = 'none';
        document.getElementById('addStreamNewFolderName').value = '';
    }
    
    createFolderFromAddStreamPopup() {
        const input = document.getElementById('addStreamNewFolderName');
        const folderName = input.value.trim();
        
        if (!folderName) {
            this.showNotification('Please enter a folder name.', 'error');
            return;
        }
        
        if (this.folders[folderName]) {
            this.showNotification('Folder already exists.', 'error');
            return;
        }
        
        this.folders[folderName] = {
            name: folderName,
            created: new Date().toISOString()
        };
        this.saveFoldersToStorage();
        
        this.populateAddStreamFolderDropdown();
        document.getElementById('addStreamFolderSelect').value = folderName;
        this.hideAddStreamNewFolderInline();
        this.updateHiddenStreamsList();
        this.showNotification(`Created folder: ${folderName}`, 'success');
    }
    
    confirmAddStream() {
        const input = document.getElementById('addStreamNameInput');
        const streamName = input.value.trim().toLowerCase();
        const selectedFolder = document.getElementById('addStreamFolderSelect').value.trim();
        
        if (!streamName) {
            this.showNotification('Please enter a streamer name.', 'error');
            return;
        }
        
        if (this.streamers.includes(streamName)) {
            this.showNotification('This streamer is already in the list!', 'error');
            return;
        }
        
        if (!/^[a-zA-Z0-9_]+$/.test(streamName)) {
            this.showNotification('Streamer name can only contain letters, numbers and underscores!', 'error');
            return;
        }
        
        this.streamers.push(streamName);
        this.saveStreamersToStorage();
        this.addSingleStream(streamName);
        if (selectedFolder) {
            this.assignStreamToFolder(streamName, selectedFolder);
        }
        
        this.closeAddStreamPopup();
        const folderMsg = selectedFolder ? ` (assigned to "${selectedFolder}")` : '';
        this.showNotification(`Streamer "${streamName}" has been added!${folderMsg}`, 'success');
    }
    
    showBulkImportPopup() {
        const popup = document.getElementById('bulkImportPopup');
        const textarea = document.getElementById('bulkImportInput');
        textarea.value = '';
        this.populateBulkImportFolderDropdown();
        document.getElementById('bulkImportFolderSelect').value = '';
        this.hideBulkImportNewFolderInline();
        popup.style.display = 'flex';
        textarea.focus();
    }
    
    closeBulkImportPopup() {
        document.getElementById('bulkImportPopup').style.display = 'none';
        document.getElementById('bulkImportInput').value = '';
        this.hideBulkImportNewFolderInline();
    }
    
    populateBulkImportFolderDropdown() {
        const select = document.getElementById('bulkImportFolderSelect');
        const currentOptions = select.querySelectorAll('option');
        currentOptions.forEach((opt, i) => { if (i > 0) opt.remove(); });
        
        Object.keys(this.folders || {}).sort().forEach(folderName => {
            const option = document.createElement('option');
            option.value = folderName;
            option.textContent = folderName;
            select.appendChild(option);
        });
    }
    
    toggleBulkImportNewFolderInline() {
        const inline = document.getElementById('bulkImportNewFolderInline');
        if (inline.style.display === 'none') {
            inline.style.display = 'flex';
            document.getElementById('bulkImportNewFolderName').value = '';
            document.getElementById('bulkImportNewFolderName').focus();
        } else {
            this.hideBulkImportNewFolderInline();
        }
    }
    
    hideBulkImportNewFolderInline() {
        const inline = document.getElementById('bulkImportNewFolderInline');
        inline.style.display = 'none';
        document.getElementById('bulkImportNewFolderName').value = '';
    }
    
    createFolderFromBulkImport() {
        const input = document.getElementById('bulkImportNewFolderName');
        const folderName = input.value.trim();
        
        if (!folderName) {
            this.showNotification('Please enter a folder name.', 'error');
            return;
        }
        
        if (this.folders[folderName]) {
            this.showNotification('Folder already exists.', 'error');
            return;
        }
        
        this.folders[folderName] = {
            name: folderName,
            created: new Date().toISOString()
        };
        this.saveFoldersToStorage();
        
        this.populateBulkImportFolderDropdown();
        document.getElementById('bulkImportFolderSelect').value = folderName;
        this.hideBulkImportNewFolderInline();
        this.updateHiddenStreamsList();
        this.showNotification(`Created folder: ${folderName}`, 'success');
    }
    
    confirmBulkImport() {
        const textarea = document.getElementById('bulkImportInput');
        const raw = textarea.value.trim();
        const folderSelect = document.getElementById('bulkImportFolderSelect');
        const selectedFolder = folderSelect.value.trim();
        
        if (!raw) {
            this.showNotification('Please enter at least one streamer name.', 'error');
            return;
        }
        
        const names = raw
            .split(/[\n,;]+/)
            .map(s => s.trim().toLowerCase())
            .filter(s => s.length > 0);
        
        const validPattern = /^[a-zA-Z0-9_]+$/;
        const added = [];
        const skipped = [];
        
        for (const name of names) {
            if (!validPattern.test(name)) {
                skipped.push(name);
                continue;
            }
            if (this.streamers.includes(name)) {
                skipped.push(name);
                continue;
            }
            this.streamers.push(name);
            this.saveStreamersToStorage();
            this.addSingleStream(name);
            added.push(name);
            if (selectedFolder) {
                this.assignStreamToFolder(name, selectedFolder);
            }
        }
        
        this.closeBulkImportPopup();
        
        if (added.length > 0) {
            this.updateHiddenStreamsList();
            const folderMsg = selectedFolder ? ` (assigned to "${selectedFolder}")` : '';
            this.showNotification(`${added.length} streamer(s) added${folderMsg}. ${skipped.length} skipped (duplicates or invalid).`, 'success');
        } else {
            this.showNotification('No new streamers added. Check for duplicates or invalid names (letters, numbers, underscores only).', 'warning');
        }
    }
    
    async addSingleStream(streamName) {
        // Create stream data for the new stream
        const newStream = {
            id: streamName,
            name: streamName,
            displayName: streamName.charAt(0).toUpperCase() + streamName.slice(1),
            isLive: Math.random() > 0.3 // 70% chance of being live for demo
        };
        
        // Add to streams array
        this.streams.push(newStream);
        
        // Create and add the stream element to the grid
        const streamElement = this.createStreamElement(newStream);
        const grid = document.getElementById('streamsGrid');
        grid.appendChild(streamElement);
    }
    
    removeStream(streamName) {
        this.currentStreamForRemoval = streamName;
        this.showRemovePopup(streamName);
    }
    
    showRemovePopup(streamName) {
        const popup = document.getElementById('removePopup');
        const message = document.getElementById('removeMessage');
        
        message.textContent = `Are you sure you want to remove "${streamName}"?`;
        popup.style.display = 'flex';
    }
    
    closeRemovePopup() {
        const popup = document.getElementById('removePopup');
        popup.style.display = 'none';
        this.currentStreamForRemoval = null;
    }
    
    confirmRemoveStream() {
        const streamName = this.currentStreamForRemoval;
        
        this.streamers = this.streamers.filter(s => s !== streamName);
        this.hiddenStreams.delete(streamName);
        this.saveStreamersToStorage();
        this.saveHiddenStreamsToStorage();
        
        // Remove from streams array
        this.streams = this.streams.filter(s => s.id !== streamName);
        
        // Remove stream element from grid
        const streamElement = document.getElementById(`stream-${streamName}`);
        if (streamElement) {
            streamElement.remove();
        }
        
        this.updateHiddenStreamsList();
        this.showNotification(`Streamer "${streamName}" has been removed!`, 'info');
        this.closeRemovePopup();
    }
    
    openOnTwitch(streamName) {
        const twitchUrl = `https://www.twitch.tv/${streamName}`;
        window.open(twitchUrl, '_blank');
    }
    
    openOnTwitchAbout(streamName) {
        const twitchUrl = `https://www.twitch.tv/${streamName}/about`;
        window.open(twitchUrl, '_blank');
    }
    
    // File operations for save/load
    saveStreamsToFile() {
        const data = {
            streamers: this.streamers,
            streams: this.streams,
            hiddenStreams: Array.from(this.hiddenStreams),
            folders: this.folders,
            streamFolders: this.streamFolders,
            folderStates: this.folderStates,
            timestamp: new Date().toISOString()
        };
        
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `twitch-streams-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('Streams saved to file!', 'success');
    }
    
    loadStreamsFromFile(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.streamers && Array.isArray(data.streamers)) {
                    // Load all data
                    this.streamers = data.streamers;
                    this.hiddenStreams = new Set(data.hiddenStreams || []);
                    
                    // Load streams data if available
                    if (data.streams) {
                        this.streams = data.streams;
                    } else {
                        // Fallback: regenerate streams from streamers
                        this.streams = this.streamers.map((streamer, index) => ({
                            id: streamer,
                            name: streamer,
                            displayName: streamer.charAt(0).toUpperCase() + streamer.slice(1),
                            isLive: Math.random() > 0.3
                        }));
                    }
                    
                    // Load folder data (use empty objects if missing, e.g. older save files)
                    this.folders = data.folders && typeof data.folders === 'object' ? data.folders : {};
                    this.streamFolders = data.streamFolders && typeof data.streamFolders === 'object' ? data.streamFolders : {};
                    this.folderStates = data.folderStates && typeof data.folderStates === 'object' ? data.folderStates : {};
                    
                    // Save all data to localStorage
                    this.saveStreamersToStorage();
                    this.saveHiddenStreamsToStorage();
                    this.saveFoldersToStorage();
                    this.saveStreamFoldersToStorage();
                    this.saveFolderStatesToStorage();
                    
                    // Render streams directly instead of reloading
                    this.renderStreams();
                    
                    const folderCount = Object.keys(this.folders).length;
                    this.showNotification(`Loaded ${data.streamers.length} streams and ${folderCount} folders from file!`, 'success');
                    this.closeSettingsPopup();
                } else {
                    throw new Error('Invalid file format');
                }
            } catch (error) {
                console.error('Error loading file:', error);
                this.showNotification('Error loading file. Please check the file format.', 'error');
            }
        };
        
        reader.readAsText(file);
        
        // Reset file input
        event.target.value = '';
    }
    
    clearAllStreams() {
        this.showClearPopup();
    }
    
    showClearPopup() {
        this.closeSettingsPopup();
        const popup = document.getElementById('clearPopup');
        popup.style.display = 'flex';
    }
    
    closeClearPopup() {
        const popup = document.getElementById('clearPopup');
        popup.style.display = 'none';
    }
    
    showSettingsPopup() {
        document.getElementById('settingsPopup').style.display = 'flex';
    }
    
    closeSettingsPopup() {
        document.getElementById('settingsPopup').style.display = 'none';
    }
    
    confirmClearStreams() {
        // Clear all data (streams and folder-related state)
        this.streamers = [];
        this.streams = [];
        this.hiddenStreams.clear();
        this.folders = {};
        this.streamFolders = {};
        this.folderStates = {};
        
        // Clear all storage
        this.saveStreamersToStorage();
        this.saveHiddenStreamsToStorage();
        this.saveFoldersToStorage();
        this.saveStreamFoldersToStorage();
        this.saveFolderStatesToStorage();
        
        // Clear the grid
        const grid = document.getElementById('streamsGrid');
        grid.innerHTML = '<div class="no-streams">No streams added yet. Add some streams to get started!</div>';
        
        // Update hidden streams list (will show no folders now)
        this.updateHiddenStreamsList();
        
        this.showNotification('All streams cleared!', 'success');
        this.closeClearPopup();
    }
    
    
    // Local Storage Functions
    saveStreamersToStorage() {
        localStorage.setItem('twitchStreamers', JSON.stringify(this.streamers));
    }
    
    loadStreamersFromStorage() {
        const stored = localStorage.getItem('twitchStreamers');
        return stored ? JSON.parse(stored) : null;
    }
    
    loadHiddenStreamsFromStorage() {
        try {
            const stored = localStorage.getItem('twitchHiddenStreams');
            return stored ? new Set(JSON.parse(stored)) : new Set();
        } catch (error) {
            console.error('Error loading hidden streams from storage:', error);
            return new Set();
        }
    }
    
    saveHiddenStreamsToStorage() {
        try {
            localStorage.setItem('twitchHiddenStreams', JSON.stringify([...this.hiddenStreams]));
        } catch (error) {
            console.error('Error saving hidden streams to storage:', error);
        }
    }
    
    loadFoldersFromStorage() {
        try {
            const stored = localStorage.getItem('twitchFolders');
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.error('Error loading folders from storage:', error);
            return null;
        }
    }
    
    saveFoldersToStorage() {
        try {
            localStorage.setItem('twitchFolders', JSON.stringify(this.folders));
        } catch (error) {
            console.error('Error saving folders to storage:', error);
        }
    }
    
    loadStreamFoldersFromStorage() {
        try {
            const stored = localStorage.getItem('twitchStreamFolders');
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.error('Error loading stream folders from storage:', error);
            return null;
        }
    }
    
    saveStreamFoldersToStorage() {
        try {
            localStorage.setItem('twitchStreamFolders', JSON.stringify(this.streamFolders));
        } catch (error) {
            console.error('Error saving stream folders to storage:', error);
        }
    }
    
    loadFolderStatesFromStorage() {
        try {
            const stored = localStorage.getItem('twitchFolderStates');
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.error('Error loading folder states from storage:', error);
            return null;
        }
    }
    
    saveFolderStatesToStorage() {
        try {
            localStorage.setItem('twitchFolderStates', JSON.stringify(this.folderStates));
        } catch (error) {
            console.error('Error saving folder states to storage:', error);
        }
    }
    
    // Folder Management Functions
    addNewFolder() {
        this.showAddFolderPopup();
    }
    
    showAddFolderPopup() {
        const popup = document.getElementById('addFolderPopup');
        const input = document.getElementById('folderNameInput');
        
        input.value = '';
        popup.style.display = 'flex';
        input.focus();
    }
    
    closeAddFolderPopup() {
        const popup = document.getElementById('addFolderPopup');
        const input = document.getElementById('folderNameInput');
        
        popup.style.display = 'none';
        input.value = '';
    }
    
    createFolderFromPopup() {
        const input = document.getElementById('folderNameInput');
        const folderName = input.value.trim();
        
        if (!folderName) {
            this.showNotification('Please enter a folder name', 'error');
            return;
        }
        
        if (this.folders[folderName]) {
            this.showNotification('Folder already exists', 'error');
            return;
        }
        
        // Create new folder
        this.folders[folderName] = {
            name: folderName,
            created: new Date().toISOString()
        };
        this.saveFoldersToStorage();
        
        this.updateHiddenStreamsList();
        this.showNotification(`Created folder: ${folderName}`, 'success');
        this.closeAddFolderPopup();
    }
    
    assignStreamToFolder(streamId, folderName) {
        this.streamFolders[streamId] = folderName;
        this.saveStreamFoldersToStorage();
        
        // Update the stream element
        const streamElement = document.getElementById(`stream-${streamId}`);
        if (streamElement) {
            this.updateStreamFolderButton(streamElement, streamId);
        }
        
        this.updateHiddenStreamsList();
        this.showNotification(`Stream assigned to folder: ${folderName}`, 'success');
    }
    
    removeStreamFromFolder(streamId) {
        delete this.streamFolders[streamId];
        this.saveStreamFoldersToStorage();
        
        // Update the stream element
        const streamElement = document.getElementById(`stream-${streamId}`);
        if (streamElement) {
            this.updateStreamFolderButton(streamElement, streamId);
        }
        
        this.updateHiddenStreamsList();
        this.showNotification('Stream removed from folder', 'success');
    }
    
    updateStreamFolderButton(streamElement, streamId) {
        const buttonContainer = streamElement.querySelector('.stream-buttons');
        const existingFolderBtn = streamElement.querySelector('.folder-button, .folder-name');
        
        if (existingFolderBtn) {
            existingFolderBtn.remove();
        }
        
        const currentFolder = this.streamFolders[streamId];
        if (currentFolder) {
            // Show folder name
            const folderNameSpan = document.createElement('span');
            folderNameSpan.className = 'folder-name';
            folderNameSpan.textContent = currentFolder;
            folderNameSpan.addEventListener('click', () => this.showFolderSelection(streamId));
            buttonContainer.appendChild(folderNameSpan);
        } else {
            // Show add to folder button
            const folderBtn = document.createElement('button');
            folderBtn.className = 'folder-button';
            folderBtn.textContent = 'Add to Folder';
            folderBtn.addEventListener('click', () => this.showFolderSelection(streamId));
            buttonContainer.appendChild(folderBtn);
        }
    }
    
    showFolderSelection(streamId) {
        const folderNames = Object.keys(this.folders);
        if (folderNames.length === 0) {
            this.showNotification('No folders available. Create a folder first.', 'error');
            return;
        }
        
        this.currentStreamForFolder = streamId;
        this.populateFolderDropdown();
        this.showFolderPopup();
    }
    
    populateFolderDropdown() {
        const select = document.getElementById('folderSelect');
        select.innerHTML = '<option value="">Choose a folder...</option>';
        
        const currentFolder = this.streamFolders[this.currentStreamForFolder];
        
        Object.keys(this.folders).sort().forEach(folderName => {
            const option = document.createElement('option');
            option.value = folderName;
            option.textContent = folderName;
            if (folderName === currentFolder) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    }
    
    showFolderPopup() {
        const popup = document.getElementById('folderPopup');
        popup.style.display = 'flex';
        
        // Update button states
        const currentFolder = this.streamFolders[this.currentStreamForFolder];
        const removeBtn = document.getElementById('removeFromFolder');
        removeBtn.style.display = currentFolder ? 'block' : 'none';
    }
    
    closeFolderPopup() {
        const popup = document.getElementById('folderPopup');
        popup.style.display = 'none';
        this.currentStreamForFolder = null;
    }
    
    assignSelectedFolder() {
        const select = document.getElementById('folderSelect');
        const selectedFolder = select.value;
        
        if (!selectedFolder) {
            this.showNotification('Please select a folder', 'error');
            return;
        }
        
        this.assignStreamToFolder(this.currentStreamForFolder, selectedFolder);
        this.closeFolderPopup();
    }
    
    removeFromSelectedFolder() {
        this.removeStreamFromFolder(this.currentStreamForFolder);
        this.closeFolderPopup();
    }
    
    // Notification System
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Styling
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            animation: slideIn 0.3s ease;
            max-width: 300px;
        `;
        
        // Colors based on type
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            info: '#9146ff',
            warning: '#f59e0b'
        };
        
        notification.style.backgroundColor = colors[type] || colors.info;
        
        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateY(100%); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateY(0); opacity: 1; }
                to { transform: translateY(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    new TwitchStreamViewer();
});

