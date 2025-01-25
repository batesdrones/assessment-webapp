// Fetch organizations from the server
fetch('/api/organizations')
  .then(response => response.json())
  .then(data => {
    const organizationSelect = document.getElementById('organization-name');
    data.forEach(org => {
      const option = document.createElement('option');
      option.value = org.organization_name;
      option.text = org.organization_name;
      organizationSelect.appendChild(option);
    });
  })
  .catch(error => {
    console.error('Error fetching organizations:', error);
  });

// Fetch distinct facility types from the server
fetch('/api/facility-types')
  .then(response => response.json())
  .then(data => {
    const facilityTypeSelect = document.getElementById('facility-type');
    data.forEach(type => {
      const option = document.createElement('option');
      option.value = type.facility_type;
      option.text = type.facility_type;
      facilityTypeSelect.appendChild(option);
    });
  })
  .catch(error => {
    console.error('Error fetching facility types:', error);
  });

// Fetch distinct projects from the server
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
  })
  .catch(error => {
    console.error('Error fetching projects:', error);
  });

// Handle form submission and validation
const assessmentForm = document.getElementById('assessment-form');

assessmentForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  // Basic input validation (add more as needed)
  const organizationName = document.getElementById('organization-name').value;
  const project = document.getElementById('project').value;
  const facilityType = document.getElementById('facility-type').value;
  if (!organizationName) {
    alert('Organization Name is required.');
    return;
  }
  if (!project) {
    alert('Project is required.');
    return;
  }
  if (!facilityType) {
    alert('Facility Type is required.');
    return;
  }
  // ... add more input validation checks for other fields

  const formData = new FormData(assessmentForm);

  try {
    const response = await fetch('/api/assessments', {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Assessment submitted successfully:', data);
      // Optionally, display a success message to the user
    } else {
      const errorData = await response.json();
      console.error('Error submitting assessment:', errorData);
      // Optionally, display an error message to the user
    }
  } catch (error) {
    console.error('Error submitting assessment:', error);
    // Optionally, display an error message to the user
  }
});