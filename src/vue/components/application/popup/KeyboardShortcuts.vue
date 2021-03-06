<template>
    <popup store-prop="KeyboardShortcuts" title="Keyboard Shortcuts">
        <div class="shortcut-sections">
            <section v-for="sec of sections" class="shortcut-section">

                <h2>{{ sec.name }}</h2>

                <div v-for="shortcut of sec.shortcuts" class="shortcut">
                    <div class="keys">
                        <span v-for="key of shortcut.keys" class="key">{{ key }}</span>
                    </div>

                    <p>{{ shortcut.action }}</p>
                </div>
            </section>
        </div>
    </popup>
</template>

<script>

    // Components
    import Popup from './Popup';

    export default {

        components: {Popup},

        data() {
            return {
                sections: [

                    {
                        name: 'Selecting',
                        shortcuts: [
                            {keys: ['ctrl', 'shift'], action: 'Select everything up to current element.'},
                            {keys: ['ctrl', 'a'], action: 'Select everything.'},
                            {keys: ['s', 'd'], action: 'Select directories.'},
                            {keys: ['s', 'f'], action: 'Select files.'},
                            {keys: ['s', 'i'], action: 'Invert selection.'},
                            {keys: ['enter'], action: 'Enter first selected directory.'},
                            {keys: ['arrow-up'], action: 'Select next element.'},
                            {keys: ['arrow-down'], action: 'Select previous element.'}
                        ]
                    },

                    {
                        name: 'Actions',
                        shortcuts: [
                            {keys: ['ctrl', 'x'], action: 'Cut folder / files.'},
                            {keys: ['ctrl', 'c'], action: 'Copy folder / files.'},
                            {keys: ['ctrl', 'v'], action: 'Paste folder / files.'},
                            {keys: ['n', 's'], action: 'Share.'},
                            {keys: ['z', 'i'], action: 'Create zip file out of selection.'},
                            {keys: ['n', 'f'], action: 'Create new folder.'},
                            {keys: ['e', 'n'], action: 'Edit the name.'},
                            {keys: ['m', 'a'], action: 'Marks selected files / folders.'},
                            {keys: ['m', 'r'], action: 'Removes the mark from selected files / folders.'},
                            {keys: ['delete'], action: 'Move selected files / folders to the bin.'},
                            {keys: ['delete', 'shift'], action: 'Permanently delete selected files / folders.'}
                        ]
                    },

                    {
                        name: 'General',
                        shortcuts: [
                            {keys: ['r'], action: 'Refresh everything.'},
                            {keys: ['v', 'l'], action: 'Change view to list.'},
                            {keys: ['v', 'g'], action: 'Change view to grid.'},
                            {keys: ['j', 'h'], action: 'Switch to home tab.'},
                            {keys: ['j', 'm'], action: 'Switch to marked folder / files.'},
                            {keys: ['j', 'b'], action: 'Switch to bin.'},
                            {keys: ['j', 's'], action: 'Switch to settigs.'},
                            {keys: ['tab'], action: 'Switch tabs.'},
                            {keys: ['backspace'], action: 'Go up in hierarchy.'},
                            {keys: ['esc'], action: 'Close any popup like menu or this page.'}
                        ]
                    },

                    {
                        name: 'Help',
                        shortcuts: [
                            {keys: ['h', 'k'], action: 'Show keyboard shortcuts.'},
                            {keys: ['h', 'f'], action: 'Show search filters.'}
                        ]
                    }
                ]
            };
        },

        mounted() {
            this.$callOnDestroy(
                this.utils.detectKeyCombinations(
                    document,
                    this.keyboardEvent,
                    ({target}) => target.getAttribute('contenteditable') !== 'true' && !['TEXT-AREA', 'INPUT'].includes(target.tagName)
                )
            );
        },

        methods: {

            keyboardEvent(keys, event) {
                const store = this.$store;
                const state = store.state;
                const {selection, clipboard, activeTab} = state;
                const currentLocation = state.location.node;

                // Shortcuts which are only available at the home screen
                if (activeTab === 'home') {

                    // Copy nodes
                    if (selection.length && keys.KeyC && keys.ctrlKey) {

                        // Save to clipboard
                        store.commit('clipboard/clear');
                        store.commit('clipboard/insert', {
                            nodes: selection,
                            type: 'copy'
                        });

                        return;
                    }

                    // Zip nodes
                    if (selection.length && keys.KeyZ && keys.KeyI) {
                        store.dispatch('nodes/zip', {nodes: selection});
                        return;
                    }

                    // Paste nodes
                    const clipboardNodes = clipboard.nodes;
                    if (clipboardNodes.length && keys.KeyV && keys.ctrlKey) {

                        // Move elements
                        store.dispatch(`nodes/${state.clipboard.type}`, {
                            nodes: clipboardNodes,
                            destination: currentLocation
                        });

                        // Keep initially copied nodes in clipboard
                        if (clipboard.type !== 'copy') {

                            // Clear clipboard
                            store.commit('clipboard/clear');
                        }

                        return;
                    }

                    // Hierarchy up event
                    if (keys.KeyBackspace) {
                        store.dispatch('location/goUp');
                        return;
                    }

                    // Create new folder
                    if (keys.KeyN && keys.KeyF) {

                        // Create a folder and immediatly make it editable
                        store.dispatch('nodes/createFolder', {parent: currentLocation}).then(folderNode => {
                            store.commit('editable/set', folderNode);
                        });

                        // Prevent setting the letter 'f' as folder name because the freshly created
                        // folder is editable.
                        event.preventDefault();
                        return;
                    }

                    // Jump into folder
                    if (keys.KeyEnter && selection.length) {
                        const firstFolder = selection.find(v => v.type === 'folder');

                        if (firstFolder) {
                            this.$store.commit('location/update', firstFolder);
                        }
                        return;
                    }
                }

                // Cut nodes
                if (selection.length && keys.KeyX && keys.ctrlKey) {

                    // Save to clipboard
                    store.commit('clipboard/clear');
                    store.commit('clipboard/insert', {
                        nodes: selection,
                        type: 'move'
                    });

                    return;
                }

                // Edit name
                if (selection.length && keys.KeyE && keys.KeyN) {
                    this.$store.commit('editable/set', selection[0]);
                    event.preventDefault();
                    return;
                }

                // Change to grid-view
                if (keys.KeyV && keys.KeyG) {
                    store.commit('setViewType', 'grid');
                    return;
                }

                // Chantge to list-view
                if (keys.KeyV && keys.KeyL) {
                    store.commit('setViewType', 'list');
                    return;
                }

                // Define nodes as function to prevent
                // useless calculations. Returns, if there is, the search result
                // or all nodes which are currently into view.
                const nodes = () => store.getters['nodes/currentDisplayedNodes']();

                // Select everything
                if (keys.ctrlKey && keys.KeyA) {

                    // Select all nodes which are currently under the current location
                    const nodesMap = nodes();
                    store.commit('selection/append', nodesMap.file.concat(nodesMap.dir));
                    return;
                }

                // Select all folders
                if (keys.KeyS && keys.KeyD) {

                    // Clear selection to remove previously selected files
                    store.commit('selection/clear');

                    // Select all folders which are currently under the current location
                    store.commit('selection/append', nodes().dir);
                    return;
                }

                // Select all files
                if (keys.KeyS && keys.KeyF) {

                    // Clear selection to remove previously selected folders
                    store.commit('selection/clear');

                    // Select all files which are currently under the current location
                    store.commit('selection/append', nodes().file);
                    return;
                }

                // General canceling
                if (keys.KeyEscape) {

                    // Clear selection
                    store.commit('selection/clear');

                    // Close open popup
                    this.$store.commit('setActivePopup', null);

                    // Close editable node
                    this.$store.commit('editable/clear');

                    // Close filepreview
                    this.$store.commit('filepreview/clear');
                    return;
                }

                // Inverse selection all files
                if (keys.KeyS && keys.KeyI) {
                    const nodesMap = nodes();
                    const notSelected = nodesMap.file.concat(nodesMap.dir).filter(v => !selection.includes(v));

                    // Clear selection
                    store.commit('selection/clear');

                    // Append previously not
                    store.commit('selection/append', notSelected);
                    return;
                }

                // Add mark
                if (keys.KeyM && keys.KeyA) {
                    this.$store.dispatch('nodes/addMark', selection);
                    return;
                }

                // Remove mark
                if (keys.KeyM && keys.KeyR) {
                    this.$store.dispatch('nodes/removeMark', selection);
                    return;
                }

                // Delete nodes
                if (keys.KeyDelete && selection.length) {
                    store.dispatch('nodes/delete', {nodes: selection, permanently: keys.shiftKey});
                    return;
                }

                // Show keyboard shortcuts
                if (keys.KeyH && keys.KeyK) {
                    this.$store.commit('setActivePopup', 'KeyboardShortcuts');
                    return;
                }

                // Show search filters
                if (keys.KeyH && keys.KeyF) {
                    this.$store.commit('setActivePopup', 'SearchFilters');
                    return;
                }

                // Switch to home screen
                if (keys.KeyJ && keys.KeyH) {
                    this.$store.commit('setActiveTab', 'home');
                    return;
                }

                // Switch to marked screen
                if (keys.KeyJ && keys.KeyM) {
                    this.$store.commit('setActiveTab', 'marked');
                    return;
                }

                // Switch to bin
                if (keys.KeyJ && keys.KeyB) {
                    this.$store.commit('setActiveTab', 'bin');
                    return;
                }

                // Switch to settings screen
                if (keys.KeyJ && keys.KeyS) {
                    this.$store.commit('setActiveTab', 'settings');
                    return;
                }

                // Switch tabs
                if (keys.KeyTab && !keys.ctrlKey) {
                    const tabs = ['home', 'marked', 'settings'];
                    let index = tabs.indexOf(this.$store.state.activeTab) + 1;

                    // Rotate if end is reached
                    index === tabs.length && (index = 0);

                    // Switch tab
                    this.$store.commit('setActiveTab', tabs[index]);
                    event.preventDefault();
                    return;
                }

                // Share
                if (keys.KeyN && keys.KeyS && selection.length === 1 && selection[0].type === 'file') {
                    this.$store.commit('setActivePopup', 'ShareViaLink');
                    this.$store.commit('share/set', selection[0]);
                    return;
                }

                // Refresh
                if (keys.KeyR) {
                    store.dispatch('nodes/update');
                }
            }
        }
    };

</script>

<style lang="scss" scoped>

    .shortcut-sections {
        @include flex(row, flex-start, space-between);
        flex-wrap: wrap;
    }

    .shortcut-section {
        @include flex(column);
        width: 48%;

        h2 {
            @include font(400, 0.9em);
            padding: 0.75em 0 0.25em;
            border-bottom: 1px solid rgba($palette-deep-blue, 0.05);
            margin-bottom: 0.5em;
        }

        .shortcut {
            @include flex(row, center);
            padding: 0.25em 0;

            .keys {
                flex-grow: 1;
                font-family: monospace;
                @include font(600, 0.9em);

                .key {
                    margin-right: 0.5em;
                    color: $palette-deep-blue;
                    border: 1px solid rgba($palette-deep-blue, 0.75);
                    border-bottom: 2px solid rgba($palette-deep-blue, 0.9);
                    border-radius: 2px;
                    padding: 0.05em 0.45em 0.1em 0.45em;
                }
            }

            p {
                @include font(400, 0.8em);
                color: darken($palette-grayish-blue, 15);
                text-align: right;
            }
        }
    }

</style>
