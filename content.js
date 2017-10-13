/* global chrome */

const supportedSites = {
  'www.builtinchicago.org': true,
  'www.builtinnyc.com': true,
  'www.builtinla.com': true,
  'www.builtincolorado.com': true,
}

const chooseRandom = arr => {
  const randomIndex = Math.floor(Math.random() * arr.length)
  return arr[randomIndex]
}

const getMessage = () => {
  const messages = [
    'Much goodbye',
    'No thank u',
    'Next pls',
    'Wow',
    'No like',
    'Much next',
  ]
  return chooseRandom(messages)
}

const getRandomInRange = (min, max) => {
  return Math.round((Math.random() * (max - min) + min) * 100)
}

const getRandomColor = () => {
  const colors = [
    '#0500fe',
    '#ff00fe',
    '#fe0400',
    '#fe7e00',
    '#0f0',
  ]
  return chooseRandom(colors)
}

const getDogeMessage = () => {
  let message = document.createElement('p')
  message.style.left = `${getRandomInRange(0.1, 0.6)}%`
  message.style.top = `${getRandomInRange(0.0, 0.45)}%`
  message.style.color = getRandomColor()
  message.style.transform = `translateY(0em) rotate(${getRandomInRange(-0.12, 0.12)}deg)`
  message.innerHTML = getMessage()
  message.classList.add('doge-msg')
  return message
}

const traversePosts = (domElements, hiddenPosts) => {
  for (let i = 0; i < domElements.length; i++) {
    let currentElem = domElements[i]

    if (!currentElem.querySelector('.jobdoge-remove')) {
      // Set id for CSS transition
      currentElem.setAttribute('id', 'jobdoge-post')

      // Get relevant data
      let jobInfo = currentElem.querySelector('.job-title a')
      let hrefString = jobInfo.href
      let jobTitle = jobInfo.text
      let host = jobInfo.hostname
      let companyInfo = currentElem.querySelector('.job-company a')
      let company = companyInfo
        ? companyInfo.text
        : currentElem.querySelector('.job-company').innerHTML

      if (hiddenPosts[hrefString]) {
        // If job post matches a hidden post, hide the post
        currentElem.setAttribute('id', 'jobdoge-hidden-post')
      } else {

        // Set up doge message
        let dogeMsg = getDogeMessage()
        currentElem.prepend(dogeMsg)

        // Set up button
        var button = document.createElement('Button')
        button.innerHTML = 'Hide'
        button.classList.add('jobdoge-remove')
        button.addEventListener('click', function() {
          // Update CSS to enable transition
          currentElem.setAttribute('id', 'jobdoge-hidden-post')
          dogeMsg.classList.add('doge-msg-hidden')

          // Save relevant data to storage
          let data = {}
          let date = Date.now()
          data[hrefString] = {jobTitle, company, host, date}
          chrome.storage.sync.set(data);
        });
        currentElem.prepend(button)
      }
    }
  }
}

const updatePosts = () => {
  const { host } = window.location
  if (supportedSites[host]) {
    chrome.storage.sync.get(null, listHistory => {
      traversePosts(
        document.querySelectorAll('.results.jobs .views-row'),
        listHistory
      )
    })
  }
}

const buildModal = () => {
  // Set up modal
  const modal = document.createElement('div')
  modal.classList.add('jobdoge-modal')
  modal.classList.add('jobdoge-modal-closed')

  // Set up modal content
  const modalContent = document.createElement('div')
  modalContent.classList.add('jobdoge-modal-content')
  modalContent.style.transform = 'translateY(-200px)'

  // Set up close button on modal
  const closeButton = document.createElement('span')
  closeButton.innerHTML = '&times;'
  closeButton.onclick = function() {
    modal.classList.add('jobdoge-modal-closed')
    modal.classList.remove('jobdoge-modal-open')
    modalContent.style.transform = 'translateY(-200px)'
  }
  closeButton.classList.add('close')
  modalContent.prepend(closeButton)

  // Set up container in modal content
  const container = document.createElement('div')
  container.setAttribute('id', 'jobdoge-modal-container')
  modalContent.prepend(container)

  // Add modal content to modal
  modal.prepend(modalContent)

  // When the user clicks anywhere outside of the modal, close it
  window.onclick = function(event) {
    if (event.target === modal) {
      modal.classList.add('jobdoge-modal-closed')
      modal.classList.remove('jobdoge-modal-open')
      modalContent.style.transform = 'translateY(-200px)'
    }
  }

  return modal
}

const buildRow = (url, post) => {
  const { company, date, host, jobTitle} = post

  // Create row div
  let row = document.createElement('div')
  row.classList.add('jobdoge-row')

  // Create date column
  let dateCol = document.createElement('p')
  let dateStr = new Date(post.date).toString().slice(4, 15)
  dateCol.innerHTML = dateStr

  // Create job name column
  let jobCol = document.createElement('a')
  jobCol.target = '_blank'
  jobCol.innerHTML = jobTitle
  jobCol.href = url

  // Create company name column
  let compCol = document.createElement('p')
  compCol.innerHTML = company

  // Create unhide button
  let unhideButton = document.createElement('button')
  unhideButton.innerHTML = 'Unhide'
  unhideButton.onclick = function() {
    chrome.storage.sync.remove([url], function() {
      console.log('removed url ', url)
      var error = chrome.runtime.lastError
      if (error) console.error(error)
      else row.remove()
    })
  }

  // Add elements to row div
  row.append(dateCol)
  row.append(compCol)
  row.append(jobCol)
  row.append(unhideButton)

  return row
}

window.addEventListener('load', function load() {
  window.removeEventListener('load', load, false)
  updatePosts()

  const { host } = window.location
  if (supportedSites[host]) {
    const content = document.querySelector('#content-area')
    content.addEventListener('DOMSubtreeModified', function() {
      updatePosts()
    })
  }

  // Build modal and attach to DOM
  const modal = buildModal()
  const modalContent = modal.querySelector('.jobdoge-modal-content')
  document.querySelector('body').prepend(modal)

  // Add listener to listen for messages from popup
  chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    const { text } = msg
    if (text === 'open_modal') {
      modal.classList.add('jobdoge-modal-open')
      modal.classList.remove('jobdoge-modal-closed')
      modalContent.style.transform = 'translateY(0px)'

      chrome.storage.sync.get(null, listHistory => {
        const modalContainer = document.querySelector('#jobdoge-modal-container')
        // Clear children
        while (modalContainer.firstChild) {
          modalContainer.removeChild(modalContainer.firstChild);
        }

        let jobPostArr = []
        for (let key in listHistory) {
          jobPostArr.push({key, data: listHistory[key]})
        }
        jobPostArr
          .sort((a, b) => a.data.date > b.data.date)
          .forEach(jobObj => {
            let { key, data } = jobObj
            modalContainer.prepend(buildRow(key, data))
          })
        console.log('jobPostArr', jobPostArr)
      })
    }
  })
})

