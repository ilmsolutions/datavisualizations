function d3bar(o){
    var config = {
          margin:{top: 0, left: 0, bottom: 0, right: 0}
        , gap:{top: 0, left: 0, bottom: 0, right: 0}
        , title:{text: ''}
        , bar:{volume: 30}
        //, axes:{x:{}, y:{}} 
        , colorbrewer: 'BuPu'
        ,  dispatches: null         
    };

    if(o)
      config = $.extend(true, config, o);

    var colorswatch = colorbrewer[config.colorbrewer];
    
    function chart(selection, o) {
        d3commons.graph.call(chart);

        selection.each(function (data) {   

            if(data)
               d3.select(this).datum(data);

            this.dispatches = config.dispatches;

            chart.draw.call(this, o);

            //chart.update.call(this, config);
        });        
        return chart;
    };

    chart.draw = function(opt){
        opt = (opt) ? $.extend(true, {}, config, opt) : config;


        var container = d3.select(this)
           , datum = container.datum();

        if(datum.length <= 0)
        {
            container.selectAll('*').remove();
            return;
        }

        var props = chart.getprops.call(this, opt)
           , svg = container.selectAll('svg')
                    .data([props.canvas]);

        this.svg = svg.enter().append('svg')
                    .attr("width", props.canvas.width)
                    .attr("height", props.canvas.height)
                    .attr("viewBox", "0 0 " + props.canvas.width + " " + props.canvas.height)
                    .classed(opt.colorbrewer, true);

        this.svg.append('g').classed('title', true)
                .append('text').text(opt.title.text)
                .attr('text-anchor', 'middle')
                .attr('dy', '0.9em')
                .attr('transform', 'translate(' + [props.canvas.width / 2, 0] + ')');

        svg.exit().remove();

        
        this.plot = this.svg.selectAll('g.plot')
                      .data([props.plot]);
    
        this.plot.enter().append('g')
            .classed('plot', true)
            .each(function(d){
                console.log('in enter....');
                var o = getaxes.call(this, datum, opt)
                   , _p = d3.select(this)
                        .attr('width', d.width)
                        .attr('height', d.height)
                        .attr('transform', 'translate(' + [
                                            (opt.margin.left + opt.gap.left)
                                        , (opt.margin.top + opt.gap.top)
                                    ] + ')')
                  , _xaxis = _p.append('g').classed('xaxis', true)
                                  .attr('transform', 'translate(' + [0, d.height] + ')')
                                  .call(o.axisgen.x)
                  , _yaxis = _p.append('g').classed('yaxis', true)
                                  .attr('transform', 'translate(' + [0, 0] + ')')
                                  .call(o.axisgen.y)
                  , _bars = _p.append('g').classed('bars', true)
                              .call(renderbars, datum, o.scales);

        });

        this.plot = svg.selectAll('g.plot');
        this.plot.each(function(d){
            console.log('in update...');
            var o = getaxes.call(this, datum, opt)
            , _p = d3.select(this)
            , _xaxis = _p.select('g.xaxis').call(o.axisgen.x)
            , _yaxis = _p.select('g.yaxis').call(o.axisgen.y)
            , _bars = _p.selectAll('g.bars').call(renderbars, datum, o.scales);
        });

        this.svg = svg;
    
        return chart;
    }


    function renderbars(selection, datum, scales){

        selection.selectAll('*').remove();

        var bar = selection.selectAll('g.bar')
                      .data(datum);
                      
        bar.enter().append('g').classed('bar', true)
        .each(function(d, i){
              d.color = 'q' + (i+1) + '-4';
              var _w = scales.x(d.value)
              , _self = d3.select(this)
                            .attr('transform', 'translate(' + 
                                  [0, scales.y(d.name) + (scales.y.bandwidth() - config.bar.volume)/2] + ')');
              _self.append('rect').attr('x', 0).attr('height', config.bar.volume)
              .attr('y', 0)
              .attr('width', _w)
              .classed(d.color, true);
      
              _self.append('text')
              .attr('dx', '-0.2em')
              .attr('dy', scales.y.bandwidth() / 2)
              .text(function(d){
                return d.name + ' ' + config.axes.x.formatter(d.value);
              }).attr('transform', function(d){
                  var tw = this.getBBox().width
                     ,op = _w - tw;
                  return 'translate(' + [op, 0] + ')';
              });
            
        });
        
         
    }

    function getaxes(datum, opt){
        var p = d3.select(this)
          , d = p.datum()
          , x = d3.scaleLinear().domain([0, d3.max(datum, function(d){return d.value})])
                  .range([0, d.width]).nice() 
          , y = d3.scaleBand().domain(datum.map(function(d){return d.name;}))
                  .range([d.height, 0])
          , xaxisgen = d3.axisBottom(x).ticks(5).tickSize(0).tickFormat(opt.axes.x.formatter)
          , yaxisgen = d3.axisLeft(y).tickSize(0);

        return {
            scales:{x: x, y: y}
          , axisgen:{x: xaxisgen, y: yaxisgen}
        }

    }


    return chart;
}