document.addEventListener('DOMContentLoaded', function() {

// Insert custom styles for email boxes
const styles = `
  .email-box:hover {
      background-color: #f0f0f0;
      cursor: pointer;
  }
`;
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');

  // Handle the email submission
  document.querySelector('#compose-form').addEventListener('submit', send_email);
  
});

function send_email(event) {
  // Prevent the default form submission behavior
  event.preventDefault();

  // Extract email details from the form
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  // Make a POST request to send the email
  fetch('/emails', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({
          recipients: recipients,
          subject: subject,
          body: body
      })
  })
  .then(response => response.json())
  .then(result => {
      // Print result for debugging and check for errors
      console.log(result);

      // If there's an error, show it
      if (result.error) {
          alert(result.error);
          return;
      }

      // If the email is sent successfully, load the sent mailbox
      load_mailbox('sent');
  })
  .catch(error => {
      console.log('Error:', error);
  });
}

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name (This part was provided)
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Make a GET request to fetch emails for the mailbox
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      // Iterate over each email and render them
      emails.forEach(email => {
          // Create a new div for the email
          const emailDiv = document.createElement('div');
          emailDiv.className = 'email-box';
          emailDiv.style.border = '1px solid black';
          emailDiv.style.padding = '10px';
          emailDiv.style.margin = '10px 0';
          emailDiv.style.backgroundColor = email.read ? 'lightgray' : 'white'; // Set background based on read status

          // Add sender, subject, and timestamp to the email div
        //   emailDiv.innerHTML = `
        //       <strong>${email.sender}</strong>
        //       ${email.subject}
        //       ${email.timestamp}
        //   `;

          emailDiv.innerHTML = `
            <div class="email-detail"><strong>${email.sender}</strong></div>
            <div class="email-detail">${email.subject}</div>
            <div class="email-timestamp">${email.timestamp}</div>
          `;

          emailDiv.addEventListener('click',(function(email_id){
            return function() {
                load_email_content(email_id);
            };
          })(email.id));
        

          if (mailbox === "inbox") {
            const archiveButton = document.createElement('button');
            archiveButton.innerText = 'Archive';
            archiveButton.className = 'archive-btn';
            archiveButton.onclick = function() {
                toggleArchive(email.id, true);  // true to archive
            };
            emailDiv.appendChild(archiveButton);
          }
        
          if (mailbox === "archive") {
              const unarchiveButton = document.createElement('button');
              unarchiveButton.innerText = 'Unarchive';
              unarchiveButton.className = 'archive-btn'
              unarchiveButton.onclick = function() {
                  toggleArchive(email.id, false);  // false to unarchive
              };
              emailDiv.appendChild(unarchiveButton);
          }
        

          // Append the email div to the emails-view
          document.querySelector('#emails-view').appendChild(emailDiv);
      });
  });
}


function load_email_content(email_id) {
  // Fetch the email content
  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {
      // Mark the email as read
      return fetch(`/emails/${email_id}`, {
          method: 'PUT',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({
              read: true
          })
      })
      .then(() => email); // Return the email for the next .then block
  })
  .then(email => {
      // Hide other views
      document.querySelector('#emails-view').style.display = 'none';
      document.querySelector('#compose-view').style.display = 'none';
      const emailView = document.querySelector('#email-view');
      emailView.style.display = 'block';  // Show the email-view div


      // Load email content
      emailView.innerHTML = `
        <strong>From:</strong> ${email.sender}<br>
        <strong>To:</strong> ${email.recipients.join(", ")}<br>
        <strong>Subject:</strong> ${email.subject}<br>
        <strong>Timestamp:</strong> ${email.timestamp}<br>
        <button id="reply-button">Reply</button><br>
        <hr>
        ${email.body}
        <br>
      `;

      // Attach event listener to the reply button
      document.querySelector('#reply-button').addEventListener('click', () => {
          reply_to_email(email);
      });
      document.querySelector('#reply-button').className = 'reply-btn'; // Add this line to apply the style

  });
}



function toggleArchive(email_id, archiveStatus) {
  fetch(`/emails/${email_id}`, {
      method: 'PUT',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({
          archived: archiveStatus
      })
  })
  .then(() => {
      // Redirect to the inbox after archiving/unarchiving
      load_mailbox('inbox');
  });
}


function reply_to_email(email) {
  // Switch to the composition view
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Pre-fill the composition form fields
  document.querySelector('#compose-recipients').value = email.sender;

  const subjectPrefix = email.subject.startsWith('Re: ') ? '' : 'Re: ';
  document.querySelector('#compose-subject').value = `${subjectPrefix}${email.subject}`;

  document.querySelector('#compose-body').value = 
      `\nOn ${email.timestamp} ${email.sender} wrote:\n${email.body}`;
}



