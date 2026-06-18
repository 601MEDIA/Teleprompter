/* ── State ──────────────────────────────────────────────────────────────── */
const state = {
    projects:           [],
    activeProjectId:    null,
    segments:           [],
    selectedSegmentIds: new Set(),
    editingProject:     null,
    editingSegment:     null,
    pendingDelete:      null,
}

/* ── API ────────────────────────────────────────────────────────────────── */
async function api(action, data = {}) {
    const isGet = ['get_projects', 'get_segments', 'get_segment'].includes(action)

    if (isGet) {
        const params = new URLSearchParams({ action, ...data })
        const res = await fetch(`api.php?${params}`)
        const json = await res.json()
        if (!json.success) throw new Error(json.error)
        return json.data
    }

    const body = new FormData()
    body.append('action', action)
    for (const [k, v] of Object.entries(data)) body.append(k, v)

    const res = await fetch('api.php', { method: 'POST', body })
    const json = await res.json()
    if (!json.success) throw new Error(json.error)
    return json.data ?? null
}

/* ── Render helpers ─────────────────────────────────────────────────────── */
function el(id) { return document.getElementById(id) }

function renderProjects() {
    const list = el('project-list')

    if (state.projects.length === 0) {
        list.innerHTML = `<div style="padding:16px;text-align:center;color:var(--text-muted);font-size:12px;">No projects yet</div>`
        return
    }

    list.innerHTML = state.projects.map(p => `
        <div class="project-item ${p.id === state.activeProjectId ? 'active' : ''}" data-id="${p.id}">
            <div class="project-icon">📁</div>
            <div style="flex:1;min-width:0;">
                <div class="project-name">${escHtml(p.name)}</div>
            </div>
            <div class="project-actions">
                <button class="btn btn-ghost btn-icon" title="Edit" onclick="openEditProject(event, ${p.id})">✏️</button>
                <button class="btn btn-danger btn-icon" title="Delete" onclick="openDeleteProject(event, ${p.id})">🗑</button>
            </div>
        </div>
    `).join('')

    list.querySelectorAll('.project-item').forEach(item => {
        item.addEventListener('click', () => selectProject(parseInt(item.dataset.id)))
    })
}

function renderSegments() {
    const container = el('segments-area')
    state.selectedSegmentIds.clear()
    updateSelectionBar()

    if (!state.activeProjectId) {
        el('add-segment-btn').style.display = 'none'
        container.innerHTML = `
            <div class="empty-state">
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                    <rect x="8" y="12" width="48" height="40" rx="4" stroke="#888" stroke-width="2"/>
                    <line x1="16" y1="24" x2="48" y2="24" stroke="#888" stroke-width="2"/>
                    <line x1="16" y1="32" x2="40" y2="32" stroke="#888" stroke-width="2"/>
                    <line x1="16" y1="40" x2="44" y2="40" stroke="#888" stroke-width="2"/>
                </svg>
                <h3>Select a Project</h3>
                <p>Choose a project from the sidebar to view and manage its segments.</p>
            </div>`
        return
    }

    const project = state.projects.find(p => p.id === state.activeProjectId)
    el('main-title').textContent    = project?.name ?? 'Project'
    el('main-subtitle').textContent = `${state.segments.length} segment${state.segments.length !== 1 ? 's' : ''}`
    el('add-segment-btn').style.display = 'inline-flex'

    if (state.segments.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                    <circle cx="32" cy="32" r="22" stroke="#888" stroke-width="2"/>
                    <line x1="32" y1="22" x2="32" y2="42" stroke="#888" stroke-width="2" stroke-linecap="round"/>
                    <line x1="22" y1="32" x2="42" y2="32" stroke="#888" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <h3>No Segments Yet</h3>
                <p>Add your first segment to get started with this project.</p>
                <button class="btn btn-accent" onclick="openCreateSegment()">+ Add Segment</button>
            </div>`
        return
    }

    container.innerHTML = `
        ${state.segments.length > 1 ? `
        <div class="launch-all-bar">
            <button class="btn btn-launch btn-launch-all"
                    onclick="launchProject(${state.activeProjectId})">
                ▶▶ Launch All ${state.segments.length} Segments
            </button>
        </div>` : ''}
        <div class="segment-grid" id="segment-grid">
            ${state.segments.map((s, i) => `
                <div class="segment-card" data-id="${s.id}">
                    <div class="segment-card-header">
                        <div class="segment-order">${i + 1}</div>
                        <div class="segment-title">${escHtml(s.title)}</div>
                        <label class="seg-checkbox-wrap" title="Select for chained playback">
                            <input type="checkbox" class="seg-checkbox" data-id="${s.id}"
                                   onchange="toggleSegmentSelect(${s.id}, this.checked)">
                            <span class="seg-checkbox-ui"></span>
                        </label>
                    </div>
                    <div class="segment-preview">${escHtml(s.content || '(no content)')}</div>
                    <div class="segment-card-footer">
                        <button class="btn btn-launch" onclick="launchSegment(${s.id})">▶ Launch</button>
                        <button class="btn btn-ghost btn-icon" title="Edit" onclick="openEditSegment(${s.id})">✏️</button>
                        <button class="btn btn-danger btn-icon" title="Delete" onclick="openDeleteSegment(${s.id})">🗑</button>
                    </div>
                </div>
            `).join('')}
        </div>
        <div class="selection-bar" id="selection-bar" style="display:none;">
            <span class="selection-count" id="selection-count">0 selected</span>
            <button class="btn btn-accent" onclick="launchSelected()">▶ Launch Selected</button>
            <button class="btn btn-ghost" onclick="clearSelection()">Clear</button>
        </div>`
}

/* ── Selection ──────────────────────────────────────────────────────────── */
function toggleSegmentSelect(id, checked) {
    if (checked) {
        state.selectedSegmentIds.add(id)
    } else {
        state.selectedSegmentIds.delete(id)
    }

    // Reflect selected state on card
    const card = document.querySelector(`.segment-card[data-id="${id}"]`)
    card?.classList.toggle('selected', checked)

    updateSelectionBar()
}

function updateSelectionBar() {
    const bar   = el('selection-bar')
    const count = el('selection-count')
    if (!bar) return

    const n = state.selectedSegmentIds.size
    if (n > 0) {
        bar.style.display   = 'flex'
        count.textContent   = `${n} segment${n !== 1 ? 's' : ''} selected`
    } else {
        bar.style.display   = 'none'
    }
}

function clearSelection() {
    state.selectedSegmentIds.clear()
    document.querySelectorAll('.seg-checkbox').forEach(cb => { cb.checked = false })
    document.querySelectorAll('.segment-card').forEach(c => c.classList.remove('selected'))
    updateSelectionBar()
}

/* ── Project Actions ────────────────────────────────────────────────────── */
async function loadProjects() {
    state.projects = await api('get_projects')
    renderProjects()
}

async function selectProject(id) {
    state.activeProjectId = id
    renderProjects()
    state.segments = await api('get_segments', { project_id: id })
    renderSegments()
}

function openCreateProject() {
    state.editingProject = null
    el('project-modal-title').textContent = 'New Project'
    el('project-name-input').value = ''
    openModal('project-modal')
    setTimeout(() => el('project-name-input').focus(), 80)
}

function openEditProject(e, id) {
    e.stopPropagation()
    const p = state.projects.find(p => p.id === id)
    if (!p) return
    state.editingProject = p
    el('project-modal-title').textContent = 'Edit Project'
    el('project-name-input').value = p.name
    openModal('project-modal')
    setTimeout(() => el('project-name-input').focus(), 80)
}

async function saveProject() {
    const name = el('project-name-input').value.trim()
    if (!name) { showToast('Project name is required', true); return }

    try {
        if (state.editingProject) {
            await api('update_project', { id: state.editingProject.id, name })
            showToast('Project updated')
        } else {
            const created = await api('create_project', { name })
            state.activeProjectId = created.id
            showToast('Project created')
        }
        closeModal('project-modal')
        await loadProjects()
        if (state.activeProjectId) await selectProject(state.activeProjectId)
    } catch (err) {
        showToast(err.message, true)
    }
}

function openDeleteProject(e, id) {
    e.stopPropagation()
    const p = state.projects.find(p => p.id === id)
    if (!p) return
    state.pendingDelete = { type: 'project', id, name: p.name }
    el('confirm-message').textContent = `Delete project "${p.name}" and all its segments? This cannot be undone.`
    openModal('confirm-modal')
}

/* ── Segment Actions ────────────────────────────────────────────────────── */
function openCreateSegment() {
    state.editingSegment = null
    el('segment-modal-title').textContent = 'New Segment'
    el('segment-title-input').value = ''
    el('segment-content-input').value = ''
    openModal('segment-modal')
    setTimeout(() => el('segment-title-input').focus(), 80)
}

async function openEditSegment(id) {
    try {
        const s = await api('get_segment', { id })
        state.editingSegment = s
        el('segment-modal-title').textContent = 'Edit Segment'
        el('segment-title-input').value = s.title
        el('segment-content-input').value = s.content
        openModal('segment-modal')
        setTimeout(() => el('segment-title-input').focus(), 80)
    } catch (err) {
        showToast(err.message, true)
    }
}

async function saveSegment() {
    const title   = el('segment-title-input').value.trim()
    const content = el('segment-content-input').value.trim()
    if (!title) { showToast('Segment title is required', true); return }

    try {
        if (state.editingSegment) {
            await api('update_segment', { id: state.editingSegment.id, title, content })
            showToast('Segment updated')
        } else {
            await api('create_segment', { project_id: state.activeProjectId, title, content })
            showToast('Segment added')
        }
        closeModal('segment-modal')
        state.segments = await api('get_segments', { project_id: state.activeProjectId })
        renderSegments()
    } catch (err) {
        showToast(err.message, true)
    }
}

function openDeleteSegment(id) {
    const s = state.segments.find(s => s.id === id)
    if (!s) return
    state.pendingDelete = { type: 'segment', id, name: s.title }
    el('confirm-message').textContent = `Delete segment "${s.title}"? This cannot be undone.`
    openModal('confirm-modal')
}

async function confirmDelete() {
    if (!state.pendingDelete) return
    const { type, id } = state.pendingDelete

    try {
        if (type === 'project') {
            await api('delete_project', { id })
            if (state.activeProjectId === id) {
                state.activeProjectId = null
                state.segments = []
            }
            await loadProjects()
            if (state.activeProjectId) {
                await selectProject(state.activeProjectId)
            } else {
                renderSegments()
            }
            showToast('Project deleted')
        } else {
            await api('delete_segment', { id })
            state.segments = await api('get_segments', { project_id: state.activeProjectId })
            renderSegments()
            showToast('Segment deleted')
        }
        closeModal('confirm-modal')
        state.pendingDelete = null
    } catch (err) {
        showToast(err.message, true)
    }
}

/* ── Teleprompter Launch ─────────────────────────────────────────────────── */
function openTp(url) {
    window.open(url, '_blank', 'fullscreen=yes,toolbar=no,menubar=no,location=no,status=no')
}

function launchSegment(id) {
    openTp(`teleprompter.php?id=${id}`)
}

function launchProject(projectId) {
    // Launch all segments for this project in their sort order
    openTp(`teleprompter.php?project_id=${projectId}`)
}

function launchSelected() {
    if (state.selectedSegmentIds.size === 0) return
    // Preserve display order (as shown in the grid)
    const orderedIds = state.segments
        .filter(s => state.selectedSegmentIds.has(s.id))
        .map(s => s.id)
        .join(',')
    openTp(`teleprompter.php?ids=${orderedIds}`)
}

/* ── Modal Helpers ──────────────────────────────────────────────────────── */
function openModal(id)  { el(id).classList.add('open') }
function closeModal(id) { el(id).classList.remove('open') }

/* ── Toast ──────────────────────────────────────────────────────────────── */
function showToast(msg, isError = false) {
    const t = document.createElement('div')
    t.className = `toast${isError ? ' toast-error' : ''}`
    t.textContent = msg
    el('toast-container').appendChild(t)
    setTimeout(() => t.remove(), 3000)
}

/* ── Utils ──────────────────────────────────────────────────────────────── */
function escHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
}

/* ── Keyboard Shortcuts ─────────────────────────────────────────────────── */
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        ['project-modal', 'segment-modal', 'confirm-modal'].forEach(closeModal)
    }
})

/* ── Init ───────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
    await loadProjects()

    el('main-title').textContent    = 'Dashboard'
    el('main-subtitle').textContent = 'Select a project to get started'
    el('add-segment-btn').style.display = 'none'

    el('project-name-input').addEventListener('keydown', e => {
        if (e.key === 'Enter') saveProject()
    })
})
