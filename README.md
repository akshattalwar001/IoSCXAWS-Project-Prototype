![Students Database API](https://i.imgur.com/552tfPh.png)

it checks which student is SC ST and which is General.

it also identifies who is hosteller and who is day scholar.

it stores current GPA of each student.

then it analyzes overall performance using academic records.


#5 endpoints of Students
![Project Screenshot](https://i.imgur.com/xyOu6XH.png)

#5 endpoints of Analytics
![Project Screenshot](https://i.imgur.com/DcO3ITe.png)

#4 Schemas
![Project Screenshot](https://i.imgur.com/KyijGAa.png)

Read [](file:///d%3A/Games/IoSCXAWS-Project-Prototype/main.py)

## Schemas

### `Student` (used for POST)
| Field | Type | Rules |
|---|---|---|
| id | int | required |
| name | string | required, min 1 char |
| category | string | must be `"SC"`, `"ST"`, or `"General"` |
| residence | string | must be `"Hosteller"` or `"Day Scholar"` |
| gpa | float | 0.0 to 10.0 |
| semester | int | 1 to 8 |

### `StudentUpdate` (used for PUT)
Same fields as above but **all optional**. Only send what you want to change.

---

## Endpoints

### Students (CRUD)

| # | Method | Endpoint | Query Params | Body | What it does |
|---|---|---|---|---|---|
| 1 | `GET` | `/students` | `category`, `residence`, `semester`, `min_gpa`, `max_gpa` (all optional) | - | Returns filtered list of students. No params = all 100. |
| 2 | `GET` | `/students/{student_id}` | - | - | Returns one student by ID. 404 if not found. |
| 3 | `POST` | `/students` | - | `Student` JSON | Adds a new student. 400 if ID already exists. |
| 4 | `PUT` | `/students/{student_id}` | - | `StudentUpdate` JSON | Updates only the fields you send. 404 if not found. |
| 5 | `DELETE` | `/students/{student_id}` | - | - | Deletes a student. 404 if not found. |

### Analytics (read-only)

| # | Method | Endpoint | Query Params | What it returns |
|---|---|---|---|---|
| 6 | `GET` | `/analytics/summary` | - | Total students, avg/highest/lowest GPA, count per performance level (excellent 9+, good 7-8.9, average 5-6.9, below 5) |
| 7 | `GET` | `/analytics/category` | - | Stats (count, avg/high/low GPA) grouped by SC, ST, General |
| 8 | `GET` | `/analytics/residence` | - | Same stats grouped by Hosteller vs Day Scholar |
| 9 | `GET` | `/analytics/toppers` | `count` (default 10), `category` (optional) | Top N students sorted by GPA descending |
| 10 | `GET` | `/analytics/at-risk` | `threshold` (default 5.5) | Students with GPA below threshold, sorted lowest first |
