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
            strategy: function ($field) {
                return $field.text().trim();
            }
        },
        {
            name: 'description',
            type: 'text',
            selector: '[itemprop="description"]',
            strategy: function ($field) {
                return $field.text().trim();
            }
        },
        {
            name: 'duration',
            type: 'text',
            selector: '.entry-stats__item_cooking .entry-stats__value',
            strategy: function ($field) {
                return $field.text().trim();
            }
        },
        {
            name: 'ingredients',
            type: 'map',
            multiple: true,
            selector: '.definition-list-table__tr',
            items: [
                {
                    key: 'name',
                    selector: '.checkbox span',
                    strategy: function ($field) {
                        return $field[0] && $field[0].children[0].data;
                    }
                },
                {
                    key: 'value',
                    selector: '.definition-list-table__td_value',
                    strategy: function ($field) {
                        return $field.text().trim();
                    }
                }
            ]
        },
        {
            name: 'steps',
            type: 'map',
            multiple: true,
            selector: '[itemprop="recipeInstructions"] .content-box',
            items: [
                {
                    key: 'image',
                    selector: '.field-row img',
                    upload: true,
                    strategy: function ($field) {
                        return $field.attr('data-original').replace(/\?\d+$/, '');
                    }
                },
                {
                    key: 'text',
                    selector: '.plain-text',
                    strategy: function ($field) {
                        return $field.text().trim();
                    }
                }
            ]
        },
    ]
};

module.exports = options;