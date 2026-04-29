# HiveFive — Backend Guide (PHP + MySQL)

*Everything you need to build, test, and deploy the backend for HiveFive. Assumes you know nothing.*

---

## What You're Building

The frontend (React) runs in the user's browser. It's pretty, but it's dumb — it can't store data, authenticate users, or remember anything between page loads. That's the backend's job.

Your backend is a set of **PHP files** that sit on the UB servers. The frontend sends HTTP requests to these files (using `fetch`), the PHP code talks to a **MySQL database**, and sends back JSON responses. That's it. That's the whole pattern.

```
Browser (React)  ──fetch──>  PHP file on server  ──query──>  MySQL database
                 <──JSON───                      <──rows───
```

---

## Part 0: Get On the Network

Both servers are behind UB's firewall. **If you're off campus, connect to the UB VPN first.** Nothing — not the website, not phpMyAdmin, not SSH — will work without this.

If you're on campus Wi-Fi, you're good.

---

## Part 1: Understanding the Two Servers

| | Aptitude (Test) | Cattle (Production) |
|---|---|---|
| **URL** | `https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/` | `https://cattle.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/` |
| **Purpose** | Testing during the sprint | The graded release |
| **Maps to** | `dev` branch | `main` branch |
| **Update when** | After PRs merge into `dev` | End of sprint ONLY |
| **Tests run here** | Task tests | Acceptance tests |
| **Server path** | `/data/web/CSE442/2026-Spring/cse-442j/` | `/data/web/CSE442/2026-Spring/cse-442j/` |

These are real Apache servers running PHP and MySQL. Your PHP files run directly on them — no build step needed (unlike the React frontend).

---

## Part 2: Credentials (Don't Mix These Up)

There are TWO different sets of credentials and people confuse them constantly.

| Service | Username | Password |
|---|---|---|
| **SSH** (logging into the server via terminal) | Your UBIT username | Your **UBIT password** |
| **MySQL / phpMyAdmin** (database access) | Your UBIT username | Your **8-digit person number** |

**These are NOT the same password.** SSH uses your UBIT password. MySQL uses your person number. Mix them up and you'll stare at "Access denied" errors wondering what's wrong with your life.

Database name on both servers: `cse442_2026_spring_team_j_db`

When your PHP code connects to the database, the hostname is always `localhost` — it connects to the MySQL instance on whichever server the code is running on.

---

## Part 3: The API Folder Structure

All backend PHP files live in an `api/` folder in the repo. This keeps them separate from the React frontend code. Here's the structure we're using:

```
s26-hivefive/
├── src/                    ← React frontend (you don't touch this)
├── api/                    ← ALL backend PHP code goes here
│   ├── db_config.php       ← Database connection (NEVER commit real credentials)
│   ├── auth/
│   │   ├── login.php
│   │   ├── register.php
│   │   └── logout.php
│   ├── services/
│   │   ├── list.php        ← GET: fetch all services
│   │   ├── get.php         ← GET: fetch one service by ID
│   │   └── create.php      ← POST: create a new service
│   ├── users/
│   │   └── profile.php     ← GET: fetch user profile
│   ├── bookings/
│   │   └── create.php      ← POST: create a booking
│   ├── messages/
│   │   ├── conversations.php
│   │   └── messages.php
│   └── wallet/
│       ├── balance.php
│       └── transactions.php
├── package.json
└── ...
```

**Every PHP file follows the same pattern:** receive a request, validate the input, talk to the database, return JSON. That's it.

---

## Part 4: Setting Up the Database (phpMyAdmin)

### 4.1 — Log Into phpMyAdmin

1. Open: **https://aptitude.cse.buffalo.edu/phpmyadmin/**
2. Username: Your UBIT username
3. Password: Your **8-digit person number** (NOT your UBIT password)
4. Click on `cse442_2026_spring_team_j_db` in the left sidebar

### 4.2 — Create the Users Table

Click the **SQL** tab at the top and run:

```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    bio TEXT DEFAULT '',
    university VARCHAR(100) DEFAULT 'University at Buffalo',
    profile_image VARCHAR(255) DEFAULT '',
    hivecoin_balance DECIMAL(10,2) DEFAULT 100.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

Click **Go**.

Notice the column is called `password_hash`, not `password`. We NEVER store plain text passwords. The rubric literally gives you a 0 for storing passwords in plaintext. More on this in the Security section.

### 4.3 — Insert a Test User

```sql
INSERT INTO users (email, username, password_hash, first_name, last_name)
VALUES (
    'testuser@buffalo.edu',
    'testuser',
    '$2y$10$examplehashdonotusethisinproduction',
    'Test',
    'User'
);
```

Verify it worked by clicking on the `users` table in the left sidebar.

### 4.4 — Save Your SQL Setup Scripts

Create a file in the repo at `api/sql/setup.sql` containing all your `CREATE TABLE` statements, and `api/sql/seed.sql` for test data. This way anyone on the team can recreate the database from scratch. The rubric checks for these.

---

## Part 5: The Database Config File

This file connects your PHP code to MySQL. Create it at `api/db_config.php`:

```php
<?php
$host = 'localhost';
$db   = 'cse442_2026_spring_team_j_db';
$user = 'YOUR_UBIT_USERNAME';      // <-- replace with your actual UBIT
$pass = 'YOUR_PERSON_NUMBER';      // <-- replace with your 8-digit person number

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Database connection failed"]);
    exit;
}

// Set charset to handle special characters properly
$conn->set_charset("utf8mb4");
?>
```

**CRITICAL: Add `api/db_config.php` to your `.gitignore` file.** This file contains database credentials and must NEVER be committed to the repo. The rubric says "files that only specify passwords/API keys are not required to be in the repo" — this is that file. Each person creates it manually on their local machine and on the servers.

Add this line to your `.gitignore`:

```
api/db_config.php
```

But DO commit a template so teammates know what to fill in. Create `api/db_config.example.php`:

```php
<?php
// Copy this file to db_config.php and fill in your credentials
// DO NOT commit db_config.php to the repo
$host = 'localhost';
$db   = 'cse442_2026_spring_team_j_db';
$user = '';   // Your UBIT username
$pass = '';   // Your 8-digit person number

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Database connection failed"]);
    exit;
}

$conn->set_charset("utf8mb4");
?>
```

---

## Part 6: Writing API Endpoints

Every PHP endpoint follows the same skeleton. Learn this pattern once and you can write any endpoint.

### The Skeleton

```php
<?php
// 1. Headers — tell the browser this is JSON and handle CORS
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests (the browser sends these automatically)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 2. Connect to the database
require_once __DIR__ . '/../db_config.php';

// 3. Your logic goes here

// 4. Close connection
$conn->close();
?>
```

### Example: GET All Users (`api/users/list.php`)

```php
<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/../db_config.php';

$sql = "SELECT id, email, username, first_name, last_name, bio, university,
        profile_image, hivecoin_balance, created_at
        FROM users";

$result = $conn->query($sql);

$users = [];
while ($row = $result->fetch_assoc()) {
    $users[] = $row;
}

echo json_encode($users);
$conn->close();
?>
```

Notice we SELECT specific columns — we do NOT select `password_hash`. Never send password data to the frontend.

### Example: GET One User by ID (`api/users/profile.php`)

```php
<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/../db_config.php';

// Get the user ID from the query string: /api/users/profile.php?id=1
$id = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($id <= 0) {
    http_response_code(400);
    echo json_encode(["error" => "Valid user ID is required"]);
    $conn->close();
    exit;
}

// ALWAYS use prepared statements — never concatenate user input into SQL
$stmt = $conn->prepare("SELECT id, email, username, first_name, last_name, bio,
                        university, profile_image, hivecoin_balance, created_at
                        FROM users WHERE id = ?");
$stmt->bind_param("i", $id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    http_response_code(404);
    echo json_encode(["error" => "User not found"]);
} else {
    echo json_encode($result->fetch_assoc());
}

$stmt->close();
$conn->close();
?>
```

### Example: POST — Create a User (`api/auth/register.php`)

```php
<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "POST method required"]);
    exit;
}

require_once __DIR__ . '/../db_config.php';

// Read the JSON body from the request
$input = json_decode(file_get_contents('php://input'), true);

// Validate required fields
$required = ['email', 'username', 'password', 'first_name', 'last_name'];
foreach ($required as $field) {
    if (empty($input[$field])) {
        http_response_code(400);
        echo json_encode(["error" => "$field is required"]);
        $conn->close();
        exit;
    }
}

// Validate email is a buffalo.edu address
if (!str_ends_with($input['email'], '@buffalo.edu')) {
    http_response_code(400);
    echo json_encode(["error" => "Must use a @buffalo.edu email"]);
    $conn->close();
    exit;
}

// Hash the password — NEVER store plaintext
// password_hash() automatically generates a salt (this gets you "Exemplary" on the rubric)
$password_hash = password_hash($input['password'], PASSWORD_DEFAULT);

// Insert with prepared statement
$stmt = $conn->prepare("INSERT INTO users (email, username, password_hash, first_name, last_name)
                        VALUES (?, ?, ?, ?, ?)");
$stmt->bind_param("sssss",
    $input['email'],
    $input['username'],
    $password_hash,
    $input['first_name'],
    $input['last_name']
);

if ($stmt->execute()) {
    http_response_code(201);
    echo json_encode([
        "message" => "User created successfully",
        "user_id" => $conn->insert_id
    ]);
} else {
    // Check for duplicate email/username
    if ($conn->errno === 1062) {
        http_response_code(409);
        echo json_encode(["error" => "Email or username already exists"]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Failed to create user"]);
    }
}

$stmt->close();
$conn->close();
?>
```

### Example: Login (`api/auth/login.php`)

```php
<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../db_config.php';

$input = json_decode(file_get_contents('php://input'), true);

if (empty($input['email']) || empty($input['password'])) {
    http_response_code(400);
    echo json_encode(["error" => "Email and password are required"]);
    $conn->close();
    exit;
}

// Look up the user by email
$stmt = $conn->prepare("SELECT id, email, username, password_hash, first_name, last_name FROM users WHERE email = ?");
$stmt->bind_param("s", $input['email']);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    http_response_code(401);
    echo json_encode(["error" => "Invalid email or password"]);
    $stmt->close();
    $conn->close();
    exit;
}

$user = $result->fetch_assoc();

// Verify the password against the stored hash
if (!password_verify($input['password'], $user['password_hash'])) {
    http_response_code(401);
    echo json_encode(["error" => "Invalid email or password"]);
    $stmt->close();
    $conn->close();
    exit;
}

// Don't send the password hash back
unset($user['password_hash']);

// Start a session and store user info
session_start();
$_SESSION['user_id'] = $user['id'];
$_SESSION['username'] = $user['username'];

echo json_encode([
    "message" => "Login successful",
    "user" => $user
]);

$stmt->close();
$conn->close();
?>
```

---

## Part 7: Testing with Postman

Postman is how you verify your API works before the frontend ever touches it. Download it from https://www.postman.com/downloads/

**Make sure you're on UB VPN or campus network.**

### Test 1: Fetch All Users (GET)

1. Method: `GET`
2. URL: `https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/api/users/list.php`
3. Click **Send**
4. You should get back a JSON array of users

### Test 2: Register a New User (POST)

1. Method: `POST`
2. URL: `https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/api/auth/register.php`
3. Go to the **Body** tab → select **raw** → change the dropdown from "Text" to **JSON**
4. Paste:
```json
{
    "email": "newuser@buffalo.edu",
    "username": "newuser",
    "password": "mysecurepassword123",
    "first_name": "New",
    "last_name": "User"
}
```
5. Click **Send**
6. You should get back: `{ "message": "User created successfully", "user_id": 2 }`

### Test 3: Login (POST)

1. Method: `POST`
2. URL: `https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/api/auth/login.php`
3. Body → raw → JSON:
```json
{
    "email": "newuser@buffalo.edu",
    "password": "mysecurepassword123"
}
```
4. Click **Send**
5. You should get back the user object without the password hash

### Test 4: Test Error Handling

Try sending a POST to register with a duplicate email. You should get a 409 with an error message. Try fetching a user with a non-existent ID. You should get a 404. These alternate path tests matter for the rubric.

**Screenshot your Postman results.** These are your proof-of-concept deliverables.

---

## Part 8: The Proof of Concept (Sprint 1 Requirement)

The Sprint 1 rubric requires "working proof-of-concept code demoing using fetch to retrieve data stored in the backend database" and it must be "demoed from prod" (cattle).

Here's the minimum you need:

1. **A `users` table exists** in the database on cattle with at least one test user
2. **A PHP file** (`api/users/list.php` or similar) that queries the database and returns JSON
3. **Postman screenshot** showing a successful GET request to that endpoint on cattle
4. **The SQL setup scripts** (`api/sql/setup.sql` and `api/sql/seed.sql`) in the repo

That's the backend PoC. The frontend PoC is separate (demoing the React framework).

### Deploy to Cattle for the Demo

At sprint end, when the PM merges `dev` into `main`, upload the `api/` folder to cattle:

```bash
scp -r api/* YOUR_UBIT@cattle.cse.buffalo.edu:/data/web/CSE442/2026-Spring/cse-442j/api/
```

Then create `db_config.php` directly on cattle with the cattle MySQL credentials (same UBIT username and person number — it's the same credentials, different server).

```bash
ssh YOUR_UBIT@cattle.cse.buffalo.edu
cd /data/web/CSE442/2026-Spring/cse-442j/api/
nano db_config.php
# Paste the db_config contents, save, exit
```

Also run your `setup.sql` and `seed.sql` on cattle's phpMyAdmin (`https://cattle.cse.buffalo.edu/phpmyadmin/`) to create the tables and test data there.

---

## Part 9: Security — What the Rubric Requires

This isn't optional. The rubric explicitly grades these. Getting them wrong means losing points across multiple sprints.

### Passwords: Hash and Salt

**Sprint 2 rubric:**
- Satisfactory: passwords are hashed before being saved
- Exemplary: passwords are hashed AND salted before being saved

**Good news:** PHP's `password_hash()` function automatically generates a unique salt every time. If you use it, you get the Exemplary score for free:

```php
// When creating a user:
$hash = password_hash($plaintext_password, PASSWORD_DEFAULT);

// When checking login:
$valid = password_verify($input_password, $stored_hash);
```

NEVER do any of these:
```php
// BAD — plaintext
$sql = "INSERT INTO users (password) VALUES ('$password')";

// BAD — MD5 is not secure
$hash = md5($password);

// BAD — SHA without salt
$hash = sha256($password);
```

### SQL Injection: Use Prepared Statements

**ALWAYS use prepared statements.** No exceptions. The course activity solutions explicitly say this is the better approach.

```php
// GOOD — prepared statement
$stmt = $conn->prepare("SELECT * FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();

// BAD — SQL injection vulnerability (NEVER DO THIS)
$result = $conn->query("SELECT * FROM users WHERE email = '$email'");
```

The `bind_param` types: `s` = string, `i` = integer, `d` = double, `b` = blob.

```php
// Multiple parameters
$stmt = $conn->prepare("INSERT INTO users (email, username, password_hash) VALUES (?, ?, ?)");
$stmt->bind_param("sss", $email, $username, $hash);
```

### XSS Prevention: Encode Output

When you echo any user-provided data back, encode it:

```php
// If you ever output user data in HTML (not common in API-only backend):
echo htmlspecialchars($user_input, ENT_QUOTES, 'UTF-8');
```

For a JSON API, `json_encode()` handles this automatically. But NEVER trust data from the frontend — the course hammers this point relentlessly. Anyone can send any data to your endpoint using Postman, curl, or their own code. Always validate on the server.

### Sessions: Use $_SESSION, Not Cookies

The course teaches that storing user identity in cookies (even hashed) is insecure. Use PHP sessions instead:

```php
session_start();
$_SESSION['user_id'] = $user['id'];

// Later, to check if someone is logged in:
session_start();
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["error" => "Not logged in"]);
    exit;
}
```

---

## Part 10: How the Frontend Calls Your API

You don't need to know React to understand this. The frontend uses `fetch()` to call your PHP files:

```javascript
// GET request
const response = await fetch('https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/api/users/list.php');
const users = await response.json();

// POST request
const response = await fetch('https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/api/auth/register.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        email: 'test@buffalo.edu',
        username: 'testuser',
        password: 'securepassword',
        first_name: 'Test',
        last_name: 'User'
    })
});
const result = await response.json();
```

Your PHP file receives the request, does its thing, and returns JSON. The frontend renders it. That's the entire frontend-backend contract.

**The CORS headers in your PHP files** (`Access-Control-Allow-Origin: *`) are what allow the frontend (running on `localhost:5173` during development) to talk to the API (running on `aptitude`). Without those headers, the browser blocks the request. If you're getting weird errors in the browser console about "CORS policy," you're probably missing those headers.

---

## Part 11: Deploying Backend Code

Unlike the React frontend, PHP files don't need a build step. You upload them as-is.

### To Aptitude (during sprint):

```bash
scp -r api/* YOUR_UBIT@aptitude.cse.buffalo.edu:/data/web/CSE442/2026-Spring/cse-442j/api/
```

### To Cattle (sprint end only):

```bash
scp -r api/* YOUR_UBIT@cattle.cse.buffalo.edu:/data/web/CSE442/2026-Spring/cse-442j/api/
```

**Remember:** You need to create `db_config.php` manually on each server since it's not in the repo. And you need to set up the database tables on each server's phpMyAdmin separately — aptitude and cattle have their own independent MySQL databases.

---

## Part 12: Local Development with XAMPP

The course says individual testing should be done on your machine using **XAMPP**. This lets you run PHP and MySQL locally without needing VPN access.

1. Download XAMPP: https://www.apachefriends.org/
2. Install and open the XAMPP Control Panel
3. Start **Apache** and **MySQL**
4. Put your `api/` folder in XAMPP's `htdocs/` directory (usually `C:\xampp\htdocs\` on Windows or `/Applications/XAMPP/htdocs/` on Mac)
5. Create a local `db_config.php` pointing to XAMPP's MySQL:

```php
<?php
$host = 'localhost';
$db   = 'hivefive';       // Create this database in XAMPP's phpMyAdmin
$user = 'root';            // XAMPP default
$pass = '';                // XAMPP default (no password)

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Database connection failed"]);
    exit;
}
$conn->set_charset("utf8mb4");
?>
```

6. Access phpMyAdmin at `http://localhost/phpmyadmin/`
7. Create a database called `hivefive`
8. Run your `setup.sql` and `seed.sql` to create tables and test data
9. Test your endpoints at `http://localhost/api/users/list.php`

This way you can develop and test without VPN, without needing to SSH anywhere, and without risk of breaking what's on aptitude.

---

## Part 13: Troubleshooting

| Problem | Fix |
|---------|-----|
| Can't reach aptitude/cattle URLs | You're not on VPN or campus network |
| phpMyAdmin login fails | You're using your UBIT password — use your **person number** instead |
| SSH login fails | You're using your person number — use your **UBIT password** instead |
| PHP shows blank page | You have a syntax error. SSH in and run `php api/your_file.php` to see the error |
| "Access denied for user" in PHP | Wrong credentials in `db_config.php` |
| CORS errors in browser console | Your PHP file is missing the `Access-Control-Allow-Origin` header |
| Postman returns HTML instead of JSON | Check the URL path — capitalization matters. Also make sure the file exists on the server |
| `json_decode` returns null | The frontend isn't sending the `Content-Type: application/json` header |
| "Table doesn't exist" | You created the table on aptitude but you're hitting cattle (or vice versa). Each server has its own database |
| "Duplicate entry" on INSERT | The email or username already exists. Check with a SELECT first or handle the 1062 error code |
| Password verification always fails | Make sure you used `password_hash()` when creating and `password_verify()` when checking. Don't try to compare hashes directly |

---

## Quick Reference

### Every PHP endpoint needs:

```php
header('Content-Type: application/json');           // Always
header('Access-Control-Allow-Origin: *');            // Always
require_once __DIR__ . '/../db_config.php';          // Always
// Use prepared statements for ALL queries           // Always
// Return JSON with json_encode()                    // Always
// Use proper HTTP status codes                      // Always
$conn->close();                                      // Always
```

### HTTP Status Codes You'll Use:

```
200  OK                  — Request succeeded
201  Created             — New resource created (registration, new service post)
400  Bad Request         — Missing or invalid input
401  Unauthorized        — Not logged in or wrong credentials
404  Not Found           — Resource doesn't exist
405  Method Not Allowed  — Wrong HTTP method (GET vs POST)
409  Conflict            — Duplicate resource (email already registered)
500  Internal Error      — Something broke on the server
```

### The bind_param Cheat Sheet:

```
"s"  — string    (email, username, text)
"i"  — integer   (id, count)
"d"  — double    (price, balance)
"ssi" — multiple (string, string, integer — in order)
```
