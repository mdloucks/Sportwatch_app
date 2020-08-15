

/**
 * @class
 * @classdesc this class will be used to specify animations and transitions for various components
 * all methods will be static
 */
class Animations {
    /**
     * @description hide all of the children of the given parent element
     * @param {String} element the parent element to hide the children of
     */
    static hideChildElements(element) {
        $(`${element} *`).each(function (index, element) {
            $(this).hide();
        });
    }

    /**
     * @description fade in the children of the given element
     * @param {String} element the element to fade in children
     * @param {Number} duration The duration to fade in
     * @param {Number} increment the amount to increment after each transition
     */
    static fadeInChildren(element, duration, increment) {
        $(`${element} *`).each(function (index, element) {
            $(this).fadeIn(duration + (increment * index));
        });
    }

        /**
     * @description fade in the children of the given element
     * @param {String} element the element to fade in children
     * @param {Number} duration The duration to fade in
     * @param {Number} increment the amount to increment after each transition
     */
    static fadeOutChildren(element, duration, increment) {
        $(`${element} *`).each(function (index, element) {
            $(this).fadeOut(duration + (increment * index));
        });
    }
}