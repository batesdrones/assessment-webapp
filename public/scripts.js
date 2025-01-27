fetch('/api/projects')
  .then(response => response.json())
  .then(data => {
    const projectSelect = document.getElementById('project');
    data.forEach(project => {
      const option = document.createElement('option');
      option.value = project.project; 
      option.text = project.project;
      projectSelect.appendChild(option);
    });

    // Add event listener to the project select
    projectSelect.addEventListener('change', () => {
      const selectedProject = projectSelect.value;

      // Fetch facilities for the selected project
      fetch(`/api/facilities?project=${selectedProject}`) 
        .then(response => response.json())
        .then(data => {
          const facilityNameSelect = document.getElementById('facility-name');
          facilityNameSelect.innerHTML = ''; // Clear existing options
          data.forEach(facility => {
            const option = document.createElement('option');
            option.value = facility.id; // Use facility ID as the option value
            option.text = facility.facility_name;
            facilityNameSelect.appendChild(option);
          });
        })
        .catch(error => {
          console.error('Error fetching facilities:', error);
        });
    });
  })
  .catch(error => {
    console.error('Error fetching projects:', error);
  });

// Add event listener to the facility-name select
const facilityNameSelect = document.getElementById('facility-name');
facilityNameSelect.addEventListener('change', () => {
  const selectedFacilityId = facilityNameSelect.value;

  // Fetch facility details for the selected facility
  fetch(`/api/facilities/${selectedFacilityId}`)
    .then(response => response.json())
    .then(data => {
      // Populate form fields with facility details
      document.getElementById('street-address').value = data.address || ''; 
      // ... populate other fields (status, internet_type, etc.) 
    })
    .catch(error => {
      console.error('Error fetching facility details:', error);
    });
});

// Handle form submission
const assessmentForm = document.getElementById('assessment-form');
assessmentForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(assessmentForm);

  try {
    const response = await fetch('/api/assessments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        facility_id: formData.get('facility-name'),
        question1_speed: formData.get('question1_speed'),
        question2_reliability: formData.get('question2_reliability'),
        question3_support: formData.get('question3_support'),
        question4_cost: formData.get('question4_cost'),
        question5_sufficient: formData.get('question5_sufficient'),
        question6_future_needs: formData.get('question6_future_needs'),
        question7_limitations: formData.get('question7_limitations'),
        question8_improvements: formData.get('question8_improvements')
      })
    });

    if (response.ok) {
      // Handle successful submission (e.g., display success message, redirect)
      console.log('Assessment submitted successfully!');
      // Optionally, redirect to a success page
      window.location.href = '/success'; 
    } else {
      console.error('Error submitting assessment:', await response.text());
    }
  } catch (error) {
    console.error('Error submitting assessment:', error);
  }
});