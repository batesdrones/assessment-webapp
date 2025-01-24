document.addEventListener("DOMContentLoaded", () => {
    const sections = {
        login: document.getElementById("login-section"),
        createAccount: document.getElementById("create-account-section"),
        mainContent: document.getElementById("main-content"),
        homeSection: document.getElementById("home-section") 
    };

    const headerTitle = document.getElementById("header-title");
    const loginForm = document.getElementById("login-form");
    const createAccountBtn = document.getElementById("create-account-btn");
    const backToLoginBtns = document.querySelectorAll("#back-to-login-btn");
    const takeAssessmentBtn = document.getElementById("take-assessment-btn");

    const assessmentsRequested = document.getElementById('assessments-requested');
    const assessmentsCompleted = document.getElementById('assessments-completed');

    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const email = document.getElementById("username").value;
        const password = document.getElementById("login-password").value;

        try {
            const response = await fetch('http://localhost:3001/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (response.ok) {
                sections.login.style.display = "none";
                sections.mainContent.style.display = "flex"; 

                // Fetch and display assessment counts after login
                fetch('/api/user/assessments') 
                    .then(response => response.json())
                    .then(data => {
                        assessmentsRequested.textContent = data.requested;
                        assessmentsCompleted.textContent = data.completed;
                    })
                    .catch(error => console.error('Error fetching assessment counts:', error));
            } else {
                alert('Invalid email or password.');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('An error occurred during login.');
        }
    });

    createAccountBtn.addEventListener("click", () => {
        sections.login.style.display = "none";
        sections.createAccount.style.display = "block";
    });

    backToLoginBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            sections.createAccount.style.display = "none";
            sections.login.style.display = "block";
        });
    });

    takeAssessmentBtn.addEventListener("click", () => { 
        window.location.href = "assessments.html"; 
    });

    // Fetch assessment counts on assessments.html page
    if (window.location.pathname === "/assessments.html") {
        fetch('/api/user/assessments') 
            .then(response => response.json())
            .then(data => {
                assessmentsRequested.textContent = data.requested;
                assessmentsCompleted.textContent = data.completed;
            })
            .catch(error => console.error('Error fetching assessment counts:', error));

        const organizationSelect = document.getElementById('organization-name');

        fetch('/api/organizations')
            .then(response => response.json())
            .then(data => {
                data.forEach(org => {
                    const option = document.createElement('option');
                    option.value = org.organization_name;
                    option.text = org.organization_name;
                    organizationSelect.appendChild(option);
                });
            })
            .catch(error => console.error('Error fetching organizations:', error));

        organizationSelect.addEventListener('change', async () => { 
            const selectedOrganization = organizationSelect.value;
            if (selectedOrganization) {
                try {
                    const response = await fetch(`/api/organizations/${selectedOrganization}`);
                    const data = await response.json();
                    if (data) {
                        document.getElementById('facility-type').value = data.facility_type || '';
                        document.getElementById('street-address').value = data.facility_address || '';
                        // ... (populate other fields with existing data) ...
                    }
                } catch (error) {
                    console.error('Error fetching organization data:', error);
                }
            }
        });

        const assessmentForm = document.getElementById('assessment-form');

        assessmentForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const formData = new FormData(assessmentForm);
            const organizationName = formData.get('organization-name');

            try {
                const response = await fetch('/api/assessments/submit', {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    alert('Assessment submitted successfully!');
                    // Optionally, redirect the user to a confirmation page or refresh the counts
                    fetch('/api/user/assessments') 
                        .then(response => response.json())
                        .then(data => {
                            assessmentsRequested.textContent = data.requested;
                            assessmentsCompleted.textContent = data.completed;
                        });
                } else {
                    alert('Error submitting assessment.');
                }
            } catch (error) {
                console.error('Error submitting assessment:', error);
                alert('An error occurred while submitting the assessment.');
            }
        });
    }
});