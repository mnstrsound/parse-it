let options = {
    url: 'https://www.edimdoma.ru/retsepty',
    pager: {
        pagerSelector: '.paginator__pages',
        activeSelector: '.active',
    },
    item: {
        selector: '.card',
        link: '.card__description > a',
        content: '.grid-three-column__column_center'
    },
    fields: [
        {
            name: 'title',
            type: 'text',
            selector: '.recipe-header__name',
            strategy: $field => $field.text().trim()
        },
        {
            name: 'description',
            type: 'text',
            selector: $post => $post.find('.section-title').next(),
            strategy: $field => $field.text().trim()
        },
        {
            name: 'duration',
            type: 'text',
            selector: '.entry-stats__item_cooking .entry-stats__value',
            strategy: $field => $field.text().trim()
        },
        {
            name: 'ingredients',
            type: 'map',
            multiple: true,
            selector: '.definition-list-table__tr',
            items: [
                {
                    key: 'name',
                    selector: $post => $post.find('.definition-list-table__tr span span'),
                    strategy: $field => $field[0] && $field[0].children[0].data
                },
                {
                    key: 'value',
                    selector: '.definition-list-table__td_value',
                    strategy: $field => $field.text().trim()
                }
            ]
        },
        {
            name: 'steps',
            type: 'map',
            multiple: true,
            selector: $post => $post.find('.js-mediator-article .content-box').first(),
            items: [
                {
                    key: 'image',
                    selector: '.field-row img',
                    upload: true,
                    strategy: $field => {
                        let value = $field.attr('data-original');

                        return value
                            ? value.replace(/\?\d+$/, '')
                            : null;
                    }
                },
                {
                    key: 'text',
                    selector: '.plain-text',
                    strategy: $field => $field.text().trim()
                }
            ]
        }
    ]
};

module.exports = options;