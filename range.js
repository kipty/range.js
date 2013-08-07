;(function($) {
    'use strict';

    /*
     * 
     * @param {type} el
     * @param {type} opts : Object {width: '100px' or '100%'}
     * @returns {undefined}
     */
    var Range = function(el, opts) {

        var self = this,
                $el = $(el),
                $button, $bar, $container,
                options = opts,
                mouseIsDown = false,
                val = 0,
                startX = 0,
                diffX,
                sliderLength, stepDist, valDiff,
                maxVal, minVal, step = 1;

        /*
         * 
         * @returns {undefined}
         */
        self.init = function() {

            //get values from input
            minVal = parseInt($el.attr('min'));
            maxVal = parseInt($el.attr('max'));
            val = parseInt($el.attr('value'));
            step = parseInt($el.attr('step'));
            if (isNaN(step))
                step = 1;
            //
            valDiff = maxVal - minVal;
            //
            //do checks on values
            if (step > Math.abs(valDiff))
                throw new Error("Range: step value too big");
            
            //min less than max
            if (minVal < maxVal)
            {
                if (val < minVal)
                    val = minVal;
                if (val > maxVal)
                    val = maxVal;
            }
            //max less than min
            if (minVal > maxVal)
            {
                if (val > minVal)
                    val = minVal;
                if (val < maxVal)
                    val = maxVal;
            }
            //
            $el.hide();
            $el.wrap('<div/>');
            $container = $(el).parent();
            $container.addClass(options.container_class);
            $container.append('<div class="'+ options.bar_class + '"><button onclick="return false;" class="'+ $el.attr('class') + ' ' + options.button_class + '" value="'+val+'"></div></div>');
            //
            $button = $container.find('.' + options.button_class);
            $bar = $container.find('.' + options.bar_class);

            //set width from options
            if (typeof(options.width) !== 'undefined') {
                $container.css('width', options.width);
            }
            //init the dimension values
            self.setSliderDimensions();

            //
            //add events
            $button.on('mousedown', self.slideStart);
            $bar.on('mousedown', self.slideStart);
            $button.on('keydown', self.slideStart);
            $(window).on('resize', self.setSliderDimensions);

            /*
             * mouse movement
             */
            $(document).on('mousemove', function(e) {
                self.onMouseMove(e);
                e.preventDefault();
                return false;
            });
            /*
             * mouse up
             */
            $(document).on('mouseup', function(e) {
                self.onMouseUp(e);
                e.preventDefault();
                return false;
            });

        };

        /*
         * called on mousedown and keydown events
         * sets start X position and updates the display
         * @param {type} e
         * @returns {Boolean}
         */
        self.slideStart = function(e) {

            var x, invalidate = false;
            if (e.type === 'mousedown') {
                //mouse
                mouseIsDown = true;
                x = startX = self.getMouseX(e);
               
                //bar click
                if ($(e.target)[0] === $bar[0]) {
                    //get cutrrent button position
                    startX = self.getValueAsPosition();
                    mouseIsDown = false;
                }

                invalidate = true;

            } else if (e.type === 'keydown') {
                //keyboard
                startX = 0;
                if (e.which === 37 || e.which === 40) {
                    //down/left
                    x = -stepDist;
                    invalidate = true;
                }
                if (e.which === 38 || e.which === 39) {
                    //up/right
                    x = stepDist;
                    invalidate = true;
                }
            }
            //
            if (invalidate) {
                diffX = ($button.offset().left - $bar.offset().left);
                self.invalidate(x);
            }
            e.preventDefault();
            return false;
        };

        /*
         * gets x pos of the mouse
         * @param {type} e
         * @returns mouse X position
         */
        self.getMouseX = function(e) {
            var x = 0;
            if (e.clientX) {
                x = e.clientX - $bar.offset().left;
            }
            return x;
        };

        /**
         * get the current value as an x position on the slider
         * @returns
         */
        self.getValueAsPosition = function() {
            return Math.round(((val - minVal) / valDiff) * sliderLength);
        };

        /*
         * get the nearst value to the supplied position
         * @param {type} pos
         * @returns current slider value
         */
        self.getNearestValue = function(pos) {
            var v = (pos / sliderLength) * valDiff;
            return (Math.round(v / step) * step) + minVal;
        };

        /*
         * configure the dimension varialbes
         * called on resize
         */
        self.setSliderDimensions = function() {
            sliderLength = $bar.width() - $button.width();
            stepDist = Math.round(sliderLength / (valDiff / step));
            if(stepDist === 0) stepDist = 1;
            //set button pos
            var left = self.getValueAsPosition();
            $button.css("left", left);
        };

        /*
         * set the new button position
         * @param {type} x
         */
        self.invalidate = function(x) {

            var movedX = x - startX;
            var newLeft = diffX + movedX;

            //set max/min x
            newLeft = newLeft < 0 ? 0 : newLeft;
            newLeft = Math.min(newLeft, sliderLength);

            //round to the nearest step value
            newLeft = (stepDist * Math.round(newLeft / stepDist));

            //set new position
            $button.css("left", newLeft);

            //set value
            val = self.getNearestValue(newLeft);
            //console.log(val);
            $el.val(val);
            $button.val(val);
            //event
            $el.trigger('change', [{val: val}]);
        };

        /*
         * mouseMove Event handler
         * @param {type} e
         * @returns {Boolean}
         */
        self.onMouseMove = function(e) {
            if (mouseIsDown) {
                self.invalidate(self.getMouseX(e));
                return false;
            }
        };

        /*
         * mouseup Event handler
         * @param {type} e
         */
        self.onMouseUp = function(e) {
            mouseIsDown = false;
            //on changed event
            //$el.trigger('range:onChanged', [{val: val}]);
            return false;
        };

        self.init();

    };

    /*
     * @param {type} options
     * @returns 
     */
    $.fn.Range = function(options) {
        var opts = $.extend({}, $.fn.Range.defaults, options);
        return this.each(function() {
            new Range($(this), opts);
        });
    };
    /*
     * default options
     */
    $.fn.Range.defaults = {
        width: '100%',
        container_class: 'range',
        button_class: 'range-button',
        bar_class: 'range-bar'
    };
})($);
