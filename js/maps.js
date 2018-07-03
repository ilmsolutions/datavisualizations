function d3maps(o){
    var config = {
       type: 'world'
      ,colorbrewer: 'YlOrRd'
      ,dispatches: null
      ,projection:  { type: d3.geoEquirectangular(), scale: 200, precision: .1}
      ,margin:{top: 0, left: 0, bottom: 0, right: 0}
      ,gap:{top: 0, left: 0, bottom: 0, right: 0}
      ,legend:{show: true, formatter: d3.format(".2s")}
    };
    if(o)
      config = $.extend(true, config, o);

    var colorswatch = colorbrewer[config.colorbrewer];

    function chart(selection, o) {
        
        d3commons.graph.call(chart);

        selection.each(function (data) {   

            if(data)
               d3.select(this).datum(data);

            chart.draw.call(this, o);

            //chart.update.call(this, config);
        });        
        return chart;
    };

    chart.draw = function(opt){
        opt = (opt) ? $.extend(true, {}, config, opt) : config;
        
        if(!opt.projection || !opt.projection.type) return;
   
        var container = d3.select(this),
            props = chart.getprops.call(this, opt),
            svg = container.selectAll('svg')
                      .data([1]).enter().append('svg')
                      .attr("width", props.canvas.width)
                      .attr("height", props.canvas.height)
                      .attr("viewBox", "0 0 " + props.canvas.width + " " + props.canvas.height)
                      .datum(props.canvas)                      
                      .classed(opt.colorbrewer, true);

        this.projection = opt.projection.type
                        .scale(opt.projection.scale)
                        .translate([props.canvas.width / 2, props.canvas.height / 2])
                        .precision(opt.projection.precision);
    

        this.svg = svg;

        var _tks = opt.type.split('.'),
            _type = _tks[0]
            _draw = null;       
        
        
        switch(_type){
            case 'world':
                _draw = chart.draw_world;
                 break;
        }

        if(_draw)
           _draw.call(this, opt);

        if(config.dispatches)
           config.dispatches.call('loaded', svg);

        return chart;
    }

    chart.draw_world = function(opt){
        opt = $.extend(true, {
           key: 'code'
        ,  feature: 'country'
        ,  behaviors: null
        }, opt);

        var c = d3.select(this)
          , path = d3.geoPath().projection(this.projection)
          , svg = this.svg
          , paths =  svg.selectAll("path." + opt.feature)
            .data(c.datum(), function(d, i){ return d.properties[opt.key];})
            .enter().append("path").classed(opt.feature, true)
            .attr("d", path)
            .each(function(){
                var _self = d3.select(this);
                if(opt.behaviors){
                    for (var [key, value] of opt.behaviors) {
                        _self.on(key, value);
                    }
                }
            });
  
        return chart;
    }

    chart.visualize = function(opt){
        opt = $.extend(true, {
           vis: {type:'quantize', range: 9}
        }, opt);
       //build a key map pair
       var datamap = d3.map(this.filldata, function(d){return d.key})
          ,_extent = d3.extent(this.filldata.map(function(d){return d.value}));
        
       switch(opt.vis.type){
           case 'quantize':
                _quantize.call(this, opt.vis, _extent, datamap); 
                break;
       }
       return chart;
    }

     //access properties
    chart.filldata = function(_){
        if(!arguments.length) return this.filldata;
        this.filldata = _;
        return chart;
    }

    chart.legend = function(_){
        if(!arguments.length) return this.legend;
        this.legend = _;
        return chart;
    }

    chart.dispatches = function (_) {
        if (!arguments.length) return dispatches;
        dispatches = d3.dispatch(_);
        return chart;
    }


    //private functions 
    function _quantize(opt, extent, datamap){
        var qtz = d3.scaleQuantize()
                    .range(d3.range(opt.range).map(function(i){
                        return "q" + i + "-9";
                    })); 

        qtz.domain(extent);

        this.svg.selectAll('path.country')
                .each(function(d){
                var _self = d3.select(this);
                d.measure  = datamap.get(d.properties.code);

                if(d.measure){
                    _self.classed(qtz(d.measure.value), true);
                }
        });
       
        if(config.legend.show && this.legend){
            var keys = this.legend.selectAll('li.key')
                            .data(qtz.range());
            keys.enter().append('li').attr('class',  function(d){
                return 'key ' + d;
            })
            .style('border-color', function(d){
                var matches = d.match(/^q([0-9])-([0-9])$/i);
                return matches.length >=2 ? colorswatch[matches[2]][matches[1]] : '#fff';
            })
            .text(function(d){
                    var r= qtz.nice().invertExtent(d);
                    return config.legend.formatter(r[0]);
            });

        }

     }

   return chart;
}


d3maps.behaviors = {
    mouseover: function(d){
        if(d && d.measure && d.measure.values){
            var _self = d3.select(this)
               ,_parent = d3.select(this.parentNode)
               ,_keys = d.measure.values.map(function(_d){return _d.key;});
       
            _parent.classed('mouse-over', true);
            _parent.selectAll('path.country')
                .filter(function(_d){
                    return _d.properties.code == d.properties.code || _keys.indexOf(_d.properties.code) >= 0;
                }).classed('feature-highlight', true);
        }
    }
  ,mouseout: function(d){
    var _parent = d3.select(this.parentNode);
    _parent.classed('mouse-over', false);
    _parent.selectAll('path.country').classed('feature-highlight', false);
  }
}