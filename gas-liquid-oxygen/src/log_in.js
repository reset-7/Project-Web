// ========================================
// LOGIN
// ========================================


// ========================================
// TEST USERS
// ========================================

const USERS = [

    {
        username: "Admin",
        password: "admin123",
        role: "admin"
    },

    {
        username: "Guest",
        password: "guest123",
        role: "guest"
    }

];


// ========================================
// ELEMENTS
// ========================================

const usernameInput =
    document.getElementById("username");

const passwordInput =
    document.getElementById("password");

const loginButton =
    document.getElementById("login-button");

const loginMessage =
    document.getElementById("login-message");


// ========================================
// LOGIN
// ========================================

function login() {

    const username =
        usernameInput.value.trim();

    const password =
        passwordInput.value;


    // ========================================
    // EMPTY INPUT
    // ========================================

    if (!username || !password) {

        showMessage(
            "Please enter username and password.",
            "error"
        );

        return;
    }


    // ========================================
    // FIND USER
    // ========================================

    const user =
        USERS.find(
            account =>
                account.username === username &&
                account.password === password
        );


    // ========================================
    // LOGIN FAILED
    // ========================================

    if (!user) {

        showMessage(
            "Invalid username or password.",
            "error"
        );

        return;
    }


    // ========================================
    // LOGIN SUCCESS
    // ========================================

    sessionStorage.setItem("loggedIn", "true");
    sessionStorage.setItem("userId", user.username);
    sessionStorage.setItem("role", user.role);

    showMessage(
        "Login successful.",
        "success"
    );


    // ========================================
    // REDIRECT
    // ========================================

    setTimeout(() => {

        window.location.href =
            "dashboard.html";

    }, 500);

}


// ========================================
// SHOW MESSAGE
// ========================================

function showMessage(message, type) {

    loginMessage.textContent =
        message;


    if (type === "error") {

        loginMessage.style.color =
            "#D32F2F";

    }

    else {

        loginMessage.style.color =
            "#2E7D32";

    }

}


// ========================================
// BUTTON
// ========================================

loginButton.addEventListener(
    "click",
    login
);


// ========================================
// ENTER KEY
// ========================================

passwordInput.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {

            login();

        }

    }
);

// ========================================
// GUEST LOGIN
// ========================================

const guestLogin =
    document.getElementById("guest-login");


guestLogin.addEventListener(
    "click",
    event => {

        event.preventDefault();

        const guest =
            USERS.find(
                account =>
                    account.role === "guest"
            );

        if (!guest) {
            return;
        }


        // ========================================
        // CREATE GUEST SESSION
        // ========================================

        sessionStorage.setItem(
            "loggedIn",
            "true"
        );

        sessionStorage.setItem(
            "userId",
            guest.username
        );

        sessionStorage.setItem(
            "role",
            guest.role
        );


        // ========================================
        // REDIRECT
        // ========================================

        window.location.href =
            "dashboard.html";

    }
);