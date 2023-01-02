const axios = require("axios");
const cheerio = require("cheerio");
const puppeteer = require('puppeteer');

const token = process.env.TELEGRAM_TOKEN;

async function getPrices() {

    const sitesData = [
        {
            index: 1,
            providerName: "Mercado Libre",
            productName: "YVES SAINT LAURENT Y EDP",
            url: "https://www.mercadolibre.com.ar/yves-saint-laurent-y-edp-60ml-para-hombre/p/MLA17410146?product_trigger_id=MLA17410145&quantity=1",
            priceSelector:
                "#ui-pdp-main-container > div.ui-pdp-container__col.col-3.ui-pdp-container--column-center.pb-40 > div > div.ui-pdp-container__row.ui-pdp-with--separator--fluid.ui-pdp-with--separator--40 > div.ui-pdp-container__col.col-2.mr-32 > div.ui-pdp-price.mt-16.ui-pdp-price--size-large > div.ui-pdp-price__second-line > span > span.andes-money-amount__fraction",
            disabledSelector:
                "#item_status_short_description_message > div > div.andes-message__content.andes-message__content--untitled > div > div",
        },
        {
            index: 2,
            providerName: "Perfumeria Rouge",
            productName: "YVES SAINT LAURENT Y EDP",
            url: "https://www.perfumeriasrouge.com/men-edp-ll8238200c/p?skuId=8242",
            priceSelector:
                "div.render-container.render-route-store-product > div > div.vtex-store__template.bg-base > div > div > div > div:nth-child(4) > div > div:nth-child(2) > div > section > div > div > div > div:nth-child(3) > div > div > div:nth-child(2) > div > div > div > div > div > div > div:nth-child(5) > div > div:nth-child(1) > div > div > div:nth-child(1) > div > div > span > span",
            disabledSelector: "",
        },
        {
            index: 3,
            providerName: "Perfumeria Parfumerie",
            productName: "YVES SAINT LAURENT Y EDP",
            url: "https://www.parfumerie.com.ar/ysl-y-intense-edp-rp131161",
            priceSelector:
                "#maincontent > div > div",
            disabledSelector:
                "#maincontent > div > div > div.product_wp_38606 > div > div.product.media > div.label.simple-product > span",
        },
    ];

    let priceOrDefault = "";
    let allPrices = "";
    const browser = await puppeteer.launch();
    for (const site of sitesData) {
        try {

            const page = await browser.newPage();
            await page.goto(site.url, { waitUntil: 'networkidle0' });

            const data = await page.evaluate(() => document.querySelector('*').outerHTML);

            const $ = cheerio.load(data);

            switch (site.index) {
                case 1:
                    if ($(site.disabledSelector).text().length > 0) {
                        priceOrDefault = "Publicacion pausada";
                    } else {
                        priceOrDefault = $(site.priceSelector).text();
                    }
                    break;
                case 2:
                    priceOrDefault = $(site.priceSelector).text();
                    if ($(site.priceSelector).text().length == 0) {
                        priceOrDefault = 'No disponible';
                    } else {
                        priceOrDefault = priceOrDefault.replace("$", "").trim();
                    }
                    break;
                case 3:
                    let className = $(site.priceSelector).children().attr('class');
                    let productId = className.replace(/\D/g, "");
                    let newSelector = `#product-price-${productId} > .price`;
                    if ($(site.disabledSelector).text().length > 0 && $(site.disabledSelector).text() == 'Sin stock') {
                        priceOrDefault = 'Sin stock';
                    } else {
                        priceOrDefault = $(newSelector).text();
                    }
                    break;
            }
            priceOrDefault = site.providerName + ': ' + priceOrDefault;
        } catch (err) {
            priceOrDefault = site.providerName + ': No disponible';
        }

        allPrices += `${priceOrDefault}`;
        allPrices += '\r\n';
    }

    var message = encodeURIComponent(allPrices)
    const { data } = await axios({
        method: "GET",
        url: `https://api.telegram.org/bot${token}/sendMessage?chat_id=1570494776&text=${message}&parse_mode=html`,
    });

    await browser.close();
}

getPrices();
