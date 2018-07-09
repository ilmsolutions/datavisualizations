var d3commons = d3commons || {};

d3commons.graph = function (globals) {
    var graph = this;

    graph.getprops = function (opt) {
        var $this = $(this),
            w = $this.width(),
            ismobile = ($this.width() <= opt.minwidth) ? true : false,
            h = opt.height,
            cw = (w - opt.margin.left - opt.margin.right),
            ch = (h - opt.margin.top - opt.margin.bottom);
        // console.log(w + ' ' + opt.minwidth);
        var props = {
            canvas: {
                width: cw,
                height: ch,
                ismobile: ismobile
            },
            plot: {
                width: cw - opt.gap.left - opt.gap.right,
                height: ch - opt.gap.top - opt.gap.bottom,
                ismobile: ismobile
            }
        };

        // console.log(w + ' ' + opt.minwidth + ' ' + ismobile);

        return props;
    };

    graph.formatter = d3commons.utilities.formatter;

    graph.valueformatter = d3commons.utilities.valueformatter;

    //graph.forecolor = d3commons.utilities.forecolor;

    //graph.computerange = d3commons.utilities.computerange;

    return graph;
}