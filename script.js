const AppState = {
    currentFilter: 'all',
    currentSection: 'hero',
    pitches: [],
    mentors: [],
    stats: {
        newPitches: 24,
        underReview: 12,
        meetings: 8,
        investments: 5
    }
};

// Sample Data
const SAMPLE_PITCHES = [ /* same as before */ ];
const SAMPLE_MENTORS = [ /* same as before */ ];

// Utility Functions
function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('');
}

function showLoadingSpinner(buttonId, text = "Processing...") {
    const button = document.getElementById(buttonId);
    if (!button) return;
    const originalText = button.innerHTML;
    button.innerHTML = `<div class="loading-spinner"></div>${text}`;
    button.disabled = true;

    setTimeout(() => {
        button.innerHTML = originalText;
        button.disabled = false;
    }, 2000);
}

// Navigation
function showSection(sectionId) {
    const sections = ['hero', 'browse', 'pitch', 'investors', 'mentors', 'entrepreneur'];
    
    sections.forEach(id => {
        const sec = document.getElementById(id);
        if (sec) sec.classList.add('hidden');
    });

    const target = document.getElementById(sectionId);
    if (target) {
        target.classList.remove('hidden');
        AppState.currentSection = sectionId;

        // Section-specific functions
        if (sectionId === 'browse' || sectionId === 'pitch') displayPitches();
        if (sectionId === 'mentors') displayMentors();
        if (sectionId === 'investors') updateInvestorStats();

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Pitches
function displayPitches() {
    const grid = document.getElementById('pitchGrid');
    if (!grid) return;

    const filtered = AppState.currentFilter === 'all' 
        ? AppState.pitches 
        : AppState.pitches.filter(p => p.category === AppState.currentFilter);

    grid.innerHTML = filtered.map(pitch => `
        <div class="pitch-card p-6 bg-white rounded-2xl shadow-lg mb-6">
            <div class="flex justify-between items-start mb-3">
                <h3 class="text-xl font-bold flex items-center gap-2">💻 ${pitch.name}</h3>
                <span class="startup-badge">${pitch.stage}</span>
            </div>
            <p class="opacity-90 font-semibold mb-2">${pitch.tagline}</p>
            <p class="opacity-80 mb-3">${pitch.description}</p>
            <div class="flex justify-between items-center mb-3">
                <span class="font-bold">${pitch.funding}</span>
                <span class="text-sm opacity-90">${pitch.industry}</span>
            </div>
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                    <div class="w-9 h-9 founder-circle rounded-full flex items-center justify-center text-sm font-bold bg-purple-200">
                        ${getInitials(pitch.founder)}
                    </div>
                    <span class="text-sm">${pitch.founder}</span>
                </div>
                <button onclick="viewPitch(${pitch.id})" class="px-4 py-2 rounded-lg text-sm bg-purple-600 text-white hover:bg-purple-700 transition-colors">
                    View Details
                </button>
            </div>
        </div>
    `).join('');
}

function filterPitches(category, event) {
    AppState.currentFilter = category;
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('bg-purple-600','text-white');
        btn.classList.add('bg-gray-200','text-gray-700');
    });
    if(event && event.target){
        event.target.classList.add('bg-purple-600','text-white');
        event.target.classList.remove('bg-gray-200','text-gray-700');
    }
    displayPitches();
}

function viewPitch(id) {
    const pitch = AppState.pitches.find(p => p.id === id);
    if(pitch) alert(`Pitch: ${pitch.name}\nTagline: ${pitch.tagline}\nFounder: ${pitch.founder}`);
}

// Form Submissions
async function submitPitch(event) {
    event.preventDefault();
    const form = event.target;
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<div class="loading-spinner"></div>Submitting...`;

    const formData = Object.fromEntries(new FormData(form).entries());

    try {
        const res = await fetch("http://localhost:5000/api/submit-pitch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData)
        });
        const data = await res.json();

        if (data.success) {
            document.getElementById("successMessage").classList.remove("hidden");
            document.getElementById("successMessage").innerText = "✅ Pitch submitted successfully!";
            form.reset();
            setTimeout(() => document.getElementById("successMessage").classList.add("hidden"), 3000);

            AppState.pitches.push({
                id: AppState.pitches.length + 1,
                name: formData.startupName,
                category: formData.industry,
                tagline: formData.tagline,
                description: formData.problem + " " + formData.solution,
                funding: formData.funding,
                stage: formData.stage,
                founder: "You",
                industry: formData.industry
            });
            AppState.stats.newPitches++;
            updateInvestorStats();
        } else {
            alert("❌ " + data.message);
        }
    } catch (err) {
        console.error(err);
        alert("⚠️ Server error while submitting pitch");
    }

    submitBtn.disabled = false;
    submitBtn.innerHTML = "Submit Pitch";
}

// Mentors
function displayMentors() {
    const list = document.getElementById('mentorsList');
    if(!list) return;
    list.innerHTML = AppState.mentors.map(mentor => `
        <div class="mentor-card p-6 rounded-xl bg-white shadow mb-4">
            <div class="flex items-center space-x-4 mb-3">
                <div class="w-12 h-12 ${mentor.color} rounded-full flex items-center justify-center text-white font-bold">
                    ${mentor.initials}
                </div>
                <div>
                    <h4 class="font-bold">${mentor.name}</h4>
                    <p class="text-gray-600 text-sm">${mentor.title}</p>
                </div>
            </div>
            <p class="text-gray-700">"${mentor.description}"</p>
            <button onclick="connectWithMentor(${mentor.id})" class="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Connect
            </button>
        </div>
    `).join('');
}

function connectWithMentor(id) {
    const mentor = AppState.mentors.find(m => m.id === id);
    if(mentor) alert(`🤝 Connection request sent to ${mentor.name}!`);
}

// Investors
function updateInvestorStats() {
    document.getElementById('newPitchesCount').textContent = AppState.stats.newPitches;
    document.getElementById('underReviewCount').textContent = AppState.stats.underReview;
    document.getElementById('meetingsCount').textContent = AppState.stats.meetings;
    document.getElementById('investmentsCount').textContent = AppState.stats.investments;
}
function joinAsInvestor() { alert('💼 Investor Registration opened!'); }

// Entrepreneur Form
function submitEntrepreneur(event) {
    event.preventDefault();
    const formData = Object.fromEntries(new FormData(event.target).entries());
    console.log("Entrepreneur Form:", formData);
    alert("Entrepreneur form submitted successfully!");
    event.target.reset();
}

// Initialize
function initializeApp() {
    AppState.pitches = [...SAMPLE_PITCHES];
    AppState.mentors = [...SAMPLE_MENTORS];

    displayPitches();
    displayMentors();
    updateInvestorStats();
    showSection('hero');
}

document.addEventListener('DOMContentLoaded', initializeApp);

// Popup Form Functions
function openForm() {
    document.getElementById("registerPopup").classList.remove("hidden");
}
function closeForm() {
    document.getElementById("registerPopup").classList.add("hidden");
}

// Initialize
document.addEventListener('DOMContentLoaded', initializeApp);

// Expose
window.showSection = showSection;
window.filterPitches = filterPitches;
window.viewPitch = viewPitch;
window.submitPitch = submitPitch;
window.connectWithMentor = connectWithMentor;
window.submitEntrepreneur = submitEntrepreneur;
window.joinAsInvestor = joinAsInvestor;
window.openForm = openForm;
window.closeForm = closeForm;


function openWebinarForm() {
    document.getElementById("webinarFormPopup").classList.remove("hidden");
    document.getElementById("webinarFormPopup").classList.add("flex");
}

function closeWebinarForm() {
    document.getElementById("webinarFormPopup").classList.add("hidden");
}

function showWebinarSuccess() {
    document.getElementById("webinarSuccessPopup").classList.remove("hidden");
}

function closeWebinarSuccess() {
    document.getElementById("webinarSuccessPopup").classList.add("hidden");
}

document.getElementById("webinarForm").addEventListener("submit", function(e){
    e.preventDefault();
    closeWebinarForm();
    showWebinarSuccess();
});


const reserveBtn = document.getElementById("reserveBtn");
const modal = document.getElementById("reserveModal");
const closeBtn = document.querySelector(".close");

reserveBtn.onclick = () => {
  modal.style.display = "flex";
};

closeBtn.onclick = () => {
  modal.style.display = "none";
};

window.onclick = (e) => {
  if (e.target === modal) {
    modal.style.display = "none";
  }
};

document.getElementById("reserveForm").onsubmit = function(e) {
  e.preventDefault();
  alert("✅ Your spot has been reserved! Confirmation email sent.");
  modal.style.display = "none";
};

document.getElementById("reserveForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = {
    name: e.target[0].value,
    email: e.target[1].value,
    startup: e.target[2].value,
    role: e.target[3].value,
  };

  const res = await fetch("http://localhost:5000/reserve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (res.ok) {
    alert("✅ Confirmation email sent to your inbox!");
    document.getElementById("reserveModal").classList.add("hidden");
  } else {
    alert("❌ Something went wrong. Try again!");
  }
});



// Expose
window.showSection = showSection;
window.filterPitches = filterPitches;
window.viewPitch = viewPitch;
window.submitPitch = submitPitch;
window.connectWithMentor = connectWithMentor;
window.submitEntrepreneur = submitEntrepreneur;
window.joinAsInvestor = joinAsInvestor;

function openForm() {
  const popup = document.getElementById("registerPopup");
  const successMsg = document.getElementById("successMsg");
  const form = document.getElementById("registerForm");

  popup.style.display = "flex";

  // 🔥 RESET STATE
  successMsg.style.display = "none";
  form.style.display = "block";
}

function closeForm() {
  document.getElementById("registerPopup").style.display = "none";
}

function handleSubmit(e) {
  e.preventDefault();

  const fullName = document.querySelector('[name="fullName"]').value;
  const email = document.querySelector('[name="email"]').value;
  const startupName = document.querySelector('[name="startupName"]').value;

  fetch("http://localhost:5000/api/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      fullName,
      email,
      startupName
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      document.getElementById("successMsg").style.display = "block";
    }
  })
  .catch(err => console.error("Register error:", err));
}







// ================= SIGNUP =================
document.getElementById("signupForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const user = {
    username: document.getElementById("username").value,
    email: document.getElementById("email").value,
    password: document.getElementById("password").value
  };

  const res = await fetch("http://localhost:5000/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user)
  });

  const data = await res.json();

  if (res.ok) {
    document.getElementById("successMessage").style.display = "block";
    setTimeout(() => window.location.href = "login.html", 2000);
  } else {
    alert(data.message);
  }
});


// ================= LOGIN =================
document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const user = {
    username: document.getElementById("username").value,
    password: document.getElementById("password").value
  };

  const res = await fetch("http://localhost:5000/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user)
  });

  const data = await res.json();

  if (res.ok) {
    // ✅ CREATE PROFILE (SAVE USER)
    localStorage.setItem("user", JSON.stringify({
      id: data.id,
      username: data.username,
      email: data.email
    }));

    document.getElementById("successMessage").style.display = "block";
    setTimeout(() => window.location.href = "index.html", 1000);
  } else {
    alert(data.message);
  }
});


// ================= PROFILE LOAD =================
function loadProfile() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  document.getElementById("profileUsername").innerText = user.username;
  document.getElementById("profileEmail").innerText = user.email;
}

