import json

with open('../i18n/translations.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

testimonials_data = {
    'en': {
        'biotech': {
            'title': 'What Our Clients Say',
            'desc': 'Testimonials from satisfied biotech customers',
            't1': {'text': 'The cell thawing machines have significantly improved our lab efficiency. Excellent quality and reliable service.', 'author': 'Dr. Sarah Chen', 'company': 'Research Director, USA'},
            't2': {'text': 'XuanJi Technology helped us find the perfect cryogenic equipment for our research needs. Highly recommended.', 'author': 'Prof. Markus Weber', 'company': 'Lab Manager, Germany'},
            't3': {'text': 'Great products and exceptional support. Their team understands the biotech industry requirements perfectly.', 'author': 'Dr. Elena Kovalenko', 'company': 'CEO, BiotechLab Russia'}
        },
        'autoparts': {
            'title': 'Auto Parts Distributors Trust Us',
            'desc': 'Real feedback from our automotive clients',
            't1': {'text': "We've been sourcing roller chains from XuanJi Technology for 8 years. Their quality is consistent and prices are competitive.", 'author': 'James Wilson', 'company': 'CEO, AutoParts USA'},
            't2': {'text': 'Their brake discs meet OE standards at a fraction of the cost. Our customers are very satisfied with the quality.', 'author': 'Maria Gonzalez', 'company': 'Purchasing Director, EuroAuto Parts'},
            't3': {'text': "XuanJi Technology's OEM service helped us launch our own brand of timing chains. Their support throughout the process was excellent.", 'author': 'David Kim', 'company': 'Operations Manager, Asian Motors'}
        },
        'instruments': {
            'title': 'Industrial Professionals Trust Us',
            'desc': 'Real feedback from our industrial clients',
            't1': {'text': 'The coating thickness gauges we purchased from XuanJi Technology have improved our quality control significantly. Very accurate and reliable.', 'author': 'Peter Brown', 'company': 'Quality Manager, MetalWorks Ltd.'},
            't2': {'text': "We've been using their ultrasonic thickness gauges for pipeline inspection. The measurements are precise and the equipment is durable.", 'author': 'Lisa Anderson', 'company': 'Operations Director, OilCo Inc.'},
            't3': {'text': 'XuanJi Technology helped us find the right conductivity meters for our manufacturing process. Their technical advice was very helpful.', 'author': 'Mark Wilson', 'company': 'Plant Manager, TechManufacturing'}
        }
    },
    'zh': {
        'biotech': {
            'title': '客户评价',
            'desc': '来自满意生物医学客户的评价',
            't1': {'text': '细胞解冻仪显著提高了我们实验室的效率。品质卓越，服务可靠。', 'author': 'Sarah Chen博士', 'company': '研究总监, 美国'},
            't2': {'text': 'XuanJi Technology帮助我们找到了完美的低温设备，强烈推荐。', 'author': 'Markus Weber教授', 'company': '实验室经理, 德国'},
            't3': {'text': '优秀的产品和卓越的支持。他们的团队完全理解生物医学行业的需求。', 'author': 'Elena Kovalenko博士', 'company': 'CEO, BiotechLab Russia'}
        },
        'autoparts': {
            'title': '汽车零部件经销商信赖我们',
            'desc': '来自汽车客户的真实反馈',
            't1': {'text': '我们已经从XuanJi Technology采购滚子链8年了。品质始终如一，价格具有竞争力。', 'author': 'James Wilson', 'company': 'CEO, AutoParts USA'},
            't2': {'text': '他们的刹车盘达到OE标准，价格却只有一小部分。我们的客户对质量非常满意。', 'author': 'Maria Gonzalez', 'company': '采购总监, EuroAuto Parts'},
            't3': {'text': 'XuanJi Technology的OEM服务帮助我们推出了自己品牌的正时链条。整个过程中他们的支持非常出色。', 'author': 'David Kim', 'company': '运营经理, Asian Motors'}
        },
        'instruments': {
            'title': '工业专业人士信赖我们',
            'desc': '来自工业客户的真实反馈',
            't1': {'text': '我们从XuanJi Technology购买的涂层测厚仪显著改善了我们的质量控制。非常准确可靠。', 'author': 'Peter Brown', 'company': '质量经理, MetalWorks Ltd.'},
            't2': {'text': '我们一直使用他们的超声波测厚仪进行管道检测。测量精确，设备耐用。', 'author': 'Lisa Anderson', 'company': '运营总监, OilCo Inc.'},
            't3': {'text': 'XuanJi Technology帮助我们找到了适合生产流程的电导率仪。他们的技术建议非常有帮助。', 'author': 'Mark Wilson', 'company': '工厂经理, TechManufacturing'}
        }
    },
    'ru': {
        'biotech': {
            'title': 'Что говорят наши клиенты',
            'desc': 'Отзывы удовлетворенных клиентов из области биотехнологий',
            't1': {'text': 'Машинки для размораживания клеток значительно повысили эффективность нашей лаборатории. Отличное качество и надежный сервис.', 'author': 'Доктор Сара Чен', 'company': 'Директор по исследованиям, США'},
            't2': {'text': 'XuanJi Technology помогло нам найти идеальное криогенное оборудование для наших исследовательских нужд. Очень рекомендую.', 'author': 'Профессор Маркус Вебер', 'company': 'Менеджер лаборатории, Германия'},
            't3': {'text': 'Отличные продукты и исключительная поддержка. Их команда отлично понимает требования биотехнологической отрасли.', 'author': 'Доктор Елена Коваленко', 'company': 'Генеральный директор, BiotechLab Russia'}
        },
        'autoparts': {
            'title': 'Дистрибьюторы автозапчастей доверяют нам',
            'desc': 'Реальные отзывы наших автомобильных клиентов',
            't1': {'text': 'Мы закупаем роликовые цепи у XuanJi Technology уже 8 лет. Их качество стабильно, а цены конкурентоспособны.', 'author': 'Джеймс Уилсон', 'company': 'Генеральный директор, AutoParts USA'},
            't2': {'text': 'Их тормозные диски соответствуют стандартам OE при небольшой цене. Наши клиенты очень довольны качеством.', 'author': 'Мария Гонсалес', 'company': 'Директор по закупкам, EuroAuto Parts'},
            't3': {'text': 'OEM-сервис XuanJi Technology помог нам запустить собственный бренд цепей ГРМ. Их поддержка на всем протяжении процесса была отличной.', 'author': 'Дэвид Ким', 'company': 'Менеджер по операциям, Asian Motors'}
        },
        'instruments': {
            'title': 'Промышленные профессионалы доверяют нам',
            'desc': 'Реальные отзывы наших промышленных клиентов',
            't1': {'text': 'Толщиномеры покрытия, купленные у XuanJi Technology, значительно улучшили наш контроль качества. Очень точные и надежные.', 'author': 'Питер Браун', 'company': 'Менеджер по качеству, MetalWorks Ltd.'},
            't2': {'text': 'Мы используем их ультразвуковые толщиномеры для обследования трубопроводов. Измерения точные, оборудование прочное.', 'author': 'Лиза Андерсон', 'company': 'Директор по операциям, OilCo Inc.'},
            't3': {'text': 'XuanJi Technology помогло нам найти подходящие приборы для измерения проводимости для нашего производственного процесса. Их технические советы были очень полезными.', 'author': 'Марк Уилсон', 'company': 'Директор завода, TechManufacturing'}
        }
    },
    'es': {
        'biotech': {
            'title': 'Lo que dicen nuestros clientes',
            'desc': 'Testimonios de clientes satisfechos de biotech',
            't1': {'text': 'Las máquinas de descongelación celular han mejorado significativamente la eficiencia de nuestro laboratorio. Excelente calidad y servicio confiable.', 'author': 'Dra. Sarah Chen', 'company': 'Directora de Investigación, EE.UU.'},
            't2': {'text': 'XuanJi Technology nos ayudó a encontrar el equipo criogénico perfecto para nuestras necesidades de investigación. Altamente recomendado.', 'author': 'Prof. Markus Weber', 'company': 'Gerente de Laboratorio, Alemania'},
            't3': {'text': 'Grandes productos y soporte excepcional. Su equipo entiende perfectamente los requisitos de la industria biotecnológica.', 'author': 'Dra. Elena Kovalenko', 'company': 'CEO, BiotechLab Russia'}
        },
        'autoparts': {
            'title': 'Los distribuidores de piezas de auto confían en nosotros',
            'desc': 'Comentarios reales de nuestros clientes automotrices',
            't1': {'text': 'Hemos estado comprando cadenas de rodillos a XuanJi Technology durante 8 años. Su calidad es constante y los precios son competitivos.', 'author': 'James Wilson', 'company': 'CEO, AutoParts USA'},
            't2': {'text': 'Sus discos de freno cumplen con los estándares OE a una fracción del costo. Nuestros clientes están muy satisfechos con la calidad.', 'author': 'Maria Gonzalez', 'company': 'Directora de Compras, EuroAuto Parts'},
            't3': {'text': 'El servicio OEM de XuanJi Technology nos ayudó a lanzar nuestra propia marca de cadenas de distribución. Su apoyo durante todo el proceso fue excelente.', 'author': 'David Kim', 'company': 'Gerente de Operaciones, Asian Motors'}
        },
        'instruments': {
            'title': 'Los profesionales industriales confían en nosotros',
            'desc': 'Comentarios reales de nuestros clientes industriales',
            't1': {'text': 'Los medidores de espesor de revestimiento que compramos a XuanJi Technology han mejorado significativamente nuestro control de calidad. Muy precisos y confiables.', 'author': 'Peter Brown', 'company': 'Gerente de Calidad, MetalWorks Ltd.'},
            't2': {'text': 'Hemos estado usando sus medidores de espesor ultrasónico para inspección de tuberías. Las mediciones son precisas y el equipo es duradero.', 'author': 'Lisa Anderson', 'company': 'Directora de Operaciones, OilCo Inc.'},
            't3': {'text': 'XuanJi Technology nos ayudó a encontrar los medidores de conductividad adecuados para nuestro proceso de fabricación. Su asesoramiento técnico fue muy útil.', 'author': 'Mark Wilson', 'company': 'Gerente de Planta, TechManufacturing'}
        }
    },
    'de': {
        'biotech': {
            'title': 'Was unsere Kunden sagen',
            'desc': 'Zeugnisse zufriedener Biotech-Kunden',
            't1': {'text': 'Die Zellentauungsmaschinen haben unsere Laboreffizienz erheblich verbessert. Ausgezeichnete Qualität und zuverlässiger Service.', 'author': 'Dr. Sarah Chen', 'company': 'Forschungsdirektorin, USA'},
            't2': {'text': 'XuanJi Technology hat uns geholfen, das perfekte Kryo-Gerät für unsere Forschungsbedürfnisse zu finden. Sehr empfehlenswert.', 'author': 'Prof. Markus Weber', 'company': 'Laborleiter, Deutschland'},
            't3': {'text': 'Großartige Produkte und hervorragende Unterstützung. Ihr Team versteht die Anforderungen der Biotech-Branche perfekt.', 'author': 'Dr. Elena Kovalenko', 'company': 'CEO, BiotechLab Russia'}
        },
        'autoparts': {
            'title': 'Autoteile-Händler vertrauen uns',
            'desc': 'Echte Rückmeldungen von unseren Automobilkunden',
            't1': {'text': 'Wir beziehen Rollenketten seit 8 Jahren bei XuanJi Technology. Ihre Qualität ist konstant und die Preise wettbewerbsfähig.', 'author': 'James Wilson', 'company': 'CEO, AutoParts USA'},
            't2': {'text': 'Ihre Bremsscheiben entsprechen OE-Standards zu einem Bruchteil der Kosten. Unsere Kunden sind mit der Qualität sehr zufrieden.', 'author': 'Maria Gonzalez', 'company': 'Einkaufsleiterin, EuroAuto Parts'},
            't3': {'text': 'Der OEM-Service von XuanJi Technology hat uns geholfen, unsere eigene Marke von Steuerketten zu lancen. Ihre Unterstützung während des gesamten Prozesses war ausgezeichnet.', 'author': 'David Kim', 'company': 'Operations Manager, Asian Motors'}
        },
        'instruments': {
            'title': 'Industrieprofis vertrauen uns',
            'desc': 'Echte Rückmeldungen von unseren Industriekunden',
            't1': {'text': 'Die Beschichtungsdickenmesser, die wir bei XuanJi Technology gekauft haben, haben unsere Qualitätskontrolle erheblich verbessert. Sehr genau und zuverlässig.', 'author': 'Peter Brown', 'company': 'Qualitätsmanager, MetalWorks Ltd.'},
            't2': {'text': 'Wir verwenden ihre Ultraschall-Dickenmesser für Rohrleitungsinspektionen. Die Messungen sind präzise und das Gerät langlebig.', 'author': 'Lisa Anderson', 'company': 'Operationsleiterin, OilCo Inc.'},
            't3': {'text': 'XuanJi Technology hat uns geholfen, die richtigen Leitfähigkeitsmesser für unseren Produktionsprozess zu finden. Ihr technischer Rat war sehr hilfreich.', 'author': 'Mark Wilson', 'company': 'Werkleiter, TechManufacturing'}
        }
    },
    'fr': {
        'biotech': {
            'title': 'Ce que disent nos clients',
            'desc': 'Témoignages de clients biotech satisfaits',
            't1': {'text': "Les machines de décongélation cellulaire ont considérablement amélioré l'efficacité de notre laboratoire. Excellente qualité et service fiable.", 'author': 'Dr. Sarah Chen', 'company': 'Directrice de Recherche, États-Unis'},
            't2': {'text': 'XuanJi Technology nous a aidés à trouver le matériel cryogénique parfait pour nos besoins de recherche. Très recommandé.', 'author': 'Prof. Markus Weber', 'company': 'Responsable de Laboratoire, Allemagne'},
            't3': {'text': "Grands produits et support exceptionnel. Leur équipe comprend parfaitement les exigences de l'industrie biotechnologique.", 'author': 'Dr. Elena Kovalenko', 'company': 'CEO, BiotechLab Russia'}
        },
        'autoparts': {
            'title': 'Les distributeurs de pièces auto nous font confiance',
            'desc': 'Commentaires réels de nos clients automobiles',
            't1': {'text': 'Nous achetons des chaînes à rouleaux chez XuanJi Technology depuis 8 ans. Leur qualité est constante et les prix sont compétitifs.', 'author': 'James Wilson', 'company': 'CEO, AutoParts USA'},
            't2': {'text': 'Leurs disques de frein répondent aux normes OE pour une fraction du coût. Nos clients sont très satisfaits de la qualité.', 'author': 'Maria Gonzalez', 'company': 'Directrice des Achats, EuroAuto Parts'},
            't3': {'text': "Le service OEM de XuanJi Technology nous a aidés à lancer notre propre marque de chaînes de distribution. Leur support tout au long du processus a été excellent.", 'author': 'David Kim', 'company': 'Responsable des Opérations, Asian Motors'}
        },
        'instruments': {
            'title': 'Les professionnels industriels nous font confiance',
            'desc': 'Commentaires réels de nos clients industriels',
            't1': {'text': "Les micromètres d'épaisseur de revêtement que nous avons achetés chez XuanJi Technology ont considérablement amélioré notre contrôle de qualité. Très précis et fiables.", 'author': 'Peter Brown', 'company': 'Responsable de la Qualité, MetalWorks Ltd.'},
            't2': {'text': "Nous utilisons leurs micromètres d'épaisseur ultrasonores pour l'inspection de pipelines. Les mesures sont précises et l'équipement est durable.", 'author': 'Lisa Anderson', 'company': 'Directrice des Opérations, OilCo Inc.'},
            't3': {'text': 'XuanJi Technology nous a aidés à trouver les bonnes mesures de conductivité pour notre processus de fabrication. Leur conseil technique a été très utile.', 'author': 'Mark Wilson', 'company': "Responsable de l'Usine, TechManufacturing"}
        }
    },
    'it': {
        'biotech': {
            'title': 'Cosa dicono i nostri clienti',
            'desc': 'Testimonianze di clienti biotech soddisfatti',
            't1': {'text': "Le macchine per il scongelamento cellulare hanno migliorato significativamente l'efficienza del nostro laboratorio. Ottima qualità e servizio affidabile.", 'author': 'Dr. Sarah Chen', 'company': 'Direttrice della Ricerca, USA'},
            't2': {'text': "XuanJi Technology ci ha aiutato a trovare l'equipaggiamento criogenico perfetto per le nostre esigenze di ricerca. Molto consigliato.", 'author': 'Prof. Markus Weber', 'company': 'Responsabile del Laboratorio, Germania'},
            't3': {'text': "Grandi prodotti e supporto eccezionale. La loro squadra capisce perfettamente i requisiti dell'industria biotecnologica.", 'author': 'Dr. Elena Kovalenko', 'company': 'CEO, BiotechLab Russia'}
        },
        'autoparts': {
            'title': 'I distributori di parti auto ci fidano',
            'desc': 'Commenti reali dei nostri clienti automobilistici',
            't1': {'text': 'Acquistiamo catene a rulli da XuanJi Technology da 8 anni. La loro qualità è costante e i prezzi sono competitivi.', 'author': 'James Wilson', 'company': 'CEO, AutoParts USA'},
            't2': {'text': 'Le loro dischi freno soddisfano gli standard OE a una frazione del costo. I nostri clienti sono molto soddisfatti della qualità.', 'author': 'Maria Gonzalez', 'company': "Direttrice dell'Acquisto, EuroAuto Parts"},
            't3': {'text': "Il servizio OEM di XuanJi Technology ci ha aiutato a lanciare il nostro marchio di catene di distribuzione. Il loro supporto durante tutto il processo è stato eccellente.", 'author': 'David Kim', 'company': 'Responsabile delle Operazioni, Asian Motors'}
        },
        'instruments': {
            'title': 'I professionisti industriali ci fidano',
            'desc': 'Commenti reali dei nostri clienti industriali',
            't1': {'text': 'I misuratori dello spessore del rivestimento acquistati da XuanJi Technology hanno migliorato significativamente il nostro controllo di qualità. Molto precisi e affidabili.', 'author': 'Peter Brown', 'company': 'Responsabile della Qualità, MetalWorks Ltd.'},
            't2': {'text': "Utilizziamo i loro misuratori dello spessore ultrasonici per l'ispezione delle tubazioni. Le misurazioni sono precise e l'equipaggiamento è durevole.", 'author': 'Lisa Anderson', 'company': 'Direttrice delle Operazioni, OilCo Inc.'},
            't3': {'text': 'XuanJi Technology ci ha aiutato a trovare i giusti misuratori di conducibilità per il nostro processo di fabbricazione. Il loro consiglio tecnico è stato molto utile.', 'author': 'Mark Wilson', 'company': "Responsabile dell'Officina, TechManufacturing"}
        }
    }
}

languages = ['en', 'zh', 'ru', 'es', 'de', 'fr', 'it']
for lang in languages:
    for section in ['biotech', 'autoparts', 'instruments']:
        if 'testimonials' not in data[lang][section]:
            data[lang][section]['testimonials'] = testimonials_data[lang][section]

with open('../i18n/translations.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print('Done')
