class TwitchStreamViewer {
    constructor() {
        this.streams = [];
        this.hiddenStreamsByWorkspace = this.loadHiddenStreamsByWorkspaceFromStorage();
        this.manageMode = false;
        this.folders = this.loadFoldersFromStorage() || {};
        this.streamFolders = this.loadStreamFoldersFromStorage() || {};
        this.folderStreamers = this.loadFolderStreamersFromStorage() || {};
        this.folderStates = this.loadFolderStatesFromStorage() || {};
        this.workspaces = this.loadWorkspacesFromStorage() || {};
        this.folderWorkspace = this.loadFolderWorkspaceFromStorage() || {};
        this.currentWorkspaceId = this.loadCurrentWorkspaceIdFromStorage();
        this.currentStreamForFolder = null;
        this.currentStreamForRemoval = null;
        this.currentFolderForDeletion = null;
        this.viewMode = this.loadViewModeFromStorage() || 'gallery';
        this.searchFilter = '';
        
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
        this.ensureWorkspaceStructure();
        this.ensureFolderStreamersFromStreamFolders();
        this.setupEventListeners();
        this.populateWorkspaceSelect();
        this.updateHeaderWorkspaceTitle();
        document.getElementById('viewGallery').classList.toggle('btn-view-active', this.viewMode === 'gallery');
        document.getElementById('viewList').classList.toggle('btn-view-active', this.viewMode === 'list');
        document.getElementById('streamsGrid').style.display = this.viewMode === 'gallery' ? '' : 'none';
        document.getElementById('streamsList').style.display = this.viewMode === 'list' ? '' : 'none';
        this.loadStreams();
    }
    
    ensureWorkspaceStructure() {
        const workspaceIds = Object.keys(this.workspaces);
        if (workspaceIds.length === 0) {
            const defaultId = 'ws-' + Date.now();
            this.workspaces[defaultId] = { name: 'Default' };
            Object.keys(this.folders || {}).forEach(folderName => {
                this.folderWorkspace[folderName] = defaultId;
            });
            this.currentWorkspaceId = defaultId;
            this.saveWorkspacesToStorage();
            this.saveFolderWorkspaceToStorage();
            this.saveCurrentWorkspaceIdToStorage();
        } else if (!this.currentWorkspaceId || !this.workspaces[this.currentWorkspaceId]) {
            this.currentWorkspaceId = workspaceIds[0];
            this.saveCurrentWorkspaceIdToStorage();
        }
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
        
        document.getElementById('viewGallery').addEventListener('click', () => {
            this.switchView('gallery');
        });
        document.getElementById('viewList').addEventListener('click', () => {
            this.switchView('list');
        });
        
        document.getElementById('streamSearch').addEventListener('input', (e) => {
            this.searchFilter = (e.target.value || '').trim().toLowerCase();
            this.renderStreams();
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
        
        // Rename folder popup
        document.getElementById('closeRenameFolderPopup').addEventListener('click', () => {
            this.closeRenameFolderPopup();
        });
        document.getElementById('confirmRenameFolder').addEventListener('click', () => {
            this.confirmRenameFolder();
        });
        document.getElementById('cancelRenameFolder').addEventListener('click', () => {
            this.closeRenameFolderPopup();
        });
        document.getElementById('renameFolderPopup').addEventListener('click', (e) => {
            if (e.target.id === 'renameFolderPopup') this.closeRenameFolderPopup();
        });
        document.getElementById('renameFolderNameInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.confirmRenameFolder();
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
        
        // Workspace event listeners
        document.getElementById('workspaceSelect').addEventListener('change', (e) => {
            const id = e.target.value;
            if (id) {
                this.currentWorkspaceId = id;
                this.saveCurrentWorkspaceIdToStorage();
                this.updateHeaderWorkspaceTitle();
                this.updateHiddenStreamsList();
                this.renderStreams();
            }
        });
        document.getElementById('addWorkspace').addEventListener('click', () => {
            this.showWorkspaceManagementPopup();
        });
        document.getElementById('closeWorkspaceNamePopup').addEventListener('click', () => {
            this.closeWorkspaceNamePopup();
        });
        document.getElementById('confirmWorkspaceName').addEventListener('click', () => {
            this.confirmWorkspaceNamePopup();
        });
        document.getElementById('cancelWorkspaceName').addEventListener('click', () => {
            this.closeWorkspaceNamePopup();
        });
        document.getElementById('workspaceNamePopup').addEventListener('click', (e) => {
            if (e.target.id === 'workspaceNamePopup') this.closeWorkspaceNamePopup();
        });
        document.getElementById('workspaceNameInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.confirmWorkspaceNamePopup();
        });
        
        // Workspace management popup (opened via sidebar + button)
        document.getElementById('closeWorkspaceManagementPopup').addEventListener('click', () => {
            this.closeWorkspaceManagementPopup();
        });
        document.getElementById('closeWorkspaceManagementBtn').addEventListener('click', () => {
            this.closeWorkspaceManagementPopup();
        });
        document.getElementById('workspaceManagementPopup').addEventListener('click', (e) => {
            if (e.target.id === 'workspaceManagementPopup') this.closeWorkspaceManagementPopup();
        });
        document.getElementById('workspaceManagementCreate').addEventListener('click', () => {
            this.createWorkspaceFromManagement();
        });
        document.getElementById('workspaceManagementNewName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.createWorkspaceFromManagement();
        });
        
        // Delete workspace popup
        document.getElementById('closeDeleteWorkspacePopup').addEventListener('click', () => {
            this.closeDeleteWorkspacePopup();
        });
        document.getElementById('confirmDeleteWorkspace').addEventListener('click', () => {
            this.confirmDeleteWorkspace();
        });
        document.getElementById('cancelDeleteWorkspace').addEventListener('click', () => {
            this.closeDeleteWorkspacePopup();
        });
        document.getElementById('deleteWorkspacePopup').addEventListener('click', (e) => {
            if (e.target.id === 'deleteWorkspacePopup') this.closeDeleteWorkspacePopup();
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
    
    
    switchView(mode) {
        this.viewMode = mode;
        this.saveViewModeToStorage();
        document.getElementById('viewGallery').classList.toggle('btn-view-active', mode === 'gallery');
        document.getElementById('viewList').classList.toggle('btn-view-active', mode === 'list');
        document.getElementById('streamsGrid').style.display = mode === 'gallery' ? '' : 'none';
        document.getElementById('streamsList').style.display = mode === 'list' ? '' : 'none';
        this.renderStreams();
    }
    
    renderStreams() {
        const grid = document.getElementById('streamsGrid');
        const listContainer = document.getElementById('streamsList');
        grid.innerHTML = '';
        listContainer.innerHTML = '';
        
        let visibleStreams = this.streams.filter(stream => {
            if (this.getHiddenStreams().has(stream.id)) return false;
            if (!this.streamBelongsToCurrentWorkspace(stream.id)) return false;
            if (this.searchFilter) {
                const name = (stream.displayName || stream.id || '').toLowerCase();
                if (!name.includes(this.searchFilter)) return false;
            }
            return true;
        });
        visibleStreams = visibleStreams.slice().sort((a, b) => {
            const na = (a.displayName || a.id || '').toLowerCase();
            const nb = (b.displayName || b.id || '').toLowerCase();
            return na.localeCompare(nb);
        });
        
        if (this.viewMode === 'gallery') {
            visibleStreams.forEach(stream => {
                const streamElement = this.createStreamElement(stream);
                grid.appendChild(streamElement);
            });
        } else {
            visibleStreams.forEach(stream => {
                const listItem = this.createStreamListItem(stream);
                listContainer.appendChild(listItem);
            });
        }
        
        this.updateHiddenStreamsList();
    }
    
    createStreamListItem(stream) {
        const row = document.createElement('div');
        row.className = 'stream-list-item';
        row.id = `stream-list-${stream.id}`;
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'stream-list-name';
        nameSpan.textContent = stream.displayName;
        
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'stream-list-actions';
        
        const hideBtn = document.createElement('button');
        hideBtn.className = 'btn btn-small';
        hideBtn.textContent = 'Hide';
        hideBtn.addEventListener('click', () => this.hideStream(stream.id));
        
        const infoBtn = document.createElement('button');
        infoBtn.className = 'btn btn-small';
        infoBtn.textContent = 'Info';
        infoBtn.addEventListener('click', () => this.openOnTwitchAbout(stream.id));
        
        const twitchBtn = document.createElement('button');
        twitchBtn.className = 'btn btn-small';
        twitchBtn.textContent = 'Twitch';
        twitchBtn.addEventListener('click', () => this.openOnTwitch(stream.id));
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn btn-small remove-stream-btn';
        removeBtn.textContent = 'X';
        removeBtn.addEventListener('click', () => this.removeStream(stream.id));
        
        buttonContainer.appendChild(hideBtn);
        buttonContainer.appendChild(infoBtn);
        buttonContainer.appendChild(twitchBtn);
        
        const folderLabel = this.getStreamDisplayFolder(stream.id);
        if (folderLabel) {
            const folderSpan = document.createElement('span');
            folderSpan.className = 'stream-list-folder';
            folderSpan.textContent = folderLabel;
            folderSpan.addEventListener('click', () => this.showFolderSelection(stream.id));
            buttonContainer.appendChild(folderSpan);
        } else {
            const folderBtn = document.createElement('button');
            folderBtn.className = 'btn btn-small';
            folderBtn.textContent = 'Add to Folder';
            folderBtn.addEventListener('click', () => this.showFolderSelection(stream.id));
            buttonContainer.appendChild(folderBtn);
        }
        
        buttonContainer.appendChild(removeBtn);
        row.appendChild(nameSpan);
        row.appendChild(buttonContainer);
        return row;
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
    
    getHiddenStreams() {
        const ws = this.currentWorkspaceId;
        if (!ws) return new Set();
        if (!this.hiddenStreamsByWorkspace[ws]) this.hiddenStreamsByWorkspace[ws] = new Set();
        return this.hiddenStreamsByWorkspace[ws];
    }
    
    hideStream(streamId) {
        this.getHiddenStreams().add(streamId);
        this.saveHiddenStreamsByWorkspaceToStorage();
        const streamElement = document.getElementById(`stream-${streamId}`);
        if (streamElement) streamElement.classList.add('hidden');
        const listItem = document.getElementById(`stream-list-${streamId}`);
        if (listItem) listItem.remove();
        this.updateHiddenStreamsList();
    }
    
    showStream(streamId) {
        this.getHiddenStreams().delete(streamId);
        this.saveHiddenStreamsByWorkspaceToStorage();
        this.updateHiddenStreamsList();
        this.renderStreams();
    }
    
    // Method to refresh only hidden streams list without affecting running streams
    refreshHiddenStreamsList() {
        this.updateHiddenStreamsList();
    }
    
    updateHiddenStreamsList() {
        const list = document.getElementById('hiddenStreamsList');
        const hiddenStreams = Array.from(this.getHiddenStreams());
        
        // Group hidden streams by folder
        const streamsByFolder = {};
        let streamsWithoutFolder = [];
        
        const inAnyFolder = new Set(Object.values(this.folderStreamers).flat());
        hiddenStreams.forEach(streamId => {
            const stream = this.streams.find(s => s.id === streamId);
            if (stream) {
                let inFolder = false;
                Object.keys(this.folderStreamers || {}).forEach(folderName => {
                    if ((this.folderStreamers[folderName] || []).includes(streamId)) {
                        if (!streamsByFolder[folderName]) streamsByFolder[folderName] = [];
                        streamsByFolder[folderName].push({ id: streamId, stream });
                        inFolder = true;
                    }
                });
                if (!inFolder) streamsWithoutFolder.push({ id: streamId, stream });
            }
        });
        
        list.innerHTML = '';
        
        // Only show the currently selected workspace (others are hidden)
        if (this.currentWorkspaceId && this.workspaces[this.currentWorkspaceId]) {
            const folderNamesInWs = this.getFolderNamesInWorkspace(this.currentWorkspaceId).sort();
            const workspaceContent = document.createElement('div');
            workspaceContent.className = 'workspace-block-content';
            folderNamesInWs.forEach(folderName => {
                const streams = streamsByFolder[folderName] || [];
                const folderSection = this.createFolderSection(folderName, streams);
                workspaceContent.appendChild(folderSection);
            });
            list.appendChild(workspaceContent);
        }
        
        // Always show "No Folder" section (streams without folder assignment)
        const noFolderSection = this.createFolderSection('No Folder', streamsWithoutFolder);
        list.appendChild(noFolderSection);
    }
    
    getStreamIdsInFolder(folderName) {
        if (folderName === 'No Folder') {
            const inAnyFolder = new Set(Object.values(this.folderStreamers).flat());
            return this.streamers.filter(id => !inAnyFolder.has(id));
        }
        return this.folderStreamers[folderName] || [];
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
        delete this.folderStreamers[folderName];
        delete this.folders[folderName];
        delete this.folderStates[folderName];
        delete this.folderWorkspace[folderName];
        
        this.saveFolderStreamersToStorage();
        this.saveFoldersToStorage();
        this.saveFolderStatesToStorage();
        this.saveFolderWorkspaceToStorage();
        
        streamIdsInFolder.forEach(streamId => {
            const streamElement = document.getElementById(`stream-${streamId}`);
            if (streamElement) this.updateStreamFolderButton(streamElement, streamId);
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
            const renameFolderBtn = document.createElement('button');
            renameFolderBtn.className = 'folder-action-btn rename-folder-btn';
            renameFolderBtn.title = 'Rename folder';
            renameFolderBtn.innerHTML = '<svg class="folder-icon-pencil" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
            renameFolderBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showRenameFolderPopup(folderName);
            });
            headerActions.appendChild(renameFolderBtn);
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
        
        this.getFolderNamesInWorkspace(this.currentWorkspaceId).sort().forEach(folderName => {
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
        this.folderWorkspace[folderName] = this.currentWorkspaceId;
        this.saveFoldersToStorage();
        this.saveFolderWorkspaceToStorage();
        
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
        
        if (!/^[a-zA-Z0-9_]+$/.test(streamName)) {
            this.showNotification('Streamer name can only contain letters, numbers and underscores!', 'error');
            return;
        }
        
        if (selectedFolder) {
            if (this.isStreamInFolder(streamName, selectedFolder)) {
                this.showNotification('This streamer is already in this folder.', 'error');
                return;
            }
        } else {
            if (this.isStreamInNoFolder(streamName)) {
                this.showNotification('This streamer is already in "No Folder".', 'error');
                return;
            }
        }
        
        const isNewStream = !this.streamers.includes(streamName);
        if (isNewStream) {
            this.streamers.push(streamName);
            this.saveStreamersToStorage();
            this.addSingleStream(streamName);
        }
        if (selectedFolder) {
            if (!this.folderStreamers[selectedFolder]) this.folderStreamers[selectedFolder] = [];
            this.folderStreamers[selectedFolder].push(streamName);
            this.saveFolderStreamersToStorage();
            if (isNewStream) {
                const streamElement = document.getElementById(`stream-${streamName}`);
                if (streamElement) this.updateStreamFolderButton(streamElement, streamName);
            }
        }
        this.updateHiddenStreamsList();
        this.renderStreams();
        
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
        
        this.getFolderNamesInWorkspace(this.currentWorkspaceId).sort().forEach(folderName => {
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
        this.folderWorkspace[folderName] = this.currentWorkspaceId;
        this.saveFoldersToStorage();
        this.saveFolderWorkspaceToStorage();
        
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
            if (selectedFolder) {
                if (this.isStreamInFolder(name, selectedFolder)) {
                    skipped.push(name);
                    continue;
                }
            } else {
                if (this.isStreamInNoFolder(name)) {
                    skipped.push(name);
                    continue;
                }
            }
            const isNewStream = !this.streamers.includes(name);
            if (isNewStream) {
                this.streamers.push(name);
                this.saveStreamersToStorage();
                this.addSingleStream(name);
            }
            added.push(name);
            if (selectedFolder) {
                if (!this.folderStreamers[selectedFolder]) this.folderStreamers[selectedFolder] = [];
                this.folderStreamers[selectedFolder].push(name);
                this.saveFolderStreamersToStorage();
                const streamElement = document.getElementById(`stream-${name}`);
                if (streamElement) this.updateStreamFolderButton(streamElement, name);
            }
        }
        
        this.closeBulkImportPopup();
        
        if (added.length > 0) {
            this.updateHiddenStreamsList();
            this.renderStreams();
            const folderMsg = selectedFolder ? ` (assigned to "${selectedFolder}")` : '';
            this.showNotification(`${added.length} streamer(s) added${folderMsg}. ${skipped.length} skipped (duplicates in this folder or invalid).`, 'success');
        } else {
            this.showNotification('No new streamers added. Check for duplicates in this folder or invalid names (letters, numbers, underscores only).', 'warning');
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
        Object.keys(this.hiddenStreamsByWorkspace).forEach(wsId => {
            this.hiddenStreamsByWorkspace[wsId].delete(streamName);
        });
        Object.keys(this.folderStreamers).forEach(f => {
            this.folderStreamers[f] = this.folderStreamers[f].filter(id => id !== streamName);
            if (this.folderStreamers[f].length === 0) delete this.folderStreamers[f];
        });
        this.saveStreamersToStorage();
        this.saveHiddenStreamsByWorkspaceToStorage();
        this.saveFolderStreamersToStorage();
        
        this.streams = this.streams.filter(s => s.id !== streamName);
        const streamElement = document.getElementById(`stream-${streamName}`);
        if (streamElement) streamElement.remove();
        const listItem = document.getElementById(`stream-list-${streamName}`);
        if (listItem) listItem.remove();
        
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
            hiddenStreamsByWorkspace: this.serializeHiddenStreamsByWorkspace(),
            folders: this.folders,
            streamFolders: this.streamFolders,
            folderStreamers: this.folderStreamers,
            folderStates: this.folderStates,
            workspaces: this.workspaces,
            folderWorkspace: this.folderWorkspace,
            currentWorkspaceId: this.currentWorkspaceId,
            viewMode: this.viewMode,
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
                    this.hiddenStreamsByWorkspace = this.parseHiddenStreamsByWorkspace(data.hiddenStreamsByWorkspace || data.hiddenStreams, data.currentWorkspaceId);
                    
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
                    this.folderStreamers = data.folderStreamers && typeof data.folderStreamers === 'object' ? data.folderStreamers : {};
                    this.ensureFolderStreamersFromStreamFolders();
                    this.folderStates = data.folderStates && typeof data.folderStates === 'object' ? data.folderStates : {};
                    this.workspaces = data.workspaces && typeof data.workspaces === 'object' ? data.workspaces : {};
                    this.folderWorkspace = data.folderWorkspace && typeof data.folderWorkspace === 'object' ? data.folderWorkspace : {};
                    this.currentWorkspaceId = data.currentWorkspaceId && this.workspaces[data.currentWorkspaceId] ? data.currentWorkspaceId : null;
                    this.ensureWorkspaceStructure();
                    this.viewMode = (data.viewMode === 'list' || data.viewMode === 'gallery') ? data.viewMode : 'gallery';
                    this.saveViewModeToStorage();
                    
                    // Save all data to localStorage
                    this.saveStreamersToStorage();
                    this.saveHiddenStreamsByWorkspaceToStorage();
                    this.saveFoldersToStorage();
                    this.saveStreamFoldersToStorage();
                    this.saveFolderStreamersToStorage();
                    this.saveFolderStatesToStorage();
                    this.saveWorkspacesToStorage();
                    this.saveFolderWorkspaceToStorage();
                    this.saveCurrentWorkspaceIdToStorage();
                    
                    document.getElementById('viewGallery').classList.toggle('btn-view-active', this.viewMode === 'gallery');
                    document.getElementById('viewList').classList.toggle('btn-view-active', this.viewMode === 'list');
                    document.getElementById('streamsGrid').style.display = this.viewMode === 'gallery' ? '' : 'none';
                    document.getElementById('streamsList').style.display = this.viewMode === 'list' ? '' : 'none';
                    
                    this.renderStreams();
                    
                    this.populateWorkspaceSelect();
                    this.updateHeaderWorkspaceTitle();
                    const folderCount = Object.keys(this.folders).length;
                    const workspaceCount = Object.keys(this.workspaces).length;
                    this.showNotification(`Loaded ${data.streamers.length} streams, ${folderCount} folders, ${workspaceCount} workspace(s) from file!`, 'success');
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
        // Clear all data (streams, folders, workspaces)
        this.streamers = [];
        this.streams = [];
        this.hiddenStreamsByWorkspace = {};
        this.folders = {};
        this.streamFolders = {};
        this.folderStreamers = {};
        this.folderStates = {};
        this.workspaces = {};
        this.folderWorkspace = {};
        this.currentWorkspaceId = null;
        
        // Clear all storage
        this.saveStreamersToStorage();
        this.saveHiddenStreamsByWorkspaceToStorage();
        this.saveFoldersToStorage();
        this.saveStreamFoldersToStorage();
        this.saveFolderStreamersToStorage();
        this.saveFolderStatesToStorage();
        this.saveWorkspacesToStorage();
        this.saveFolderWorkspaceToStorage();
        this.saveCurrentWorkspaceIdToStorage();
        
        // Re-create default workspace
        this.ensureWorkspaceStructure();
        this.populateWorkspaceSelect();
        this.updateHeaderWorkspaceTitle();
        
        this.renderStreams();
        const container = this.viewMode === 'gallery' ? document.getElementById('streamsGrid') : document.getElementById('streamsList');
        if (container) container.innerHTML = '<div class="no-streams">No streams added yet. Add some streams to get started!</div>';
        
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
    
    loadHiddenStreamsByWorkspaceFromStorage() {
        try {
            const stored = localStorage.getItem('twitchHiddenStreamsByWorkspace');
            if (stored) {
                const obj = JSON.parse(stored);
                const out = {};
                Object.keys(obj).forEach(wsId => {
                    out[wsId] = new Set(obj[wsId] || []);
                });
                return out;
            }
            const oldStored = localStorage.getItem('twitchHiddenStreams');
            if (oldStored) {
                const arr = JSON.parse(oldStored);
                const wsId = this.currentWorkspaceId || Object.keys(this.workspaces || {})[0];
                if (wsId) return { [wsId]: new Set(arr || []) };
            }
            return {};
        } catch (error) {
            console.error('Error loading hidden streams by workspace from storage:', error);
            return {};
        }
    }
    
    saveHiddenStreamsByWorkspaceToStorage() {
        try {
            const obj = {};
            Object.keys(this.hiddenStreamsByWorkspace || {}).forEach(wsId => {
                obj[wsId] = [...this.hiddenStreamsByWorkspace[wsId]];
            });
            localStorage.setItem('twitchHiddenStreamsByWorkspace', JSON.stringify(obj));
        } catch (error) {
            console.error('Error saving hidden streams by workspace to storage:', error);
        }
    }
    
    serializeHiddenStreamsByWorkspace() {
        const obj = {};
        Object.keys(this.hiddenStreamsByWorkspace || {}).forEach(wsId => {
            obj[wsId] = [...this.hiddenStreamsByWorkspace[wsId]];
        });
        return obj;
    }
    
    parseHiddenStreamsByWorkspace(byWorkspace, currentWorkspaceId) {
        if (byWorkspace && typeof byWorkspace === 'object' && !Array.isArray(byWorkspace)) {
            const out = {};
            Object.keys(byWorkspace).forEach(wsId => {
                out[wsId] = new Set(byWorkspace[wsId] || []);
            });
            return out;
        }
        const arr = Array.isArray(byWorkspace) ? byWorkspace : [];
        const wsId = currentWorkspaceId || (this.workspaces && Object.keys(this.workspaces)[0]);
        return wsId ? { [wsId]: new Set(arr) } : {};
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
    
    loadFolderStreamersFromStorage() {
        try {
            const stored = localStorage.getItem('twitchFolderStreamers');
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.error('Error loading folder streamers from storage:', error);
            return null;
        }
    }
    
    saveFolderStreamersToStorage() {
        try {
            localStorage.setItem('twitchFolderStreamers', JSON.stringify(this.folderStreamers));
        } catch (error) {
            console.error('Error saving folder streamers to storage:', error);
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
    
    loadWorkspacesFromStorage() {
        try {
            const stored = localStorage.getItem('twitchWorkspaces');
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.error('Error loading workspaces from storage:', error);
            return null;
        }
    }
    
    saveWorkspacesToStorage() {
        try {
            localStorage.setItem('twitchWorkspaces', JSON.stringify(this.workspaces));
        } catch (error) {
            console.error('Error saving workspaces to storage:', error);
        }
    }
    
    loadFolderWorkspaceFromStorage() {
        try {
            const stored = localStorage.getItem('twitchFolderWorkspace');
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.error('Error loading folder-workspace from storage:', error);
            return null;
        }
    }
    
    saveFolderWorkspaceToStorage() {
        try {
            localStorage.setItem('twitchFolderWorkspace', JSON.stringify(this.folderWorkspace));
        } catch (error) {
            console.error('Error saving folder-workspace to storage:', error);
        }
    }
    
    loadCurrentWorkspaceIdFromStorage() {
        return localStorage.getItem('twitchCurrentWorkspaceId') || null;
    }
    
    loadViewModeFromStorage() {
        const stored = localStorage.getItem('twitchViewMode');
        return stored === 'list' || stored === 'gallery' ? stored : null;
    }
    
    saveViewModeToStorage() {
        localStorage.setItem('twitchViewMode', this.viewMode);
    }
    
    saveCurrentWorkspaceIdToStorage() {
        if (this.currentWorkspaceId) {
            localStorage.setItem('twitchCurrentWorkspaceId', this.currentWorkspaceId);
        }
    }
    
    getFolderNamesInWorkspace(workspaceId) {
        if (!workspaceId) return [];
        return Object.keys(this.folders || {}).filter(
            folderName => this.folderWorkspace[folderName] === workspaceId
        );
    }
    
    ensureFolderStreamersFromStreamFolders() {
        if (Object.keys(this.folderStreamers).length > 0) return;
        Object.keys(this.streamFolders || {}).forEach(streamId => {
            const folderName = this.streamFolders[streamId];
            if (folderName) {
                if (!this.folderStreamers[folderName]) this.folderStreamers[folderName] = [];
                if (!this.folderStreamers[folderName].includes(streamId)) {
                    this.folderStreamers[folderName].push(streamId);
                }
            }
        });
        this.saveFolderStreamersToStorage();
    }
    
    isStreamInFolder(streamId, folderName) {
        return (this.folderStreamers[folderName] || []).includes(streamId);
    }
    
    isStreamInNoFolder(streamId) {
        return this.streamers.includes(streamId) && !Object.values(this.folderStreamers).flat().includes(streamId);
    }
    
    streamBelongsToCurrentWorkspace(streamId) {
        if (!this.currentWorkspaceId || !this.workspaces[this.currentWorkspaceId]) return true;
        const folderNamesInWs = this.getFolderNamesInWorkspace(this.currentWorkspaceId);
        const inWorkspaceFolder = folderNamesInWs.some(f => (this.folderStreamers[f] || []).includes(streamId));
        if (inWorkspaceFolder) return true;
        return this.isStreamInNoFolder(streamId);
    }
    
    getStreamDisplayFolder(streamId) {
        const folderNamesInWs = this.getFolderNamesInWorkspace(this.currentWorkspaceId);
        return folderNamesInWs.find(f => (this.folderStreamers[f] || []).includes(streamId)) || null;
    }
    
    populateWorkspaceSelect() {
        const select = document.getElementById('workspaceSelect');
        const currentId = select.value;
        select.innerHTML = '<option value="">— Select —</option>';
        Object.keys(this.workspaces).sort((a, b) => {
            const na = (this.workspaces[a].name || '').toLowerCase();
            const nb = (this.workspaces[b].name || '').toLowerCase();
            return na.localeCompare(nb);
        }).forEach(wsId => {
            const option = document.createElement('option');
            option.value = wsId;
            option.textContent = this.workspaces[wsId].name || wsId;
            if (wsId === this.currentWorkspaceId) option.selected = true;
            select.appendChild(option);
        });
        if (!this.currentWorkspaceId && select.options.length > 1) {
            select.selectedIndex = 1;
            this.currentWorkspaceId = select.value;
            this.saveCurrentWorkspaceIdToStorage();
        }
    }
    
    updateHeaderWorkspaceTitle() {
        const el = document.getElementById('headerWorkspaceTitle');
        if (!el) return;
        if (this.currentWorkspaceId && this.workspaces[this.currentWorkspaceId]) {
            el.textContent = this.workspaces[this.currentWorkspaceId].name || this.currentWorkspaceId;
            el.style.display = '';
        } else {
            el.textContent = '';
            el.style.display = 'none';
        }
    }
    
    showAddWorkspacePopup() {
        this.workspaceNamePopupMode = 'add';
        document.getElementById('workspaceNamePopupTitle').textContent = 'Add Workspace';
        document.getElementById('workspaceNameInput').value = '';
        document.getElementById('workspaceNamePopup').style.display = 'flex';
        document.getElementById('workspaceNameInput').focus();
    }
    
    showRenameWorkspacePopup(workspaceId) {
        const id = workspaceId !== undefined ? workspaceId : this.currentWorkspaceId;
        if (!id || !this.workspaces[id]) return;
        this.workspaceNamePopupMode = 'rename';
        this.workspaceIdForRename = id;
        document.getElementById('workspaceNamePopupTitle').textContent = 'Rename Workspace';
        document.getElementById('workspaceNameInput').value = this.workspaces[id].name || '';
        document.getElementById('workspaceNamePopup').style.display = 'flex';
        document.getElementById('workspaceNameInput').focus();
    }
    
    closeWorkspaceNamePopup() {
        document.getElementById('workspaceNamePopup').style.display = 'none';
        this.workspaceIdForRename = null;
    }
    
    showWorkspaceManagementPopup() {
        document.getElementById('workspaceManagementNewName').value = '';
        this.refreshWorkspaceManagementList();
        document.getElementById('workspaceManagementPopup').style.display = 'flex';
        document.getElementById('workspaceManagementNewName').focus();
    }
    
    closeWorkspaceManagementPopup() {
        document.getElementById('workspaceManagementPopup').style.display = 'none';
    }
    
    refreshWorkspaceManagementList() {
        const listEl = document.getElementById('workspaceManagementList');
        listEl.innerHTML = '';
        const workspaceIds = Object.keys(this.workspaces || {}).sort((a, b) => {
            const na = (this.workspaces[a].name || '').toLowerCase();
            const nb = (this.workspaces[b].name || '').toLowerCase();
            return na.localeCompare(nb);
        });
        if (workspaceIds.length === 0) {
            listEl.appendChild(document.createTextNode('No workspaces yet. Create one above.'));
            return;
        }
        workspaceIds.forEach(wsId => {
            const row = document.createElement('div');
            row.className = 'workspace-management-row';
            row.dataset.workspaceId = wsId;
            const nameSpan = document.createElement('span');
            nameSpan.className = 'workspace-management-name';
            nameSpan.textContent = this.workspaces[wsId].name || wsId;
            const actions = document.createElement('div');
            actions.className = 'workspace-management-actions';
            const renameBtn = document.createElement('button');
            renameBtn.type = 'button';
            renameBtn.className = 'btn btn-small btn-secondary';
            renameBtn.textContent = 'Rename';
            renameBtn.addEventListener('click', () => {
                this.showRenameWorkspacePopup(wsId);
            });
            const deleteBtn = document.createElement('button');
            deleteBtn.type = 'button';
            deleteBtn.className = 'btn btn-small btn-danger-secondary';
            deleteBtn.textContent = 'Delete';
            deleteBtn.addEventListener('click', () => {
                this.showDeleteWorkspacePopup(wsId);
            });
            actions.appendChild(renameBtn);
            actions.appendChild(deleteBtn);
            row.appendChild(nameSpan);
            row.appendChild(actions);
            listEl.appendChild(row);
        });
    }
    
    createWorkspaceFromManagement() {
        const input = document.getElementById('workspaceManagementNewName');
        const name = input.value.trim();
        if (!name) {
            this.showNotification('Please enter a workspace name.', 'error');
            return;
        }
        const id = 'ws-' + Date.now();
        this.workspaces[id] = { name };
        this.saveWorkspacesToStorage();
        this.currentWorkspaceId = id;
        this.saveCurrentWorkspaceIdToStorage();
            this.populateWorkspaceSelect();
            this.updateHeaderWorkspaceTitle();
            this.updateHiddenStreamsList();
            input.value = '';
        this.refreshWorkspaceManagementList();
        this.showNotification(`Workspace "${name}" created.`, 'success');
    }
    
    confirmWorkspaceNamePopup() {
        const input = document.getElementById('workspaceNameInput');
        const name = input.value.trim();
        if (!name) {
            this.showNotification('Please enter a name.', 'error');
            return;
        }
        if (this.workspaceNamePopupMode === 'add') {
            const id = 'ws-' + Date.now();
            this.workspaces[id] = { name };
            this.saveWorkspacesToStorage();
            this.currentWorkspaceId = id;
            this.saveCurrentWorkspaceIdToStorage();
            this.populateWorkspaceSelect();
            this.updateHeaderWorkspaceTitle();
            this.updateHiddenStreamsList();
            this.showNotification(`Workspace "${name}" created.`, 'success');
        } else if (this.workspaceNamePopupMode === 'rename' && this.workspaceIdForRename) {
            this.workspaces[this.workspaceIdForRename].name = name;
            this.saveWorkspacesToStorage();
            this.populateWorkspaceSelect();
            this.updateHeaderWorkspaceTitle();
            this.updateHiddenStreamsList();
            this.showNotification('Workspace renamed.', 'success');
        }
        this.closeWorkspaceNamePopup();
        if (document.getElementById('workspaceManagementPopup').style.display === 'flex') {
            this.refreshWorkspaceManagementList();
        }
    }
    
    showDeleteWorkspacePopup(workspaceId) {
        const id = workspaceId !== undefined ? workspaceId : this.currentWorkspaceId;
        if (!id || !this.workspaces[id]) return;
        if (Object.keys(this.workspaces).length <= 1) {
            this.showNotification('At least one workspace is required.', 'warning');
            return;
        }
        this.workspaceIdForDeletion = id;
        const ws = this.workspaces[id];
        const name = ws ? ws.name : id;
        const folderCount = this.getFolderNamesInWorkspace(id).length;
        const msg = folderCount > 0
            ? `Delete workspace "${name}"? Its ${folderCount} folder(s) will be deleted and streamers in them moved to "No Folder".`
            : `Delete workspace "${name}"?`;
        document.getElementById('deleteWorkspaceMessage').textContent = msg;
        document.getElementById('deleteWorkspacePopup').style.display = 'flex';
    }
    
    closeDeleteWorkspacePopup() {
        document.getElementById('deleteWorkspacePopup').style.display = 'none';
        this.workspaceIdForDeletion = null;
        const cb = document.getElementById('deleteWorkspaceAlsoStreamers');
        if (cb) cb.checked = false;
    }
    
    confirmDeleteWorkspace() {
        if (this.workspaceIdForDeletion) {
            const alsoDeleteStreamers = document.getElementById('deleteWorkspaceAlsoStreamers').checked;
            this.deleteWorkspace(this.workspaceIdForDeletion, alsoDeleteStreamers);
        }
        this.closeDeleteWorkspacePopup();
    }
    
    deleteWorkspace(workspaceId, alsoDeleteStreamers = false) {
        const folderNames = this.getFolderNamesInWorkspace(workspaceId);
        const streamIdsInWorkspace = new Set();
        folderNames.forEach(folderName => {
            this.getStreamIdsInFolder(folderName).forEach(id => streamIdsInWorkspace.add(id));
        });
        if (alsoDeleteStreamers && streamIdsInWorkspace.size > 0) {
            streamIdsInWorkspace.forEach(streamId => {
                this.streamers = this.streamers.filter(s => s !== streamId);
                this.streams = this.streams.filter(s => s.id !== streamId);
                Object.keys(this.hiddenStreamsByWorkspace).forEach(wsId => {
                    this.hiddenStreamsByWorkspace[wsId].delete(streamId);
                });
                Object.keys(this.folderStreamers).forEach(f => {
                    this.folderStreamers[f] = (this.folderStreamers[f] || []).filter(id => id !== streamId);
                    if (this.folderStreamers[f].length === 0) delete this.folderStreamers[f];
                });
                const el = document.getElementById(`stream-${streamId}`);
                if (el) el.remove();
            });
            this.saveStreamersToStorage();
            this.saveHiddenStreamsByWorkspaceToStorage();
            this.saveFolderStreamersToStorage();
        }
        folderNames.forEach(folderName => {
            delete this.folderStreamers[folderName];
            delete this.folders[folderName];
            delete this.folderStates[folderName];
            delete this.folderWorkspace[folderName];
        });
        delete this.workspaces[workspaceId];
        if (this.currentWorkspaceId === workspaceId) {
            const remaining = Object.keys(this.workspaces);
            this.currentWorkspaceId = remaining.length > 0 ? remaining[0] : null;
            this.saveCurrentWorkspaceIdToStorage();
        }
        this.saveWorkspacesToStorage();
        this.saveFoldersToStorage();
        this.saveFolderStreamersToStorage();
        this.saveFolderStatesToStorage();
        this.saveFolderWorkspaceToStorage();
        this.populateWorkspaceSelect();
        this.updateHeaderWorkspaceTitle();
        this.updateHiddenStreamsList();
        this.streams.forEach(stream => {
            const el = document.getElementById(`stream-${stream.id}`);
            if (el) this.updateStreamFolderButton(el, stream.id);
        });
        if (document.getElementById('workspaceManagementPopup').style.display === 'flex') {
            this.refreshWorkspaceManagementList();
        }
        this.showNotification('Workspace deleted.', 'success');
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
    
    showRenameFolderPopup(folderName) {
        this.folderNameForRename = folderName;
        document.getElementById('renameFolderNameInput').value = folderName;
        const select = document.getElementById('renameFolderWorkspaceSelect');
        select.innerHTML = '<option value="">— Select —</option>';
        const currentWsId = this.folderWorkspace[folderName];
        Object.keys(this.workspaces || {}).sort((a, b) => {
            const na = (this.workspaces[a].name || '').toLowerCase();
            const nb = (this.workspaces[b].name || '').toLowerCase();
            return na.localeCompare(nb);
        }).forEach(wsId => {
            const option = document.createElement('option');
            option.value = wsId;
            option.textContent = this.workspaces[wsId].name || wsId;
            if (wsId === currentWsId) option.selected = true;
            select.appendChild(option);
        });
        document.getElementById('renameFolderPopup').style.display = 'flex';
        document.getElementById('renameFolderNameInput').focus();
    }
    
    closeRenameFolderPopup() {
        document.getElementById('renameFolderPopup').style.display = 'none';
        this.folderNameForRename = null;
    }
    
    confirmRenameFolder() {
        const newName = document.getElementById('renameFolderNameInput').value.trim();
        const newWorkspaceId = document.getElementById('renameFolderWorkspaceSelect').value;
        if (!this.folderNameForRename) {
            this.closeRenameFolderPopup();
            return;
        }
        const oldName = this.folderNameForRename;
        const finalName = newName || oldName;
        if (!finalName) {
            this.showNotification('Please enter a folder name.', 'error');
            return;
        }
        if (finalName !== oldName && this.folders[finalName]) {
            this.showNotification('A folder with that name already exists.', 'error');
            return;
        }
        if (finalName !== oldName) {
            this.renameFolder(oldName, finalName);
        }
        const previousWsId = this.folderWorkspace[finalName];
        const didMove = newWorkspaceId && this.workspaces[newWorkspaceId] && previousWsId !== newWorkspaceId;
        if (didMove) {
            this.folderWorkspace[finalName] = newWorkspaceId;
            this.saveFolderWorkspaceToStorage();
            this.updateHiddenStreamsList();
            this.streams.forEach(stream => {
                const el = document.getElementById(`stream-${stream.id}`);
                if (el) this.updateStreamFolderButton(el, stream.id);
            });
            this.renderStreams();
        }
        this.closeRenameFolderPopup();
        const didRename = finalName !== oldName;
        const msg = didRename && didMove
            ? `Folder renamed to "${finalName}" and moved to workspace.`
            : didRename
                ? `Folder renamed to "${finalName}".`
                : didMove
                    ? 'Folder moved to workspace.'
                    : '';
        if (msg) this.showNotification(msg, 'success');
    }
    
    renameFolder(oldName, newName) {
        if (oldName === 'No Folder' || !this.folders[oldName]) return;
        this.folders[newName] = this.folders[oldName];
        delete this.folders[oldName];
        if (this.folderStates[oldName] !== undefined) {
            this.folderStates[newName] = this.folderStates[oldName];
            delete this.folderStates[oldName];
        }
        if (this.folderWorkspace[oldName] !== undefined) {
            this.folderWorkspace[newName] = this.folderWorkspace[oldName];
            delete this.folderWorkspace[oldName];
        }
        if (this.folderStreamers[oldName]) {
            this.folderStreamers[newName] = this.folderStreamers[oldName];
            delete this.folderStreamers[oldName];
        }
        this.saveFoldersToStorage();
        this.saveFolderStatesToStorage();
        this.saveFolderWorkspaceToStorage();
        this.saveFolderStreamersToStorage();
        this.updateHiddenStreamsList();
        this.streams.forEach(stream => {
            const el = document.getElementById(`stream-${stream.id}`);
            if (el) this.updateStreamFolderButton(el, stream.id);
        });
        this.showNotification(`Folder renamed to "${newName}".`, 'success');
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
        
        // Create new folder in current workspace
        this.folders[folderName] = {
            name: folderName,
            created: new Date().toISOString()
        };
        this.folderWorkspace[folderName] = this.currentWorkspaceId;
        this.saveFoldersToStorage();
        this.saveFolderWorkspaceToStorage();
        
        this.updateHiddenStreamsList();
        this.showNotification(`Created folder: ${folderName}`, 'success');
        this.closeAddFolderPopup();
    }
    
    assignStreamToFolder(streamId, folderName) {
        if (!this.streamers.includes(streamId)) {
            this.streamers.push(streamId);
            this.saveStreamersToStorage();
        }
        if (!this.folderStreamers[folderName]) this.folderStreamers[folderName] = [];
        if (!this.folderStreamers[folderName].includes(streamId)) {
            this.folderStreamers[folderName].push(streamId);
            this.saveFolderStreamersToStorage();
        }
        const streamElement = document.getElementById(`stream-${streamId}`);
        if (streamElement) this.updateStreamFolderButton(streamElement, streamId);
        this.updateHiddenStreamsList();
        this.renderStreams();
        this.showNotification(`Stream assigned to folder: ${folderName}`, 'success');
    }
    
    removeStreamFromFolder(streamId, folderName) {
        if (this.folderStreamers[folderName]) {
            this.folderStreamers[folderName] = this.folderStreamers[folderName].filter(id => id !== streamId);
            if (this.folderStreamers[folderName].length === 0) delete this.folderStreamers[folderName];
            this.saveFolderStreamersToStorage();
        }
        const streamElement = document.getElementById(`stream-${streamId}`);
        if (streamElement) this.updateStreamFolderButton(streamElement, streamId);
        this.updateHiddenStreamsList();
        this.renderStreams();
        this.showNotification('Stream removed from folder', 'success');
    }
    
    updateStreamFolderButton(streamElement, streamId) {
        const buttonContainer = streamElement.querySelector('.stream-buttons');
        const existingFolderBtn = streamElement.querySelector('.folder-button, .folder-name');
        
        if (existingFolderBtn) {
            existingFolderBtn.remove();
        }
        
        const currentFolder = this.getStreamDisplayFolder(streamId);
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
        
        const currentFolder = this.getStreamDisplayFolder(this.currentStreamForFolder);
        
        this.getFolderNamesInWorkspace(this.currentWorkspaceId).sort().forEach(folderName => {
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
        
        const inAnyFolder = this.getStreamDisplayFolder(this.currentStreamForFolder) != null;
        const removeBtn = document.getElementById('removeFromFolder');
        removeBtn.style.display = inAnyFolder ? 'block' : 'none';
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
        const selectedFolder = document.getElementById('folderSelect').value;
        if (!selectedFolder) {
            this.showNotification('Select a folder to remove the stream from.', 'error');
            return;
        }
        this.removeStreamFromFolder(this.currentStreamForFolder, selectedFolder);
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

