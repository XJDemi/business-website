(function(window) {
  var GT_TRACKING = {
    visitorId: null,
    sessionId: null,
    firstVisitTime: null,
    currentPageStartTime: null,
    pagesVisited: [],
    productsViewed: [],

    init: function() {
      this.visitorId = this.getOrCreateVisitorId();
      this.sessionId = this.getOrCreateSessionId();
      this.firstVisitTime = localStorage.getItem('gt_first_visit') || new Date().toISOString();
      if (!localStorage.getItem('gt_first_visit')) {
        localStorage.setItem('gt_first_visit', this.firstVisitTime);
      }
      
      this.currentPageStartTime = Date.now();
      
      this.trackVisit();
      
      this.setupPageLeaveTracking();
      this.setupProductTracking();
    },

    getOrCreateVisitorId: function() {
      var visitorId = localStorage.getItem('gt_visitor_id');
      if (!visitorId) {
        visitorId = 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 15);
        localStorage.setItem('gt_visitor_id', visitorId);
      }
      return visitorId;
    },

    getOrCreateSessionId: function() {
      var sessionId = localStorage.getItem('gt_session_id');
      var sessionExpire = localStorage.getItem('gt_session_expire');
      var now = Date.now();
      
      if (!sessionId || (sessionExpire && now > parseInt(sessionExpire))) {
        sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        sessionExpire = now + 30 * 60 * 1000;
        localStorage.setItem('gt_session_id', sessionId);
        localStorage.setItem('gt_session_expire', sessionExpire);
      }
      
      return sessionId;
    },

    getVisitorId: function() {
      return this.visitorId;
    },

    getSessionId: function() {
      return this.sessionId;
    },

    getSearchKeyword: function() {
      var params = new URLSearchParams(window.location.search);
      var keywords = ['q', 'query', 'search', 'keyword', 'keywords', 's'];
      for (var i = 0; i < keywords.length; i++) {
        var val = params.get(keywords[i]);
        if (val) return decodeURIComponent(val);
      }
      return null;
    },

    getTrafficSource: function() {
      var referrer = document.referrer;
      if (!referrer) return 'direct';
      
      if (referrer.includes('google')) return 'google';
      if (referrer.includes('bing')) return 'bing';
      if (referrer.includes('baidu')) return 'baidu';
      if (referrer.includes('yahoo')) return 'yahoo';
      if (referrer.includes('yandex')) return 'yandex';
      if (referrer.includes('facebook') || referrer.includes('fb')) return 'facebook';
      if (referrer.includes('linkedin')) return 'linkedin';
      if (referrer.includes('twitter') || referrer.includes('x.com')) return 'twitter';
      if (referrer.includes('instagram')) return 'instagram';
      if (referrer.includes('youtube')) return 'youtube';
      if (referrer.includes('alibaba') || referrer.includes('aliexpress')) return 'alibaba';
      if (referrer.includes('made-in-china')) return 'made-in-china';
      if (referrer.includes('globalsources')) return 'globalsources';
      if (referrer.includes('tradekey')) return 'tradekey';
      
      var hostname = new URL(referrer).hostname;
      if (hostname === window.location.hostname) return 'internal';
      
      return 'other';
    },

    getDeviceType: function() {
      var ua = navigator.userAgent;
      if (/Mobile|Android|iOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
        return 'mobile';
      } else if (/Tablet|iPad/i.test(ua)) {
        return 'tablet';
      }
      return 'desktop';
    },

    trackVisit: function() {
      try {
        var isNewVisitor = !localStorage.getItem('gt_returning');
        localStorage.setItem('gt_returning', 'true');
        
        var searchKeyword = this.getSearchKeyword();
        var trafficSource = this.getTrafficSource();
        var deviceType = this.getDeviceType();
        
        var pageInfo = {
          visitor_id: this.visitorId,
          session_id: this.sessionId,
          page_url: window.location.href,
          page_title: document.title,
          referrer: document.referrer,
          is_new: isNewVisitor,
          search_keyword: searchKeyword,
          traffic_source: trafficSource,
          device_type: deviceType
        };
        
        this.pagesVisited.push(pageInfo);
        
        fetch('/api/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pageInfo)
        }).catch(function() {});
        
      } catch (error) {
        console.log('Tracking failed');
      }
    },

    trackProductView: function(productId, productName) {
      try {
        this.productsViewed.push({
          product_id: productId,
          product_name: productName,
          time: new Date().toISOString()
        });
        
        fetch('/api/track-product', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            visitor_id: this.visitorId,
            session_id: this.sessionId,
            product_id: productId,
            product_name: productName,
            page_url: window.location.href
          })
        }).catch(function() {});
        
      } catch (error) {
        console.log('Product tracking failed');
      }
    },

    setupPageLeaveTracking: function() {
      var self = this;
      window.addEventListener('beforeunload', function() {
        var duration = Math.floor((Date.now() - self.currentPageStartTime) / 1000);
        if (duration > 0) {
          fetch('/api/track-duration', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              visitor_id: self.visitorId,
              session_id: self.sessionId,
              page_url: window.location.href,
              duration: duration
            })
          }).catch(function() {});
        }
      });
    },

    setupProductTracking: function() {
      var self = this;
      document.addEventListener('click', function(e) {
        var productCard = e.target.closest('.product-card, [data-product-id]');
        if (productCard) {
          var productId = productCard.getAttribute('data-product-id') || productCard.dataset.productId;
          var productName = productCard.querySelector('h3')?.textContent || productCard.querySelector('[data-product-name]')?.textContent;
          if (productId) {
            self.trackProductView(productId, productName);
          }
        }
      });
    },

    getTrackingData: function() {
      return {
        visitor_id: this.visitorId,
        session_id: this.sessionId,
        pages_visited: this.pagesVisited,
        products_viewed: this.productsViewed,
        first_visit: this.firstVisitTime,
        current_page: window.location.href
      };
    }
  };

  window.GT_TRACKING = GT_TRACKING;
  
  document.addEventListener('DOMContentLoaded', function() {
    GT_TRACKING.init();
  });
})(window);