<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Teleprompter — 601MEDIA</title>
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
<div class="app">

    <!-- Header -->
    <header class="header">
        <span class="header-logo">601MEDIA</span>
        <div class="header-divider"></div>
        <span class="header-title">Teleprompter</span>
        <div class="header-spacer"></div>
        <button class="btn btn-accent" onclick="openCreateProject()">+ New Project</button>
    </header>

    <div class="workspace">

        <!-- Sidebar: Projects -->
        <aside class="sidebar">
            <div class="sidebar-header">
                <span class="sidebar-label">Projects</span>
            </div>
            <div class="sidebar-list" id="project-list">
                <!-- Populated by JS -->
            </div>
        </aside>

        <!-- Main: Segments -->
        <main class="main">
            <div class="main-header">
                <div>
                    <div class="main-title" id="main-title">Dashboard</div>
                    <div class="main-subtitle" id="main-subtitle">Select a project to get started</div>
                </div>
                <button class="btn btn-accent" id="add-segment-btn"
                        onclick="openCreateSegment()" style="display:none">
                    + Add Segment
                </button>
            </div>
            <div id="segments-area" style="display:flex;flex:1;overflow:hidden;">
                <div class="empty-state">
                    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                        <rect x="8" y="12" width="48" height="40" rx="4" stroke="#888" stroke-width="2"/>
                        <line x1="16" y1="24" x2="48" y2="24" stroke="#888" stroke-width="2"/>
                        <line x1="16" y1="32" x2="40" y2="32" stroke="#888" stroke-width="2"/>
                        <line x1="16" y1="40" x2="44" y2="40" stroke="#888" stroke-width="2"/>
                    </svg>
                    <h3>Select a Project</h3>
                    <p>Choose a project from the sidebar or create a new one to get started.</p>
                </div>
            </div>
        </main>

    </div>
</div>

<!-- ── Project Modal ──────────────────────────────────────────────────── -->
<div class="modal-backdrop" id="project-modal" onclick="if(event.target===this)closeModal('project-modal')">
    <div class="modal">
        <div class="modal-header">
            <span class="modal-title" id="project-modal-title">New Project</span>
            <button class="btn btn-ghost btn-icon" onclick="closeModal('project-modal')">✕</button>
        </div>
        <div class="modal-body">
            <div class="form-group">
                <label for="project-name-input">Project Name</label>
                <input type="text" id="project-name-input" placeholder="e.g. Product Launch 2025" maxlength="120">
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-ghost" onclick="closeModal('project-modal')">Cancel</button>
            <button class="btn btn-accent" onclick="saveProject()">Save Project</button>
        </div>
    </div>
</div>

<!-- ── Segment Modal ──────────────────────────────────────────────────── -->
<div class="modal-backdrop" id="segment-modal" onclick="if(event.target===this)closeModal('segment-modal')">
    <div class="modal modal-lg">
        <div class="modal-header">
            <span class="modal-title" id="segment-modal-title">New Segment</span>
            <button class="btn btn-ghost btn-icon" onclick="closeModal('segment-modal')">✕</button>
        </div>
        <div class="modal-body">
            <div class="form-group">
                <label for="segment-title-input">Segment Title</label>
                <input type="text" id="segment-title-input" placeholder="e.g. Opening Remarks" maxlength="120">
            </div>
            <div class="form-group">
                <label for="segment-content-input">Script Content</label>
                <textarea id="segment-content-input"
                          placeholder="Type or paste your script here...&#10;&#10;Each line break will be preserved in the teleprompter."></textarea>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-ghost" onclick="closeModal('segment-modal')">Cancel</button>
            <button class="btn btn-accent" onclick="saveSegment()">Save Segment</button>
        </div>
    </div>
</div>

<!-- ── Confirm Delete Modal ───────────────────────────────────────────── -->
<div class="modal-backdrop" id="confirm-modal" onclick="if(event.target===this)closeModal('confirm-modal')">
    <div class="modal" style="max-width:400px;">
        <div class="modal-body" style="padding:28px 24px;">
            <div class="confirm-icon">🗑</div>
            <h3 style="text-align:center;margin-bottom:10px;">Confirm Delete</h3>
            <p class="confirm-text" id="confirm-message"></p>
        </div>
        <div class="modal-footer">
            <button class="btn btn-ghost" onclick="closeModal('confirm-modal')">Cancel</button>
            <button class="btn" style="background:var(--danger);color:#fff;" onclick="confirmDelete()">Delete</button>
        </div>
    </div>
</div>

<!-- ── Toast Container ────────────────────────────────────────────────── -->
<div class="toast-container" id="toast-container"></div>

<script src="assets/js/dashboard.js"></script>
</body>
</html>
