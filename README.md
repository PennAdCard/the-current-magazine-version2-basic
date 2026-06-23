# Simple Magazine — Version 2

This is a basic, beginner-friendly magazine website. The code contains many comments to explain what the HTML, CSS, and JavaScript do.

## What the project includes

- A responsive magazine homepage
- A navigation menu connecting both pages
- A separate member sign-up page
- Required name, email, age/grade, and address/affiliation fields
- An optional phone-number field
- Form validation
- A table that displays submitted members
- Edit, delete, and search features
- JSON storage using the browser's `localStorage`
- Bootstrap plus basic custom CSS

## Project folders

```text
the-current-version2-basic/
├── index.html          The homepage
├── members.html        The member form and table
├── README.md           These instructions
├── .gitignore          Prevents unwanted system files from going to GitHub
├── css/
│   └── style.css       Colors, fonts, sizes, and spacing
└── js/
    └── members.js      Validation, JSON, table, edit, and delete behavior
```

## Open it correctly in Visual Studio Code

1. Start Visual Studio Code.
2. Select **File → Open Folder**.
3. Select the entire `the-current-version2-basic` folder. Do not select only the `css` or `js` folder.
4. The Explorer on the left should show `index.html`, `members.html`, `css`, and `js` together.
5. Click `index.html` to open it.

## Run the website with Live Server

1. Make sure the **Live Server** extension is installed.
2. Open `index.html` in Visual Studio Code.
3. Right-click inside the file.
4. Select **Open with Live Server**.
5. Your browser should open an address similar to `http://127.0.0.1:5500/index.html`.

If the browser only displays a list of files, stop Live Server and confirm that the complete `the-current-version2-basic` folder is open in Visual Studio Code.

## Test the member page

1. Click **Member Sign-Up** in the navigation menu.
2. Click **Add Member** without entering information. Required-field messages should appear.
3. Complete all required fields. The phone number may remain blank.
4. Click **Add Member**. A row should appear in the table.
5. Refresh the browser. The member remains because JSON data was saved in the browser.
6. Try the **Edit**, **Delete**, and search controls.
7. Look at the **Stored JSON Data** box to see the information in JSON format.

## How the files work together

`index.html` and `members.html` contain the page structure and text. Both pages connect to `css/style.css`, which provides colors, fonts, spacing, and responsive styles.

Only `members.html` connects to `js/members.js`. JavaScript reads the form, validates required entries, saves members as JSON, and creates the table rows.

Bootstrap is loaded from the internet. It supplies the responsive columns, navigation, buttons, form controls, and table styling. The website needs an internet connection for Bootstrap to load.

## Save Version 2 to GitHub

Create a separate repository so Version 1 remains unchanged:

1. In Visual Studio Code, confirm that `the-current-version2-basic` is the open folder.
2. Open **Source Control** from the left sidebar.
3. Click **Initialize Repository**.
4. Enter the commit message `Create beginner magazine version 2`.
5. Click **Commit** and approve staging all files if asked.
6. Click **Publish Branch** or **Publish to GitHub**.
7. Use a new repository name such as `the-current-magazine-version2-basic`.
8. Choose private or public visibility.

Do not publish Version 2 from inside the Version 1 repository. Each version should have its own folder and repository.
