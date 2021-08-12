class App {
    constructor(countCard) {
        this.countCard = countCard;
        this.data = JSON.parse(localStorage.getItem('kamdevState'))
        this.breakpoint = '.content';
        this.position = 'afterbegin';
        this.goals = {
            'Click on plan in welcome': 200363,
            'Click on device 1 in welcome': 200364,
            'Click inside welcome': 200365
        };

        this.generateTiles()
    }

    addHandlers() {

        Kameleoon.API.Utils.addUniversalClickListener(document, (event) => {
            const { target } = event;

            if (target.closest('.kam-tile') && (target instanceof HTMLAnchorElement || target.closest('a'))) {
                Kameleoon.API.Goals.processConversion(this.goals['Click inside welcome']);

                if (target.closest('.kam-plan-tile')) {
                    Kameleoon.API.Goals.processConversion(this.goals['Click on plan in welcome']);
                }
                if (target.closest('.kam-device-tile')) {
                    Kameleoon.API.Goals.processConversion(this.goals['Click on device 1 in welcome']);
                }
            }

            if ((target.classList.contains('footnote') || target.closest('.footnote')) && target.closest('[data-type]')) {
                const parentTile = target.closest('[data-type]')
                const action = parentTile && parentTile.dataset.type
                const dataPopup = {}

                switch (action) {
                    case 'plan':
                        dataPopup.header = parentTile.querySelector('.footnote__header') && parentTile.querySelector('.footnote__header').textContent
                        dataPopup.descr = parentTile.querySelector('.footnote__descr') && parentTile.querySelector('.footnote__descr').textContent
                        break;
                    case 'device':
                        dataPopup.header = 'congstar Monatliche Rate:'
                        dataPopup.descr = 'Genannter Betrag ist für 24 Monate zusätzlich zu den Kosten des gewählten Tarifs zu zahlen. Angebot gilt nur bei Abschluss eines congstar Mobilfunkvertrages mit einer Mindestvertragslaufzeit von 24 Monaten. Alle Preise inklusive Umsatzsteuer und zzgl. 4,86 € <a href="https://www.congstar.de/hilfe-service/auftrag-lieferung/" title="Opens internal link in current window" target="_blank" class="internal-link">Versandkosten</a>.'
                        break;
                }
                this.popupRender(dataPopup)
            }

            if (target.classList.contains('kam-tile-modal') || target.classList.contains('kam-tile-modal__backdrop') || target.closest('.icon--close') || target.classList.contains('icon--close')) {
                if (target instanceof HTMLAnchorElement || target.closest('a')) event.preventDefault();
                document.querySelector('#footnote').remove();
                document.querySelector('.modal-backdrop').remove()
            }
        });
    }

    render(data) {
        const readyLayout = this.view(data);
        Kameleoon.API.Core.runWhenElementPresent(this.breakpoint, ([elemForInsert]) => {
            elemForInsert.insertAdjacentHTML(this.position, readyLayout)
            this.addHandlers()
        })
    }

    async generateTiles() {

        try {
            let idsForRequest = {};
            const actions = Object.keys(this.data);

            for (const action of actions) {

                this.data[action].sort((a, b) => b.pv.views === a.pv.views ? b.pv.time - a.pv.time : b.pv.views - a.pv.views)

                if (this.countCard > 3) {
                    this.data[action] = this.data[action].filter((tile, index) => action === 'plan' ? index < 1 : index < 4) //count tiles
                } else {
                    this.data[action] = this.data[action].filter((tile, index) => index < 1) //count tiles
                }

                for (let i = 0; i < this.data[action].length; i++) {
                    idsForRequest[action] = idsForRequest[action]
                        ? [...idsForRequest[action], (this.data[action][i].plan_id || this.data[action][i].deviceID)]
                        : idsForRequest[action] = [this.data[action][i].plan_id || this.data[action][i].deviceID];
                }
            }

            let url;
            if (idsForRequest.device && idsForRequest.plan) {
                url = `https://customers.kameleoon.com/congstar/product-api/product-data?product=${idsForRequest.device.join(',')}&plan=${idsForRequest.plan.join(',')}`;
            } else if (idsForRequest.device && !idsForRequest.plan) {
                url = `https://customers.kameleoon.com/congstar/product-api/product-data?product=${idsForRequest.device.join(',')}`;
            } else if (!idsForRequest.device && idsForRequest.plan) {
                url = `https://customers.kameleoon.com/congstar/product-api/product-data?plan=${idsForRequest.plan.join(',')}`;
            }

            if (!url) return;

            const data = await fetch(url).then(r => r.ok && r.json());

            if (data) {
                if (data['plan']) {
                    const id = Object.keys(data['plan'])[0];
                    const { usps, media, footnotes } = await fetch(`https://www.congstar.de/api/shop/plan-configuration/clients/1/plans/${id}`).then(res => res.json())
                    const newUsps = usps.map((usp, i) => {
                        let icon
                        switch (usp.type) {
                            case 'telephony': icon = 'phone'; break;
                            case 'sms': icon = 'sms'; break;
                            case 'data': icon = 'internet'; break;
                            case 'telephony-and-sms': icon = 'phone-sms'; break;
                            case 'roaming': icon = 'roaming-eu'; break;
                            case 'fairConditions': icon = 'heart'; break;
                            case 'contractDuration': icon = 'contract-duration'; break;
                            case 'other': icon = 'check'; break;
                        }
                        return { ...usp, icon };
                    }).filter((el, i) => i < 3)


                    data['plan'][id] = { ...data['plan'][id], newUsps, media, footnotes }
                    data['plan'] = Object.values(data['plan'])
                }

                if (data['device']) {
                    let devices = []
                    this.data['device'].forEach(({ deviceID }, index) => {
                        data['device'][deviceID] = { ...data['device'][deviceID], index }
                        devices.push({ ...data['device'][deviceID], id: deviceID })
                    })

                    data['device'] = devices;
                }

                this.render(data)
            }



        } catch (err) {
            console.error(err)
        }
    }

    popupRender(data) {
        const { header, descr } = data;
        const layout = `<div class="kam-tile-modal modal modal--footnote show" id="footnote" tabindex="-1" role="dialog" aria-labelledby="Footnote text" aria-modal="true" style="display: block;">
                            <div class="modal-dialog" role="document">
                                <div class="modal-content background-color--bright">
                                    <div class="modal-header">
                                        <a href="#" class="close icon--close" data-dismiss="modal" aria-label="Close"></a>
                                        <h4 class="modal-title" id="myModalLabel">${header}</h4>
                                    </div>
                                    <div class="modal-body" ng-bind-html="descriptionWithHtml">${descr}</div>
                                </div>
                            </div>
                        </div>
                        <div class="kam-tile-modal__backdrop modal-backdrop show"></div>`;

        document.body.insertAdjacentHTML('beforeend', layout)
    }

    view(data) {

        const formatTitle = (title) => {
            let titleFormat;
            titleFormat = title.replace(' GB ', 'GB ')

            if (title.length > 55) {
                let maxStrSize = 45;
                titleFormat = titleFormat.slice(0, maxStrSize);
                let lastTitleIndex = titleFormat.lastIndexOf(' ');
                titleFormat = titleFormat.substring(0, lastTitleIndex)

                let remainingSymbols = 55 - titleFormat.length
                for (let i = 0; i < remainingSymbols; i++) {
                    if (i < 3) {
                        titleFormat += '.'
                    }
                }
            }
            return titleFormat;
        }

        const tileLayouts = {
            plan: props => {
                let { id, title, detailLink, price, media, newUsps, contractType, footnotes, type } = props
                price = price.toFixed(2)
                return (`
                    <div class="kam-tile kam-plan-tile ${contractType === 'postpaid' ? 'theme--postpaid' : 'theme--prepaid'}" plan-id="${id}" data-type="${type}">
                        <div class="plan-bucket background-color--bright">
                            <header class="plan-bucket__header background-color--themed">
                                <a title="${title}" href="${detailLink}" class="plan-bucket__link">
                                    <h4 class="plan-bucket__title">${formatTitle(title)}</h4>
                                 </a>
                            </header>
                            <div class="plan-bucket__container">
                                ${(media && media.images && media.images.teaser) ? `<div class="plan-bucket__background-image responsive-image responsive-image-bg" data-src="${media.images.teaser}" style="background-image: url(${media.images.teaser});"></div>` : ''}
                                ${newUsps.length ? `<ul class="icon-list icon-list--themed"> 
                                ${newUsps.map(usp => `<li class="icon--${usp.icon}">${usp.description}</li>`).join('')}
                                 </ul>` : ''}
                            </div>
                            <footer class="plan-bucket__footer">
                                <hr>
                                <div class="teaser-price">
                                    <div class="price">
                                        <span class="price__euro">${String(price).split('.')[0]}</span>
                                        <span class="price__cent">${String(price).split('.')[1]}</span>
                                        <span class="price__rate">€ mtl.</span>
                                        <div class="footnote">
                                            <span class="footnote__icon"></span>
                                            ${footnotes && footnotes.length ?
                        `<div class="footnote__modal-data" style="display:none">
                                                    <header class="footnote__header">${footnotes[0].header}</header>
                                                    <main class="footnote__descr">${footnotes[0].description}</main>
                                                </div>` : ''}
                                        </div>
                                    </div>
                                </div>
                                <a title="Allnet Flat" class="btn-primary btn-primary--themed" href="${detailLink}" >Zum Tarif</a>
                            </footer>
                        </div>
                    </div>
                `)
            },
            device: props => {
                let { id, title, detailLink, image, installmentPlanMonthly, type } = props
                installmentPlanMonthly = installmentPlanMonthly.toFixed(2);

                return (`
                    <div class="kam-tile kam-device-tile" device-id="${id}" data-type="${type}">
                        <div class="device-teaser theme--phones">
                            <header class="device-teaser__header background-color--themed">
                                <a title="${title}" href="${detailLink}" class="btn-primary btn-primary--phones">
                                    <h4 class="device-teaser__title text-wrapper">${formatTitle(title)}</h4>
                                </a>
                            </header>
                            <div class="device-teaser__container background-color--bright">
                                <a title="${title}" class="device-teaser__image-link" href="${detailLink}">
                                    <img class="device-teaser__image responsive-image" src="${image}" alt="" data-src="${image}">
                                </a>          
                            </div>
                            <footer class="device-teaser__footer">
                                <hr>
                                <div class="teaser-price">
                                    <div class="price price--large">
                                        <span class="price__euro">${String(installmentPlanMonthly).split('.')[0]}</span>
                                        <span class="price__cent">${String(installmentPlanMonthly).split('.')[1]}</span>
                                        <span class="price__rate">€ mtl.</span>
                                        <div  class="footnote">
                                            <span class="footnote__icon"></span>
                                        </div>
                                        <div class="price__duration">24 Monate Laufzeit</div>
                                    </div>
                                </div>
                                <a title="${title}" class="btn-primary btn-primary--phones device-teaser__button" href="${detailLink}">Zum Handy</a>
                            </footer>
                        </div>
                    </div>
                `)
            },
            deviceOther: props => {
                const { id, title, detailLink, image } = props;
                return (`
                    <div class="kam-tile kam-device-additional-tile" device-id="${id}" additional-tile="${title}">
                        <div class="device-teaser theme--phones">
                            <div class="device-teaser__container background-color--bright">
                                <a title="${title}" class="device-teaser__image-link" href="${detailLink}">
                                    <img class="device-teaser__image responsive-image" src="${image}" alt="" data-src="${image}">
                                </a>
                            </div>
                            <header class="device-teaser__header background-color--themed">
                            <a title="${title}" href="${detailLink}" class="btn-primary btn-primary--phones">
                                <p class="device-teaser__title text-wrapper">
                                    ${formatTitle(title)}
                                </p>
                            </a>
                            </header>
                        </div>
                    </div>
                `)
            }
        }

        let tilesReady = []

        if (data['plan']) {
            tilesReady.push(tileLayouts['plan']({ ...data['plan'][0], type: 'plan' }))
        }
        if (data['device']) {
            data['device'].forEach((tile, index) => {
                const item = { ...tile, type: 'device' }
                if (index === 0) {
                    tilesReady.push(tileLayouts['device'](item))
                } else {
                    tilesReady.push(tileLayouts['deviceOther'](item))
                }
            })
        }

        return (`
            <section id="kameleoonElement" class="kam-come-back ${tilesReady.length < 3 ? Object.keys(data).length < 2 ? 'bg-full' : 'bg-hulf' : ''}">
                <h2 class="headline--h1 headline--skizzed headline--themed">Willkommen zurück!</h2>
                <p class="headline--h4 headline--themed">Damit hast du bei deinem letzten Besuch aufgehört:</p>
                <img class="kam-come-back__image" src="https://storage.kameleoon.eu/congstar/welcome_back_modul/welcome-image.png"/>
                <div class="kam-come-back__teasers ${data['plan'] ? '' : 'kam-come-back__teasers--only-devices'}">
                    ${tilesReady.join('')}
                </div>
            </section> 
        `)
    }
}

export default App;

