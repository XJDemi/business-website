var GT_I18N = (function() {
  var translations = {};
  var currentLang = 'en';
  var defaultLang = 'en';
  var ready = false;
  var callbacks = [];
  var apiTranslationCache = {};

  function getStoredLang() {
    try {
      return localStorage.getItem('gt_lang');
    } catch (e) {
      return null;
    }
  }

  function setStoredLang(lang) {
    try {
      localStorage.setItem('gt_lang', lang);
    } catch (e) {}
  }

  function loadTranslations(callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/i18n/translations.json?_=' + Date.now(), true);
    xhr.onload = function() {
      if (xhr.status === 200) {
        try {
          translations = JSON.parse(xhr.responseText);
          var stored = getStoredLang();
          if (stored && translations[stored]) {
            currentLang = stored;
          }
          ready = true;
          notifyCallbacks();
          if (callback) callback();
        } catch (e) {
          console.error('Failed to parse translations:', e);
          if (callback) callback();
        }
      } else {
        console.error('Failed to load translations:', xhr.status);
        if (callback) callback();
      }
    };
    xhr.onerror = function() {
      console.error('Failed to load translations');
      if (callback) callback();
    };
    xhr.send();
  }

  function addCallback(callback) {
    callbacks.push(callback);
    if (ready) {
      callback(currentLang);
    }
  }

  function notifyCallbacks() {
    for (var i = 0; i < callbacks.length; i++) {
      callbacks[i](currentLang);
    }
  }

  function t(key, fallback) {
    if (!ready) return fallback || key;
    
    var cacheKey = currentLang + '::' + key;
    if (apiTranslationCache[cacheKey]) {
      return apiTranslationCache[cacheKey];
    }
    
    var keys = key.split('.');
    var value = translations[currentLang];
    
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        value = undefined;
        break;
      }
    }
    
    if (value !== undefined) {
      fetchApiTranslation(key, value);
      return value;
    }
    
    if (currentLang !== defaultLang) {
      var defaultValue = translations[defaultLang];
      for (var j = 0; j < keys.length; j++) {
        var dk = keys[j];
        if (defaultValue && typeof defaultValue === 'object' && dk in defaultValue) {
          defaultValue = defaultValue[dk];
        } else {
          defaultValue = undefined;
          break;
        }
      }
      if (defaultValue !== undefined) {
        fetchApiTranslation(key, defaultValue);
        return defaultValue;
      }
    }
    
    fetchApiTranslation(key, fallback || key);
    return fallback || key;
  }

  function fetchApiTranslation(key, sourceText) {
    if (currentLang === defaultLang) return;
    
    var cacheKey = currentLang + '::' + key;
    if (apiTranslationCache[cacheKey]) return;
    
    apiTranslationCache[cacheKey] = null;
    
    var url = '/api/translate?key=' + encodeURIComponent(key) + '&text=' + encodeURIComponent(sourceText) + '&lang=' + encodeURIComponent(currentLang) + '&_=' + Date.now();
    
    fetch(url)
      .then(function(response) {
        return response.json();
      })
      .then(function(data) {
        if (data.success && data.translation) {
          apiTranslationCache[cacheKey] = data.translation;
          replaceText();
        }
      })
      .catch(function(error) {
        console.error('Failed to fetch translation:', error);
        delete apiTranslationCache[cacheKey];
      });
  }

  function setLang(lang) {
    if (translations[lang]) {
      currentLang = lang;
      setStoredLang(lang);
      apiTranslationCache = {};
      replaceText();
      notifyCallbacks();
      return true;
    }
    return false;
  }

  function getLang() {
    return currentLang;
  }

  function getAvailableLangs() {
    return Object.keys(translations);
  }

  function getLangName(lang) {
    var keys = ('language.' + lang).split('.');
    var value = translations[defaultLang];
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        value = undefined;
        break;
      }
    }
    return value !== undefined ? value : lang.toUpperCase();
  }

  function replaceText() {
    var elements = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      var key = el.getAttribute('data-i18n');
      var html = '';
      if (key.indexOf('lang.') === 0) {
        var langKey = key.replace('lang.', 'language.');
        var langKeys = langKey.split('.');
        var langValue = translations[defaultLang];
        for (var j = 0; j < langKeys.length; j++) {
          var lk = langKeys[j];
          if (langValue && typeof langValue === 'object' && lk in langValue) {
            langValue = langValue[lk];
          } else {
            langValue = undefined;
            break;
          }
        }
        html = langValue !== undefined ? langValue : '';
      } else {
        html = t(key, '');
      }
      if (html) {
        el.innerHTML = html;
      }
    }

    var placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
    for (var j = 0; j < placeholderElements.length; j++) {
      var phEl = placeholderElements[j];
      var phKey = phEl.getAttribute('data-i18n-placeholder');
      var phValue = t(phKey, '');
      if (phValue) {
        phEl.placeholder = phValue;
      }
    }

    var titleElements = document.querySelectorAll('[data-i18n-title]');
    for (var k = 0; k < titleElements.length; k++) {
      var titleEl = titleElements[k];
      var titleKey = titleEl.getAttribute('data-i18n-title');
      var titleValue = t(titleKey, '');
      if (titleValue) {
        titleEl.title = titleValue;
      }
    }

    var altElements = document.querySelectorAll('[data-i18n-alt]');
    for (var m = 0; m < altElements.length; m++) {
      var altEl = altElements[m];
      var altKey = altEl.getAttribute('data-i18n-alt');
      var altValue = t(altKey, '');
      if (altValue) {
        altEl.alt = altValue;
      }
    }
  }

  function init(callback) {
    addCallback(replaceText);
    loadTranslations(callback);
  }

  return {
    init: init,
    t: t,
    setLang: setLang,
    getLang: getLang,
    getAvailableLangs: getAvailableLangs,
    getLangName: getLangName,
    addCallback: addCallback,
    replaceText: replaceText
  };
})();