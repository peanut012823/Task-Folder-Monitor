import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowLeft, ArrowRight, CalendarDays, ChevronRight, Download, ExternalLink,
  File, FileImage, FileText, FolderOpen, GripVertical, Link2, Plus, RefreshCw,
  Search, Trash2, Type
} from "lucide-react";
import "./styles.css";

const STATUSES = [
  ["In progress", "blue"],
  ["In Vetting", "yellow"],
  ["For Revision", "navy"],
  ["For Upload", "purple"],
  ["Completed", "green"]
];

const STORAGE_KEY = "task-folder-monitor-electron-v1";

function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

function loadTasks() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}
function saveTasks(tasks) { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); }

function ext(name) {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}
function baseName(name) {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(0, i) : name;
}
function statusClass(status) {
  return STATUSES.find(x => x[0] === status)?.[1] || "blue";
}

function App() {
  const [tasks, setTasks] = useState(loadTasks);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => saveTasks(tasks), [tasks]);

  const selectedTask = tasks.find(t => t.id === selectedId);

  const addTask = () => {
    const task = {
      id: uid(),
      name: "",
      status: "In progress",
      priority: "Medium",
      deadline: "",
      notes: "",
      sourceFolderPath: "",
      sourceFolderName: "",
      workfileLocation: ""
    };
    setTasks(prev => [...prev, task]);
    setSelectedId(task.id);
  };

  const updateTask = (id, patch) =>
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));

  const deleteTask = id => {
    setTasks(prev => prev.filter(t => t.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <div className="brand">TASK FOLDER MONITOR</div>
          <div className="subtitle">Local desktop task tracking • folder verification • file preparation</div>
        </div>
        <button className="primary" onClick={addTask}><Plus size={17}/> Create Task</button>
      </header>

      {!selectedTask
        ? <TaskTable tasks={tasks} updateTask={updateTask} openTask={setSelectedId} deleteTask={deleteTask}/>
        : <TaskDetail task={selectedTask} updateTask={patch => updateTask(selectedTask.id, patch)} onBack={() => setSelectedId(null)}/>
      }
    </div>
  );
}

function TaskTable({ tasks, updateTask, openTask, deleteTask }) {
  return (
    <main className="workspace">
      <section className="main-panel">
        <div className="panel-head">
          <div className="panel-title">TASKS</div>
          <div className="small-muted">{tasks.length} task{tasks.length === 1 ? "" : "s"}</div>
        </div>
        <div className="table-wrap">
          <table className="task-table">
            <thead>
              <tr>
                <th>TASKS</th><th>STATUS</th><th>PRIORITY LEVEL</th><th>DEADLINE</th><th>NOTES</th><th>SOURCE FOLDER</th><th></th>
              </tr>
            </thead>
            <tbody>
              {!tasks.length && <tr><td colSpan="7" className="empty">No tasks yet. Click <b>Create Task</b> and enter a task name to start.</td></tr>}
              {tasks.map(task => (
                <tr key={task.id}>
                  <td>
                    <button className="task-link" onClick={() => openTask(task.id)}>
                      {task.name || "Enter task name"} <ChevronRight size={15}/>
                    </button>
                  </td>
                  <td>
                    <select className={`status-select ${statusClass(task.status)}`} value={task.status}
                      onChange={e => updateTask(task.id, {status:e.target.value})}>
                      {STATUSES.map(([s]) => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td>
                    <select className="cell-input" value={task.priority} onChange={e=>updateTask(task.id,{priority:e.target.value})}>
                      <option>Low</option><option>Medium</option><option>High</option><option>Urgent</option>
                    </select>
                  </td>
                  <td><input className="cell-input" type="date" value={task.deadline} onChange={e=>updateTask(task.id,{deadline:e.target.value})}/></td>
                  <td><input className="cell-input" value={task.notes} placeholder="Add note..." onChange={e=>updateTask(task.id,{notes:e.target.value})}/></td>
                  <td>
                    <button className="folder-button" onClick={()=>openTask(task.id)}>
                      <FolderOpen size={15}/>{task.sourceFolderName || "Link source folder"}
                    </button>
                  </td>
                  <td><button className="icon-button danger" onClick={()=>deleteTask(task.id)}><Trash2 size={15}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flow-arrow"><ArrowRight size={42} strokeWidth={1.1}/></div>

      <section className="info-panel">
        <div className="info-title">WORKFLOW</div>
        <div className="workflow-card"><span className="num">1</span><div><b>Task</b><p>Name the task and connect its local source folder.</p></div></div>
        <div className="workflow-card"><span className="num">2</span><div><b>Inspect</b><p>Scan Illustrator, Links, Export and Fonts directly from disk.</p></div></div>
        <div className="workflow-card"><span className="num">3</span><div><b>Prepare</b><p>Rename files, add dates and set the workfile location.</p></div></div>
        <div className="browser-note">Desktop version: Electron can read, open and rename local files/folders with your permission.</div>
      </section>
    </main>
  );
}

function TaskDetail({ task, updateTask, onBack }) {
  const [files, setFiles] = useState({ai:[], links:[], export:[], fonts:[], linksFolder:"", exportFolder:"", fontsFolder:""});
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState("");
  const [dateMode, setDateMode] = useState("before");
  const [selected, setSelected] = useState({links:new Set(), export:new Set(), fonts:new Set()});
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const scan = async pathValue => {
    if (!pathValue) return;
    setLoading(true);
    const result = await window.desktop.scanFolder(pathValue);
    setFiles(result || {ai:[],links:[],export:[],fonts:[]});
    setLoading(false);
    if (result?.error) setMessage(result.error);
    else setMessage(`Scanned ${result?.ai?.length || 0} Illustrator, ${result?.links?.length || 0} Links, ${result?.export?.length || 0} Export and ${result?.fonts?.length || 0} Font file(s).`);
  };

  const chooseSource = async () => {
    const folder = await window.desktop.chooseFolder();
    if (!folder) return;
    updateTask({sourceFolderPath: folder, sourceFolderName: folder.split(/[\\/]/).pop()});
    await scan(folder);
  };

  const refresh = () => scan(task.sourceFolderPath);

  const openFile = async item => {
    const result = await window.desktop.openPath(item.path);
    if (!result.ok) setMessage(result.error || "Could not open file.");
  };

  const openFolder = async folderPath => {
    if (!folderPath) { setMessage("Folder location is not available."); return; }
    const result = await window.desktop.openPath(folderPath);
    if (!result.ok) setMessage(result.error || "Could not open folder in Explorer.");
  };

  const renameItem = async item => {
    const proposed = prompt(`Rename file: ${item.name}`, baseName(item.name));
    if (!proposed || proposed === baseName(item.name)) return;
    const newName = proposed.includes(".") ? proposed : `${proposed}.${ext(item.name)}`;
    const result = await window.desktop.renameFile(item.path, newName);
    if (!result.ok) {
      setMessage(result.error || "Could not rename file.");
      return;
    }
    setMessage(`Renamed ${item.name} → ${result.name}`);
    await refresh();
  };

  // Exact requested format:
  // BEFORE: 20260511 - 2-Pack Soothe Changing Pad Covers (Cameo) Main_1A.jpg
  // AFTER:  3-Pack Soothe (Wren) Swaddle Wraps (Glacier, Large) Listing_2 - 20260903.jpg
  const buildDatedName = (oldName) => {
    if (!date) return oldName;
    const extPart = ext(oldName);
    const stem = baseName(oldName);
    return dateMode === "before"
      ? `${date.replaceAll("-", "")} - ${stem}.${extPart}`
      : `${stem} - ${date.replaceAll("-", "")}.${extPart}`;
  };

  const addDateToSelected = async section => {
    if (!date) { setMessage("Choose a date first."); return; }
    const paths = [...selected[section]];
    if (!paths.length) { setMessage("Select one or more Export files first."); return; }
    const items = files[section].filter(item => paths.includes(item.path));
    let count = 0;
    for (const item of items) {
      const result = await window.desktop.renameFile(item.path, buildDatedName(item.name));
      if (!result.ok) setMessage(result.error || `Could not rename ${item.name}`);
      else count++;
    }
    setSelected({...selected, [section]:new Set()});
    setMessage(`${count} Export file(s) renamed with the date.`);
    await refresh();
  };

  const toggle = (section, item) => {
    const next = new Set(selected[section]);
    next.has(item.path) ? next.delete(item.path) : next.add(item.path);
    setSelected({...selected, [section]:next});
  };

  const visible = section =>
    files[section].filter(x => x.name.toLowerCase().includes(search.toLowerCase()));

  const chooseWorkfile = async () => {
    const folder = await window.desktop.chooseWorkfileFolder();
    if (folder) updateTask({workfileLocation:folder});
  };

  const handleDrop = async e => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const p = window.desktop.getPathForFile(file);
    if (p) updateTask({workfileLocation:p});
    else setMessage("Could not read the dropped folder path.");
  };

  useEffect(() => {
    if (task.sourceFolderPath) scan(task.sourceFolderPath);
  }, [task.sourceFolderPath]);

  return (
    <main className="detail">
      <div className="detail-top">
        <button className="back" onClick={onBack}><ArrowLeft size={17}/> Back to Tasks</button>
        <div className="detail-heading">
          <div>
            <div className="task-name-editor">
            <label>TASK NAME</label>
            <input className="task-name-input" value={task.name}
              placeholder="Enter task name" autoFocus={!task.name}
              onChange={e => updateTask({name:e.target.value})}/>
            <div className="detail-meta">
              <select className={`status-select ${statusClass(task.status)}`} value={task.status} onChange={e=>updateTask({status:e.target.value})}>
                {STATUSES.map(([s])=><option key={s}>{s}</option>)}
              </select>
              <span>Priority: <b>{task.priority}</b></span>
              {task.deadline && <span>Deadline: <b>{task.deadline}</b></span>}
            </div>
            </div>
          </div>
          <button className="secondary" onClick={refresh} disabled={!task.sourceFolderPath || loading}><RefreshCw size={16}/> {loading ? "Scanning..." : "Refresh Scan"}</button>
        </div>
      </div>

      <div className="source-bar">
        <div className="source-label">
          <FolderOpen size={18}/>
          <div><b>Source folder</b><span>{task.sourceFolderPath || "Not connected"}</span></div>
        </div>
        <button className="primary" onClick={chooseSource}><Link2 size={16}/> {task.sourceFolderPath ? "Change Source Folder" : "Link Source Folder"}</button>
      </div>

      {message && <div className="notice">{message}</div>}

      <div className="file-grid">
        <FileSection title="Adobe Illustrator file" icon={<File size={18}/>} files={visible("ai")} empty="No .ai file found in the source folder." onOpen={openFile}/>
        <FileSection title="Links folder" icon={<Link2 size={18}/>} folderPath={files.linksFolder} files={visible("links")} empty="No .psd or .psb files found." onOpen={openFile} onOpenFolder={openFolder} selectable selected={selected.links} onToggle={i=>toggle("links", visible("links")[i])} onRename={renameItem}/>
        <FileSection title="Export" icon={<Download size={18}/>} folderPath={files.exportFolder} files={visible("export")} empty="No .jpg, .jpeg or .png files found." onOpen={openFile} onOpenFolder={openFolder} selectable selected={selected.export} onToggle={i=>toggle("export", visible("export")[i])} onRename={renameItem}/>
        <FileSection title="Fonts" icon={<Type size={18}/>} files={visible("fonts")} empty="No font files found." onOpen={openFile} selectable selected={selected.fonts} onToggle={i=>toggle("fonts", visible("fonts")[i])} onRename={renameItem}/>
      </div>

      <section className="tools-panel">
        <div className="tools-title">FILE TOOLS</div>
        <div className="tool-row">
          <div className="tool-field"><label><CalendarDays size={15}/> Date</label><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
          <div className="tool-field"><label>Place date</label>
            <select value={dateMode} onChange={e=>setDateMode(e.target.value)}>
              <option value="before">Before filename</option>
              <option value="after">After filename</option>
            </select>
          </div>
          <div className="tool-actions">
            <button className="secondary" onClick={()=>addDateToSelected("export")}>Apply Date to Selected Export</button>
          </div>
          <div className="format-example">
            {dateMode === "before"
              ? "20260511 - Filename.ext"
              : "Filename.ext → Filename - 20260903.ext"}
          </div>
        </div>
        <div className="search-row">
          <Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search scanned files..."/>
          <span className="small-muted">File Tool works only with selected Export items.</span>
        </div>
        <div className="selected-export-list">
          <b>Selected Export files</b>
          {selected.export.size === 0 ? <span className="small-muted">None selected</span> : [...selected.export].map(path => {
            const item = files.export.find(x => x.path === path);
            return item ? <div key={path} className="selected-export-item"><FileImage size={14}/>{item.name}</div> : null;
          })}
        </div>
      </section>

      <section className="workfile" onDragOver={e=>e.preventDefault()} onDrop={handleDrop}>
        <div className="workfile-icon"><GripVertical size={21}/></div>
        <div className="workfile-copy">
          <b>Workfile location</b>
          <p>{task.workfileLocation || "Drag and drop a folder here"}</p>
        </div>
        <div className="workfile-actions">
          <button className="secondary" onClick={chooseWorkfile}><FolderOpen size={15}/> Choose Folder</button>
          {task.workfileLocation && <button className="secondary" onClick={()=>openFolder(task.workfileLocation)}><ExternalLink size={15}/> Open in Explorer</button>}
        </div>
      </section>

      <div className="notes-bar">
        <label>Notes</label>
        <textarea value={task.notes} onChange={e=>updateTask({notes:e.target.value})} placeholder="Task notes..."/>
      </div>
    </main>
  );
}

function FileSection({title, icon, files, empty, onOpen, onOpenFolder, folderPath, selectable=false, selected=new Set(), onToggle, onRename}) {
  return <section className="file-section">
    <div className="section-head">
      <div className="section-title">{icon}{title}</div>
      <div className="section-head-actions">
        {onOpenFolder && <button className="folder-location" onClick={()=>onOpenFolder(folderPath)}><FolderOpen size={14}/> Open Folder</button>}
        <span className="count">{files.length}</span>
      </div>
    </div>
    <div className="file-list">
      {!files.length ? <div className="file-empty">{empty}</div> : files.map((item,i)=><div className="file-item" key={item.path}>
        {selectable && <input type="checkbox" checked={selected.has(item.path)} onChange={()=>onToggle(i)}/>}<FileIcon name={item.name}/>
        <span className="file-name" title={item.path}>{item.name}</span>
        <button className="icon-button" onClick={()=>onOpen(item)} title="Open"><ExternalLink size={15}/></button>
        {onRename && <button className="icon-button" onClick={()=>onRename(item)} title="Rename"><Type size={15}/></button>}
      </div>)}
    </div>
  </section>;
}
function FileIcon({name}) {
  const e = ext(name);
  if (["jpg","jpeg","png"].includes(e)) return <FileImage size={17}/>;
  if (["psd","psb"].includes(e)) return <FileText size={17}/>;
  return <File size={17}/>;
}

createRoot(document.getElementById("root")).render(<App/>);