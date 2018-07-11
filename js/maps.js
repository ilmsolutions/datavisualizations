function d3maps(o){
    var config = {
       type: 'world'
      ,feature: 'country' 
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

            this.dispatches = config.dispatches;

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
    
        d3maps.defs.addfilters.call(this, ['dropshadow']);

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

        if(this.dispatches){
            this.dispatches.call('loaded', svg);
        }
           

        return chart;
    }

    chart.draw_world = function(opt){
        opt = $.extend(true, {
           key: 'code'
        ,  behaviors: null
        }, opt);

        var c = d3.select(this)
          , path = d3.geoPath().projection(this.projection)
          , svg = this.svg
          , paths =  svg.selectAll("path." + opt.feature)
                        .data(c.datum(), function(d, i){ return d.properties[opt.key];})
          , pathsenter =  paths.enter().append("path").classed(opt.feature, true)
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

        switch(opt.vis.type){
           case 'quantize':
                _quantize.call(this, opt.vis); 
                break;
       }
       return chart;
    }

     //access properties
    chart.filldata = function(_){
        if(!arguments.length) return this.filldata;
        
        this.filldata = d3.map(_, function(d){return d.key});
        return chart;
    }

    chart.legend = function(_){
        if(!arguments.length) return this.legend;
        this.legend = _;
        return chart;
    }

    chart.dispatches = function (_) {
        if (!arguments.length) return dispatches;
        this.dispatches = d3.dispatch(_);
        return chart;
    }


    //private functions 
    function _quantize(opt){
        var qtz = d3.scaleQuantize()
                    .range(d3.range(opt.range).map(function(i){
                        return "q" + i + "-9";
                    }))
            , datamap = this.filldata
            , extent = d3.extent(datamap.values().map(function(d){return d.value}))
            ,classed = qtz.range().join(' '); 

        qtz.domain(extent);

        this.svg.selectAll('path.' + config.feature)
                .each(function(d){
                var _self = d3.select(this).classed(classed, false);
                d.measure  = datamap.get(d.properties.code);

                if(d.measure){
                    _self.classed(qtz(d.measure.value), true);
                }
        });
       
        if(config.legend.show && this.legend){
            var keys = this.legend.selectAll('li.key')
                            .data(qtz.range().map(function(d){
                                return {
                                    value: d
                                  , key: qtz.nice().invertExtent(d)[0]
                                };
                            }), function(d){
                                return d.key;
                            });

            keys.exit().remove();

            keys.enter().append('li').attr('class',  function(d){
                return 'key ' + d.value;
            }).each(function(d){     
                var _self = d3.select(this)
                   ,matches = d.value.match(/^q([0-9])-([0-9])$/i)
                   ,border = matches.length >=2 ? colorswatch[matches[2]][matches[1]] : '#fff'
                   ;
                _self.style('border-color', border)
                     .text(config.legend.formatter(d.key)); 

            });
        }

     }

   return chart;
}


d3maps.behaviors = {
    mouseover: function(d){
        if(d && d.measure && d.measure.values){
            var _self = d3.select(this).classed('feature-selected', true)
                          .style('filter', 'url(#dropshadow)')
               ,_parent = d3.select(this.parentNode)
               ,_container = this.parentNode.parentNode
               ,_keys = d.measure.values.map(function(_d){return _d.key;});
       
            _parent.classed('mouse-over', true);
            _parent.selectAll('path.country')
                .filter(function(_d){
                    return _d.properties.code == d.properties.code || _keys.indexOf(_d.properties.code) >= 0;
                }).classed('feature-highlight', true);

            _container.dispatches.call('mouseover', this, d);
            
       }
    }
  , mouseout: function(d){
    var _parent = d3.select(this.parentNode)
       ,_container = this.parentNode.parentNode;
    d3.select(this).classed('feature-selected', false).style('filter', '')
    _parent.classed('mouse-over', false);
    _parent.selectAll('path.country').classed('feature-highlight', false);
    _container.dispatches.call('mouseout', this, d);
  }
}

d3maps.defs = (function(){
    return {
        addfilters: function(types){
            var svg = d3.select(this).selectAll('svg')
              , _defs = svg.selectAll('defs')
                           .data([1])
             , _defsenter = _defs.enter().append('defs');
    
             if(types){
                 types.forEach(function(type){
                     switch(type){
                         case 'dropshadow':
                             filter_dropshadow.call(_defsenter, type);
                             break;
                     }
                 })
             }
        }    
    };

    function filter_dropshadow(type){
        var _defsenter = this
         , _filter = _defsenter.selectAll('filter.' + type)
                          .data([type])
         , _filterenter = _filter.enter().append('filter')
                            .attr('id', type)
                            .classed(type, true);

         _filterenter.attr('height', '130%')
                     .append('feGaussianBlur').attr('in', 'SourceAlpha').attr('stdDeviation', 3); //<!-- stdDeviation is how much to blur -->

        _filterenter.append('feOffset').attr('dx', 2).attr('dy', 2).attr('result', 'offsetblur'); //<!-- how much to offset -->

        _filterenter.append('feComponentTransfer')
                    .append('feFuncA').attr('type', 'linear').attr('slope', 0.5); //<!-- slope is the opacity of the shadow -->
        
        var _feMerge = _filterenter.append('feMerge');

        _feMerge.append('feMergeNode'); //<!-- this contains the offset blurred image -->
        _feMerge.append('feMergeNode').attr('in', 'SourceGraphic'); //<!-- this contains the element that the filter is applied to -->

    }
})();