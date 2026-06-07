/*
========================================================================
   STUDENT ATTENDANCE MANAGEMENT SYSTEM (SAMS) - CORE SCRIPT
========================================================================
*/

// --- State Management ---
const AppState = {
    students: [],
    attendance: {}, // Schema: { "YYYY-MM-DD": { "RollNo": "Present"|"Absent" } }
    activities: [],
    currentDate: '',
    editingRoll: null,
    deletingRoll: null,
    defaultersList: [],
    currentDefaulterIndex: 0,
    studentPage: 1,
    studentRowsPerPage: 10
};

// --- Mock Data Setup ---
// --- Mock Data Setup ---
const firstNames = ["Aarav", "Aditi", "Rahul", "Priya", "Vikram", "Neha", "Arjun", "Ananya", "Rohan", "Sneha", "Kabir", "Diya", "Siddharth", "Pooja", "Varun", "Shruti", "Manish", "Meera", "Yash", "Tanvi", "Aditya", "Riya", "Kunal", "Amit", "Kiran"];
const lastNames = ["Sharma", "Patel", "Verma", "Singh", "Malhotra", "Iyer", "Joshi", "Reddy", "Mehta", "Sen", "Kapoor", "Gupta", "Shah", "Nair", "Vardhan", "Hegde", "Rao", "Saxena", "Choudhury", "Bhatia", "Roy", "Trivedi", "Dhawan", "Goel", "Pandey"];
const courses = ["BCA", "BBA", "B.Tech", "B.Sc"];
const semesters = ["II", "IV", "VI"];

const MOCK_STUDENTS = [];
courses.forEach(course => {
    for (let i = 1; i <= 25; i++) {
        const fName = firstNames[(i * 3 + course.charCodeAt(0)) % firstNames.length];
        const lName = lastNames[(i * 7 + course.charCodeAt(1)) % lastNames.length];
        const fullName = `${fName} ${lName}`;
        
        const indexStr = String(i).padStart(3, '0');
        const year = course === "B.Tech" ? "2025" : "2026";
        const code = course === "B.Tech" ? "BTC" : (course === "B.Sc" ? "BSC" : course);
        const rollNumber = `${code}-${year}-${indexStr}`;
        
        const semester = semesters[i % semesters.length];
        const email = `${fName.toLowerCase()}.${lName.toLowerCase()}${i}@smartattend.edu`;
        
        MOCK_STUDENTS.push({
            rollNumber,
            fullName,
            course,
            semester,
            email
        });
    }
});

const MOCK_ATTENDANCE = {};
const dates = ["2026-06-02", "2026-06-03", "2026-06-04", "2026-06-05", "2026-06-06"];
dates.forEach(date => {
    MOCK_ATTENDANCE[date] = {};
    MOCK_STUDENTS.forEach((student, index) => {
        const dayHash = parseInt(date.slice(-1));
        const isAbsent = (index % 6 === 0 && dayHash % 2 === 0) || 
                         (index % 9 === 0 && dayHash % 3 === 0) || 
                         (index % 12 === 0);
        MOCK_ATTENDANCE[date][student.rollNumber] = isAbsent ? "Absent" : "Present";
    });
});

const MOCK_ACTIVITIES = [
    { id: 1, type: "primary", message: "System initialized with database records", time: "2026-06-07T10:00:00" },
    { id: 2, type: "success", message: "Attendance registry saved for 2026-06-06", time: "2026-06-06T16:30:00" },
    { id: 3, type: "success", message: "Attendance registry saved for 2026-06-05", time: "2026-06-05T16:20:00" },
    { id: 4, type: "success", message: "Attendance registry saved for 2026-06-04", time: "2026-06-04T15:10:00" },
    { id: 5, type: "success", message: "Attendance registry saved for 2026-06-03", time: "2026-06-03T15:00:00" },
    { id: 6, type: "success", message: "Attendance registry saved for 2026-06-02", time: "2026-06-02T14:40:00" }
];

// --- Initializing Application ---
document.addEventListener("DOMContentLoaded", () => {
    initializeDate();
    loadLocalStorageData();
    setupNavigation();
    setupTheme();
    setupEventListeners();
    
    // Initial UI Render
    renderDashboard();
    renderStudentDirectory();
    renderAttendanceRegistry();
    renderReports();
});

// Set current date in picker and layout header
function initializeDate() {
    // Current Local time is June 7, 2026 based on prompt metadata
    const today = new Date("2026-06-07");
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    
    AppState.currentDate = `${yyyy}-${mm}-${dd}`;
    
    // Set Pickers Default Value
    document.getElementById("attendanceDatePicker").value = AppState.currentDate;
    
    // Set reports default range (Start of month to today)
    document.getElementById("reportStartDate").value = `${yyyy}-${mm}-01`;
    document.getElementById("reportEndDate").value = AppState.currentDate;
    
    // Render text date in header
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById("currentDateDisplay").textContent = today.toLocaleDateString('en-US', options);
    document.getElementById("dashPresentDate").textContent = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric'});
    document.getElementById("dashAbsentDate").textContent = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric'});
}

// --- Data Layer (LocalStorage Synchronization) ---
function loadLocalStorageData() {
    const localStudents = localStorage.getItem("sams_students");
    const localAttendance = localStorage.getItem("sams_attendance");
    const localActivities = localStorage.getItem("sams_activities");
    
    if (!localStudents) {
        // First run: load mock datasets
        AppState.students = [...MOCK_STUDENTS];
        AppState.attendance = { ...MOCK_ATTENDANCE };
        AppState.activities = [...MOCK_ACTIVITIES];
        
        saveToLocalStorage("students");
        saveToLocalStorage("attendance");
        saveToLocalStorage("activities");
        
        logActivity("primary", "Preloaded default sample students & history");
    } else {
        AppState.students = JSON.parse(localStudents);
        AppState.attendance = localAttendance ? JSON.parse(localAttendance) : {};
        AppState.activities = localActivities ? JSON.parse(localActivities) : [];
    }
}

function saveToLocalStorage(key) {
    if (key === "students" || key === "all") {
        localStorage.setItem("sams_students", JSON.stringify(AppState.students));
    }
    if (key === "attendance" || key === "all") {
        localStorage.setItem("sams_attendance", JSON.stringify(AppState.attendance));
    }
    if (key === "activities" || key === "all") {
        localStorage.setItem("sams_activities", JSON.stringify(AppState.activities));
    }
}

function logActivity(type, message) {
    const newLog = {
        id: Date.now(),
        type: type, // 'success', 'danger', 'primary', 'warning'
        message: message,
        time: new Date().toISOString()
    };
    
    AppState.activities.unshift(newLog);
    // Limit activities log to 30 items
    if (AppState.activities.length > 30) {
        AppState.activities.pop();
    }
    saveToLocalStorage("activities");
    renderRecentActivities();
}

// --- Navigation Engine ---
function setupNavigation() {
    const navLinks = document.querySelectorAll(".nav-link");
    
    // Watch URL hashes
    window.addEventListener("hashchange", handleHashNavigation);
    
    // Handle manual clicks
    navLinks.forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const targetSection = link.getAttribute("data-section");
            window.location.hash = targetSection;
        });
    });
    
    // Initial page check
    handleHashNavigation();
}

function handleHashNavigation() {
    const hash = window.location.hash.replace("#", "") || "dashboard";
    triggerNav(hash);
}

function triggerNav(sectionId) {
    const validSections = ["dashboard", "students", "attendance", "reports"];
    if (!validSections.includes(sectionId)) return;
    
    // Update active nav-link UI
    const navLinks = document.querySelectorAll(".nav-link");
    navLinks.forEach(link => {
        if (link.getAttribute("data-section") === sectionId) {
            link.classList.add("active");
        } else {
            link.classList.remove("active");
        }
    });
    
    // Update Content Section UI
    const sections = document.querySelectorAll(".content-section");
    sections.forEach(sec => {
        if (sec.id === `${sectionId}Section`) {
            sec.classList.add("active");
        } else {
            sec.classList.remove("active");
        }
    });
    
    // Update Page Header Title
    const titles = {
        "dashboard": "Dashboard Metrics",
        "students": "Student Database Directory",
        "attendance": "Daily Attendance Registry",
        "reports": "Analytics & Export Reports"
    };
    document.getElementById("pageTitle").textContent = titles[sectionId];
    
    // Perform section specific operations on load
    if (sectionId === "dashboard") {
        renderDashboard();
    } else if (sectionId === "students") {
        renderStudentDirectory();
    } else if (sectionId === "attendance") {
        renderAttendanceRegistry();
    } else if (sectionId === "reports") {
        renderReports();
    }
    
    // Auto-close sidebar on mobile after navigating
    document.getElementById("sidebar").classList.remove("active");
}

// --- Theme Switcher Logic ---
function setupTheme() {
    const themeToggleBtn = document.getElementById("themeToggleBtn");
    const themeText = document.getElementById("themeToggleText");
    const htmlTag = document.documentElement;
    
    // Load theme setting
    const savedTheme = localStorage.getItem("sams_theme") || "light";
    htmlTag.setAttribute("data-theme", savedTheme);
    updateThemeUI(savedTheme);
    
    themeToggleBtn.addEventListener("click", () => {
        const currentTheme = htmlTag.getAttribute("data-theme");
        const newTheme = currentTheme === "light" ? "dark" : "light";
        
        htmlTag.setAttribute("data-theme", newTheme);
        localStorage.setItem("sams_theme", newTheme);
        updateThemeUI(newTheme);
        showToast(`Switched to ${newTheme === 'dark' ? 'Dark Mode' : 'Light Mode'} theme`, "primary");
    });
}

function updateThemeUI(theme) {
    const themeText = document.getElementById("themeToggleText");
    if (theme === "dark") {
        themeText.textContent = "Light Mode";
    } else {
        themeText.textContent = "Dark Mode";
    }
}

// --- Event Handlers Setup ---
function setupEventListeners() {
    // Mobile Navigation triggers
    const mobileMenuBtn = document.getElementById("mobileMenuBtn");
    const mobileCloseBtn = document.getElementById("mobileCloseBtn");
    const sidebar = document.getElementById("sidebar");
    
    mobileMenuBtn.addEventListener("click", () => sidebar.classList.add("active"));
    mobileCloseBtn.addEventListener("click", () => sidebar.classList.remove("active"));
    
    // Modal Student Triggers
    const btnAddNewStudent = document.getElementById("btnAddNewStudent");
    const btnQuickAddStudent = document.getElementById("btnQuickAddStudent");
    const btnCancelStudent = document.getElementById("btnCancelStudent");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const studentForm = document.getElementById("studentForm");
    
    btnAddNewStudent.addEventListener("click", () => openStudentModal());
    btnQuickAddStudent.addEventListener("click", () => openStudentModal());
    btnCancelStudent.addEventListener("click", () => closeStudentModal());
    closeModalBtn.addEventListener("click", () => closeStudentModal());
    
    // Student Form submission
    studentForm.addEventListener("submit", handleStudentSubmit);
    
    // Input validators for instant field clearing on keypress
    document.querySelectorAll(".form-input").forEach(input => {
        input.addEventListener("input", () => {
            const formGroup = input.closest(".form-group");
            if (formGroup) formGroup.classList.remove("invalid");
        });
    });
    
    // Student Filters & Search (with page reset to 1)
    document.getElementById("studentSearchInput").addEventListener("input", () => {
        AppState.studentPage = 1;
        renderStudentDirectory();
    });
    document.getElementById("studentFilterCourse").addEventListener("change", () => {
        AppState.studentPage = 1;
        renderStudentDirectory();
    });
    document.getElementById("studentFilterSemester").addEventListener("change", () => {
        AppState.studentPage = 1;
        renderStudentDirectory();
    });
    
    // Delete Confirmation Modals
    document.getElementById("btnCancelConfirm").addEventListener("click", closeConfirmModal);
    document.getElementById("closeConfirmBtn").addEventListener("click", closeConfirmModal);
    document.getElementById("btnYesConfirm").addEventListener("click", executeStudentDelete);
    
    // Attendance Actions
    document.getElementById("attendanceDatePicker").addEventListener("change", (e) => {
        AppState.currentDate = e.target.value;
        renderAttendanceRegistry();
    });
    document.getElementById("btnMarkAllPresent").addEventListener("click", () => bulkMarkAttendance("Present"));
    document.getElementById("btnMarkAllAbsent").addEventListener("click", () => bulkMarkAttendance("Absent"));
    document.getElementById("btnSaveAttendance").addEventListener("click", saveAttendanceRegistry);
    
    // Reports filters
    document.getElementById("reportStartDate").addEventListener("change", renderReports);
    document.getElementById("reportEndDate").addEventListener("change", renderReports);
    document.getElementById("reportFilterCourse").addEventListener("change", renderReports);
    document.getElementById("reportFilterSemester").addEventListener("change", renderReports);
    document.getElementById("btnExportCSV").addEventListener("click", exportAttendanceReportToCSV);
    
    // SAMS Defaulter & Print triggers
    const defaulterToggle = document.getElementById("defaulterToggle");
    if (defaulterToggle) {
        defaulterToggle.addEventListener("change", renderReports);
    }
    const btnPrintReport = document.getElementById("btnPrintReport");
    if (btnPrintReport) {
        btnPrintReport.addEventListener("click", () => {
            window.print();
        });
    }
    
    const btnResetDatabase = document.getElementById("btnResetDatabase");
    if (btnResetDatabase) {
        btnResetDatabase.addEventListener("click", () => {
            if (confirm("Are you sure you want to reset the database? This will clear all local storage records and load default mock data.")) {
                localStorage.removeItem("sams_students");
                localStorage.removeItem("sams_attendance");
                localStorage.removeItem("sams_activities");
                window.location.reload();
            }
        });
    }

    // CSV Student Import bindings
    const btnImportCSVStudents = document.getElementById("btnImportCSVStudents");
    const studentCSVInput = document.getElementById("studentCSVInput");
    if (btnImportCSVStudents && studentCSVInput) {
        btnImportCSVStudents.addEventListener("click", () => studentCSVInput.click());
        studentCSVInput.addEventListener("change", handleCSVImport);
    }

    // Warning Letters Simulation bindings
    const btnGenerateWarnings = document.getElementById("btnGenerateWarnings");
    if (btnGenerateWarnings) {
        btnGenerateWarnings.addEventListener("click", openWarningLettersModal);
    }
    const closeWarningLetterBtn = document.getElementById("closeWarningLetterBtn");
    if (closeWarningLetterBtn) {
        closeWarningLetterBtn.addEventListener("click", () => {
            document.getElementById("warningLetterModal").classList.remove("active");
        });
    }
    const btnPrevWarning = document.getElementById("btnPrevWarning");
    if (btnPrevWarning) {
        btnPrevWarning.addEventListener("click", () => {
            if (AppState.currentDefaulterIndex > 0) {
                AppState.currentDefaulterIndex--;
                renderWarningLetter();
            }
        });
    }
    const btnNextWarning = document.getElementById("btnNextWarning");
    if (btnNextWarning) {
        btnNextWarning.addEventListener("click", () => {
            if (AppState.currentDefaulterIndex < AppState.defaultersList.length - 1) {
                AppState.currentDefaulterIndex++;
                renderWarningLetter();
            }
        });
    }
    const btnPrintWarning = document.getElementById("btnPrintWarning");
    if (btnPrintWarning) {
        btnPrintWarning.addEventListener("click", printWarningLetter);
    }

    // Student Directory Pagination bindings
    const btnStudentPrevPage = document.getElementById("btnStudentPrevPage");
    const btnStudentNextPage = document.getElementById("btnStudentNextPage");
    if (btnStudentPrevPage) {
        btnStudentPrevPage.addEventListener("click", () => {
            if (AppState.studentPage > 1) {
                AppState.studentPage--;
                renderStudentDirectory();
            }
        });
    }
    if (btnStudentNextPage) {
        btnStudentNextPage.addEventListener("click", () => {
            const searchVal = document.getElementById("studentSearchInput").value.trim().toLowerCase();
            const courseVal = document.getElementById("studentFilterCourse").value;
            const semVal = document.getElementById("studentFilterSemester").value;
            const filteredStudents = AppState.students.filter(student => {
                const matchesSearch = student.fullName.toLowerCase().includes(searchVal) || 
                                      student.rollNumber.toLowerCase().includes(searchVal);
                const matchesCourse = courseVal === "" || student.course === courseVal;
                const matchesSem = semVal === "" || student.semester === semVal;
                return matchesSearch && matchesCourse && matchesSem;
            });
            const totalPages = Math.ceil(filteredStudents.length / AppState.studentRowsPerPage) || 1;
            if (AppState.studentPage < totalPages) {
                AppState.studentPage++;
                renderStudentDirectory();
            }
        });
    }

    // CSV Import Template Exporter
    const btnExportCSVTemplate = document.getElementById("btnExportCSVTemplate");
    if (btnExportCSVTemplate) {
        btnExportCSVTemplate.addEventListener("click", exportCSVTemplate);
    }
}

// --- Dashboard Rendering ---
function renderDashboard() {
    // 1. Total Registered Students count
    const totalStudents = AppState.students.length;
    document.getElementById("dashTotalStudents").textContent = totalStudents;
    
    // 2. Present and Absent Today counts
    const todayLogs = AppState.attendance[AppState.currentDate];
    let presentCount = 0;
    let absentCount = 0;
    
    if (todayLogs) {
        Object.keys(todayLogs).forEach(roll => {
            // Check if student still exists
            const studentExists = AppState.students.some(s => s.rollNumber === roll);
            if (studentExists) {
                if (todayLogs[roll] === "Present") presentCount++;
                if (todayLogs[roll] === "Absent") absentCount++;
            }
        });
        
        document.getElementById("dashPresentToday").textContent = presentCount;
        document.getElementById("dashAbsentToday").textContent = absentCount;
    } else {
        const ctaHtml = `<span class="dash-cta-text" onclick="window.location.hash='#attendance'; triggerNav('attendance');" title="Today's attendance registry has not been saved yet. Click here to mark it now!">Registry Pending</span>`;
        document.getElementById("dashPresentToday").innerHTML = ctaHtml;
        document.getElementById("dashAbsentToday").innerHTML = ctaHtml;
    }
    
    // 3. Overall Cumulative Attendance Percentage
    let totalPresentLogs = 0;
    let totalLogsCount = 0;
    
    Object.keys(AppState.attendance).forEach(date => {
        const dayLogs = AppState.attendance[date];
        Object.keys(dayLogs).forEach(roll => {
            const studentExists = AppState.students.some(s => s.rollNumber === roll);
            if (studentExists) {
                totalLogsCount++;
                if (dayLogs[roll] === "Present") totalPresentLogs++;
            }
        });
    });
    
    const overallRate = totalLogsCount > 0 ? Math.round((totalPresentLogs / totalLogsCount) * 100) : 0;
    
    document.getElementById("dashPercentage").textContent = `${overallRate}%`;
    document.getElementById("dashPercentageText").textContent = `${overallRate}%`;
    
    // Update circle SVG progress gauge
    const circle = document.getElementById("dashProgressCircle");
    const circumference = 213.6; // 2 * pi * r (r=34)
    const offset = circumference - (overallRate / 100) * circumference;
    circle.style.strokeDashoffset = offset;
    
    // 4. Course Analytics Bar distribution
    renderCourseBars();
    
    // 5. Draw Trend SVG Line Chart
    renderTrendChart();
    
    // 6. Build recent activities log
    renderRecentActivities();
}

function renderCourseBars() {
    const barContainer = document.getElementById("coursesBarContainer");
    barContainer.innerHTML = "";
    
    // Calculate student enrollments and rates per course
    const courseStats = {};
    const coursesList = ["BCA", "BBA", "B.Tech", "B.Sc"];
    
    coursesList.forEach(course => {
        courseStats[course] = {
            enrollment: 0,
            presentDays: 0,
            totalDays: 0
        };
    });
    
    // Calculate enrollments
    AppState.students.forEach(student => {
        if (courseStats[student.course]) {
            courseStats[student.course].enrollment++;
        }
    });
    
    // Calculate attendance logs per course
    Object.keys(AppState.attendance).forEach(date => {
        const dayLogs = AppState.attendance[date];
        Object.keys(dayLogs).forEach(roll => {
            const student = AppState.students.find(s => s.rollNumber === roll);
            if (student && courseStats[student.course]) {
                courseStats[student.course].totalDays++;
                if (dayLogs[roll] === "Present") {
                    courseStats[student.course].presentDays++;
                }
            }
        });
    });
    
    // Build and render HTML elements
    coursesList.forEach(course => {
        const stats = courseStats[course];
        const rate = stats.totalDays > 0 ? Math.round((stats.presentDays / stats.totalDays) * 100) : 0;
        
        const barItemHtml = `
            <div class="course-bar-item">
                <div class="course-bar-meta">
                    <span class="course-name-tag">${course} <span class="course-enrollment">(${stats.enrollment} Enrolled)</span></span>
                    <span class="course-rate">${rate}% Attendance</span>
                </div>
                <div class="course-bar-bg">
                    <div class="course-bar-fill" style="width: ${rate}%"></div>
                </div>
            </div>
        `;
        barContainer.insertAdjacentHTML("beforeend", barItemHtml);
    });
}

function renderRecentActivities() {
    const activityContainer = document.getElementById("recentActivityLog");
    activityContainer.innerHTML = "";
    
    if (AppState.activities.length === 0) {
        activityContainer.innerHTML = '<div class="log-item empty">No recent actions recorded.</div>';
        return;
    }
    
    AppState.activities.slice(0, 5).forEach(act => {
        const dateObj = new Date(act.time);
        const formatTime = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) + 
                           ` - ` + dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                           
        const logHtml = `
            <div class="log-item">
                <span class="log-badge ${act.type}"></span>
                <div class="log-content">
                    <p>${act.message}</p>
                    <span class="log-time">${formatTime}</span>
                </div>
            </div>
        `;
        activityContainer.insertAdjacentHTML("beforeend", logHtml);
    });
}

// --- Student Management (CRUD Actions) ---
function renderStudentDirectory() {
    const tableBody = document.getElementById("studentTableBody");
    const summaryText = document.getElementById("studentTableSummary");
    
    const searchVal = document.getElementById("studentSearchInput").value.trim().toLowerCase();
    const courseVal = document.getElementById("studentFilterCourse").value;
    const semVal = document.getElementById("studentFilterSemester").value;
    
    tableBody.innerHTML = "";
    
    // Filters search logic
    const filteredStudents = AppState.students.filter(student => {
        const matchesSearch = student.fullName.toLowerCase().includes(searchVal) || 
                              student.rollNumber.toLowerCase().includes(searchVal);
        const matchesCourse = courseVal === "" || student.course === courseVal;
        const matchesSem = semVal === "" || student.semester === semVal;
        
        return matchesSearch && matchesCourse && matchesSem;
    });
    
    const totalPages = Math.ceil(filteredStudents.length / AppState.studentRowsPerPage) || 1;
    // Bound page range
    if (AppState.studentPage > totalPages) {
        AppState.studentPage = totalPages;
    }
    if (AppState.studentPage < 1) {
        AppState.studentPage = 1;
    }
    
    const pageInfo = document.getElementById("studentPageInfo");
    const prevBtn = document.getElementById("btnStudentPrevPage");
    const nextBtn = document.getElementById("btnStudentNextPage");
    
    if (pageInfo) {
        pageInfo.textContent = `Page ${AppState.studentPage} of ${totalPages}`;
    }
    if (prevBtn) {
        prevBtn.disabled = (AppState.studentPage === 1);
    }
    if (nextBtn) {
        nextBtn.disabled = (AppState.studentPage === totalPages);
    }
    
    if (filteredStudents.length === 0) {
        tableBody.innerHTML = `
            <tr class="empty-table-row">
                <td colspan="6">
                    <div class="empty-state-wrapper">
                        <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <span class="empty-state-text">No students found matching filters</span>
                        <span class="empty-state-sub">Try adjusting filters or register a new student.</span>
                    </div>
                </td>
            </tr>
        `;
        summaryText.textContent = `Showing 0 of ${AppState.students.length} students`;
        return;
    }
    
    // Sort students alphabetically by name
    filteredStudents.sort((a, b) => a.fullName.localeCompare(b.fullName));
    
    const startIdx = (AppState.studentPage - 1) * AppState.studentRowsPerPage;
    const endIdx = startIdx + AppState.studentRowsPerPage;
    const pagedStudents = filteredStudents.slice(startIdx, endIdx);
    
    pagedStudents.forEach(student => {
        const row = `
            <tr>
                <td><strong>${student.rollNumber}</strong></td>
                <td>${student.fullName}</td>
                <td><span class="badge badge-indigo">${student.course}</span></td>
                <td>Sem ${student.semester}</td>
                <td><a href="mailto:${student.email}" class="text-blue">${student.email}</a></td>
                <td class="text-right">
                    <div class="actions-cell-wrapper">
                        <button class="btn-icon-only btn-edit" title="Edit Student details" onclick="openStudentModal('${student.rollNumber}')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button class="btn-icon-only btn-delete" title="Delete Student" onclick="openConfirmModal('${student.rollNumber}')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
        tableBody.insertAdjacentHTML("beforeend", row);
    });
    
    summaryText.textContent = `Showing ${startIdx + 1} to ${Math.min(endIdx, filteredStudents.length)} of ${filteredStudents.length} students (Total: ${AppState.students.length})`;
}

// Modal handling
function openStudentModal(roll = null) {
    const modal = document.getElementById("studentModal");
    const modalTitle = document.getElementById("modalTitle");
    const studentForm = document.getElementById("studentForm");
    const rollInput = document.getElementById("studentRoll");
    
    // Clear validation styling & values
    studentForm.reset();
    document.querySelectorAll(".form-group").forEach(fg => fg.classList.remove("invalid"));
    document.getElementById("modalErrorSummary").style.display = "none";
    
    if (roll) {
        // Edit Mode
        AppState.editingRoll = roll;
        modalTitle.textContent = "Edit Student Details";
        rollInput.setAttribute("disabled", "true"); // Prevent changing primary key ID
        
        const student = AppState.students.find(s => s.rollNumber === roll);
        if (student) {
            document.getElementById("studentRoll").value = student.rollNumber;
            document.getElementById("studentName").value = student.fullName;
            document.getElementById("studentCourse").value = student.course;
            document.getElementById("studentSemester").value = student.semester;
            document.getElementById("studentEmail").value = student.email;
        }
    } else {
        // Add Mode
        AppState.editingRoll = null;
        modalTitle.textContent = "Register New Student";
        rollInput.removeAttribute("disabled");
    }
    
    modal.classList.add("active");
}

function closeStudentModal() {
    document.getElementById("studentModal").classList.remove("active");
    AppState.editingRoll = null;
}

// Form Handlers
function handleStudentSubmit(e) {
    e.preventDefault();
    
    // Perform custom validation checks
    const rollInput = document.getElementById("studentRoll");
    const nameInput = document.getElementById("studentName");
    const courseInput = document.getElementById("studentCourse");
    const semInput = document.getElementById("studentSemester");
    const emailInput = document.getElementById("studentEmail");
    
    const roll = rollInput.value.trim();
    const name = nameInput.value.trim();
    const course = courseInput.value;
    const sem = semInput.value;
    const email = emailInput.value.trim();
    
    let isFormValid = true;
    
    // 1. Roll Number Validation
    if (!roll) {
        showFieldError(rollInput, "Roll number is required.");
        isFormValid = false;
    } else if (!AppState.editingRoll && AppState.students.some(s => s.rollNumber.toLowerCase() === roll.toLowerCase())) {
        showFieldError(rollInput, "Roll number already exists in directory.");
        isFormValid = false;
    }
    
    // 2. Name validation
    if (!name) {
        showFieldError(nameInput, "Student's full name is required.");
        isFormValid = false;
    } else if (name.length < 3) {
        showFieldError(nameInput, "Name must be at least 3 characters long.");
        isFormValid = false;
    }
    
    // 3. Course validation
    if (!course) {
        showFieldError(courseInput, "Please select a valid course.");
        isFormValid = false;
    }
    
    // 4. Semester validation
    if (!sem) {
        showFieldError(semInput, "Please select a valid semester.");
        isFormValid = false;
    }
    
    // 5. Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
        showFieldError(emailInput, "Email address is required.");
        isFormValid = false;
    } else if (!emailRegex.test(email)) {
        showFieldError(emailInput, "Please enter a valid format (e.g. name@college.edu).");
        isFormValid = false;
    }
    
    if (!isFormValid) {
        document.getElementById("modalErrorSummary").style.display = "block";
        return;
    }
    
    // Save details to database
    if (AppState.editingRoll) {
        // Update
        const studentIndex = AppState.students.findIndex(s => s.rollNumber === AppState.editingRoll);
        if (studentIndex !== -1) {
            AppState.students[studentIndex] = {
                rollNumber: AppState.editingRoll,
                fullName: name,
                course: course,
                semester: sem,
                email: email
            };
            logActivity("primary", `Updated student records for ${name} (${AppState.editingRoll})`);
            showToast("Student details updated successfully", "success");
        }
    } else {
        // Add new
        AppState.students.push({
            rollNumber: roll,
            fullName: name,
            course: course,
            semester: sem,
            email: email
        });
        logActivity("success", `Registered new student: ${name} (${roll})`);
        showToast(`Registered student ${name} successfully`, "success");
    }
    
    saveToLocalStorage("students");
    closeStudentModal();
    renderStudentDirectory();
    renderDashboard();
}

function showFieldError(inputEl, errMsg) {
    const group = inputEl.closest(".form-group");
    if (group) {
        group.classList.add("invalid");
        const errSpan = group.querySelector(".form-error-msg");
        if (errSpan) errSpan.textContent = errMsg;
    }
}

// Delete Handlers
function openConfirmModal(roll) {
    AppState.deletingRoll = roll;
    const student = AppState.students.find(s => s.rollNumber === roll);
    if (student) {
        document.getElementById("confirmModalMsg").textContent = 
            `Are you sure you want to delete ${student.fullName} (${student.rollNumber})? This will remove all their details from the database directory.`;
        document.getElementById("confirmModal").classList.add("active");
    }
}

function closeConfirmModal() {
    document.getElementById("confirmModal").classList.remove("active");
    AppState.deletingRoll = null;
}

function executeStudentDelete() {
    const roll = AppState.deletingRoll;
    if (!roll) return;
    
    const student = AppState.students.find(s => s.rollNumber === roll);
    const name = student ? student.fullName : roll;
    
    // Remove student
    AppState.students = AppState.students.filter(s => s.rollNumber !== roll);
    saveToLocalStorage("students");
    
    // Clean up attendance associated logs (optional - here we keep database clean by pruning)
    Object.keys(AppState.attendance).forEach(date => {
        if (AppState.attendance[date][roll]) {
            delete AppState.attendance[date][roll];
        }
    });
    saveToLocalStorage("attendance");
    
    logActivity("danger", `Removed student from directory: ${name} (${roll})`);
    showToast(`Removed student ${name} from directory`, "danger");
    
    closeConfirmModal();
    renderStudentDirectory();
    renderDashboard();
}

// --- Attendance Management (Check-in logic) ---
function renderAttendanceRegistry() {
    const tableBody = document.getElementById("attendanceTableBody");
    const statusBadge = document.getElementById("attendanceStatusBadge");
    const warningBar = document.getElementById("attendanceConflictWarning");
    const countText = document.getElementById("attendanceSubmitCount");
    
    tableBody.innerHTML = "";
    warningBar.style.display = "none";
    
    if (AppState.students.length === 0) {
        tableBody.innerHTML = `
            <tr class="empty-table-row">
                <td colspan="5">
                    <div class="empty-state-wrapper">
                        <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                        </svg>
                        <span class="empty-state-text">No students registered in database</span>
                        <span class="empty-state-sub">Add students in the Student Directory first.</span>
                    </div>
                </td>
            </tr>
        `;
        statusBadge.textContent = "No Data";
        statusBadge.className = "badge badge-red";
        countText.textContent = "0 / 0 marked";
        return;
    }
    
    const dateLogs = AppState.attendance[AppState.currentDate];
    const isSaved = !!dateLogs;
    
    if (isSaved) {
        statusBadge.textContent = "Registry Saved";
        statusBadge.className = "badge badge-green";
        warningBar.style.display = "flex"; // Warn about overwrite danger
    } else {
        statusBadge.textContent = "Not Saved";
        statusBadge.className = "badge badge-warning";
    }
    
    // Sort students alphabetically
    const sortedStudents = [...AppState.students].sort((a, b) => a.fullName.localeCompare(b.fullName));
    
    sortedStudents.forEach(student => {
        // If saved, load. If not saved, default to "Present" for faster marking workflow
        let status = "Present";
        if (isSaved && dateLogs[student.rollNumber]) {
            status = dateLogs[student.rollNumber];
        }
        
        // Calculate historical attendance rate
        let presentCount = 0;
        let totalCount = 0;
        Object.keys(AppState.attendance).forEach(d => {
            const dayLogs = AppState.attendance[d];
            if (dayLogs && dayLogs[student.rollNumber] !== undefined) {
                totalCount++;
                if (dayLogs[student.rollNumber] === "Present") {
                    presentCount++;
                }
            }
        });
        
        const historyRate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;
        let badgeClass = "badge-green";
        if (historyRate < 75) {
            badgeClass = "badge-red";
        } else if (historyRate < 85) {
            badgeClass = "badge-warning";
        }
        
        const histBadge = totalCount > 0
            ? `<span class="badge ${badgeClass} badge-hist" title="Historical attendance: ${presentCount}/${totalCount} classes">${historyRate}% Hist</span>`
            : `<span class="badge badge-indigo badge-hist" title="No history recorded">New</span>`;
        
        const row = `
            <tr>
                <td><strong>${student.rollNumber}</strong></td>
                <td>${student.fullName}${histBadge}</td>
                <td><span class="badge badge-blue">${student.course}</span></td>
                <td>Sem ${student.semester}</td>
                <td>
                    <div class="attendance-status-toggle">
                        <input type="radio" name="att_${student.rollNumber}" id="pres_${student.rollNumber}" class="toggle-radio" value="Present" ${status === "Present" ? "checked" : ""}>
                        <label for="pres_${student.rollNumber}" class="toggle-label">Present</label>
                        
                        <input type="radio" name="att_${student.rollNumber}" id="abs_${student.rollNumber}" class="toggle-radio" value="Absent" ${status === "Absent" ? "checked" : ""}>
                        <label for="abs_${student.rollNumber}" class="toggle-label">Absent</label>
                    </div>
                </td>
            </tr>
        `;
        tableBody.insertAdjacentHTML("beforeend", row);
    });
    
    updateAttendanceCountText();
}

function updateAttendanceCountText() {
    const total = AppState.students.length;
    let present = 0;
    
    AppState.students.forEach(student => {
        const radPresent = document.getElementById(`pres_${student.rollNumber}`);
        if (radPresent && radPresent.checked) {
            present++;
        }
    });
    
    document.getElementById("attendanceSubmitCount").textContent = `${present} / ${total} marked Present`;
}

// Bulk mark buttons
function bulkMarkAttendance(status) {
    if (AppState.students.length === 0) return;
    
    AppState.students.forEach(student => {
        const radio = document.getElementById(status === "Present" ? `pres_${student.rollNumber}` : `abs_${student.rollNumber}`);
        if (radio) radio.checked = true;
    });
    
    updateAttendanceCountText();
    showToast(`All students marked as ${status}`, "warning");
}

// Save Registry
function saveAttendanceRegistry() {
    if (AppState.students.length === 0) {
        showToast("Cannot save empty attendance registry", "danger");
        return;
    }
    
    const logs = {};
    AppState.students.forEach(student => {
        const radPresent = document.getElementById(`pres_${student.rollNumber}`);
        logs[student.rollNumber] = (radPresent && radPresent.checked) ? "Present" : "Absent";
    });
    
    AppState.attendance[AppState.currentDate] = logs;
    saveToLocalStorage("attendance");
    
    const countText = document.getElementById("attendanceSubmitCount").textContent;
    logActivity("success", `Saved daily attendance registry for ${AppState.currentDate} (${countText})`);
    showToast(`Attendance registry saved successfully for ${AppState.currentDate}`, "success");
    
    renderAttendanceRegistry();
    renderDashboard();
}

// --- Reports Generation & Analytics ---
function renderReports() {
    const tableBody = document.getElementById("reportTableBody");
    const summaryRow = document.getElementById("reportsSummaryRow");
    
    const startVal = document.getElementById("reportStartDate").value;
    const endVal = document.getElementById("reportEndDate").value;
    const courseVal = document.getElementById("reportFilterCourse").value;
    const semVal = document.getElementById("reportFilterSemester").value;
    
    tableBody.innerHTML = "";
    
    if (!startVal || !endVal) {
        tableBody.innerHTML = `<tr><td colspan="7" class="text-center">Please select a valid date range.</td></tr>`;
        return;
    }
    
    // 1. Find all active attendance dates within range
    const allDates = Object.keys(AppState.attendance).filter(date => {
        return date >= startVal && date <= endVal;
    });
    
    // 2. Filter students according to parameters
    const filteredStudents = AppState.students.filter(student => {
        const matchesCourse = courseVal === "" || student.course === courseVal;
        const matchesSem = semVal === "" || student.semester === semVal;
        return matchesCourse && matchesSem;
    });
    
    if (filteredStudents.length === 0) {
        tableBody.innerHTML = `
            <tr class="empty-table-row">
                <td colspan="7">
                    <div class="empty-state-wrapper">
                        <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        <span class="empty-state-text">No data matches report queries</span>
                        <span class="empty-state-sub">Try modifying date ranges or courses filter.</span>
                    </div>
                </td>
            </tr>
        `;
        document.getElementById("reportTableSummary").textContent = "Showing 0 student records";
        updateReportMetaWidgets(0, 0, 0);
        return;
    }
    
    let globalPresentSum = 0;
    let globalLecturesSum = 0;
    const reportData = [];
    
    // 3. Aggregate metrics for each student
    filteredStudents.forEach(student => {
        let presentCount = 0;
        let totalSessionsCount = 0;
        
        allDates.forEach(date => {
            const dayLogs = AppState.attendance[date];
            if (dayLogs && dayLogs[student.rollNumber] !== undefined) {
                totalSessionsCount++;
                if (dayLogs[student.rollNumber] === "Present") {
                    presentCount++;
                    globalPresentSum++;
                }
                globalLecturesSum++;
            }
        });
        
        const absentCount = totalSessionsCount - presentCount;
        const rate = totalSessionsCount > 0 ? Math.round((presentCount / totalSessionsCount) * 100) : 0;
        
        reportData.push({
            student: student,
            present: presentCount,
            absent: absentCount,
            total: totalSessionsCount,
            rate: rate
        });
    });
    
    // Filter by defaulter status if switch is checked
    const defaultersOnly = document.getElementById("defaulterToggle") ? document.getElementById("defaulterToggle").checked : false;
    const reportSection = document.getElementById("reportsSection");
    
    let finalReportData = reportData;
    if (defaultersOnly) {
        finalReportData = reportData.filter(item => item.rate < 75 && item.total > 0);
        if (reportSection) reportSection.classList.add("defaulter-view-active");
    } else {
        if (reportSection) reportSection.classList.remove("defaulter-view-active");
    }
    
    // Sort report rows alphabetically
    finalReportData.sort((a, b) => a.student.fullName.localeCompare(b.student.fullName));
    
    // 4. Render Table rows
    finalReportData.forEach(item => {
        let badgeColorClass = "badge-red";
        if (item.rate >= 75) {
            badgeColorClass = "badge-green";
        } else if (item.rate >= 50) {
            badgeColorClass = "badge-warning";
        }
        
        const row = `
            <tr>
                <td><strong>${item.student.rollNumber}</strong></td>
                <td>${item.student.fullName}</td>
                <td><span class="badge badge-blue">${item.student.course}</span> Sem ${item.student.semester}</td>
                <td class="text-center text-green"><strong>${item.present}</strong></td>
                <td class="text-center text-red"><strong>${item.absent}</strong></td>
                <td class="text-center"><strong>${item.total}</strong></td>
                <td class="text-right">
                    <span class="badge ${badgeColorClass}" style="font-size:12px; padding: 6px 12px;">${item.rate}%</span>
                </td>
            </tr>
        `;
        tableBody.insertAdjacentHTML("beforeend", row);
    });
    
    // 5. Update UI Widgets & Subtitle
    const avgOverallRate = globalLecturesSum > 0 ? Math.round((globalPresentSum / globalLecturesSum) * 100) : 0;
    
    // If defaulters view is active, update the total count card to reflect number of defaulters, not total registrations!
    const displayStudentCount = defaultersOnly ? finalReportData.length : filteredStudents.length;
    updateReportMetaWidgets(allDates.length, displayStudentCount, avgOverallRate);
    
    document.getElementById("reportTableSummary").textContent = `Showing ${finalReportData.length} student records`;
    
    // Update report subtitle
    const startFormatted = new Date(startVal).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const endFormatted = new Date(endVal).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (defaultersOnly) {
        document.getElementById("reportMetaSubtitle").textContent = `CRITICAL DEFAULTERS LIST (<75%) - Logs from ${startFormatted} to ${endFormatted}`;
        document.getElementById("reportMetaSubtitle").className = "badge badge-red";
    } else {
        document.getElementById("reportMetaSubtitle").textContent = `Logs from ${startFormatted} to ${endFormatted}`;
        document.getElementById("reportMetaSubtitle").className = "badge badge-blue";
    }

    // Toggle simulated warnings button based on defaulter mode and list count
    const btnGenerateWarnings = document.getElementById("btnGenerateWarnings");
    if (btnGenerateWarnings) {
        if (defaultersOnly && finalReportData.length > 0) {
            btnGenerateWarnings.style.display = "flex";
        } else {
            btnGenerateWarnings.style.display = "none";
        }
    }
}

function updateReportMetaWidgets(daysCount, studentCount, avgRate) {
    document.getElementById("reportTotalDays").textContent = daysCount;
    document.getElementById("reportTotalStudents").textContent = studentCount;
    document.getElementById("reportAvgRate").textContent = `${avgRate}%`;
}

// Export CSV Functionality
function exportAttendanceReportToCSV() {
    const startVal = document.getElementById("reportStartDate").value;
    const endVal = document.getElementById("reportEndDate").value;
    const courseVal = document.getElementById("reportFilterCourse").value || "ALL";
    const semVal = document.getElementById("reportFilterSemester").value || "ALL";
    
    const allDates = Object.keys(AppState.attendance).filter(date => date >= startVal && date <= endVal);
    const filteredStudents = AppState.students.filter(student => {
        const matchesCourse = courseVal === "ALL" || student.course === courseVal;
        const matchesSem = semVal === "ALL" || student.semester === semVal;
        return matchesCourse && matchesSem;
    });
    
    if (filteredStudents.length === 0 || allDates.length === 0) {
        showToast("No attendance logs found in date range to export", "danger");
        return;
    }
    
    // Build CSV Content
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // CSV Header row
    csvContent += "Roll Number,Full Name,Course,Semester,Lectures Present,Lectures Absent,Total Classes,Attendance Rate (%)\r\n";
    
    filteredStudents.sort((a, b) => a.fullName.localeCompare(b.fullName)).forEach(student => {
        let present = 0;
        let total = 0;
        
        allDates.forEach(date => {
            const dayLogs = AppState.attendance[date];
            if (dayLogs && dayLogs[student.rollNumber] !== undefined) {
                total++;
                if (dayLogs[student.rollNumber] === "Present") present++;
            }
        });
        
        const absent = total - present;
        const rate = total > 0 ? Math.round((present / total) * 100) : 0;
        
        const row = `"${student.rollNumber}","${student.fullName}","${student.course}","${student.semester}",${present},${absent},${total},${rate}\r\n`;
        csvContent += row;
    });
    
    // Trigger download anchor
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SAMS_Attendance_Report_Course_${courseVal}_Sem_${semVal}_[${startVal}_to_${endVal}].csv`);
    document.body.appendChild(link);
    
    link.click();
    document.body.removeChild(link);
    
    logActivity("warning", `Generated and exported CSV attendance sheet`);
    showToast("CSV report generated successfully", "success");
}

// --- Notification UI Elements (Toast Alerts) ---
function showToast(message, type = "primary") {
    const container = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    
    // Select Icon based on type
    let svgIcon = '';
    if (type === "success") {
        svgIcon = `
            <svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
        `;
    } else if (type === "danger") {
        svgIcon = `
            <svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
        `;
    } else if (type === "warning") {
        svgIcon = `
            <svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
        `;
    } else {
        svgIcon = `
            <svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
        `;
    }
    
    toast.innerHTML = `
        ${svgIcon}
        <span class="toast-message">${message}</span>
        <button class="toast-close" aria-label="Close notification">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
    `;
    
    container.appendChild(toast);
    
    // Setup close listener
    const closeBtn = toast.querySelector(".toast-close");
    closeBtn.addEventListener("click", () => {
        toast.style.transform = "translateX(120%)";
        setTimeout(() => toast.remove(), 300);
    });
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.transform = "translateX(120%)";
            setTimeout(() => toast.remove(), 300);
        }
    }, 4000);
}

// --- Dynamic SVG Trend Chart Generator ---
function renderTrendChart() {
    const container = document.getElementById("trendChartContainer");
    if (!container) return;
    
    // 1. Get dates in chronological order
    const dates = Object.keys(AppState.attendance).sort();
    
    // Take latest 5 dates
    const latestDates = dates.slice(-5);
    
    if (latestDates.length === 0) {
        container.innerHTML = `
            <div class="empty-state-wrapper" style="padding: 24px;">
                <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <line x1="18" y1="20" x2="18" y2="10"></line>
                    <line x1="12" y1="20" x2="12" y2="4"></line>
                    <line x1="6" y1="20" x2="6" y2="14"></line>
                </svg>
                <span class="empty-state-text">No trend data available</span>
                <span class="empty-state-sub">Save attendance for a few days to view trends.</span>
            </div>
        `;
        return;
    }
    
    // Calculate rate for each date
    const points = [];
    latestDates.forEach((date) => {
        const logs = AppState.attendance[date];
        let presentCount = 0;
        let totalLogs = 0;
        
        Object.keys(logs).forEach(roll => {
            const studentExists = AppState.students.some(s => s.rollNumber === roll);
            if (studentExists) {
                totalLogs++;
                if (logs[roll] === "Present") presentCount++;
            }
        });
        
        const rate = totalLogs > 0 ? Math.round((presentCount / totalLogs) * 100) : 0;
        
        // Date formatting e.g. "Jun 4"
        const dStr = date.split("-");
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthIndex = parseInt(dStr[1]) - 1;
        const dateStr = monthNames[monthIndex] + " " + parseInt(dStr[2]);
        
        points.push({
            date: dateStr,
            rate: rate,
            fullDate: date
        });
    });
    
    // SVG Settings
    const svgWidth = 500;
    const svgHeight = 200;
    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 30;
    
    const plotWidth = svgWidth - paddingLeft - paddingRight;
    const plotHeight = svgHeight - paddingTop - paddingBottom;
    
    // X coordinates step
    const xStep = points.length > 1 ? plotWidth / (points.length - 1) : plotWidth;
    
    // Build path coordinates
    let linePathD = "";
    let areaPathD = "";
    const dotsHtml = [];
    const labelsHtml = [];
    
    points.forEach((pt, i) => {
        const x = paddingLeft + i * xStep;
        // Y mapping: rate 100% -> Y=paddingTop, rate 0% -> Y=svgHeight - paddingBottom
        const y = (svgHeight - paddingBottom) - (pt.rate / 100) * plotHeight;
        
        if (i === 0) {
            linePathD = `M ${x} ${y}`;
            areaPathD = `M ${x} ${svgHeight - paddingBottom} L ${x} ${y}`;
        } else {
            linePathD += ` L ${x} ${y}`;
            areaPathD += ` L ${x} ${y}`;
        }
        
        if (i === points.length - 1) {
            areaPathD += ` L ${x} ${svgHeight - paddingBottom} Z`;
        }
        
        // SVG Dots with tooltips
        dotsHtml.push(`
            <circle class="chart-dot" cx="${x}" cy="${y}" r="5">
                <title>${pt.fullDate}: ${pt.rate}% Attendance</title>
            </circle>
            <text x="${x}" y="${y - 10}" class="chart-axis-label" text-anchor="middle" font-weight="700" fill="var(--text-primary)">${pt.rate}%</text>
        `);
        
        // X-axis label
        labelsHtml.push(`
            <text x="${x}" y="${svgHeight - 10}" class="chart-axis-label" text-anchor="middle">${pt.date}</text>
        `);
    });
    
    // Draw Y grid lines (100%, 75%, 50%, 25%, 0%)
    const gridLines = [];
    const percentages = [0, 25, 50, 75, 100];
    percentages.forEach(pct => {
        const y = (svgHeight - paddingBottom) - (pct / 100) * plotHeight;
        gridLines.push(`
            <line class="chart-axis-line" x1="${paddingLeft}" y1="${y}" x2="${svgWidth - paddingRight}" y2="${y}"></line>
            <text x="${paddingLeft - 8}" y="${y + 3}" class="chart-axis-label" text-anchor="end">${pct}%</text>
        `);
    });
    
    const svgContent = `
        <svg class="chart-svg" viewBox="0 0 ${svgWidth} ${svgHeight}" width="100%" height="100%">
            <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="var(--color-primary)" stop-opacity="0.4"/>
                    <stop offset="100%" stop-color="var(--color-primary)" stop-opacity="0.0"/>
                </linearGradient>
            </defs>
            
            <!-- Grid Lines -->
            ${gridLines.join("")}
            
            <!-- Area Fill -->
            ${points.length > 0 ? `<path class="chart-area" d="${areaPathD}"></path>` : ""}
            
            <!-- Trend Line -->
            ${points.length > 0 ? `<path class="chart-line" d="${linePathD}"></path>` : ""}
            
            <!-- Data Dots -->
            ${dotsHtml.join("")}
            
            <!-- X-axis Labels -->
            ${labelsHtml.join("")}
        </svg>
    `;
    
    container.innerHTML = svgContent;
}

// --- Import Students CSV Parser ---
function handleCSVImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(evt) {
        const text = evt.target.result;
        const lines = text.split(/\r?\n/);
        let importedCount = 0;
        let duplicateCount = 0;
        let invalidCount = 0;
        
        let startIdx = 0;
        if (lines[0].toLowerCase().includes("roll") || lines[0].toLowerCase().includes("name")) {
            startIdx = 1;
        }
        
        for (let i = startIdx; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim());
            if (cols.length < 5) {
                invalidCount++;
                continue;
            }
            
            const roll = cols[0];
            const name = cols[1];
            const course = cols[2];
            const sem = cols[3];
            const email = cols[4];
            
            if (!roll || !name || !course || !sem || !email) {
                invalidCount++;
                continue;
            }
            
            if (AppState.students.some(s => s.rollNumber.toLowerCase() === roll.toLowerCase())) {
                duplicateCount++;
                continue;
            }
            
            AppState.students.push({
                rollNumber: roll,
                fullName: name,
                course: course,
                semester: sem,
                email: email
            });
            importedCount++;
        }
        
        if (importedCount > 0) {
            saveToLocalStorage("students");
            renderStudentDirectory();
            renderDashboard();
            logActivity("success", `Imported ${importedCount} students from CSV`);
            showToast(`Imported ${importedCount} students successfully!`, "success");
        }
        
        if (duplicateCount > 0 || invalidCount > 0) {
            showToast(`Skipped ${duplicateCount} duplicates and ${invalidCount} invalid rows.`, "warning");
        }
        
        e.target.value = "";
    };
    reader.readAsText(file);
}

// --- Warning Letters Generation ---
function openWarningLettersModal() {
    const startVal = document.getElementById("reportStartDate").value;
    const endVal = document.getElementById("reportEndDate").value;
    
    const allDates = Object.keys(AppState.attendance).filter(date => date >= startVal && date <= endVal);
    
    const courseVal = document.getElementById("reportFilterCourse").value;
    const semVal = document.getElementById("reportFilterSemester").value;
    
    const filteredStudents = AppState.students.filter(student => {
        const matchesCourse = courseVal === "" || student.course === courseVal;
        const matchesSem = semVal === "" || student.semester === semVal;
        return matchesCourse && matchesSem;
    });
    
    AppState.defaultersList = [];
    
    filteredStudents.forEach(student => {
        let present = 0;
        let total = 0;
        allDates.forEach(date => {
            const dayLogs = AppState.attendance[date];
            if (dayLogs && dayLogs[student.rollNumber] !== undefined) {
                total++;
                if (dayLogs[student.rollNumber] === "Present") present++;
            }
        });
        const rate = total > 0 ? Math.round((present / total) * 100) : 0;
        if (rate < 75 && total > 0) {
            AppState.defaultersList.push({
                student: student,
                present: present,
                total: total,
                rate: rate
            });
        }
    });
    
    if (AppState.defaultersList.length === 0) {
        showToast("No defaulters found in this report view to generate letters for.", "warning");
        return;
    }
    
    AppState.currentDefaulterIndex = 0;
    renderWarningLetter();
    document.getElementById("warningLetterModal").classList.add("active");
}

function renderWarningLetter() {
    const container = document.getElementById("warningLetterContent");
    const idxText = document.getElementById("warningLetterIndex");
    
    if (AppState.defaultersList.length === 0) return;
    
    const item = AppState.defaultersList[AppState.currentDefaulterIndex];
    const student = item.student;
    
    idxText.textContent = `Letter ${AppState.currentDefaulterIndex + 1} of ${AppState.defaultersList.length}`;
    
    const todayDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    container.innerHTML = `
        <div class="letter-head">
            <h2 class="letter-college-name">SmartAttend Academy & Technology</h2>
            <p class="letter-dept">Academic Affairs - Warning Registry</p>
            <p class="letter-dept" style="font-size: 11px;">Affiliated to State Technical University</p>
        </div>
        <div class="letter-meta">
            <div class="letter-meta-col">
                <strong>Ref No:</strong> SAIT/DSA/ATT/2026/${100 + AppState.currentDefaulterIndex}
            </div>
            <div class="letter-meta-col">
                <strong>Date:</strong> ${todayDate}
            </div>
        </div>
        <div class="letter-to">
            To,<br>
            <strong>The Parents / Guardian of</strong><br>
            ${student.fullName}<br>
            Roll Number: ${student.rollNumber}<br>
            Course: ${student.course}, Semester: ${student.semester}
        </div>
        <div class="letter-subject">
            SUBJECT: WARNING REGARDING SHORTAGE OF LECTURES ATTENDANCE
        </div>
        <div class="letter-body">
            Dear Parent/Guardian,<br><br>
            This is to bring to your urgent notice that your ward, <strong>${student.fullName}</strong>, registered under Roll Number <strong>${student.rollNumber}</strong> in <strong>${student.course} Semester ${student.semester}</strong>, has been highly irregular in attending lectures. 
            As per University regulations, a minimum of <strong>75% attendance</strong> is mandatory to be eligible to appear in the end-semester examinations.
            <br><br>
            The details of attendance recorded in the recent session are summarized below:
            <table class="letter-table">
                <thead>
                    <tr>
                        <th>Lectures Conducted</th>
                        <th>Lectures Attended</th>
                        <th>Current Attendance Rate</th>
                        <th>Required Minimum</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>${item.total}</strong></td>
                        <td style="color:var(--color-danger-hover);"><strong>${item.present}</strong></td>
                        <td style="color:var(--color-danger-hover); font-weight:bold;">${item.rate}%</td>
                        <td><strong>75%</strong></td>
                    </tr>
                </tbody>
            </table>
            As your ward's current attendance rate is <strong>${item.rate}%</strong>, which is critically below the university threshold, they are in danger of being barred from examinations. 
            You are requested to advise your ward to attend the remaining lectures regularly to recover the deficit, and meet the BCA Department Coordinator immediately to submit a formal clarification.
        </div>
        <div class="letter-closing">
            Yours faithfully,<br><br><br>
            <div class="letter-sign">
                Dean / Department Head<br>
                SAIT Academic Cell
            </div>
        </div>
    `;
}

function printWarningLetter() {
    document.body.classList.add("print-letter-mode");
    window.print();
    setTimeout(() => {
        document.body.classList.remove("print-letter-mode");
    }, 500);
}

// Download CSV Import Template
function exportCSVTemplate() {
    const headers = "Roll Number,Full Name,Course,Semester,Email Address\r\n";
    const sampleRow = `"BCA-2026-001","Aarav Sharma","BCA","VI","aarav.sharma@college.edu"\r\n`;
    
    // Create CSV blob and trigger download
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(headers + sampleRow);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", "SmartAttend_Student_Import_Template.csv");
    document.body.appendChild(link);
    
    link.click();
    document.body.removeChild(link);
    
    logActivity("primary", "Downloaded CSV Student Import Template");
    showToast("Import template downloaded", "success");
}
