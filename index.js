let fs = require('fs');
let cheerio = require('cheerio');
let fetch = require('node-fetch');
let options = require('./config/fields');
let proxyList = require('./config/proxy-list');
let download = require('./utils/download');
let Proxy = require('./utils/proxy');

let {url, item, fields, pager} = options;

function normalizeURL(parentURL, childURL) {
    let matches = parentURL.match(/^(https?:\/\/[^/]+)/);
    let origDomain = matches && matches[0];

    return origDomain + childURL;
}

function getElem(field, $post, $) {
    return typeof field.selector === 'function' ?
        field.selector($post, $) :
        $post.find(field.selector);
}


function getValue(field, $elem, $) {
    return new Promise((resolve, reject) => {
        let value = field.strategy($elem);

        if (!field.upload) {
            resolve(value);
        } else {
            resolve(value
                ? download({
                    url: normalizeURL(url, field.strategy($elem)),
                    dir: './media'
                })
                : ''
            );
        }
    });
}

function getMapValue(field, $elem, $) {
    let promises = [];

    field.items.forEach((fieldItem) => {
        promises.push(
            getValue(fieldItem, getElem(fieldItem, $elem, $))
        )
    });

    return Promise.all(promises)
        .then((data) => {
            let map = {};

            field.items.forEach((fieldItem, index) => {
                map[fieldItem.key] = data[index];
            });

            return map;
    });
}

function getFieldValue(field, $elem, $) {
    if (field.multiple) {
        let promises = [];

        $elem.each((index, elemItem) => {
            if (field.type === 'map') {
                promises.push(getMapValue(field, $(elemItem), $))
            } else {
                promises.push(getValue(field, $(elemItem), $));
            }
        });
        return Promise.all(promises);
    } else {
        return getValue(field, $elem, $);
    }
}

const parse = (url) => {
    let proxy = ProxyAgent.getProxy();

    fetch(url)
        .then(data => {
            ProxyAgent.releaseProxy(proxy);
            return data.text()
        })
        .then(html => {
            let $ = cheerio.load(html);
            let $posts = $(item.selector);
            let $pagination = $(pager.pagerSelector);
            let $active = $pagination.find(pager.activeSelector);
            let posts = [];

            $posts.each((index, post) => {
                let $post = $(post);
                let link = $post.find(item.link).attr('href');

                if (!link) return;

                link = normalizeURL(url, link);

                posts.push(fetch(link)
                    .then(data => data.text())
                    .then(html => {
                        let $ = cheerio.load(html);
                        let $post = $(item.content);
                        let post = {link};
                        let promises = [];

                        fields.forEach(field => {
                            let $elem = getElem(field, $post, $);
                            promises.push(
                                getFieldValue(field, $elem, $)
                                    .then((value) => {
                                        post[field.name] = value;
                                    })
                            );
                        });

                        return Promise.all(promises)
                            .then((data) => {
                                console.log(post);
                            });
                    })
                );
            });

            Promise.all(posts).then(() => {
                if ($active[0].nextSibling) {
                    parse(normalizeURL(url, $active.next().attr('href')));
                }
            });
        }).catch(function (err) {
            console.log(err);
        });
};

let ProxyAgent = new Proxy(proxyList);

parse(url);