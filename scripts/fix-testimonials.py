import re
def fix_biotech():
    with open('../biotech/index.html', 'r', encoding='utf-8') as f:
        c = f.read()
    c = c.replace('<h2>What Our Clients Say</h2>', '<h2 data-i18n=\
biotech.testimonials.title\>What Our Clients Say</h2>')
    c = c.replace('<p>Testimonials from satisfied biotech customers</p>', '<p data-i18n=\
biotech.testimonials.desc\>Testimonials from satisfied biotech customers</p>')
    c = c.replace('<p>The cell thawing machines have significantly improved our lab efficiency. Excellent quality and reliable service.</p>', '<p data-i18n=\
biotech.testimonials.t1.text\>The cell thawing machines have significantly improved our lab efficiency. Excellent quality and reliable service.</p>')
    c = c.replace('<h4>Dr. Sarah Chen</h4>', '<h4 data-i18n=\
biotech.testimonials.t1.author\>Dr. Sarah Chen</h4>')
    c = c.replace('<span>Research Director, USA</span>', '<span data-i18n=\
biotech.testimonials.t1.company\>Research Director, USA</span>')
    c = c.replace('<p>XuanJi Technology helped us find the perfect cryogenic equipment for our research needs. Highly recommended.</p>', '<p data-i18n=\
biotech.testimonials.t2.text\>XuanJi Technology helped us find the perfect cryogenic equipment for our research needs. Highly recommended.</p>')
    c = c.replace('<h4>Prof. Markus Weber</h4>', '<h4 data-i18n=\
biotech.testimonials.t2.author\>Prof. Markus Weber</h4>')
    c = c.replace('<span>Lab Manager, Germany</span>', '<span data-i18n=\
biotech.testimonials.t2.company\>Lab Manager, Germany</span>')
    c = c.replace('<p>Great products and exceptional support. Their team understands the biotech industry requirements perfectly.</p>', '<p data-i18n=\
biotech.testimonials.t3.text\>Great products and exceptional support. Their team understands the biotech industry requirements perfectly.</p>')
    c = c.replace('<h4>Dr. Elena Rodriguez</h4>', '<h4 data-i18n=\
biotech.testimonials.t3.author\>Dr. Elena Rodriguez</h4>')
    c = c.replace('<span>Lab Director, Spain</span>', '<span data-i18n=\
biotech.testimonials.t3.company\>Lab Director, Spain</span>')
    with open('../biotech/index.html', 'w', encoding='utf-8') as f:
        f.write(c)
    print('biotech done')
fix_biotech()
