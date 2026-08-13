document.addEventListener('DOMContentLoaded', function() {
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');

  mobileMenuBtn.addEventListener('click', function() {
    navLinks.classList.toggle('active');
  });

  const navLinkItems = document.querySelectorAll('.nav-links a');
  navLinkItems.forEach(function(link) {
    link.addEventListener('click', function() {
      navLinks.classList.remove('active');
    });
  });

  const filterButtons = document.querySelectorAll('.filter-btn');
  const productCards = document.querySelectorAll('.product-card');

  filterButtons.forEach(function(btn) {
    btn.addEventListener('click', function() {
      filterButtons.forEach(function(b) {
        b.classList.remove('active');
      });
      this.classList.add('active');

      const category = this.getAttribute('data-category');

      productCards.forEach(function(card) {
        if (category === 'all' || card.getAttribute('data-category') === category) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      alert('Thank you for your inquiry! Our professional team will contact you within 24 hours.');
      this.reset();
    });
  }

  const productLinks = document.querySelectorAll('.product-link');
  productLinks.forEach(function(link) {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const productId = this.getAttribute('data-id');
      showProductDetail(productId);
    });
  });

  const categoryCards = document.querySelectorAll('.category-card');
  categoryCards.forEach(function(card) {
    card.addEventListener('click', function() {
      const category = this.getAttribute('data-category');
      window.location.href = `products.html?category=${category}`;
    });
  });
});

function showProductDetail(productId) {
  const products = {
    'cell-thawer': {
      name: 'Cell Thawing Machine',
      description: 'Professional cell thawing equipment designed for rapid and uniform thawing of frozen cells.',
      specifications: 'Temperature range: -80°C to 37°C\nThawing time: 1-3 minutes\nCapacity: 1-6 cryovials\nPower: 200W\nDimensions: 350 x 250 x 200mm',
      features: ['Rapid thawing technology', 'Uniform temperature distribution', 'User-friendly touch screen', 'Safety alarm system', 'CE certified'],
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20cell%20thawing%20machine%20laboratory%20equipment%20white%20background&image_size=landscape_16_9'
    },
    'cooling-box': {
      name: 'Programmable Cooling Box',
      description: 'High-precision programmable cooling box for controlled rate freezing of biological samples.',
      specifications: 'Temperature range: 4°C to -196°C\nCooling rate: 0.1-10°C/min\nCapacity: 12 cryovials\nPower: 150W\nDimensions: 400 x 300 x 250mm',
      features: ['Precise temperature control', 'Programmable cooling curves', 'LCD display', 'Over-temperature protection', 'ISO certified'],
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=programmable%20cooling%20box%20laboratory%20equipment%20for%20cell%20freezing%20white%20background&image_size=landscape_16_9'
    },
    'chain': {
      name: 'Automotive Roller Chain',
      description: 'High-quality roller chain for automotive transmission systems, durable and reliable.',
      specifications: 'Material: Alloy steel\nPitch: 1/2" - 1"\nTensile strength: 8000-20000N\nStandard: ISO 606 / ANSI B29.1\nSurface treatment: Zinc plated',
      features: ['High tensile strength', 'Corrosion resistant', 'Smooth operation', 'Long service life', 'OEM available'],
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=automotive%20roller%20chain%20metal%20industrial%20parts%20white%20background&image_size=landscape_16_9'
    },
    'brake-disc': {
      name: 'Brake Disc Rotor',
      description: 'Premium brake disc rotor for automotive braking systems, ensuring safe and reliable stopping power.',
      specifications: 'Material: Cast iron / Carbon ceramic\nDiameter: 240-420mm\nThickness: 12-32mm\nStandard: ECE R90 / ISO',
      features: ['Excellent heat dissipation', 'Low noise operation', 'Anti-corrosion coating', 'Precision machining', 'OEM/ODM service'],
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=automotive%20brake%20disc%20rotor%20metal%20parts%20white%20background&image_size=landscape_16_9'
    },
    'coating-thickness': {
      name: 'Coating Thickness Gauge',
      description: 'Professional coating thickness measurement instrument with high accuracy.',
      specifications: 'Measurement range: 0-1250μm\nAccuracy: ±2% or ±3μm\nResolution: 1μm\nDisplay: LCD\nPower: 9V battery',
      features: ['Non-destructive testing', 'High accuracy measurement', 'Simple operation', 'Data storage function', 'CE certified'],
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=coating%20thickness%20gauge%20industrial%20instrument%20handheld%20white%20background&image_size=landscape_16_9'
    },
    'ultrasonic-gauge': {
      name: 'Ultrasonic Thickness Gauge',
      description: 'Advanced ultrasonic thickness measurement tool for industrial applications.',
      specifications: 'Measurement range: 0.75-500mm\nAccuracy: ±0.05mm\nResolution: 0.01mm\nDisplay: LCD with backlight\nPower: Rechargeable battery',
      features: ['Wide measurement range', 'High precision', 'Digital display', 'Auto calibration', 'Portable design'],
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ultrasonic%20thickness%20gauge%20industrial%20testing%20instrument%20white%20background&image_size=landscape_16_9'
    },
    'ice-free-workstation': {
      name: 'Ice-Free Workstation',
      description: 'Specialized laboratory workstation for cell culture without ice contamination.',
      specifications: 'Temperature: 4°C\nWorking area: 600 x 400mm\nPower: 300W\nDimensions: 800 x 500 x 600mm',
      features: ['Precise temperature control', 'No ice contamination', 'UV sterilization', 'Ergonomic design', 'Quiet operation'],
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ice%20free%20laboratory%20workstation%20cell%20culture%20equipment%20white%20background&image_size=landscape_16_9'
    },
    'transport-box': {
      name: 'Cryogenic Transport Box',
      description: 'Insulated transport box for safe transportation of biological samples at ultra-low temperatures.',
      specifications: 'Temperature retention: -80°C for 72h\nCapacity: 2-10L\nMaterial: PU insulation\nDimensions: Customizable',
      features: ['Excellent insulation', 'Durable construction', 'Temperature monitoring', 'Lightweight design', 'Custom sizes available'],
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cryogenic%20transport%20box%20insulated%20container%20laboratory%20equipment%20white%20background&image_size=landscape_16_9'
    },
    'ice-tray': {
      name: 'Laboratory Ice Tray',
      description: 'High-quality ice tray for laboratory sample cooling applications.',
      specifications: 'Material: PP/PC\nNumber of wells: 6-96\nTemperature resistance: -80°C to 121°C\nAutoclavable: Yes',
      features: ['Food grade material', 'Autoclavable', 'Stackable design', 'Chemical resistant', 'Various sizes'],
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=laboratory%20ice%20tray%20sample%20cooling%20white%20background&image_size=landscape_16_9'
    },
    'conductivity-meter': {
      name: 'Conductivity Meter',
      description: 'Precision conductivity measurement instrument for industrial and laboratory use.',
      specifications: 'Range: 0-200mS/cm\nAccuracy: ±1% FS\nResolution: 0.01mS/cm\nDisplay: LCD\nPower: 4 x AA batteries',
      features: ['Wide measurement range', 'High accuracy', 'Auto temperature compensation', 'Portable design', 'Data logging'],
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=conductivity%20meter%20industrial%20instrument%20laboratory%20equipment%20white%20background&image_size=landscape_16_9'
    },
    'timing-chain': {
      name: 'Engine Timing Chain',
      description: 'High-performance timing chain for automotive engine systems.',
      specifications: 'Material: Alloy steel\nPitch: 3/8" - 1/2"\nTensile strength: 15000-35000N\nStandard: ISO/TS 16949',
      features: ['High strength', 'Durable', 'Precise timing', 'Low noise', 'OEM quality'],
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=engine%20timing%20chain%20automotive%20parts%20metal%20white%20background&image_size=landscape_16_9'
    },
    'wheel-hub': {
      name: 'Wheel Hub Assembly',
      description: 'Complete wheel hub assembly for automotive applications.',
      specifications: 'Material: Steel/Aluminum\nBearing type: Tapered roller/ball\nABS sensor: Optional\nStandard: ISO/TS 16949',
      features: ['Precision engineered', 'Long lasting', 'Easy installation', 'ABS compatible', 'OEM/ODM'],
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=automotive%20wheel%20hub%20assembly%20metal%20parts%20white%20background&image_size=landscape_16_9'
    }
  };

  const product = products[productId];
  if (product) {
    const detailHTML = `
      <div class="container" style="padding-top: 120px; padding-bottom: 80px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
          <div>
            <img src="${product.image}" alt="${product.name}" style="width: 100%; border-radius: 15px;">
          </div>
          <div>
            <h1 style="font-size: 2.5rem; margin-bottom: 20px;">${product.name}</h1>
            <p style="color: #8892A6; font-size: 1.1rem; margin-bottom: 30px;">${product.description}</p>
            
            <div style="background: #112240; padding: 25px; border-radius: 15px; margin-bottom: 30px;">
              <h3 style="margin-bottom: 15px;">Technical Specifications</h3>
              <pre style="color: #8892A6; font-family: inherit; white-space: pre-wrap;">${product.specifications}</pre>
            </div>
            
            <div style="margin-bottom: 30px;">
              <h3 style="margin-bottom: 15px;">Key Features</h3>
              <ul style="list-style: none;">
                ${product.features.map(f => `<li style="color: #8892A6; margin-bottom: 10px; padding-left: 20px; position: relative;"><span style="position: absolute; left: 0; color: #FF6B35;">✓</span>${f}</li>`).join('')}
              </ul>
            </div>
            
            <button class="btn btn-primary" style="padding: 15px 40px; font-size: 1rem;" onclick="window.location.href='contact.html'">Get Quote</button>
          </div>
        </div>
        
        <div style="margin-top: 60px;">
          <h2 style="text-align: center; margin-bottom: 40px;">OEM/ODM Service</h2>
          <p style="color: #8892A6; text-align: center; max-width: 800px; margin: 0 auto;">We provide professional OEM/ODM services. Our experienced team can help you customize products according to your requirements. Please contact us for more details.</p>
        </div>
      </div>
    `;
    
    document.body.innerHTML = `
      <header>
        <div class="container">
          <nav>
            <a href="index.html" class="logo">Global<span>Trade</span></a>
            <ul class="nav-links">
              <li><a href="index.html">Home</a></li>
              <li><a href="products.html" class="active">Products</a></li>
              <li><a href="about.html">About Us</a></li>
              <li><a href="contact.html">Contact</a></li>
            </ul>
            <div class="mobile-menu-btn">☰</div>
          </nav>
        </div>
      </header>
      ${detailHTML}
      <footer>
        <div class="container">
          <div class="footer-content">
            <div class="footer-section">
              <h3>XuanJi Technology</h3>
              <p>Your trusted partner for Chinese export products. Specializing in cell culture equipment, auto parts, and industrial instruments.</p>
            </div>
            <div class="footer-section">
              <h3>Product Categories</h3>
              <ul>
                <li><a href="products.html?category=cell-culture">Cell Culture Equipment</a></li>
                <li><a href="products.html?category=auto-parts">Auto Parts</a></li>
                <li><a href="products.html?category=industrial-instruments">Industrial Instruments</a></li>
              </ul>
            </div>
            <div class="footer-section">
              <h3>Services</h3>
              <ul>
                <li><a href="#">OEM/ODM</a></li>
                <li><a href="#">Quality Control</a></li>
                <li><a href="#">Supply Chain Management</a></li>
                <li><a href="#">Payment Flexibility</a></li>
              </ul>
            </div>
            <div class="footer-section">
              <h3>Contact Us</h3>
              <p>Email: hddemiguo@gmail.com</p>
              <p>Phone: 0086-15868179726</p>
              <p>WhatsApp & Wechat: 0086-15868179726</p>
              <p>Address: Room 601, 6th Floor, BeiChengMingYuan, Shangcheng District, Hangzhou City, Zhejiang Province, China</p>
            </div>
          </div>
          <div class="footer-bottom">
            <p>&copy; 2024 XuanJi Technology. All rights reserved.</p>
          </div>
        </div>
      </footer>
    `;
  }
}
