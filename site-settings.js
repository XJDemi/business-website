document.addEventListener('DOMContentLoaded', async function() {
  try {
    const response = await fetch('/api/site-settings');
    const result = await response.json();
    
    if (result.success && result.data) {
      const settings = result.data;
      window.siteSettings = settings;
      
      const industry = detectIndustry();
      window.currentIndustry = industry;
      
      const elements = document.querySelectorAll('[data-site-key]');
      elements.forEach(function(el) {
        const key = el.getAttribute('data-site-key');
        const value = getContactValue(settings, industry, key);
        
        if (value && value.trim()) {
          if (el.tagName === 'A') {
            const href = el.getAttribute('href');
            if (href && href.includes('mailto:')) {
              el.href = 'mailto:' + value;
              el.textContent = value;
            } else if (href && href.includes('tel:')) {
              el.href = 'tel:' + value;
              el.textContent = value;
            } else if (href && href.includes('whatsapp')) {
              const match = href.match(/text=(.+)$/);
              const text = match ? match[1] : '';
              el.href = 'https://api.whatsapp.com/send?phone=' + encodeURIComponent(value) + (text ? '&text=' + text : '');
              el.textContent = value;
            } else {
              el.href = value;
              el.textContent = value;
            }
            el.style.display = '';
          } else {
            el.textContent = value;
            el.style.display = '';
          }
        }
      });
      
      const socialIcons = document.querySelectorAll('[data-social-icon]');
      socialIcons.forEach(function(icon) {
        const platform = icon.getAttribute('data-social-icon');
        const urlKey = platform + '_link';
        const value = settings[urlKey];

        if (value && value.trim()) {
          icon.href = value;
          icon.style.display = '';
        } else {
          icon.style.display = 'none';
        }
      });

      // 更新 YouTube 视频嵌入 iframe
      const videoIframes = document.querySelectorAll('[data-video-iframe]');
      videoIframes.forEach(function(iframe) {
        var videoUrl = settings['video_url'];
        if (videoUrl && videoUrl.trim()) {
          // 支持 YouTube watch URL 和 embed URL 两种格式
          var embedUrl = videoUrl;
          var watchMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
          if (watchMatch) {
            embedUrl = 'https://www.youtube.com/embed/' + watchMatch[1];
          }
          if (iframe.src !== embedUrl) {
            iframe.src = embedUrl;
          }
          iframe.style.display = '';
          var wrapper = iframe.closest('[data-video-wrapper]');
          if (wrapper) wrapper.style.display = '';
        } else {
          iframe.style.display = 'none';
          var wrapper = iframe.closest('[data-video-wrapper]');
          if (wrapper) wrapper.style.display = 'none';
        }
      });
      
      const whatsappBars = document.querySelectorAll('[data-whatsapp-bar]');
      whatsappBars.forEach(function(bar) {
        const phone = getContactValue(settings, industry, 'whatsapp_link');
        if (phone && phone.trim()) {
          const href = bar.getAttribute('href');
          const match = href ? href.match(/text=(.+)$/) : null;
          const text = match ? match[1] : '';
          bar.href = 'https://api.whatsapp.com/send?phone=' + encodeURIComponent(phone) + (text ? '&text=' + text : '');
          bar.style.display = '';
        } else {
          bar.style.display = 'none';
        }
      });
      
      const emailBars = document.querySelectorAll('[data-email-bar]');
      emailBars.forEach(function(bar) {
        const email = getContactValue(settings, industry, 'company_email');
        if (email && email.trim()) {
          bar.href = 'mailto:' + email;
          bar.style.display = '';
        } else {
          bar.style.display = 'none';
        }
      });
      
      updateSEOMetaTags(settings);
      addHreflangTags();
      addGoogleVerification(settings);
      updateSocialShareButtons(settings);
      createWhatsAppFloatButton(settings);
      populateIndustryContacts(settings);
    }
  } catch (error) {
    console.log('Failed to load site settings:', error);
  }
});

function detectIndustry() {
  const bodyIndustry = document.body ? document.body.getAttribute('data-industry') : null;
  if (bodyIndustry) return bodyIndustry;
  
  const path = window.location.pathname;
  if (path.includes('/biotech')) return 'biotech';
  if (path.includes('/autoparts')) return 'autoparts';
  if (path.includes('/instruments')) return 'instruments';
  
  return null;
}

function getContactValue(settings, industry, key) {
  const fieldMap = {
    'whatsapp_link': 'whatsapp',
    'wechat_link': 'wechat',
    'company_email': 'email',
    'contact_phone': 'phone',
    'contact_name': 'contact_name'
  };

  if (industry && fieldMap[key]) {
    const industryKey = industry + '_' + fieldMap[key];
    const industryValue = settings[industryKey];
    if (industryValue && industryValue.trim()) {
      return industryValue;
    }
  }


  return settings[key];
}

function updateSEOMetaTags(settings) {
  const currentLang = document.documentElement.lang || 'en';
  
  if (settings.homepage_seo_title && settings.homepage_seo_title[currentLang]) {
    const titleTag = document.querySelector('title');
    if (titleTag) {
      titleTag.textContent = settings.homepage_seo_title[currentLang];
    }
  }
  
  if (settings.homepage_seo_description && settings.homepage_seo_description[currentLang]) {
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', settings.homepage_seo_description[currentLang]);
  }
  
  if (settings.homepage_seo_keywords && settings.homepage_seo_keywords[currentLang]) {
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.setAttribute('name', 'keywords');
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.setAttribute('content', settings.homepage_seo_keywords[currentLang]);
  }
}

function addHreflangTags() {
  const canonicalUrl = window.location.href;
  const baseUrl = canonicalUrl.replace(/\?.*/, '');
  
  const hreflangs = [
    { lang: 'en', url: baseUrl + '?lang=en' },
    { lang: 'zh', url: baseUrl + '?lang=zh' },
    { lang: 'ru', url: baseUrl + '?lang=ru' },
    { lang: 'es', url: baseUrl + '?lang=es' }
  ];
  
  hreflangs.forEach(function(item) {
    const link = document.createElement('link');
    link.setAttribute('rel', 'alternate');
    link.setAttribute('hreflang', item.lang);
    link.setAttribute('href', item.url);
    document.head.appendChild(link);
  });
  
  const xDefault = document.createElement('link');
  xDefault.setAttribute('rel', 'alternate');
  xDefault.setAttribute('hreflang', 'x-default');
  xDefault.setAttribute('href', hreflangs[0].url);
  document.head.appendChild(xDefault);
}

function addGoogleVerification(settings) {
  if (settings.google_verification_code) {
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'google-site-verification');
    meta.setAttribute('content', settings.google_verification_code.replace('google-site-verification=', ''));
    document.head.appendChild(meta);
  }
}

function updateSocialShareButtons(settings) {
  const socialShareContainers = document.querySelectorAll('[data-social-share]');
  
  if (settings.social_share_enabled === false) {
    socialShareContainers.forEach(function(container) {
      container.style.display = 'none';
    });
    return;
  }
  
  socialShareContainers.forEach(function(container) {
    container.style.display = '';
    
    const shareButtons = container.querySelectorAll('[data-share-platform]');
    shareButtons.forEach(function(btn) {
      const platform = btn.getAttribute('data-share-platform');
      const urlKey = platform + '_link';
      
      if (settings[urlKey] && settings[urlKey].trim()) {
        btn.style.display = '';
      } else {
        btn.style.display = 'none';
      }
    });
  });
}

function getShareUrl(platform, title, url) {
  const encodedTitle = encodeURIComponent(title);
  const encodedUrl = encodeURIComponent(url);
  
  switch(platform) {
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    case 'instagram':
      return `https://www.instagram.com/?url=${encodedUrl}`;
    case 'linkedin':
      return `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`;
    case 'youtube':
      return `https://www.youtube.com/watch?v=${encodedUrl}`;
    default:
      return url;
  }
}

function createWhatsAppFloatButton(settings) {
  if (settings.whatsapp_float_enabled === false) return;
  
  const industry = window.currentIndustry || detectIndustry();
  const phone = getContactValue(settings, industry, 'whatsapp_link');
  if (!phone || !phone.trim()) return;
  
  let existingBtn = document.getElementById('whatsapp-float-btn');
  if (existingBtn) {
    existingBtn.remove();
  }
  
  const floatBtn = document.createElement('a');
  floatBtn.id = 'whatsapp-float-btn';
  floatBtn.href = 'https://api.whatsapp.com/send?phone=' + encodeURIComponent(phone);
  floatBtn.target = '_blank';
  floatBtn.style.cssText = `
    position: fixed;
    bottom: 30px;
    right: 30px;
    width: 60px;
    height: 60px;
    background-color: #25D366;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    box-shadow: 0 4px 15px rgba(37, 211, 102, 0.4);
    z-index: 1000;
    cursor: pointer;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    text-decoration: none;
    color: white;
  `;
  floatBtn.innerHTML = '💬';
  
  floatBtn.onmouseover = function() {
    floatBtn.style.transform = 'scale(1.1)';
    floatBtn.style.boxShadow = '0 6px 20px rgba(37, 211, 102, 0.6)';
  };
  
  floatBtn.onmouseout = function() {
    floatBtn.style.transform = 'scale(1)';
    floatBtn.style.boxShadow = '0 4px 15px rgba(37, 211, 102, 0.4)';
  };
  
  document.body.appendChild(floatBtn);
  
  window.whatsappFloatButton = floatBtn;
  
  if (window.updateWhatsAppFloatMessage) {
    window.updateWhatsAppFloatMessage();
  }
}

function populateIndustryContacts(settings) {
  var containers = document.querySelectorAll('[data-industry-contact]');
  if (!containers.length) return;

  var industries = ['biotech', 'autoparts', 'instruments'];
  var fields = ['contact_name', 'whatsapp', 'wechat', 'email', 'phone'];

  var fallbackMap = {
    'contact_name': 'contact_name',
    'email': 'company_email',
    'phone': 'contact_phone',
    'whatsapp': 'whatsapp_link',
    'wechat': 'wechat_link'
  };

  industries.forEach(function(ind) {
    fields.forEach(function(f) {
      var key = ind + '.' + f;
      var dbKey = ind + '_' + f;
      var value = settings[dbKey] || '';
      if (!value || !value.trim()) {
        var fallbackKey = fallbackMap[f] || f;
        value = settings[fallbackKey] || '';
      }
      containers.forEach(function(el) {
        if (el.getAttribute('data-industry-contact') === key) {
          if (value && value.trim()) {
            el.textContent = value;
          }
        }
      });
    });
  });
}

function updateWhatsAppFloatMessage(productName) {
  const floatBtn = document.getElementById('whatsapp-float-btn');
  if (!floatBtn) return;
  
  const settings = window.siteSettings || {};
  const industry = window.currentIndustry || detectIndustry();
  const phone = getContactValue(settings, industry, 'whatsapp_link');
  if (!phone) return;
  
  let text = '';
  if (productName) {
    text = '&text=' + encodeURIComponent('Hi, I am interested in ' + productName + '. ' + window.location.href);
  }
  
  floatBtn.href = 'https://api.whatsapp.com/send?phone=' + encodeURIComponent(phone) + text;
}
