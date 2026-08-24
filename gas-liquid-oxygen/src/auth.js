// ========================================
// AUTHENTICATION / USER NAVIGATION
// ========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        updateUserNavigation();

    }
);


// ========================================
// UPDATE USER NAVIGATION
// ========================================

function updateUserNavigation() {

    const userNav = document.getElementById("user-nav");

    if (!userNav) return;

    const userId = sessionStorage.getItem("userId");
    const role = sessionStorage.getItem("role");

    if (!userId || !role) {

        userNav.innerHTML = `
            <a href="log_in.html">Log In</a>
        `;
        return;
    }

    userNav.innerHTML = `
        <div class="user-nav">
            <span class="user-id">${userId}</span>
            <button type="button" onclick="logoutUser()">
                Log Out
            </button>
        </div>
    `;
}


// ========================================
// LOG OUT
// ========================================

function logoutUser() {

    const confirmLogout =
        confirm(
            "Are you sure you want to log out?"
        );


    // ========================================
    // CANCEL
    // ========================================

    if (!confirmLogout) {

        return;

    }


    // ========================================
    // CLEAR LOGIN DATA
    // ========================================

    sessionStorage.removeItem("role");

    sessionStorage.removeItem("userId");


    // ========================================
    // GO TO LOGIN PAGE
    // ========================================

    window.location.href =
        "log_in.html";

}