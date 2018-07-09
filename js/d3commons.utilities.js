var d3commons = d3commons || {};

d3commons.utilities =  {
    formatter: function (type) {
        switch (type) {
            case 'percent':
                return d3.format(',%');
            case 'decimal':
                return d3.format('.1f');
                //return d3.format('.0%');
            case 'number':
                return d3.format(',d');
            case 'numberinmillions':
                return d3.format('.2s');
            case 'currency':
                return d3.format('$,.2$');
            case "currencyinmillions":
                return d3.format('$,.2s');
        }
        return d3.format('d');
    },
    valueformatter: function (type, value) {
        var format = d3commons.utilities.formatter(type);
        switch (type) {
            case 'decimal':
                return Number.round(value, 1);
            case 'percent':
                //return format(value);
                //commented above line - was rounding 0.575 to 57%
                return Number.round((value * 100).toFixed(2)) + '%';
            case 'number':
            case 'numberinmillions':
                return format(d3.round(value));
            case 'currency':
            case 'currencyinmillions':
                return format(value).replace(/G/g, 'B');

        }
    }
}