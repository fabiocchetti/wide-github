document.addEventListener('DOMContentLoaded', function() {
  const toggle = document.getElementById('wide-toggle');
  const domainList = document.getElementById('domain-list');
  const domainInput = document.getElementById('domain-input');
  const addDomainBtn = document.getElementById('add-domain-btn');
  const domainError = document.getElementById('domain-error');
  const toggleLabel = document.querySelector('.toggle-label');
  
  // Initialize toggle state
  chrome.storage.sync.get('wideEnabled', function(result) {
    toggle.checked = result.wideEnabled !== false;
    updateToggleLabel();
  });
  
  // Initialize domain list
  chrome.storage.sync.get('githubDomains', function(result) {
    renderDomainList(result.githubDomains || []);
  });
  
  // Toggle event listener
  toggle.addEventListener('change', function() {
    const enabled = toggle.checked;
    chrome.storage.sync.set({ wideEnabled: enabled });
    updateToggleLabel();
    
    // Send message to content script
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { wideEnabled: enabled });
      }
    });
  });
  
  // Add domain event listeners
  domainInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      addDomain();
    }
  });
  
  domainInput.addEventListener('input', validateDomain);
  addDomainBtn.addEventListener('click', addDomain);
  
  function validateDomain() {
    const domain = domainInput.value.trim();
    const isValid = isValidDomain(domain);
    
    domainInput.classList.toggle('error', !isValid && domain.length > 0);
    addDomainBtn.disabled = !isValid;
    domainError.style.display = isValid || domain.length === 0 ? 'none' : 'block';
    domainError.textContent = 'Please enter a valid domain name';
  }
  
  function isValidDomain(domain) {
    if (!domain) return false;
    
    // Try to parse as URL first
    try {
      const url = new URL(domain);
      domain = url.hostname;
    } catch (e) {
      // If it's not a valid URL, assume it's just a domain name
      domain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    }
    
    // Domain validation regex
    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
    return domainRegex.test(domain);
  }
  
  function addDomain() {
    const domain = domainInput.value.trim();
    if (!isValidDomain(domain)) return;
    
    // Clean up domain input (remove protocol and path)
    let cleanDomain = domain;
    try {
      const url = new URL(domain);
      cleanDomain = url.hostname;
    } catch (e) {
      cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    }
    
    // Remove www. if present to normalize domains
    cleanDomain = cleanDomain.replace(/^www\./, '');
    
    chrome.storage.sync.get('githubDomains', function(result) {
      const domains = result.githubDomains || [];
      
      // Check if domain or its www version already exists
      const domainExists = domains.some(d => {
        const normalizedD = d.replace(/^www\./, '');
        return normalizedD === cleanDomain;
      });
      
      if (!domainExists) {
        domains.push(cleanDomain);
        chrome.storage.sync.set({ githubDomains: domains }, function() {
          renderDomainList(domains);
          domainInput.value = '';
          validateDomain();
          
          // Send message to content script
          chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            if (tabs[0]) {
              chrome.storage.sync.get('wideEnabled', function(result) {
                chrome.tabs.sendMessage(tabs[0].id, { wideEnabled: result.wideEnabled !== false });
              });
            }
          });
        });
      }
    });
  }
  
  function renderDomainList(domains) {
    domainList.innerHTML = '';
    domains.forEach(function(domain) {
      const li = document.createElement('li');
      li.className = 'domain-item';
      
      const domainText = document.createElement('span');
      domainText.textContent = domain;
      
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-btn';
      deleteBtn.textContent = '×';
      deleteBtn.addEventListener('click', function() {
        const newDomains = domains.filter(d => d !== domain);
        chrome.storage.sync.set({ githubDomains: newDomains }, function() {
          renderDomainList(newDomains);
          
          // Send message to content script
          chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            if (tabs[0]) {
              chrome.storage.sync.get('wideEnabled', function(result) {
                chrome.tabs.sendMessage(tabs[0].id, { wideEnabled: result.wideEnabled !== false });
              });
            }
          });
        });
      });
      
      li.appendChild(domainText);
      li.appendChild(deleteBtn);
      domainList.appendChild(li);
    });
  }
  
  function updateToggleLabel() {
    toggleLabel.textContent = toggle.checked ? 'Wide Layout' : 'Normal Layout';
  }
  
  // Initial validation
  validateDomain();
});
