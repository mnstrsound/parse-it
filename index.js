// let path = require('path');
// let request = require('request');
let fs = require('fs');
let cheerio = require('cheerio');
let fetch = require('node-fetch');
let options = require('./config/fields');
let proxyList = require('./config/proxy-list');
let download = require('./utils/download');
let Proxy = require('./utils/proxy');

let {url, item, fields, pager} = options;

// function getUploadContent(options) {
//     return download(options);
// }
//
// function isAbsoluteURL(url) {
//     return /^https?:\/\//.test(url)
// }
//
// function isFromRoot(path) {
//     return /^\//.test(path);
// }
//
// function isRelative(path) {
//     return /^\.{1,2}\//.test(path);
// }


// function getItemContent(field, $field, $) {
//     let content;
//
//     if (field.multiple) {
//         content = [];
//
//         $field.each((index, item) => {
//             content.push(
//                 field.type === 'map'
//                     ? getMapContent(field, $(item), $)
//                     : getSimpleContent(field, $(item))
//             )
//         });
//     } else {
//         content = getSimpleContent(field, $field)
//     }
//
//     return content;
// }
//
// function getMapContent(field, $field, $) {
//     let map = {};
//
//     field.items.forEach(item => {
//         map[item.key] = getSimpleContent(item, getField(item, $field, $));
//     });
//
//     return map;
// }
//
// function getSimpleContent(field, $field) {
//     field.strategy($field);
// }

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
        if (!field.upload) {
            resolve(field.strategy($elem));
        } else {
            resolve(download({
                url: normalizeURL(url, field.strategy($elem)),
                dir: './media'
            }));
        }
    });
}

function getMapValue(field, $elem, $) {
    let map = {};
    let promises = [];

    field.items.forEach((fieldItem) => {
        promises.push(
            getValue(fieldItem, getElem(fieldItem, $elem, $))
                .then((value) => {
                    return map[fieldItem.key] = value;
                })
        )
    });

    return Promise.all(promises);
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
                                        // console.log(value);
                                        post[field.name] = value;
                                    })
                            );
                        });

                        return Promise.all(promises)
                            .then((data) => {
                                console.log(data);
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