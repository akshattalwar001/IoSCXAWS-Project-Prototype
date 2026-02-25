const API = "https://ioscxaws-project-prototype.onrender.com";

const sidebar = document.getElementById("sidebar");
const hamburger = document.getElementById("hamburger");
const overlay = document.getElementById("overlay");

hamburger.addEventListener("click", () => {
    sidebar.classList.toggle("open");
    overlay.classList.toggle("hidden");
    hamburger.classList.toggle("active");
});

overlay.addEventListener("click", () => {
    sidebar.classList.remove("open");
    overlay.classList.add("hidden");
    hamburger.classList.remove("active");
});

// navigation
document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
        btn.classList.add("active");
        document.getElementById(btn.dataset.section).classList.add("active");
        sidebar.classList.remove("open");
        overlay.classList.add("hidden");
        hamburger.classList.remove("active");

        const section = btn.dataset.section;
        if (section === "students") loadStudents();
        if (section === "summary") loadSummary();
        if (section === "category") loadCategory();
        if (section === "residence") loadResidence();
        if (section === "toppers") loadToppers();
        if (section === "atrisk") loadAtRisk();
    });
});

// load students on page open
loadStudents();

function catBadge(cat) {
    let cls = cat === "SC" ? "badge-sc" : cat === "ST" ? "badge-st" : "badge-general";
    return `<span class="badge ${cls}">${cat}</span>`;
}

function resBadge(res) {
    let cls = res === "Hosteller" ? "badge-hosteller" : "badge-dayscholar";
    return `<span class="badge ${cls}">${res}</span>`;
}

function gpaCell(gpa) {
    let cls = gpa >= 8 ? "gpa-high" : gpa >= 6 ? "gpa-mid" : "gpa-low";
    return `<span class="gpa ${cls}">${gpa}</span>`;
}

// ---- STUDENTS ----

async function loadStudents() {
    let params = new URLSearchParams();
    let cat = document.getElementById("filter-category").value;
    let res = document.getElementById("filter-residence").value;
    let sem = document.getElementById("filter-semester").value;
    if (cat) params.append("category", cat);
    if (res) params.append("residence", res);
    if (sem) params.append("semester", sem);

    let url = API + "/students?" + params.toString();
    let data = await fetch(url).then(r => r.json());

    document.getElementById("student-count").textContent = "Showing " + data.total + " students";

    let tbody = document.querySelector("#student-table tbody");
    tbody.innerHTML = "";

    data.students.forEach(s => {
        let tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${s.id}</td>
            <td>${s.name}</td>
            <td>${catBadge(s.category)}</td>
            <td>${resBadge(s.residence)}</td>
            <td>${gpaCell(s.gpa)}</td>
            <td>${s.semester}</td>
            <td class="actions">
                <button class="btn btn-sm" onclick="openEdit(${s.id})">Edit</button>
                <button class="btn btn-sm btn-red" onclick="deleteStudent(${s.id})">Del</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

document.getElementById("apply-filters").addEventListener("click", loadStudents);
document.getElementById("clear-filters").addEventListener("click", () => {
    document.getElementById("filter-category").value = "";
    document.getElementById("filter-residence").value = "";
    document.getElementById("filter-semester").value = "";
    loadStudents();
});

// ---- ADD STUDENT ----

document.getElementById("add-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    let body = {
        id: parseInt(document.getElementById("add-id").value),
        name: document.getElementById("add-name").value,
        category: document.getElementById("add-category").value,
        residence: document.getElementById("add-residence").value,
        gpa: parseFloat(document.getElementById("add-gpa").value),
        semester: parseInt(document.getElementById("add-semester").value),
    };

    let resp = await fetch(API + "/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    let msg = document.getElementById("add-msg");
    if (resp.ok) {
        msg.textContent = "Student added!";
        msg.style.color = "#27ae60";
        e.target.reset();
    } else {
        let err = await resp.json();
        msg.textContent = err.detail || "Something went wrong";
        msg.style.color = "#e74c3c";
    }
});

// ---- EDIT STUDENT ----

async function openEdit(id) {
    let student = await fetch(API + "/students/" + id).then(r => r.json());
    document.getElementById("edit-id").value = student.id;
    document.getElementById("edit-name").value = student.name;
    document.getElementById("edit-category").value = student.category;
    document.getElementById("edit-residence").value = student.residence;
    document.getElementById("edit-gpa").value = student.gpa;
    document.getElementById("edit-semester").value = student.semester;
    document.getElementById("edit-modal").classList.remove("hidden");
}

document.getElementById("edit-cancel").addEventListener("click", () => {
    document.getElementById("edit-modal").classList.add("hidden");
});

document.getElementById("edit-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    let id = document.getElementById("edit-id").value;
    let body = {
        name: document.getElementById("edit-name").value,
        category: document.getElementById("edit-category").value,
        residence: document.getElementById("edit-residence").value,
        gpa: parseFloat(document.getElementById("edit-gpa").value),
        semester: parseInt(document.getElementById("edit-semester").value),
    };

    let resp = await fetch(API + "/students/" + id, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    if (resp.ok) {
        document.getElementById("edit-modal").classList.add("hidden");
        loadStudents();
    }
});

// ---- DELETE STUDENT ----

async function deleteStudent(id) {
    if (!confirm("Delete student #" + id + "?")) return;
    await fetch(API + "/students/" + id, { method: "DELETE" });
    loadStudents();
}

// ---- SUMMARY ----

async function loadSummary() {
    let data = await fetch(API + "/analytics/summary").then(r => r.json());

    document.getElementById("summary-cards").innerHTML = `
        <div class="card purple"><h3>Total Students</h3><div class="value">${data.total_students}</div></div>
        <div class="card green"><h3>Average GPA</h3><div class="value">${data.average_gpa}</div></div>
        <div class="card"><h3>Highest GPA</h3><div class="value">${data.highest_gpa}</div></div>
        <div class="card red"><h3>Lowest GPA</h3><div class="value">${data.lowest_gpa}</div></div>
    `;

    let levels = data.performance_levels;
    let colors = ["green", "purple", "orange", "red"];
    let keys = Object.keys(levels);
    document.getElementById("summary-levels").innerHTML = keys.map((k, i) =>
        `<div class="card ${colors[i]}"><h3>${k}</h3><div class="value">${levels[k]}</div></div>`
    ).join("");
}

// ---- CATEGORY ----

async function loadCategory() {
    let data = await fetch(API + "/analytics/category").then(r => r.json());
    document.getElementById("category-cards").innerHTML = renderGroupBlocks(data);
}

// ---- RESIDENCE ----

async function loadResidence() {
    let data = await fetch(API + "/analytics/residence").then(r => r.json());
    document.getElementById("residence-cards").innerHTML = renderGroupBlocks(data);
}

function renderGroupBlocks(data) {
    return Object.entries(data).map(([key, val]) => `
        <div class="group-block">
            <h3>${key}</h3>
            <div class="stats">
                <div>Students: <span>${val.total_students}</span></div>
                <div>Avg GPA: <span>${val.average_gpa}</span></div>
                <div>Highest: <span>${val.highest_gpa}</span></div>
                <div>Lowest: <span>${val.lowest_gpa}</span></div>
            </div>
        </div>
    `).join("");
}

// ---- TOPPERS ----

async function loadToppers() {
    let count = document.getElementById("topper-count").value;
    let cat = document.getElementById("topper-category").value;
    let params = new URLSearchParams({ count });
    if (cat) params.append("category", cat);

    let data = await fetch(API + "/analytics/toppers?" + params).then(r => r.json());

    let tbody = document.querySelector("#topper-table tbody");
    tbody.innerHTML = "";
    data.toppers.forEach((s, i) => {
        let tr = document.createElement("tr");
        tr.innerHTML = `<td>${i + 1}</td><td>${s.name}</td><td>${catBadge(s.category)}</td><td>${gpaCell(s.gpa)}</td><td>${s.semester}</td>`;
        tbody.appendChild(tr);
    });
}

document.getElementById("load-toppers").addEventListener("click", loadToppers);

// ---- AT RISK ----

async function loadAtRisk() {
    let threshold = document.getElementById("risk-threshold").value;
    let data = await fetch(API + "/analytics/at-risk?threshold=" + threshold).then(r => r.json());

    document.getElementById("risk-count").textContent = data.total_at_risk + " students below " + data.threshold + " GPA";

    let tbody = document.querySelector("#risk-table tbody");
    tbody.innerHTML = "";
    data.students.forEach(s => {
        let tr = document.createElement("tr");
        tr.innerHTML = `<td>${s.id}</td><td>${s.name}</td><td>${catBadge(s.category)}</td><td>${resBadge(s.residence)}</td><td>${gpaCell(s.gpa)}</td><td>${s.semester}</td>`;
        tbody.appendChild(tr);
    });
}

document.getElementById("load-risk").addEventListener("click", loadAtRisk);

// ---- STUDENT LOOKUP ----

document.getElementById("lookup-btn").addEventListener("click", loadLookup);
document.getElementById("lookup-id").addEventListener("keydown", (e) => {
    if (e.key === "Enter") loadLookup();
});

async function loadLookup() {
    let id = document.getElementById("lookup-id").value.trim();
    let msg = document.getElementById("lookup-msg");
    let resultDiv = document.getElementById("lookup-result");
    resultDiv.classList.add("hidden");
    msg.textContent = "";

    if (!id) { msg.textContent = "Enter a student ID"; return; }

    let resp = await fetch(API + "/students/" + id);
    if (!resp.ok) {
        msg.textContent = "Student not found";
        msg.style.color = "#dc2626";
        return;
    }

    let s = await resp.json();
    let allData = await fetch(API + "/students").then(r => r.json());
    let all = allData.students;

    let sameCat = all.filter(x => x.category === s.category);
    let sameRes = all.filter(x => x.residence === s.residence);
    let sameSem = all.filter(x => x.semester === s.semester);

    let allGpas = all.map(x => x.gpa).sort((a, b) => b - a);
    let overallRank = allGpas.indexOf(s.gpa) + 1;

    let catGpas = sameCat.map(x => x.gpa).sort((a, b) => b - a);
    let catRank = catGpas.indexOf(s.gpa) + 1;

    let avgAll = all.length ? (all.reduce((a, x) => a + x.gpa, 0) / all.length) : 0;
    let avgCat = sameCat.length ? (sameCat.reduce((a, x) => a + x.gpa, 0) / sameCat.length) : 0;
    let avgRes = sameRes.length ? (sameRes.reduce((a, x) => a + x.gpa, 0) / sameRes.length) : 0;
    let avgSem = sameSem.length ? (sameSem.reduce((a, x) => a + x.gpa, 0) / sameSem.length) : 0;

    let level = s.gpa >= 9 ? "Excellent" : s.gpa >= 7 ? "Good" : s.gpa >= 5 ? "Average" : "Below Average";
    let diff = s.gpa - avgAll;
    let diffText = diff >= 0 ? "+" + diff.toFixed(2) + " above" : diff.toFixed(2).replace("-", "-") + " below";

    document.getElementById("lookup-name").textContent = s.name;
    document.getElementById("lookup-meta").innerHTML = `
        ID: ${s.id}
        ${catBadge(s.category)}
        ${resBadge(s.residence)}
        Sem ${s.semester}
    `;

    document.getElementById("lookup-cards").innerHTML = `
        <div class="card"><h3>GPA</h3><div class="value">${gpaCell(s.gpa)}</div></div>
        <div class="card"><h3>Performance</h3><div class="value" style="font-size:16px">${level}</div></div>
        <div class="card"><h3>Overall Rank</h3><div class="value">${overallRank} / ${all.length}</div></div>
        <div class="card"><h3>${s.category} Rank</h3><div class="value">${catRank} / ${sameCat.length}</div></div>
    `;

    document.getElementById("lookup-rank").innerHTML = `
        <p class="rank-text">${s.name}'s GPA is <strong>${diffText}</strong> the overall average (${avgAll.toFixed(2)})</p>
    `;

    document.getElementById("lookup-comparison").innerHTML = `
        <table class="comparison-table">
            <tr><td>vs All Students</td><td>${s.gpa}</td><td>avg ${avgAll.toFixed(2)}</td></tr>
            <tr><td>vs ${s.category} Students</td><td>${s.gpa}</td><td>avg ${avgCat.toFixed(2)}</td></tr>
            <tr><td>vs ${s.residence}</td><td>${s.gpa}</td><td>avg ${avgRes.toFixed(2)}</td></tr>
            <tr><td>vs Semester ${s.semester}</td><td>${s.gpa}</td><td>avg ${avgSem.toFixed(2)}</td></tr>
        </table>
    `;

    msg.textContent = "";
    resultDiv.classList.remove("hidden");
}
