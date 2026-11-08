# Teleprompter — 601MEDIA

A browser-based teleprompter for organizing production scripts into projects and segments, then reading them with adjustable scrolling and typography. Built for 601MEDIA with PHP, SQLite, and vanilla JavaScript.

## Features

- Create, rename, and delete projects
- Create, edit, and delete script segments with preserved line breaks
- Launch one segment, selected segments, or all segments in a project
- Play selected segments in dashboard order
- Adjust scroll speed, font size, side padding, line height, and letter spacing
- Pause, restart, reverse scroll direction, and toggle fullscreen
- Track the current segment during chained playback
- Read against a center guide with controls that hide automatically
- Store projects and scripts in a local SQLite database

<br>

![601MEDIA Telepromptor](https://601mediasolutions.com/cdn_601/teleprompter-promo.png)

<br>

![Watch in action](https://601mediasolutions.com/cdn_601/teleprompter-promo.gif)

<br>

## Requirements

- PHP with syntax support for PHP 7.4 or newer
- PHP PDO and the `pdo_sqlite` extension enabled
- A PHP-capable web server, such as Apache through XAMPP, or PHP's built-in server for local development
- A modern browser with JavaScript enabled
- A writable `data` directory inside the project

There are no npm or Composer dependencies and no build step. MySQL is not required. Montserrat is loaded from Google Fonts; the stylesheet falls back to sans-serif when it is unavailable.

## Local setup

### XAMPP / Apache

1. Place the project in an Apache-served directory or configure a virtual host pointing to this folder.
2. Enable `pdo_sqlite` in the PHP configuration used by Apache. Restart Apache after configuration changes.
3. Create a `data` directory in the project root if it does not exist, and grant the web server write access to that directory.
4. Start Apache and open the project's URL in your browser. For a folder served as `/teleprompter`, use `http://localhost/teleprompter/`. If the folder is nested or uses a virtual host, use its configured URL.
5. Create your first project. The database file and tables are initialized automatically when the API first opens a database connection.

### PHP development server

1. Open PowerShell in the project root.
2. Ensure the storage directory exists:

   ```powershell
   New-Item -ItemType Directory -Path .\data -Force | Out-Null
   ```

3. Start the server with PHP available on your `PATH`:

   ```powershell
   php -S localhost:8000
   ```

   With XAMPP installed at `D:\xampp`, you can instead run:

   ```powershell
   & 'D:\xampp\php\php.exe' -S localhost:8000
   ```

4. Open `http://localhost:8000/`.

The built-in server is for local development. The application creates the SQLite file, but does not create the parent `data` directory.

## Using the teleprompter

1. Click **+ New Project**, enter a project name, and save it.
2. Select the project, click **+ Add Segment**, and enter a title and script.
3. Click **Launch** on a segment, select segment checkboxes and click **Launch Selected**, or click **Launch All** when the project has multiple segments.
4. In the playback window, press **Space** or click Play to start scrolling. Adjust the sliders as needed.
5. Move the mouse or click to reveal hidden controls. Use Restart to return to the beginning and resume playback.

Playback opens in a separate browser window or tab. Allow pop-ups for the local site if needed. Automatic fullscreen depends on browser permissions; use **F** or the fullscreen button if it does not activate.

### Playback shortcuts

Letter shortcuts use lowercase keys and are ignored while an input control has focus.

| Key / input | Action |
| --- | --- |
| Space or `k` | Play / pause |
| `r` or Home | Restart and play |
| Up arrow | Decrease scroll speed |
| Down arrow | Increase scroll speed |
| `+` or `=` | Increase font size |
| `-` | Decrease font size |
| `x` | Toggle reverse scrolling |
| `f` | Toggle fullscreen |
| Escape | Pause and attempt to close the playback window; the browser may exit fullscreen first |
| Mouse wheel up / down | Decrease / increase scroll speed |
| Touch drag | Manually move through the script |

Playback settings reset when the playback page is reopened or reloaded.

## Project structure

```text
teleprompter/
├── index.php                  # Project and segment dashboard
├── teleprompter.php            # Playback page and controls
├── api.php                    # JSON API for projects and segments
├── db.php                     # PDO SQLite connection and schema initialization
├── assets/
│   ├── css/style.css          # Dashboard and playback styles
│   └── js/
│       ├── dashboard.js       # Dashboard state, API calls, and launch actions
│       └── teleprompter.js    # Scrolling engine and playback interactions
├── data/
│   └── teleprompter.db        # Created on first database connection
├── .gitignore
└── README.md
```

## Data and deployment

Projects and segments are stored in `data/teleprompter.db`. Deleting a project also deletes its segments through a foreign-key cascade. The `data` directory and database files are excluded from Git, so each checkout needs its own storage directory.

To back up scripts, stop writes to the application and copy the database file. To restore, stop writes and replace it with a backup. Keep backups outside the web-served directory.

The application currently has no authentication or user-level access controls. Anyone who can reach the API can read and modify scripts. Before hosting beyond a trusted local environment, add access controls and configure the server to deny HTTP access to `data/`. The PHP development server does not provide that directory protection by default.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| `could not find driver` | Enable `pdo_sqlite` for the PHP runtime serving the app. Apache and command-line PHP can use different configuration files. |
| `unable to open database file` | Confirm `data` exists and the server process can write to it. |
| Database is read-only | Confirm write permissions on both the database file and its parent directory. |
| Playback window does not open | Allow pop-ups for the application URL. |
| Fullscreen does not activate | Click the fullscreen button or press `f` outside an input control. Browser support and permissions apply. |
| Playback reports no segments | Add a segment to the project and relaunch it from the dashboard. |

## Manual verification

There is no automated test suite included. After changing the application:

1. Create a project and two segments, then reload the dashboard to confirm persistence.
2. Edit the project name and a segment's script, then verify the saved changes.
3. Launch one segment, selected segments, and all segments; confirm the displayed order.
4. Check play/pause, restart, reverse scrolling, typography controls, fullscreen, and the end-of-script overlay.
5. Use a disposable project to verify segment deletion and project deletion.
