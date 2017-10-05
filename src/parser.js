import cheerio from 'cheerio';
import fetch from 'node-fetch';

import download from '../utils/download';
import { normalizeURL } from '../utils/helpers';

function getElem(field, $post, $) {
    return typeof field.selector === 'function' ?
        field.selector($post, $) :
        $post.find(field.selector);
}


function getValue(field, $elem, $) {
    return new Promise((resolve, reject) => {
        const value = field.strategy($elem);

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
        );
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
                promises.push(getMapValue(field, $(elemItem), $));
            } else {
                promises.push(getValue(field, $(elemItem), $));
            }
        });
        return Promise.all(promises);
    }

    return getValue(field, $elem, $);
}

export default class Parser {
    constructor(options) {
        const { url, item, fields, pager } = options;
        this.url = url;
        this.item = item;
        this.fields = fields;
        this.pager = pager;
    }

    start() {
        this.parsePage(this.url);
    }

    parsePage(url) {
        fetch(url).then(data => data.text())
            .then((html) => {
                const $ = cheerio.load(html);
                const $posts = $(this.item.selector);
                const $pagination = $(this.pager.pagerSelector);
                const $activePage = $pagination.find(this.pager.activeSelector);
                const posts = [];

                $posts.each((index, post) => {
                    const $post = $(post);
                    let link = $post.find(this.item.link).attr('href');

                    if (!link) return;

                    link = normalizeURL(this.url, link);

                    posts.push(fetch(link)
                        .then(data => data.text())
                        .then((html) => {
                            const $ = cheerio.load(html);
                            const $post = $(this.item.content);
                            const post = { link };
                            const promises = [];

                            this.fields.forEach((field) => {
                                const $elem = getElem(field, $post, $);

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
                    if ($activePage[0].nextSibling) {
                        this.parsePage(normalizeURL(url, $activePage.next().attr('href')));
                    }
                });
            });
    }
}
