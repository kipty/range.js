/*
 The MIT License (MIT)
 
 Copyright (c) 2013 Paul Robinson (https://github.com/kipty/range.js)
 
 Permission is hereby granted, free of charge, to any person obtaining a copy of
 this software and associated documentation files (the "Software"), to deal in
 the Software without restriction, including without limitation the rights to
 use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 the Software, and to permit persons to whom the Software is furnished to do so,
 subject to the following conditions:
 
 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.
 
 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
;
(function($) {
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
                dragging = false,
                val = 0,
                startPos = 0,
                diff,
                sliderLength, stepDist, valDiff,
                maxVal, minVal, step = 1,
                H = true, V = false, dir = H;


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

            if (typeof(options.vertical) !== undefined) {
                if (options.vertical === true) {
                    dir = V;
                    $container.addClass(options.vertical_class);
                }
            }

            //get original css styles from input
            var inputStyle = $el.attr('class') === undefined ? '' : $el.attr('class') + ' ';
            $container.append('<button onclick="return false;" class="' + inputStyle + options.button_class + '" value="' + val + '"/><div class="' + options.bar_class + '"></div>');
            //
            $button = $container.find('.' + options.button_class);
            $bar = $container.find('.' + options.bar_class);

            //init the dimension values
            self.setSliderDimensions();
            //
            $button.css('position', 'relative');//make sure it has relative position
            //
            //add events
            $button.on('mousedown touchstart', self.slideStart);
            $bar.on('mousedown touchstart', self.slideStart);
            $button.on('keydown', self.slideStart);
            $(window).on('resize', self.setSliderDimensions);

            /*
             * mouse movement
             */
            $container.on('mousemove touchmove', function(e) {
                if (e.type === 'mousemove')
                    self.onMouseMove(e);
                else if (e.type === 'touchmove')
                    self.onTouchMove(e);
                e.preventDefault();
                return false;
            });

            /*
             * mouse up
             */
            $container.on('mouseup touchend', function(e) {
                self.onMouseUp(e);
                e.preventDefault();
                return false;
            });

            /*
             * mouse leaves page
             */
            $(document).on('mouseleave', function(e) {
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

            var pos, invalidate = false;
            if (e.type === 'mousedown') {
                //mouse
                dragging = true;
                if (dir === H) {
                    pos = startPos = self.getMouseX(e);
                } else {
                    pos = startPos = self.getMouseY(e);
                }
                invalidate = true;

            } else if (e.type === 'keydown') {
                //keyboard
                startPos = 0;
                if (e.which === 37 || e.which === 40) {
                    //down/left
                    pos = -stepDist;
                    invalidate = true;
                }
                if (e.which === 38 || e.which === 39) {
                    //up/right
                    pos = stepDist;
                    invalidate = true;
                }
            } else if (e.type === 'touchstart') {
                //mouse
                dragging = true;

                if (!e.touches) {
                    e = e.originalEvent;
                }
                if (dir === H) {
                    pos = startPos = e.touches[0].pageX;
                } else {
                    pos = startPos = e.touches[0].pageY;
                }
                invalidate = true;
            }

            //
            if (invalidate) {

                //bar click
                if ($(e.target)[0] === $bar[0]) {
                    //get cutrrent button position
                    startPos = self.getValueAsPosition() - $(window).scrollTop();
                    dragging = false;
                }
                //
                if (dir === H)
                    diff = ($button.offset().left - $bar.offset().left);
                else
                    diff = ($button.offset().top - $bar.offset().top);

                self.invalidate(pos);
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

        /*
         * gets x pos of the mouse
         * @param {type} e
         * @returns mouse X position
         */
        self.getMouseY = function(e) {
            var y = 0;
            if (e.clientY) {
                y = e.clientY - $bar.offset().top;
            }
            return y;
        };

        /**
         * get the current slider value as a position
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
            if (dir === H)
                sliderLength = $bar.width() - $button.width();
            else
                sliderLength = $bar.height() - $button.height();

            stepDist = Math.round(sliderLength / (valDiff / step));
            if (stepDist === 0)
                stepDist = 1;
            //set button pos
            var pos = self.getValueAsPosition();
            if (dir === H)
                $button.css("left", pos);
            else
                $button.css("top", pos);
        };

        /*
         * set the new button position
         * @param {type} pos
         */
        self.invalidate = function(pos) {
            var moved = pos - startPos;
            var newPos = diff + moved;

            //set max/min x
            newPos = newPos < 0 ? 0 : newPos;
            newPos = Math.min(newPos, sliderLength);

            //round to the nearest step value
            newPos = (stepDist * Math.round(newPos / stepDist));

            //set new position
            if (dir === H)
                $button.css("left", newPos);
            else
                $button.css("top", newPos);

            //set value
            val = self.getNearestValue(newPos);
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
            if (dragging) {
                if (dir === H)
                    self.invalidate(self.getMouseX(e));
                else
                    self.invalidate(self.getMouseY(e));
                return false;
            }
        };

        /*
         * onTouchMove Event handler
         * @param {type} e
         * @returns {Boolean}
         */
        self.onTouchMove = function(e) {
            if (!dragging)
                return false;
            //
            if (!e.touches) {
                e = e.originalEvent;
            }
            if (dir === H)
                self.invalidate(e.touches[0].pageX);
            else
                self.invalidate(e.touches[0].pageY);
            return false;
        };



        /*
         * mouseup Event handler
         * @param {type} e
         */
        self.onMouseUp = function(e) {
            dragging = false;
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
        container_class: 'range',
        button_class: 'range-button',
        bar_class: 'range-track',
        vertical: false,
        vertical_class: 'vertical'
    };
})($);
