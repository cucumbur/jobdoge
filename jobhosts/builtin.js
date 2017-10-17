/* global chrome getDogeMessage */

const builtInModule = {
 processPost: (element, hiddenPosts) => {
    if (!element.querySelector('.jobdoge-remove')) {
      // Set id for CSS transition
      element.setAttribute('id', 'jobdoge-post')

      // Get relevant data
      let jobInfo = element.querySelector('.job-title a')
      let hrefString = jobInfo.href
      let jobTitle = jobInfo.text
      let host = jobInfo.hostname
      let companyInfo = element.querySelector('.job-company a')
      let company = companyInfo
        ? companyInfo.text
        : element.querySelector('.job-company').innerHTML

      if (hiddenPosts[hrefString]) {
        // If job post matches a hidden post, hide the post
        element.setAttribute('id', 'jobdoge-hidden-post')
      } else {

        // Set up doge message
        let dogeMsg = getDogeMessage()
        element.prepend(dogeMsg)

        // Set up button
        var button = document.createElement('Button')
        button.innerHTML = 'Hide'
        button.classList.add('jobdoge-remove')
        button.addEventListener('click', function() {
          // Update CSS to enable transition
          element.setAttribute('id', 'jobdoge-hidden-post')
          dogeMsg.classList.add('doge-msg-hidden')

          // Save relevant data to storage
          let data = {}
          let date = Date.now()
          data[hrefString] = {jobTitle, company, host, date}
          chrome.storage.sync.set(data);
        });
        element.prepend(button)
      }
    }
  },
  getRows: () => {
    return document.querySelectorAll('.results.jobs .views-row')
  }
}
