/* global chrome */

const supportedSites = {
  'www.builtinchicago.org': [/job\/.[^\s\\]*/g],
  'www.builtinnyc.com': [],
  'www.builtinla.com': [],
  'www.builtincolorado.com': [],
}

function getCurrentTabUrl(callback) {
  var queryInfo = {
    active: true,
    currentWindow: true
  };

  chrome.tabs.query(queryInfo, (tabs) => {

    var tab = tabs[0];
    var url = tab.url;
    console.assert(typeof url == 'string', 'tab.url should be a string');
    callback(url, tab);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  getCurrentTabUrl((url, tab) => {
    const rootUrl = url.split('/')[2]
    let supportInfo = document.getElementById('support-info');
    let requestSupport = document.getElementById('request-support');
    let hidePost = document.querySelector('#hide-post')
    let unhidePost = document.querySelector('#unhide-post')
    let postStatusDescriptor = document.querySelector('#post-status-descriptor')
    let hideButtonContainer = document.querySelector('#hide-button-container')

    if (supportedSites[rootUrl]) {
      supportInfo.innerHTML = `${rootUrl} is supported by JobDoge!`
      supportInfo.style.color = '#099409'
      requestSupport.style.display = 'none'

      let pathName = url.split('/').slice(3).join('/')
      if (supportedSites[rootUrl].map(regex => regex.test(pathName)).includes(true)) {
        chrome.tabs.sendMessage(tab.id, {
          text: 'hide_status',
          href: url,
        }, function(hideStatus) {
          if (hideStatus) {
            unhidePost.style.display = 'block'
            hidePost.style.display = 'none'
            postStatusDescriptor.innerHTML = 'You are currently hiding this job post.'
            postStatusDescriptor.style.color = 'rgb(224, 13, 15)'
          } else {
            hidePost.style.display = 'block'
            unhidePost.style.display = 'none'
            postStatusDescriptor.innerHTML = 'This job post is currently unhidden.'
            postStatusDescriptor.style.color = '#099409'
          }
        })
      } else {
        hidePost.style.display = 'none'
        unhidePost.style.display = 'none'
        postStatusDescriptor.style.display = 'none'
      }


    } else if (rootUrl && rootUrl !== 'newtab') {
      supportInfo.innerHTML = `${rootUrl} is not supported by JobDoge yet.`
      supportInfo.style.color = 'rgb(224, 13, 15)'
      requestSupport.style.display = 'block'
      requestSupport.innerHTML = `Request support for ${rootUrl}`
      requestSupport.href = `mailto:jobdoge@gmail.com?subject=JobDoge%20Support%20Request&body=Please%20add%20support%20for%20${rootUrl}`

      postStatusDescriptor.style.display = 'none'
      hideButtonContainer.style.display = 'none'
    }

    chrome.storage.sync.get(null, (items) => {
      console.log('items from storage', items)
      console.log('keys from storage', Object.keys(items))
      const hiddenCount = document.querySelector('#hidden-info')
      hiddenCount.innerHTML = `Hidden posts: ${Object.keys(items).length}`
    });


    let viewHidden = document.querySelector('#view-hidden')
    viewHidden.onclick = function() {
      chrome.tabs.sendMessage(tab.id, {
        text: 'open_modal',
      }, () => {
        window.close()
      })
    }
  });
})
